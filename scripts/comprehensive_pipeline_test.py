#!/usr/bin/env python3
"""
Comprehensive Pipeline Test - End-to-End Dry Run
Tests complete pipeline with real Tier 1 groups and visual reporting.
"""

import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import time

import numpy as np
import cv2

from ebay_client import search_photocards
from member_detector import MemberDetector
from image_processor import ImageProcessor
from metadata_tagger import MetadataTagger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test configuration
TEST_GROUPS = [
    "Stray Kids",
    "AESPA",
    "IVE",
]

class ComprehensivePipelineTest:
    """Comprehensive end-to-end pipeline test with visual reporting."""

    def __init__(self):
        """Initialize test environment."""
        self.test_dir = Path("temp_test_run")
        self.test_dir.mkdir(exist_ok=True)

        # Create subdirectories
        (self.test_dir / "images_original").mkdir(exist_ok=True)
        (self.test_dir / "images_cropped").mkdir(exist_ok=True)
        (self.test_dir / "images_processed").mkdir(exist_ok=True)
        (self.test_dir / "metadata").mkdir(exist_ok=True)
        (self.test_dir / "logs").mkdir(exist_ok=True)

        # Initialize components
        self.detector = MemberDetector()
        self.processor = ImageProcessor()
        self.tagger = MetadataTagger()

        # Results tracking
        self.results = []
        self.start_time = datetime.now()

    def generate_sample_image(self, width: int, height: int, group_name: str) -> np.ndarray:
        """Generate realistic sample photocard image."""
        # Create gradient background (color based on group)
        img = np.ones((height, width, 3), dtype=np.uint8)

        color_map = {
            "Stray Kids": (180, 100, 150),  # Purple
            "AESPA": (200, 150, 100),       # Orange
            "IVE": (100, 150, 200),         # Blue
        }

        color = color_map.get(group_name, (128, 128, 128))

        # Create gradient
        for y in range(height):
            ratio = y / height
            img[y, :] = tuple(int(c * (0.7 + 0.3 * ratio)) for c in color)

        # Add rectangle (simulate member face area)
        face_w, face_h = width // 3, height // 3
        x1, y1 = (width - face_w) // 2, (height - face_h) // 2
        x2, y2 = x1 + face_w, y1 + face_h

        cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 255), -1)

        # Add text
        cv2.putText(img, group_name, (x1 + 10, y1 + 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

        return img

    def process_group(self, group_name: str, sample_size: int = 3) -> List[Dict]:
        """Process complete pipeline for a Tier 1 group."""
        logger.info(f"\n{'='*80}")
        logger.info(f"🎴 Processing: {group_name}")
        logger.info(f"{'='*80}\n")

        group_results = []

        # Step 0: Search eBay (simulated)
        logger.info(f"🔍 Step 0: Searching eBay for '{group_name} photocard'...")
        listings = search_photocards(f"{group_name} photocard", limit=sample_size)
        logger.info(f"  ✓ Found {len(listings)} listings\n")

        for idx, listing in enumerate(listings, 1):
            logger.info(f"  Processing listing {idx}/{len(listings)}: {listing['title'][:50]}...")

            try:
                # Generate sample image (simulating download)
                sample_width, sample_height = 1200, 800
                original_img = self.generate_sample_image(sample_width, sample_height, group_name)

                logger.info(f"    📥 Step 1: Image downloaded")
                logger.info(f"       Original size: {original_img.shape[1]}×{original_img.shape[0]} pixels")

                # Save original
                orig_path = self.test_dir / "images_original" / f"{idx:02d}_{group_name.lower()}_{idx}.png"
                cv2.imwrite(str(orig_path), original_img)

                # Step 1: Member detection and cropping
                logger.info(f"    🔍 Step 2: Member detection & cropping")
                detection_result = self.detector.extract_member_card(original_img)
                cropped_img = detection_result["cropped_img"]

                logger.info(f"       Status: {detection_result['status']}")
                logger.info(f"       Cropped size: {cropped_img.shape[1]}×{cropped_img.shape[0]} pixels")
                logger.info(f"       Confidence: {detection_result['confidence']:.2f}")

                # Save cropped
                crop_path = self.test_dir / "images_cropped" / f"{idx:02d}_{group_name.lower()}_{idx}_cropped.png"
                cv2.imwrite(str(crop_path), cropped_img)

                # Step 2: Image processing (padding + resize)
                logger.info(f"    📐 Step 3: Aspect ratio correction & padding")
                processing_result = self.processor.process_pipeline(cropped_img, target_height=400)
                processed_img = processing_result["image"]

                logger.info(f"       Original ratio: {processing_result['original']['ratio']:.3f}")
                logger.info(f"       Final ratio: {processing_result['processed']['ratio']:.3f}")
                logger.info(f"       Padding applied: {processing_result['padding']['needs_padding']}")
                logger.info(f"       Final size: {processed_img.shape[1]}×{processed_img.shape[0]} pixels")
                logger.info(f"       Aspect ratio valid: {processing_result['validation']['is_valid']} (deviation: {processing_result['validation']['deviation']:.4f})")

                # Save processed
                proc_path = self.test_dir / "images_processed" / f"{idx:02d}_{group_name.lower()}_{idx}_processed.png"
                cv2.imwrite(str(proc_path), processed_img)

                # Step 3: Metadata tagging
                logger.info(f"    🏷️  Step 4: Metadata auto-tagging")
                metadata = self.tagger.generate_metadata(
                    query=listing["title"],
                    ebay_listing=listing,
                    processing_info=processing_result
                )

                logger.info(f"       Group: {metadata['group']}")
                logger.info(f"       Member: {metadata['member']}")
                logger.info(f"       Tags: {', '.join(metadata['tags'][:3])}...")

                # Save metadata
                meta_path = self.test_dir / "metadata" / f"{idx:02d}_{group_name.lower()}_{idx}_metadata.json"
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False, default=str)

                logger.info(f"    💾 Step 5: Files saved")
                logger.info(f"       Image: {proc_path.name}")
                logger.info(f"       Metadata: {meta_path.name}\n")

                # Track result
                result = {
                    "group": group_name,
                    "listing_title": listing["title"],
                    "original_size": (original_img.shape[1], original_img.shape[0]),
                    "cropped_size": (cropped_img.shape[1], cropped_img.shape[0]),
                    "processed_size": (processed_img.shape[1], processed_img.shape[0]),
                    "original_ratio": processing_result["original"]["ratio"],
                    "final_ratio": processing_result["processed"]["ratio"],
                    "padding_applied": processing_result["padding"]["needs_padding"],
                    "validation_passed": processing_result["validation"]["is_valid"],
                    "price": listing["price"],
                    "seller": listing["seller"],
                    "status": "SUCCESS"
                }

                group_results.append(result)
                self.results.append(result)

            except Exception as e:
                logger.error(f"    ❌ Error: {e}")
                result = {
                    "group": group_name,
                    "listing_title": listing["title"],
                    "status": "FAILED",
                    "error": str(e)
                }
                group_results.append(result)
                self.results.append(result)

        return group_results

    def generate_report(self):
        """Generate comprehensive test report."""
        logger.info(f"\n{'='*80}")
        logger.info("📊 COMPREHENSIVE PIPELINE TEST - FINAL REPORT")
        logger.info(f"{'='*80}\n")

        # Summary statistics
        successful = sum(1 for r in self.results if r.get("status") == "SUCCESS")
        failed = sum(1 for r in self.results if r.get("status") == "FAILED")
        total = len(self.results)

        logger.info(f"✅ Successful: {successful}/{total}")
        logger.info(f"❌ Failed: {failed}/{total}")
        logger.info(f"📊 Success Rate: {(successful/total*100):.1f}%" if total > 0 else "N/A")

        # Processing time
        duration = (datetime.now() - self.start_time).total_seconds()
        logger.info(f"⏱️  Total Duration: {duration:.2f}s")
        if successful > 0:
            logger.info(f"⏱️  Avg per image: {(duration/successful):.2f}s\n")

        # Results table
        if self.results and self.results[0].get("status") == "SUCCESS":
            logger.info("📈 DETAILED RESULTS:\n")
            logger.info("Group      | Original Size   | Cropped Size    | Final Size      | Ratio        | Price")
            logger.info("-----------|-----------------|-----------------|-----------------|--------------|--------")

            for result in self.results:
                if result.get("status") == "SUCCESS":
                    orig = result["original_size"]
                    crop = result["cropped_size"]
                    final = result["processed_size"]
                    ratio = result["final_ratio"]
                    price = result.get("price", "N/A")

                    logger.info(f"{result['group']:<10} | {orig[0]:>4}×{orig[1]:<4} | {crop[0]:>4}×{crop[1]:<4} | {final[0]:>4}×{final[1]:<4} | {ratio:.3f}      | ${price}")

        # Sample metadata
        if self.results and self.results[0].get("status") == "SUCCESS":
            logger.info(f"\n📝 SAMPLE METADATA:\n")
            meta_files = list(self.test_dir.glob("metadata/*.json"))
            if meta_files:
                with open(meta_files[0]) as f:
                    sample_meta = json.load(f)

                logger.info(f"File: {meta_files[0].name}\n")
                logger.info(f"  • Group: {sample_meta.get('group', 'Unknown')}")
                logger.info(f"  • Member: {sample_meta.get('member', 'Unknown')}")
                logger.info(f"  • Source: {sample_meta.get('source', {}).get('platform')} ({sample_meta.get('source', {}).get('seller')})")
                logger.info(f"  • Price: ${sample_meta.get('source', {}).get('price')} {sample_meta.get('source', {}).get('currency')}")
                logger.info(f"  • Member Detected: {sample_meta.get('processing_status', {}).get('member_detected')}")
                logger.info(f"  • Aspect Ratio Corrected: {sample_meta.get('processing_status', {}).get('aspect_ratio_corrected')}")
                logger.info(f"  • Tags: {', '.join(sample_meta.get('tags', [])[:5])}")

        # Generated files
        logger.info(f"\n📁 GENERATED FILES:\n")

        def count_files(subdir):
            return len(list((self.test_dir / subdir).glob("*")))

        orig_count = count_files("images_original")
        crop_count = count_files("images_cropped")
        proc_count = count_files("images_processed")
        meta_count = count_files("metadata")

        logger.info(f"  📂 images_original/       {orig_count} files")
        logger.info(f"  📂 images_cropped/        {crop_count} files")
        logger.info(f"  📂 images_processed/      {proc_count} files ⭐ (final)")
        logger.info(f"  📂 metadata/              {meta_count} files (JSON)")

        # Output directory info
        logger.info(f"\n📍 Test Results Location:")
        logger.info(f"   {self.test_dir.absolute()}\n")

        # Save summary report
        self._save_summary_report(successful, failed, total, duration)

    def _save_summary_report(self, successful, failed, total, duration):
        """Save summary report as JSON."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "test_duration_seconds": duration,
            "summary": {
                "total_processed": total,
                "successful": successful,
                "failed": failed,
                "success_rate": f"{(successful/total*100):.1f}%" if total > 0 else "N/A"
            },
            "groups_tested": TEST_GROUPS,
            "results": [
                {k: v for k, v in r.items() if k != "status" or r["status"] != "SUCCESS"}
                for r in self.results
            ]
        }

        report_path = self.test_dir / "test_summary_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"✅ Report saved: {report_path}")

    def run_all_tests(self):
        """Run complete test suite."""
        logger.info(f"\n{'#'*80}")
        logger.info("# COMPREHENSIVE PIPELINE TEST - TIER 1 DRY RUN")
        logger.info(f"# Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"# Test Groups: {', '.join(TEST_GROUPS)}")
        logger.info(f"# Output Directory: {self.test_dir.absolute()}")
        logger.info(f"{'#'*80}\n")

        # Process each test group
        for group in TEST_GROUPS:
            self.process_group(group, sample_size=2)

        # Generate report
        self.generate_report()


def main():
    """Main execution."""
    test = ComprehensivePipelineTest()
    test.run_all_tests()


if __name__ == "__main__":
    main()
