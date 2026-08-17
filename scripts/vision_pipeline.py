#!/usr/bin/env python3
"""
Vision LLM-based photocard image filtering pipeline.
Combines text-based keyword filtering with Vision LLM analysis.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import time

from vision_image_resizer import VisionImageResizer
from vision_llm_analyzer import VisionLLMAnalyzer
from image_filter import has_excluded_keywords

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VisionFilteringPipeline:
    """
    Two-stage filtering pipeline:
    1. Text-based keyword filtering (fast, free)
    2. Vision LLM analysis (accurate, cost)
    """

    def __init__(self, output_dir: str = "vision_pipeline_output"):
        """
        Initialize pipeline.

        Args:
            output_dir: Output directory for logs and results
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "results").mkdir(exist_ok=True)
        (self.output_dir / "rejected").mkdir(exist_ok=True)
        (self.output_dir / "review_queue").mkdir(exist_ok=True)

        self.image_resizer = VisionImageResizer()
        self.llm_analyzer = VisionLLMAnalyzer()

        self.stats = {
            "total_processed": 0,
            "keyword_filtered": 0,
            "llm_approved": 0,
            "llm_rejected": 0,
            "api_errors": 0,
            "total_tokens_used": 0,
            "total_api_cost_usd": 0.0,
            "processing_time_sec": 0,
        }

        self.results = []
        self.rejected = []
        self.review_queue = []

    def filter_image(
        self,
        image_url: str,
        title: str,
        card_id: str,
        source: str = "ebay",
    ) -> Dict:
        """
        Filter a single image through pipeline.

        Args:
            image_url: Image URL
            title: Item title (for keyword filtering)
            card_id: Card identifier
            source: Source name (ebay, naver)

        Returns:
            Dict with filtering result
        """
        result = {
            "card_id": card_id,
            "image_url": image_url,
            "title": title,
            "source": source,
            "stage": None,
            "is_single_card": False,
            "confidence_score": 0,
            "reason": None,
            "tokens_used": 0,
            "api_cost_usd": 0.0,
        }

        # Stage 1: Keyword filtering
        if has_excluded_keywords(title):
            result["stage"] = "keyword_filter"
            result["reason"] = "excluded_keyword"
            self.stats["keyword_filtered"] += 1
            self.rejected.append(result)
            logger.info(f"  ❌ {card_id}: Keyword filtered ({title[:30]}...)")
            return result

        # Stage 2: Download and resize
        logger.info(f"  📥 {card_id}: Downloading image...")
        processed = self.image_resizer.process_image_url(image_url)
        if processed is None:
            result["stage"] = "download"
            result["reason"] = "download_failed"
            self.stats["api_errors"] += 1
            self.rejected.append(result)
            logger.info(f"  ❌ {card_id}: Download failed")
            return result

        base64_image, original_size = processed
        logger.info(f"  ✓ Downloaded: {original_size}")

        # Stage 3: Vision LLM analysis
        logger.info(f"  🧠 {card_id}: Analyzing with Vision LLM...")
        llm_result = self.llm_analyzer.analyze_image(base64_image)

        result["stage"] = "vision_llm"
        result["is_single_card"] = llm_result.get("is_single_card", False)
        result["confidence_score"] = llm_result.get("confidence_score", 0)
        result["reason"] = llm_result.get("reason", "unknown")
        usage = llm_result.get("usage", {})
        result["tokens_used"] = usage.get("total_tokens", 0)
        result["api_cost_usd"] = VisionLLMAnalyzer.estimate_api_cost(
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
        )

        # Update stats
        self.stats["total_tokens_used"] += result["tokens_used"]
        self.stats["total_api_cost_usd"] += result["api_cost_usd"]

        if result["is_single_card"]:
            self.stats["llm_approved"] += 1
            self.results.append(result)
            logger.info(
                f"  ✅ {card_id}: APPROVED (confidence: {result['confidence_score']}%, "
                f"tokens: {result['tokens_used']}, cost: ${result['api_cost_usd']:.4f})"
            )
        else:
            self.stats["llm_rejected"] += 1
            # Confidence < 50% goes to review queue
            if result["confidence_score"] < 50:
                self.review_queue.append(result)
                logger.info(
                    f"  ⚠️  {card_id}: REVIEW NEEDED (confidence: {result['confidence_score']}%)"
                )
            else:
                self.rejected.append(result)
                logger.info(
                    f"  ❌ {card_id}: REJECTED (confidence: {result['confidence_score']}%, reason: {result['reason']})"
                )

        return result

    def process_batch(
        self,
        images: List[Dict],
        batch_name: str = "batch",
    ) -> Dict:
        """
        Process batch of images.

        Args:
            images: List of dicts with 'url', 'title', 'id', 'source'
            batch_name: Batch identifier for logging

        Returns:
            Batch statistics
        """
        logger.info(f"\n🚀 Starting Vision Pipeline Batch: {batch_name}")
        logger.info(f"   Processing {len(images)} images...\n")

        start_time = time.time()

        for i, img_data in enumerate(images, 1):
            logger.info(f"[{i}/{len(images)}]")
            self.filter_image(
                image_url=img_data.get("url") or img_data.get("image"),
                title=img_data.get("title", ""),
                card_id=img_data.get("id") or f"image_{i}",
                source=img_data.get("source", "unknown"),
            )
            self.stats["total_processed"] += 1

        self.stats["processing_time_sec"] = time.time() - start_time

        # Generate report
        logger.info("\n" + "=" * 60)
        logger.info(f"✅ Batch Complete: {batch_name}")
        logger.info("=" * 60)
        logger.info(f"Total Processed:      {self.stats['total_processed']}")
        logger.info(f"  Keyword Filtered:   {self.stats['keyword_filtered']}")
        logger.info(f"  LLM Approved:       {self.stats['llm_approved']}")
        logger.info(f"  LLM Rejected:       {self.stats['llm_rejected']}")
        logger.info(f"  API Errors:         {self.stats['api_errors']}")
        logger.info(f"  Review Queue:       {len(self.review_queue)}")
        logger.info(f"\nApproval Rate:        {(self.stats['llm_approved'] / max(self.stats['total_processed'], 1) * 100):.1f}%")
        logger.info(f"Processing Time:      {self.stats['processing_time_sec']:.1f}s")
        logger.info(f"Avg Time per Image:   {(self.stats['processing_time_sec'] / max(self.stats['total_processed'], 1)):.2f}s")
        logger.info(f"\nTotal Tokens Used:    {self.stats['total_tokens_used']:,}")
        logger.info(f"Total API Cost:       ${self.stats['total_api_cost_usd']:.2f}")
        logger.info(f"Cost per Image:       ${(self.stats['total_api_cost_usd'] / max(self.stats['total_processed'], 1)):.4f}")
        logger.info("=" * 60 + "\n")

        return self.stats

    def save_results(self, batch_name: str = "batch"):
        """Save results to JSON files."""
        timestamp = datetime.now().isoformat()

        # Approved results
        results_file = self.output_dir / "results" / f"{batch_name}_approved.json"
        with open(results_file, "w") as f:
            json.dump(
                {
                    "batch": batch_name,
                    "timestamp": timestamp,
                    "count": len(self.results),
                    "results": self.results,
                },
                f,
                indent=2,
            )
        logger.info(f"✅ Saved {len(self.results)} approved results to {results_file}")

        # Rejected results
        rejected_file = self.output_dir / "rejected" / f"{batch_name}_rejected.json"
        with open(rejected_file, "w") as f:
            json.dump(
                {
                    "batch": batch_name,
                    "timestamp": timestamp,
                    "count": len(self.rejected),
                    "results": self.rejected,
                },
                f,
                indent=2,
            )
        logger.info(f"❌ Saved {len(self.rejected)} rejected results to {rejected_file}")

        # Review queue
        if self.review_queue:
            review_file = self.output_dir / "review_queue" / f"{batch_name}_review.json"
            with open(review_file, "w") as f:
                json.dump(
                    {
                        "batch": batch_name,
                        "timestamp": timestamp,
                        "count": len(self.review_queue),
                        "results": self.review_queue,
                    },
                    f,
                    indent=2,
                )
            logger.info(f"⚠️  Saved {len(self.review_queue)} review queue items to {review_file}")

        # Summary report
        report_file = self.output_dir / f"{batch_name}_summary.json"
        with open(report_file, "w") as f:
            json.dump(
                {
                    "batch": batch_name,
                    "timestamp": timestamp,
                    "stats": self.stats,
                },
                f,
                indent=2,
            )
        logger.info(f"📊 Saved summary report to {report_file}")
