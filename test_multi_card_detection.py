#!/usr/bin/env python3
"""
Card Layout Classification Validation
Runs the real PhotocardPipeline (photocard_pipeline.py) against live eBay
queries chosen to surface BOTH kinds of real listing photos:
  - genuine single/unit photocards (should be auto-processed)
  - multi-card grid/catalog listing photos (should be routed to review)
and reports how each was classified.
"""

import json
import logging
from pathlib import Path
from datetime import datetime

import cv2

from photocard_pipeline import PhotocardPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Queries curated from prior probing: the first two reliably surface a
# genuine individual/unit card as a top result, the latter two reliably
# surface multi-card grid/catalog listing photos.
QUERIES = [
    ("Stray Kids Felix individual photocard", 2),
    ("Stray Kids Hyunjin and Felix This & That Unit Photocard", 2),
    ("Stray Kids photocard", 2),
    ("AESPA photocard", 2),
]


def main():
    pipeline = PhotocardPipeline(output_dir="temp_test_run")

    start = datetime.now()
    for query, limit in QUERIES:
        pipeline.process_collection(query=query, limit=limit)
    duration = (datetime.now() - start).total_seconds()

    rows = []
    for r in pipeline.results:
        img = cv2.imread(r["image_path"])
        with open(r["metadata_path"], encoding="utf-8") as f:
            meta = json.load(f)
        cc = meta.get("card_classification", {})
        rows.append({
            "outcome": "AUTO-PROCESSED",
            "title": meta["source"]["listing_title"][:65],
            "layout_reason": cc.get("boundary_source", "?"),
            "card_type": cc.get("card_type", "?"),
            "member_count": cc.get("member_count", "?"),
            "final_size": f"{img.shape[1]}x{img.shape[0]}" if img is not None else "?",
            "image_path": r["image_path"],
        })

    for r in pipeline.review_queue_items:
        with open(r["metadata_path"], encoding="utf-8") as f:
            meta = json.load(f)
        rows.append({
            "outcome": "REVIEW QUEUE",
            "title": meta["source"]["listing_title"][:65],
            "layout_reason": r["reason"],
            "card_type": "-",
            "member_count": meta.get("face_count", "?"),
            "final_size": "-",
            "image_path": r["image_path"],
        })

    logger.info(f"\n{'='*100}")
    logger.info("CARD LAYOUT CLASSIFICATION RESULTS")
    logger.info(f"{'='*100}")
    for row in rows:
        logger.info(f"[{row['outcome']:<15}] {row['title']:<65} | reason={row['layout_reason']:<45} | "
                    f"type={row['card_type']:<10} | members={row['member_count']}")

    n_auto = len(pipeline.results)
    n_review = len(pipeline.review_queue_items)
    n_failed = len(pipeline.errors)

    report = f"""# Card Layout Classification Validation Report

**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Duration**: {duration:.2f}s
**Pipeline**: photocard_pipeline.py `PhotocardPipeline` (production path, real eBay Browse API)

## Summary

| Outcome | Count |
|---|---|
| Auto-processed (single_card) | {n_auto} |
| Routed to review queue (multi_card / ambiguous) | {n_review} |
| Download failures | {n_failed} |

## Classification Detail

| Outcome | Listing Title | Classification Reason | Card Type | Members | Final Size |
|---|---|---|---|---|---|
"""
    for row in rows:
        report += (f"| {row['outcome']} | {row['title']} | {row['layout_reason']} | "
                   f"{row['card_type']} | {row['member_count']} | {row['final_size']} |\n")

    report += f"""
## Auto-Processed Images

{chr(10).join(f"- `{r['image_path']}`" for r in pipeline.results)}

## Review Queue Images

{chr(10).join(f"- `{r['image_path']}`" for r in pipeline.review_queue_items)}
"""

    report_path = Path("temp_test_run") / "CARD_CLASSIFICATION_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    logger.info(f"\n✅ Report saved: {report_path}")


if __name__ == "__main__":
    main()
