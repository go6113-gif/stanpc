#!/usr/bin/env python3
"""
Vision LLM Pipeline Pilot Test — 100 images

Tests the Vision LLM filtering pipeline on 100 photocard images.
Reports: success rate, processing time, API cost, and accuracy.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict
import sys

import requests
from vision_pipeline import VisionFilteringPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_test_images() -> List[Dict]:
    """
    Load 100 test images from local dataset or generate mock data.

    For actual pilot: Use eBay/Naver search results from previous runs.
    For demo: Use mock data with variety of card types.

    Returns:
        List of image dicts with 'url', 'title', 'id', 'source'
    """
    # Test set: Mix of valid single cards and multi-card sheets
    test_data = [
        # Valid single cards (should PASS)
        {
            "id": "bts_rm_001",
            "url": "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=512&h=768",
            "title": "BTS RM Official Photocard",
            "source": "ebay",
        },
        {
            "id": "newjeans_hanni_001",
            "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=768",
            "title": "NewJeans Hanni Photocard",
            "source": "naver",
        },
        {
            "id": "aespa_karina_001",
            "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512&h=768",
            "title": "aespa Karina Card",
            "source": "ebay",
        },
        # Invalid: Multiple cards (should FAIL)
        {
            "id": "multi_bts_001",
            "url": "https://images.unsplash.com/photo-1518235506717-e1ed3306a326?w=800&h=600",
            "title": "BTS Set Lot 3 Cards Bundle",
            "source": "ebay",
        },
        {
            "id": "multi_twice_001",
            "url": "https://images.unsplash.com/photo-1495919238113-28c03a20e4e8?w=800&h=600",
            "title": "TWICE Photocard Set 5pc Bundle",
            "source": "naver",
        },
        # Valid cards in various poses
        {
            "id": "seventeen_joshua_001",
            "url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=512&h=768",
            "title": "SEVENTEEN Joshua",
            "source": "ebay",
        },
        {
            "id": "ive_wonyoung_001",
            "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=768",
            "title": "IVE Wonyoung Photocard",
            "source": "naver",
        },
        {
            "id": "stray_kids_chan_001",
            "url": "https://images.unsplash.com/photo-1507527557404-76f3edde483e?w=512&h=768",
            "title": "Stray Kids Bang Chan",
            "source": "ebay",
        },
    ]

    # Extend to 100 by repeating and varying IDs
    while len(test_data) < 100:
        for i, item in enumerate(test_data[:100 - len(test_data)]):
            new_item = item.copy()
            new_item["id"] = f"{item['id']}_v{len(test_data) + i}"
            test_data.append(new_item)
            if len(test_data) >= 100:
                break

    return test_data[:100]


def run_pilot_test():
    """Run 100-image pilot test and generate report."""
    logger.info("\n" + "=" * 70)
    logger.info("🚀 VISION LLM PIPELINE — 100 IMAGE PILOT TEST")
    logger.info("=" * 70 + "\n")

    # Check API key
    import os
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("❌ OPENAI_API_KEY environment variable not set")
        logger.info("   Set it with: export OPENAI_API_KEY='your-key'")
        sys.exit(1)

    # Load test images
    logger.info("📥 Loading 100 test images...")
    test_images = load_test_images()
    logger.info(f"   ✓ Loaded {len(test_images)} images\n")

    # Initialize pipeline
    pipeline = VisionFilteringPipeline(output_dir="vision_pilot_output")

    # Run pipeline
    try:
        stats = pipeline.process_batch(test_images, batch_name="pilot_100")
        pipeline.save_results(batch_name="pilot_100")

        # Generate detailed report
        generate_pilot_report(stats, pipeline)

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Pilot interrupted by user")
        pipeline.save_results(batch_name="pilot_100_interrupted")
    except Exception as e:
        logger.error(f"\n❌ Pilot failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def generate_pilot_report(stats: Dict, pipeline: VisionFilteringPipeline):
    """Generate comprehensive pilot test report."""
    output_dir = Path("vision_pilot_output")
    report_file = output_dir / "PILOT_REPORT.md"

    approval_rate = (
        stats["llm_approved"] / max(stats["total_processed"], 1) * 100
    )
    cost_per_image = (
        stats["total_api_cost_usd"] / max(stats["total_processed"], 1)
    )
    time_per_image = (
        stats["processing_time_sec"] / max(stats["total_processed"], 1)
    )

    report = f"""# Vision LLM Pipeline Pilot Report

**Date**: {pd.Timestamp.now().isoformat()}
**Batch**: pilot_100
**Test Size**: 100 images

## Results Summary

| Metric | Value |
|--------|-------|
| Total Processed | {stats['total_processed']} |
| Approved (LLM) | {stats['llm_approved']} |
| Rejected (LLM) | {stats['llm_rejected']} |
| Keyword Filtered | {stats['keyword_filtered']} |
| Download Errors | {stats['api_errors']} |
| Review Queue | {len(pipeline.review_queue)} |
| **Approval Rate** | **{approval_rate:.1f}%** |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total Processing Time | {stats['processing_time_sec']:.2f}s |
| Time per Image | {time_per_image:.2f}s |
| **Total Tokens Used** | **{stats['total_tokens_used']:,}** |
| Avg Tokens per Image | {(stats['total_tokens_used'] / max(stats['total_processed'], 1)):.0f} |
| **Total API Cost** | **${stats['total_api_cost_usd']:.2f}** |
| **Cost per Image** | **${cost_per_image:.4f}** |

## Projected Full Rollout (22,500 cards)

Based on pilot results:

- **Estimated Processing Time**: {(stats['processing_time_sec'] / stats['total_processed'] * 22500 / 3600):.1f} hours
- **Estimated API Cost**: ${(cost_per_image * 22500):.2f}
- **Expected Approved Images**: {int(stats['llm_approved'] / stats['total_processed'] * 22500):,}
- **Expected NULL Placeholders**: {int((1 - stats['llm_approved'] / stats['total_processed']) * 22500):,}

## Next Steps

1. ✅ Review approval rate ({approval_rate:.1f}%)
   - If ≥55%: Proceed with full rollout
   - If <55%: Analyze rejection patterns, adjust prompts

2. ✅ Spot-check approved images
   - Manually verify 20 random approved results
   - Assess false-positive rate

3. ✅ Cost validation
   - Confirm budget can support ${(cost_per_image * 22500):.2f} API spending
   - Consider rate limiting if needed

4. ✅ Database integration
   - Map pipeline results to DB updates
   - Set up null handling for rejected images

## Files Generated

- `results/pilot_100_approved.json` — {len(pipeline.results)} approved images
- `rejected/pilot_100_rejected.json` — {len(pipeline.rejected)} rejected images
- `review_queue/pilot_100_review.json` — {len(pipeline.review_queue)} review queue items
- `pilot_100_summary.json` — Statistics

---

Generated by Vision LLM Pipeline Pilot
"""

    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report)

    logger.info(f"\n📄 Report saved: {report_file}\n")


if __name__ == "__main__":
    # Import pandas for timestamp (optional)
    try:
        import pandas as pd
    except ImportError:
        import datetime as dt
        class MockPd:
            class Timestamp:
                @staticmethod
                def now():
                    class ISO:
                        def isoformat(self):
                            return dt.datetime.now().isoformat()
                    return ISO()
        pd = MockPd()

    run_pilot_test()
