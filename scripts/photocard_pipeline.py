#!/usr/bin/env python3
"""
Photocard Collection and Processing Pipeline
Integrated pipeline for eBay collection -> AI processing -> metadata tagging -> storage.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
import logging
from datetime import datetime

import cv2
import numpy as np
from ebay_client import search_photocards
from member_detector import MemberDetector
from image_processor import ImageProcessor
from metadata_tagger import MetadataTagger
from card_boundary_detector import classify_card_layout, warp_card

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def sanitize_for_json(obj):
    """
    Recursively convert a value tree into JSON-safe native Python types.
    Defensive validation layer: numpy scalars/arrays, tuples/sets, and any
    other object type json.dump can't natively handle are converted (or,
    as a last resort, stringified) here instead of raising mid-write or
    silently corrupting the output the way default=str previously did
    (e.g. dumping a raw pixel array as a truncated numpy repr string).
    Large ndarrays (e.g. a processed image) are dropped entirely - they
    don't belong in metadata JSON regardless of caller intent.
    """
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    if isinstance(obj, np.ndarray):
        if obj.size > 1000:
            return f"<ndarray shape={obj.shape} dtype={obj.dtype} omitted>"
        return obj.tolist()
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(v) for v in obj]
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        return str(obj)


def write_metadata_json(path: Path, metadata: Dict) -> None:
    """Sanitize and write metadata JSON, validating it round-trips before
    touching disk so a bad field can't produce a truncated/corrupt file."""
    clean = sanitize_for_json(metadata)
    text = json.dumps(clean, indent=2, ensure_ascii=False)  # raises loudly if still unsafe
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


