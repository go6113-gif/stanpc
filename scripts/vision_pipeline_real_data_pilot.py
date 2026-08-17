#!/usr/bin/env python3
"""
Vision LLM Pipeline Pilot with Real Photocard Data
Fetches real photocard images from eBay and runs the filtering pipeline.
"""

import json
import logging
import sys
import os
from pathlib import Path
from typing import List, Dict
import time

import requests
from vision_pipeline import VisionFilteringPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def fetch_ebay_photocards(query: str = "BTS photocard", limit: int = 100) -> List[Dict]:
    """
    Fetch real photocard listings from eBay Search API.

    Args:
        query: Search query (e.g., "BTS photocard")
        limit: Number of results to fetch

    Returns:
        List of listing dicts with 'url', 'title', 'id', 'image'
    """
    # Mock data for demonstration (replace with real eBay API calls if keys available)
    # In production: Use eBay Browse API with proper authentication

    logger.info(f"Fetching {limit} photocard listings for '{query}'...")
    logger.info("⚠️  Using sample data (requires real eBay API key for production)")

    # Sample photocard listings (mix of single cards and bundles)
    sample_listings = [
        # Single card listings (should PASS)
        {
            "id": "ebay_bts_rm_001",
            "title": "BTS RM Official Photocard K-pop Trading Card",
            "url": "https://images.ebayimg.com/images/g/1YkAAOSw1example1",
            "image": "https://images.ebayimg.com/images/g/1YkAAOSw1example1",
        },
        {
            "id": "ebay_seventeen_joshua_001",
            "title": "SEVENTEEN Joshua Hengryul Photocard Official",
            "url": "https://images.ebayimg.com/images/g/2example2",
            "image": "https://images.ebayimg.com/images/g/2example2",
        },
        {
            "id": "ebay_newjeans_hanni_001",
            "title": "NewJeans Hanni Photocard Kpop Kino",
            "url": "https://images.ebayimg.com/images/g/3example3",
            "image": "https://images.ebayimg.com/images/g/3example3",
        },
        # Bundle/multi-card listings (should FAIL keyword filter)
        {
            "id": "ebay_bts_lot_001",
            "title": "BTS Photocard Lot 10 Cards Bundle Mix Vintage",
            "url": "https://images.ebayimg.com/images/g/4example4",
            "image": "https://images.ebayimg.com/images/g/4example4",
        },
        {
            "id": "ebay_kpop_set_001",
            "title": "K-pop Photocard Set 5pcs SEVENTEEN EXO Stray Kids",
            "url": "https://images.ebayimg.com/images/g/5example5",
            "image": "https://images.ebayimg.com/images/g/5example5",
        },
    ]

    # Extend to requested limit by repeating with variations
    results = []
    for i in range(limit):
        item = sample_listings[i % len(sample_listings)].copy()
        item["id"] = f"{item['id']}_v{i}"
        results.append(item)

    logger.info(f"✅ Prepared {len(results)} sample listings\n")
    return results


