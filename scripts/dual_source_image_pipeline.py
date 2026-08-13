#!/usr/bin/env python3
"""
Dual-source image sourcing pipeline for photocards.
Combines eBay and Naver image search with multi-stage filtering.

Flow:
1. Search each source for card image
2. Download and filter (aspect ratio, keywords, grid pattern)
3. Cross-validate with perceptual hash
4. Assign confidence level: high/medium/review_needed/failed
5. Update database with source and confidence
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum

import cv2
import numpy as np

from naver_image_search import NaverImageSearchClient
from image_filter import batch_filter_images
from perceptual_hash import compare_images

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfidenceLevel(str, Enum):
    """Confidence levels for image matching."""
    HIGH = "high"          # Both sources match (perceptual hash > 0.85)
    MEDIUM = "medium"      # One source only, or medium phash match
    REVIEW_NEEDED = "review_needed"  # Ambiguous / low similarity
    FAILED = "failed"      # No viable images from either source


class DualSourceImagePipeline:
    """Combines eBay and Naver image search for photocard sourcing."""

    def __init__(
        self,
        naver_client_id: str,
        naver_client_secret: str,
        output_dir: str = "pipeline_output",
    ):
        """
        Initialize dual-source pipeline.

        Args:
            naver_client_id: NAVER API HUB Client ID
            naver_client_secret: NAVER API HUB Client Secret
            output_dir: Output directory for logs and results
        """
        self.naver_client = NaverImageSearchClient(naver_client_id, naver_client_secret)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "dual_source_results").mkdir(exist_ok=True)
        (self.output_dir / "review_queue_dual").mkdir(exist_ok=True)

        self.results = []
        self.review_queue = []
        self.errors = []

    def _build_search_queries(
        self,
        group_name: str,
        member_name: Optional[str] = None,
        album_title: Optional[str] = None,
    ) -> List[str]:
        """
        Build search queries for a card.

        Strategy:
        - Primary: "{member_name} {group_name} 포토카드"
        - Secondary: "{album_title} {group_name} 포토카드"
        - Fallback: "{group_name} 포토카드"

        Args:
            group_name: Artist/group name
            member_name: Member name (optional)
            album_title: Album title (optional)

        Returns:
            List of search queries in priority order
        """
        queries = []

        if member_name:
            queries.append(f"{member_name} {group_name} 포토카드")

        if album_title:
            queries.append(f"{album_title} {group_name} 포토카드")

        queries.append(f"{group_name} 포토카드")

        return queries

    def search_dual_sources(
        self,
        group_name: str,
        member_name: Optional[str] = None,
        album_title: Optional[str] = None,
        ebay_search_fn=None,  # Function(query, limit) -> list of dicts with 'image_url'
        limit_per_source: int = 30,
    ) -> Dict:
        """
        Search both eBay and Naver for card image.

        Args:
            group_name: Artist/group name
            member_name: Member name
            album_title: Album title
            ebay_search_fn: Callable for eBay search
            limit_per_source: Max results per source

        Returns:
            Dict with eBay and Naver results (pre-filtered)
        """
        queries = self._build_search_queries(group_name, member_name, album_title)
        primary_query = queries[0]

        logger.info(f"Searching '{primary_query}'...")

        # Search Naver
        naver_results = self.naver_client.search_images(
            primary_query,
            limit=limit_per_source,
        )

        # Filter Naver results
        naver_filtered = self._filter_source_results(
            naver_results,
            source="naver",
        )

        # Search eBay (if provided)
        ebay_results = []
        ebay_filtered = []
        if ebay_search_fn:
            try:
                ebay_results = ebay_search_fn(primary_query, limit=limit_per_source)
                ebay_filtered = self._filter_source_results(
                    ebay_results,
                    source="ebay",
                )
            except Exception as e:
                logger.warning(f"eBay search failed: {e}")

        return {
            "query": primary_query,
            "ebay": {
                "raw_count": len(ebay_results),
                "filtered_count": len(ebay_filtered),
                "results": ebay_filtered,
            },
            "naver": {
                "raw_count": len(naver_results),
                "filtered_count": len(naver_filtered),
                "results": naver_filtered,
            },
        }

    def _filter_source_results(
        self,
        results: List[Dict],
        source: str = "naver",
    ) -> List[Dict]:
        """
        Apply source-specific filters (aspect ratio, keywords, etc).

        Args:
            results: Raw search results
            source: Source name (for logging)

        Returns:
            Filtered results with image objects
        """
        from image_filter import apply_source_filters

        filtered = []

        for result in results:
            url = result.get("image")
            title = result.get("title", "")

            try:
                # Download image
                img = self._download_image(url)
                if img is None:
                    continue

                # Apply filters
                filter_result = apply_source_filters(img, title)

                if filter_result["is_valid"]:
                    filtered.append({
                        "result": result,
                        "image": img,
                        "url": url,
                        "source": source,
                    })

            except Exception as e:
                logger.debug(f"Filter error for {url}: {e}")

        logger.info(f"  {source.upper()}: {len(filtered)}/{len(results)} passed filters")
        return filtered

    def _download_image(self, url: str, timeout: int = 10) -> Optional[np.ndarray]:
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
            logger.debug(f"Download failed {url}: {e}")
            return None

    def cross_validate_and_rank(
        self,
        ebay_filtered: List[Dict],
        naver_filtered: List[Dict],
        similarity_threshold: float = 0.85,
    ) -> Dict:
        """
        Cross-validate images using perceptual hash.
        Assign confidence levels.

        Returns:
            Dict with:
            - confidence_level: high/medium/review_needed/failed
            - selected_image: best image (for DB update)
            - sources_used: list of source names
            - match_details: phash comparison result (if applicable)
        """
        if not ebay_filtered and not naver_filtered:
            return {
                "confidence_level": ConfidenceLevel.FAILED,
                "selected_image": None,
                "sources_used": [],
                "reason": "No valid images from either source",
            }

        # Case 1: Both sources have candidates
        if ebay_filtered and naver_filtered:
            # Compare best candidates from each source
            ebay_best = ebay_filtered[0]
            naver_best = naver_filtered[0]

            match_result = compare_images(
                ebay_best["image"],
                naver_best["image"],
                similarity_threshold=similarity_threshold,
            )

            if match_result["is_match"]:
                # High confidence: both sources agree
                return {
                    "confidence_level": ConfidenceLevel.HIGH,
                    "selected_image": ebay_best,  # Prefer eBay (original source)
                    "sources_used": ["ebay", "naver"],
                    "match_details": match_result,
                    "reason": f"Cross-validated (similarity: {match_result['average_similarity']:.3f})",
                }
            else:
                # Medium confidence: sources disagree, but both exist
                # Route to review queue
                return {
                    "confidence_level": ConfidenceLevel.REVIEW_NEEDED,
                    "selected_image": None,
                    "sources_used": ["ebay", "naver"],
                    "match_details": match_result,
                    "reason": f"Sources disagree (similarity: {match_result['average_similarity']:.3f})",
                    "candidates": [ebay_best, naver_best],
                }

        # Case 2: Only eBay
        if ebay_filtered and not naver_filtered:
            return {
                "confidence_level": ConfidenceLevel.MEDIUM,
                "selected_image": ebay_filtered[0],
                "sources_used": ["ebay"],
                "reason": "eBay only (Naver had no matches)",
            }

        # Case 3: Only Naver
        if naver_filtered and not ebay_filtered:
            return {
                "confidence_level": ConfidenceLevel.MEDIUM,
                "selected_image": naver_filtered[0],
                "sources_used": ["naver"],
                "reason": "Naver only (eBay had no matches)",
            }

    def process_card(
        self,
        card_id: str,
        group_name: str,
        member_name: Optional[str] = None,
        album_title: Optional[str] = None,
        ebay_search_fn=None,
    ) -> Dict:
        """
        Process single card end-to-end.

        Args:
            card_id: Card database ID
            group_name: Artist/group
            member_name: Member name
            album_title: Album title
            ebay_search_fn: eBay search function

        Returns:
            Result dict with confidence_level, selected_image, etc.
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Processing Card: {card_id}")
        logger.info(f"{'='*70}")

        # Step 1: Search both sources
        search_result = self.search_dual_sources(
            group_name,
            member_name,
            album_title,
            ebay_search_fn,
        )

        # Step 2: Cross-validate and rank
        validation_result = self.cross_validate_and_rank(
            search_result["ebay"]["results"],
            search_result["naver"]["results"],
        )

        # Prepare final result
        result = {
            "card_id": card_id,
            "search_query": search_result["query"],
            "confidence_level": validation_result["confidence_level"].value,
            "sources_used": validation_result["sources_used"],
            "reason": validation_result.get("reason", ""),
        }

        # Save selected image or candidates for review
        if validation_result["confidence_level"] == ConfidenceLevel.HIGH:
            # Save single best image
            result["status"] = "success"
            self._save_image(
                card_id,
                validation_result["selected_image"]["image"],
                confidence=ConfidenceLevel.HIGH,
            )
            result["image_path"] = str(
                self.output_dir / "dual_source_results" / f"{card_id}_high.png"
            )

        elif validation_result["confidence_level"] == ConfidenceLevel.MEDIUM:
            # Save single best image
            result["status"] = "success"
            self._save_image(
                card_id,
                validation_result["selected_image"]["image"],
                confidence=ConfidenceLevel.MEDIUM,
            )
            result["image_path"] = str(
                self.output_dir / "dual_source_results" / f"{card_id}_medium.png"
            )

        elif validation_result["confidence_level"] == ConfidenceLevel.REVIEW_NEEDED:
            # Save candidates side-by-side for manual review
            result["status"] = "needs_review"
            candidates = validation_result.get("candidates", [])
            result["review_path"] = self._save_candidates_for_review(
                card_id,
                candidates,
                validation_result["match_details"],
            )
            self.review_queue.append(result)

        else:
            # Failed
            result["status"] = "failed"

        self.results.append(result)
        logger.info(f"Result: {result['confidence_level']} | {result.get('reason', 'N/A')}")

        return result

    def _save_image(self, card_id: str, image: np.ndarray, confidence: ConfidenceLevel):
        """Save image to results directory."""
        path = self.output_dir / "dual_source_results" / f"{card_id}_{confidence.value}.png"
        cv2.imwrite(str(path), image)

    def _save_candidates_for_review(
        self,
        card_id: str,
        candidates: List[Dict],
        match_details: Dict,
    ) -> str:
        """
        Save candidate images side-by-side for manual review.

        Args:
            card_id: Card ID
            candidates: List of candidate images
            match_details: Perceptual hash comparison result

        Returns:
            Path to review image
        """
        if len(candidates) < 2:
            return ""

        img1 = candidates[0]["image"]
        img2 = candidates[1]["image"]

        # Resize to same height for side-by-side display
        h = max(img1.shape[0], img2.shape[0])
        img1_resized = cv2.resize(img1, (int(img1.shape[1] * h / img1.shape[0]), h))
        img2_resized = cv2.resize(img2, (int(img2.shape[1] * h / img2.shape[0]), h))

        # Concatenate horizontally
        combined = np.hstack([img1_resized, img2_resized])

        # Save
        path = (
            self.output_dir / "review_queue_dual" / f"{card_id}_review.png"
        )
        cv2.imwrite(str(path), combined)

        # Save metadata
        metadata_path = path.with_suffix(".json")
        with open(metadata_path, "w") as f:
            json.dump({
                "card_id": card_id,
                "sources": [candidates[0].get("source"), candidates[1].get("source")],
                "phash_similarity": match_details["average_similarity"],
                "left_source": candidates[0].get("source"),
                "right_source": candidates[1].get("source"),
            }, f, indent=2)

        return str(path)

    def process_batch(
        self,
        cards: List[Dict],
        ebay_search_fn=None,
    ) -> Dict:
        """
        Process multiple cards.

        Args:
            cards: List of dicts with 'id', 'group', 'member', 'album'
            ebay_search_fn: eBay search function

        Returns:
            Summary report
        """
        logger.info(f"\n{'#'*70}")
        logger.info(f"# Dual-Source Image Pipeline")
        logger.info(f"# Cards to process: {len(cards)}")
        logger.info(f"{'#'*70}\n")

        for idx, card in enumerate(cards, 1):
            logger.info(f"\n[{idx}/{len(cards)}]")
            self.process_card(
                card.get("id"),
                card.get("group"),
                card.get("member"),
                card.get("album"),
                ebay_search_fn,
            )

        return self._generate_report()

    def _generate_report(self) -> Dict:
        """Generate processing report."""
        logger.info(f"\n{'='*70}")
        logger.info("📊 DUAL-SOURCE PIPELINE SUMMARY")
        logger.info(f"{'='*70}\n")

        high = sum(1 for r in self.results if r["confidence_level"] == "high")
        medium = sum(1 for r in self.results if r["confidence_level"] == "medium")
        review = len(self.review_queue)
        failed = sum(1 for r in self.results if r["status"] == "failed")
        total = len(self.results)

        logger.info(f"✅ High confidence (dual-source match): {high}/{total}")
        logger.info(f"🟡 Medium confidence (single source): {medium}/{total}")
        logger.info(f"🗂️  Needs manual review (source mismatch): {review}/{total}")
        logger.info(f"❌ Failed (no images): {failed}/{total}")

        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total,
                "high": high,
                "medium": medium,
                "review_needed": review,
                "failed": failed,
                "high_percentage": f"{high / total * 100:.1f}%" if total > 0 else "N/A",
            },
            "results": self.results,
            "review_queue": self.review_queue,
        }

        report_path = self.output_dir / "dual_source_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"\n📄 Report saved: {report_path}")

        return report