class PhotocardPipeline:
    """Complete photocard collection and processing pipeline."""

    def __init__(self, output_dir: str = "pipeline_output"):
        """Initialize pipeline."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # Initialize components
        self.detector = MemberDetector()
        self.processor = ImageProcessor()
        self.tagger = MetadataTagger()

        # Create subdirectories
        (self.output_dir / "images").mkdir(exist_ok=True)
        (self.output_dir / "metadata").mkdir(exist_ok=True)
        (self.output_dir / "logs").mkdir(exist_ok=True)
        (self.output_dir / "review_queue").mkdir(exist_ok=True)

        self.results = []
        self.review_queue_items = []
        self.errors = []

    def download_image(self, url: str, timeout: int = 10) -> Optional[np.ndarray]:
        """Download image from URL."""
        try:
            import requests
            from io import BytesIO

            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            img_array = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            return img
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            self.errors.append({
                "url": url,
                "error": str(e),
                "stage": "download"
            })
            return None

    def process_single_item(self, listing: Dict, index: int) -> Optional[Dict]:
        """
        Process single eBay listing through complete pipeline.

        Classifies the listing photo first: a photo showing exactly one
        physical photocard (individual, unit, or full-group - multiple
        people CAN legitimately appear on one card) is auto-cropped and
        processed as normal. A photo showing several separate physical
        cards laid out together (or an ambiguous case) is routed to the
        review queue instead of being silently cropped to one member.

        Args:
            listing: eBay listing data
            index: Item index

        Returns:
            Result dictionary (status "success" or "needs_manual_review"),
            or None on download failure.
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Processing Item {index}: {listing['title']}")
        logger.info(f"{'='*70}")

        # Step 1: Download image
        logger.info("📥 Step 1: Downloading image...")
        img = self.download_image(listing["image_url"])
        if img is None:
            return None

        logger.info(f"  ✓ Downloaded: {img.shape}")

        # Step 2: Card layout classification (boundary detection + face count/size)
        logger.info("🗂️  Step 2: Card layout classification...")
        faces = self.detector.detect_faces(img)
        layout = classify_card_layout(img, faces)

        logger.info(f"  Layout: {layout['layout']} ({layout['reason']})")
        logger.info(f"  Geometric boundaries: {layout['num_boundaries']} | Faces: {layout['face_count']} "
                    f"(largest={layout['largest_face_fraction']*100:.2f}%)")

        if layout["is_multi_card_listing"]:
            logger.warning(f"  ⚠️  Multi-card / ambiguous listing photo -> routing to review queue")
            return self._route_to_review_queue(img, listing, index, layout)

        return self._process_single_card(img, listing, index, layout, faces)

    def _process_single_card(self, img: np.ndarray, listing: Dict, index: int,
                             layout: Dict, faces: List[Dict]) -> Dict:
        """Crop, correct, tag, and save a confirmed single-photocard image."""
        # Step 3: Crop to the card region (boundary-based, not face-based -
        # a unit/group card keeps its FULL card area, not just one member)
        logger.info("🔍 Step 3: Cropping to card region...")
        if layout["card_corners"] is not None:
            card_img = warp_card(img, layout["card_corners"])
            logger.info(f"  ✓ Perspective-warped card region: {card_img.shape[1]}x{card_img.shape[0]}")
        else:
            x, y, w, h = layout["card_bbox"]
            card_img = img[y:y + h, x:x + w]
            logger.info(f"  ✓ Card region ({layout['reason']}): {card_img.shape[1]}x{card_img.shape[0]}")

        member_count = layout["face_count"]
        if member_count == 0:
            card_type = "no_face_detected"
        elif member_count == 1:
            card_type = "individual"
        elif member_count <= 3:
            card_type = "unit"
        else:
            card_type = "group"
        logger.info(f"  ✓ Card type: {card_type} ({member_count} member(s) detected)")

        # Step 4: Image aspect ratio processing and padding
        logger.info("📐 Step 4: Aspect ratio correction and padding...")
        processing_result = self.processor.process_pipeline(card_img, target_height=400)

        processed_img = processing_result["image"]
        validation = processing_result["validation"]

        logger.info(f"  ✓ Ratio: {processing_result['original']['ratio']:.3f} → {processing_result['processed']['ratio']:.3f}")
        logger.info(f"  ✓ Validation: {'✓ Valid' if validation['is_valid'] else '✗ Warning'} (deviation: {validation['deviation']:.3f})")

        # Step 5: Metadata auto-tagging
        logger.info("🏷️  Step 5: Metadata auto-tagging...")
        metadata_input = {
            k: v for k, v in processing_result.items() if k != "image"
        }
        metadata_input["status"] = "member_detected" if member_count > 0 else "no_face_detected"
        metadata_input["confidence"] = max((f["score"] for f in faces), default=0.0)
        metadata = self.tagger.generate_metadata(
            query=listing["title"],
            ebay_listing=listing,
            processing_info=metadata_input
        )
        metadata["card_classification"] = {
            "is_multi_card_listing": False,
            "card_type": card_type,
            "member_count": member_count,
            "boundary_source": layout["reason"],
            "num_geometric_boundaries": layout["num_boundaries"],
        }

        logger.info(self.tagger.format_metadata_log(metadata))

        # Step 6: Save outputs
        logger.info("💾 Step 6: Saving processed image and metadata...")
        result = self._save_outputs(
            index=index,
            processed_img=processed_img,
            metadata=metadata,
            listing=listing
        )
        result["status"] = "success"
        result["card_type"] = card_type

        logger.info(f"  ✓ Saved: {result['image_path']}")
        logger.info(f"  ✓ Metadata: {result['metadata_path']}")

        return result

    def _route_to_review_queue(self, img: np.ndarray, listing: Dict, index: int, layout: Dict) -> Dict:
        """Isolate a multi-card / ambiguous listing photo for manual review
        instead of auto-cropping it to a single (wrong) member."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_base = f"{index:03d}_review_{timestamp}"

        image_path = self.output_dir / "review_queue" / f"{filename_base}_original.png"
        cv2.imwrite(str(image_path), img)

        metadata = {
            "status": "NEEDS_MANUAL_REVIEW",
            "is_multi_card_listing": True,
            "reason": layout["reason"],
            "num_geometric_boundaries": layout["num_boundaries"],
            "geometric_boundaries": layout["boundaries"],
            "face_count": layout["face_count"],
            "largest_face_fraction": layout["largest_face_fraction"],
            "source": {
                "platform": "eBay" if listing.get("source") == "ebay" else listing.get("source", "unknown"),
                "listing_id": listing.get("item_id", "unknown"),
                "listing_title": listing.get("title", "unknown"),
                "seller": listing.get("seller", "unknown"),
                "price": listing.get("price"),
                "currency": listing.get("currency", "USD"),
                "image_url": listing.get("image_url", ""),
                "listing_url": listing.get("url", ""),
                "collection_timestamp": datetime.now().isoformat(),
            },
            "generated_at": datetime.now().isoformat(),
        }

        metadata_path = self.output_dir / "review_queue" / f"{filename_base}_metadata.json"
        write_metadata_json(metadata_path, metadata)

        result = {
            "index": index,
            "image_path": str(image_path),
            "metadata_path": str(metadata_path),
            "status": "needs_manual_review",
            "reason": layout["reason"],
            "timestamp": timestamp,
        }
        self.review_queue_items.append(result)
        logger.info(f"  ✓ Isolated to review queue: {image_path.name}")
        return result

    def _save_outputs(self, index: int, processed_img: np.ndarray,
                      metadata: Dict, listing: Dict) -> Dict:
        """Save processed image and metadata."""
        # Generate filenames
        group_name = metadata["group"].lower().replace(" ", "_")
        member_name = metadata["member"].lower().replace(" ", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_base = f"{index:03d}_{group_name}_{member_name}_{timestamp}"

        # Save image
        image_path = self.output_dir / "images" / f"{filename_base}.png"
        cv2.imwrite(str(image_path), processed_img)

        # Save metadata (sanitized + validated for JSON safety)
        metadata_path = self.output_dir / "metadata" / f"{filename_base}.json"
        write_metadata_json(metadata_path, metadata)

        return {
            "index": index,
            "image_path": str(image_path),
            "metadata_path": str(metadata_path),
            "status": "success",
            "timestamp": timestamp
        }

    def process_collection(self, query: str, limit: int = 4) -> Dict:
        """
        Process complete collection from eBay search.

        Args:
            query: eBay search query (e.g., "BTS RM photocard")
            limit: Maximum listings to process

        Returns:
            Pipeline results summary
        """
        logger.info(f"\n{'#'*70}")
        logger.info(f"# Photocard Collection Pipeline")
        logger.info(f"# Query: {query}")
        logger.info(f"# Max Items: {limit}")
        logger.info(f"{'#'*70}\n")

        # Step 0: Search eBay
        logger.info("🔍 Searching eBay...")
        listings = search_photocards(query, limit=limit)

        if not listings:
            logger.error("No listings found!")
            return {
                "status": "error",
                "message": "No listings found",
                "results": []
            }

        logger.info(f"  ✓ Found {len(listings)} listings\n")

        # Process each listing
        for idx, listing in enumerate(listings, 1):
            result = self.process_single_item(listing, idx)
            if result is None:
                continue
            if result["status"] == "needs_manual_review":
                continue  # already appended to self.review_queue_items
            self.results.append(result)

        # Generate summary
        return self._generate_summary()

    def _generate_summary(self) -> Dict:
        """Generate processing summary."""
        logger.info(f"\n{'='*70}")
        logger.info("📊 PIPELINE SUMMARY")
        logger.info(f"{'='*70}\n")

        successful = len(self.results)
        needs_review = len(self.review_queue_items)
        failed = len(self.errors)
        total = successful + needs_review + failed

        logger.info(f"✅ Successful (auto-processed): {successful}/{total}")
        logger.info(f"🗂️  Needs manual review (multi-card/ambiguous): {needs_review}/{total}")
        logger.info(f"❌ Failed (download errors): {failed}/{total}")

        if self.results:
            logger.info(f"\n✓ Processed Images:")
            for result in self.results:
                logger.info(f"  • [{result.get('card_type', '?')}] {result['image_path']}")

        if self.review_queue_items:
            logger.info(f"\n🗂️  Review Queue:")
            for item in self.review_queue_items:
                logger.info(f"  • [{item['reason']}] {item['image_path']}")

        if self.errors:
            logger.info(f"\n✗ Errors:")
            for error in self.errors:
                logger.info(f"  • {error['stage']}: {error['error']}")

        # Save detailed report
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_processed": total,
                "successful": successful,
                "needs_manual_review": needs_review,
                "failed": failed,
                "success_rate": f"{(successful/total*100):.1f}%" if total > 0 else "N/A"
            },
            "results": self.results,
            "review_queue": self.review_queue_items,
            "errors": self.errors
        }

        report_path = self.output_dir / "pipeline_report.json"
        write_metadata_json(report_path, report)

        logger.info(f"\n📄 Report saved: {report_path}")

        return report


def main():
    """Main execution for testing."""
    # Initialize pipeline
    pipeline = PhotocardPipeline(output_dir="pipeline_output")

    # Process sample collection
    results = pipeline.process_collection(
        query="BTS RM photocard",
        limit=4
    )

    return results


if __name__ == "__main__":
    main()
