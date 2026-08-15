#!/usr/bin/env python3
"""
Dual-source image pipeline pilot test.
Test with 100 cards to measure improvement over eBay-only baseline.

Configuration:
- Test set: 100 cards without images (or with album cover fallback)
- Sources: eBay + Naver
- Output: Confidence breakdown + 20-card manual validation report
"""

import logging
import sys
from pathlib import Path
from datetime import datetime

from dual_source_image_pipeline import DualSourceImagePipeline, ConfidenceLevel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_test_cards(
    database_cards: list,
    count: int = 100,
) -> list:
    """
    Load test cards (those without real photocard images).

    For pilot, we'll use cards that:
    1. Have album cover as fallback (thumbImagePath is album URL)
    2. Or thumbImagePath is empty/None

    Args:
        database_cards: All cards from database
        count: Number of cards to test

    Returns:
        List of {id, group, member, album} dicts
    """
    test_cards = [
        {
            "id": card.get("id"),
            "group": card.get("group_name"),
            "member": card.get("member_name"),
            "album": card.get("album_title"),
        }
        for card in database_cards
        if not card.get("thumbImagePath")
        or "album" in (card.get("thumbImagePath") or "").lower()
    ]

    return test_cards[:count]


def run_pilot():
    """
    Run dual-source image pipeline pilot test.
    """
    logger.info("=" * 70)
    logger.info("Dual-Source Image Pipeline - PILOT TEST")
    logger.info("=" * 70)

    # Initialize pipeline with Naver API keys
    naver_client_id = "po85ajzs6w"
    naver_client_secret = "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"

    pipeline = DualSourceImagePipeline(
        naver_client_id=naver_client_id,
        naver_client_secret=naver_client_secret,
        output_dir="pilot_output",
    )

    logger.info(f"\n📊 Naver API Quota Information:")
    logger.info(f"  - Daily limit: 25,000 requests")
    logger.info(f"  - For 100 cards (2 queries each): ~200 requests")
    logger.info(f"  - For full 22,500 cards: ~45,000 requests (need 2 days)")

    # Load test cards
    # In real scenario, would query database
    # For now, use sample data
    test_cards = [
        {
            "id": f"card_{i:04d}",
            "group": "BTS",
            "member": f"Member {i % 7}",
            "album": f"Album {i // 7}",
        }
        for i in range(100)
    ]

    logger.info(f"\n📋 Test Set: {len(test_cards)} cards")
    logger.info(f"  - Group: {test_cards[0]['group']}")
    logger.info(f"  - Member variations: {len(set(c['member'] for c in test_cards))}")
    logger.info(f"  - Album variations: {len(set(c['album'] for c in test_cards))}")

    # Process batch
    logger.info(f"\n🚀 Starting pilot processing...")
    logger.info(f"   (Naver API calls will be real, eBay search is mocked)")
    logger.info("")

    # Mock eBay search function (for pilot, just return empty)
    def mock_ebay_search(query, limit=30):
        return []

    report = pipeline.process_batch(
        test_cards,
        ebay_search_fn=mock_ebay_search,
    )

    # Print summary
    logger.info(f"\n{'='*70}")
    logger.info("📊 PILOT RESULTS SUMMARY")
    logger.info(f"{'='*70}\n")

    summary = report["summary"]
    total = summary["total"]

    logger.info(f"Total cards processed: {total}")
    logger.info(f"✅ High confidence (both sources): {summary['high']} ({summary['high_percentage']})")
    logger.info(f"🟡 Medium confidence (single source): {summary['medium']} ({summary['medium'] / total * 100:.1f}%)")
    logger.info(f"🗂️  Needs review: {summary['review_needed']} ({summary['review_needed'] / total * 100:.1f}%)")
    logger.info(f"❌ Failed (no images): {summary['failed']} ({summary['failed'] / total * 100:.1f}%)")

    success_rate = (summary['high'] + summary['medium']) / total * 100
    logger.info(f"\n📈 Overall success rate: {success_rate:.1f}%")

    # Manual validation note
    logger.info(f"\n📝 Next Step: Manual Validation")
    logger.info(f"  - Select 20 random 'high' confidence cards")
    logger.info(f"  - Verify manually against image sources")
    logger.info(f"  - Report actual accuracy")
    logger.info(f"  - Review queue: {pipeline.output_dir / 'review_queue_dual'}")

    # API quota estimate
    if total > 0:
        success_count = summary['high'] + summary['medium']
        logger.info(f"\n🔢 API Quota Projection (for full dataset)")
        cards_per_success_rate = 22_500  # Total cards to process
        estimated_requests = cards_per_success_rate * 2  # 2 queries per card
        estimated_days = estimated_requests / 25_000
        logger.info(f"  - Estimated API calls: {estimated_requests:,}")
        logger.info(f"  - Daily quota: 25,000")
        logger.info(f"  - Estimated days: {estimated_days:.1f}")

    # Save pilot report
    report_path = Path("pilot_output") / "pilot_summary.txt"
    with open(report_path, "w") as f:
        f.write("DUAL-SOURCE IMAGE PIPELINE - PILOT TEST REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Timestamp: {datetime.now().isoformat()}\n\n")

        f.write("RESULTS SUMMARY\n")
        f.write("-" * 70 + "\n")
        f.write(f"Total cards tested: {total}\n")
        f.write(f"High confidence (both sources): {summary['high']} ({summary['high_percentage']})\n")
        f.write(f"Medium confidence (single): {summary['medium']} ({summary['medium'] / total * 100:.1f}%)\n")
        f.write(f"Needs review: {summary['review_needed']} ({summary['review_needed'] / total * 100:.1f}%)\n")
        f.write(f"Failed: {summary['failed']} ({summary['failed'] / total * 100:.1f}%)\n\n")

        f.write(f"Success rate: {success_rate:.1f}%\n\n")

        f.write("NEXT STEPS\n")
        f.write("-" * 70 + "\n")
        f.write("1. Manual validation of 20 random 'high' cards\n")
        f.write("2. Review 'needs_review' queue for source mismatches\n")
        f.write("3. Compile actual accuracy report\n")
        f.write("4. Plan full-dataset rollout\n")

    logger.info(f"\n✅ Pilot summary saved: {report_path}")

    return report


if __name__ == "__main__":
    report = run_pilot()
    sys.exit(0 if report["summary"]["failed"] < 50 else 1)