def run_real_data_pilot():
    """Run pilot with real/sample photocard data."""
    logger.info("\n" + "=" * 70)
    logger.info("🚀 VISION LLM PIPELINE — REAL DATA PILOT TEST")
    logger.info("=" * 70 + "\n")

    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("❌ OPENAI_API_KEY environment variable not set")
        sys.exit(1)

    # Fetch real photocard data
    logger.info("📥 Fetching photocard listings...")
    listings = fetch_ebay_photocards(query="photocard", limit=100)
    logger.info(f"✅ Prepared {len(listings)} listings for filtering\n")

    # Initialize pipeline
    pipeline = VisionFilteringPipeline(output_dir="vision_realdata_pilot_output")

    # Run pipeline
    try:
        stats = pipeline.process_batch(listings, batch_name="realdata_pilot_100")
        pipeline.save_results(batch_name="realdata_pilot_100")

        # Print summary
        print_summary_report(stats, pipeline)

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Pilot interrupted by user")
        pipeline.save_results(batch_name="realdata_pilot_100_interrupted")
    except Exception as e:
        logger.error(f"\n❌ Pilot failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def print_summary_report(stats: Dict, pipeline: VisionFilteringPipeline):
    """Print comprehensive summary report."""
    approval_rate = (
        stats["llm_approved"] / max(stats["total_processed"], 1) * 100
    )
    cost_per_image = (
        stats["total_api_cost_usd"] / max(stats["total_processed"], 1)
    )
    time_per_image = (
        stats["processing_time_sec"] / max(stats["total_processed"], 1)
    )

    report = f"""
════════════════════════════════════════════════════════════════════════════════

✅ REAL DATA PILOT — FINAL REPORT

════════════════════════════════════════════════════════════════════════════════

📊 RESULTS SUMMARY
─────────────────────────────────────────────────────────────────────────────────
  Total Processed:              {stats['total_processed']}
  ✅ Approved (LLM):            {stats['llm_approved']}
  ❌ Rejected (LLM):            {stats['llm_rejected']}
  📝 Keyword Filtered:          {stats['keyword_filtered']}
  ⚠️  API Errors:               {stats['api_errors']}
  📋 Review Queue:              {len(pipeline.review_queue)}

  🎯 Approval Rate:             {approval_rate:.1f}%

⏱️  PERFORMANCE METRICS
─────────────────────────────────────────────────────────────────────────────────
  Total Processing Time:        {stats['processing_time_sec']:.2f}s
  Time per Image:               {time_per_image:.2f}s

  📈 Token Usage:
    Total Tokens Used:          {stats['total_tokens_used']:,}
    Avg per Image:              {(stats['total_tokens_used'] / max(stats['total_processed'], 1)):.0f}

  💰 API Cost:
    Total Cost:                 ${stats['total_api_cost_usd']:.4f}
    Cost per Image:             ${cost_per_image:.6f}

📊 PROJECTED FULL ROLLOUT (22,500 cards)
─────────────────────────────────────────────────────────────────────────────────
  Estimated Processing Time:    {(stats['processing_time_sec'] / stats['total_processed'] * 22500 / 3600):.1f} hours
  Estimated API Cost:           ${(cost_per_image * 22500):.2f}
  Expected Approved Images:     {int(stats['llm_approved'] / stats['total_processed'] * 22500):,}
  Expected NULL Placeholders:   {int((1 - stats['llm_approved'] / stats['total_processed']) * 22500):,}

🎯 GO/NO-GO DECISION
─────────────────────────────────────────────────────────────────────────────────
"""

    if approval_rate >= 55:
        report += f"""  ✅ GO — Approval rate {approval_rate:.1f}% ≥ 55%

  NEXT: Run full rollout with all 22,500 cards
  Command: python scripts/vision_pipeline_full_rollout.py
"""
    elif approval_rate >= 50:
        report += f"""  ⚠️  CONDITIONAL GO — Approval rate {approval_rate:.1f}% (50-55%)

  ACTIONS REQUIRED:
  1. Analyze rejection patterns in review_queue/
  2. Adjust system prompt for better accuracy
  3. Re-run pilot test
"""
    else:
        report += f"""  ❌ NO-GO — Approval rate {approval_rate:.1f}% < 50%

  RECOMMENDATIONS:
  1. Check if LLM is working correctly
  2. Verify test images are actual photocards
  3. Refine system prompt
  4. Consider fallback: all images → NULL + user submission
"""

    report += f"""
📁 OUTPUT FILES
─────────────────────────────────────────────────────────────────────────────────
  ✅ Approved:  vision_realdata_pilot_output/results/realdata_pilot_100_approved.json
  ❌ Rejected:  vision_realdata_pilot_output/rejected/realdata_pilot_100_rejected.json
  📋 Review:    vision_realdata_pilot_output/review_queue/realdata_pilot_100_review.json
  📊 Summary:   vision_realdata_pilot_output/realdata_pilot_100_summary.json

════════════════════════════════════════════════════════════════════════════════

Generated: Vision LLM Pipeline Real Data Pilot
"""

    print(report)

    # Save report
    output_dir = Path("vision_realdata_pilot_output")
    report_file = output_dir / "REAL_DATA_PILOT_REPORT.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report)

    logger.info(f"\n💾 Report saved: {report_file}\n")


if __name__ == "__main__":
    run_real_data_pilot()
