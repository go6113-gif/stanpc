#!/usr/bin/env python3
"""
Follow-up verification for the 100-card pilot:
1. Re-verify the 27 remaining ebay_success entries (5 already rolled back
   manually) by re-fetching each query's raw eBay results, locating the
   originally-picked listing by image URL, and checking ITS title against
   the suspicious-keyword filter added to pilot_image_pipeline.py.
2. Retry a 10-card sample of the original "complete failure" cases with the
   new filtered search (wider limit=10) to see whether it recovers any.

Writes scripts/pilot-verify-results.json — a Node script applies the
resulting rollback list to the DB.
"""

import json
import time
from pathlib import Path

from pilot_image_pipeline import get_ebay_token, ebay_search, suspicious_keyword, EBAY_SEARCH_DELAY
import requests

SCRIPTS_DIR = Path(__file__).parent
MANIFEST_PATH = SCRIPTS_DIR / "pilot-manifest.json"
PROGRESS_PATH = SCRIPTS_DIR / "pilot-progress.json"
OUT_PATH = SCRIPTS_DIR / "pilot-verify-results.json"

ALREADY_ROLLED_BACK = {
    "aespa-karina-spicy",
    "newjeans-hanni-attention",
    "seventeen-joshua-sector17",
    "blackpink-jennie-aptober",
    "pe-bts-11823",
}


def raw_ebay_results(token: str, query: str, limit: int = 10):
    resp = requests.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        params={"q": query, "limit": limit},
        headers={"Authorization": f"Bearer {token}", "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    results = []
    for item in data.get("itemSummaries", []):
        thumb = item.get("thumbnailImages", [{}])[0].get("imageUrl")
        img = thumb or item.get("image", {}).get("imageUrl")
        if img:
            results.append({"title": item.get("title", ""), "image_url": img})
    return results


def main():
    manifest = {c["id"]: c for c in json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))}
    progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))

    token = get_ebay_token()
    print("✓ eBay token acquired\n")

    # ------------------------------------------------------------------
    # Part 1: re-verify the 27 remaining ebay_success entries
    # ------------------------------------------------------------------
    to_check = [s for s in progress["ebay_success"] if s["slug"] not in ALREADY_ROLLED_BACK]
    print(f"Re-verifying {len(to_check)} remaining ebay_success entries...\n")

    rollback = []
    review_needed = []

    for i, entry in enumerate(to_check, 1):
        card = manifest.get(entry["id"])
        query = card["searchQuery"] if card else None
        print(f"[{i}/{len(to_check)}] {entry['slug']}")

        if not query:
            review_needed.append({"slug": entry["slug"], "reason": "manifest entry missing (couldn't re-derive query)"})
            continue

        try:
            results = raw_ebay_results(token, query, limit=10)
        except Exception as e:
            review_needed.append({"slug": entry["slug"], "reason": f"re-fetch errored: {e}"})
            time.sleep(EBAY_SEARCH_DELAY)
            continue

        match = next((r for r in results if r["image_url"] == entry.get("sourceImageUrl")), None)

        if match is None:
            review_needed.append({
                "slug": entry["slug"],
                "reason": "original listing no longer reproducible (may have expired/re-ranked) — needs manual look",
                "query": query,
            })
            print("   ↷ could not reproduce original listing — flagged for manual review")
        else:
            bad = suspicious_keyword(match["title"])
            if bad:
                rollback.append({"slug": entry["slug"], "id": entry["id"], "title": match["title"], "matchedKeyword": bad})
                print(f"   ✗ SUSPICIOUS title (matched /{bad}/): \"{match['title']}\" -> rollback")
            else:
                review_needed.append({"slug": entry["slug"], "reason": "title clean, still recommend visual check", "title": match["title"]})
                print(f"   ✓ title looks clean: \"{match['title']}\"")

        time.sleep(EBAY_SEARCH_DELAY)

    # ------------------------------------------------------------------
    # Part 2: retry a 10-card sample of the original complete failures
    # ------------------------------------------------------------------
    orig_failures = [f for f in progress["failed"] if f["reason"] == "eBay empty, fallback empty too"]
    sample = orig_failures[:10]
    print(f"\nRetrying {len(sample)} originally-failed cards with the new filtered search (limit=10)...\n")

    retry_results = []
    for i, f in enumerate(sample, 1):
        card = manifest.get(f["id"])
        query = card["searchQuery"] if card else None
        print(f"[{i}/{len(sample)}] {f['slug']} — \"{query}\"")
        if not query:
            retry_results.append({"slug": f["slug"], "outcome": "no query available"})
            continue

        stats = {"rate_limited_count": 0}
        try:
            image_url, title, status = ebay_search(token, query, stats)
        except Exception as e:
            retry_results.append({"slug": f["slug"], "outcome": f"error: {e}"})
            time.sleep(EBAY_SEARCH_DELAY)
            continue

        if image_url:
            retry_results.append({"slug": f["slug"], "outcome": "now found", "title": title, "image_url": image_url})
            print(f"   ✓ now found: \"{title}\"")
        else:
            retry_results.append({"slug": f["slug"], "outcome": "still nothing"})
            print("   ✗ still no clean result")

        time.sleep(EBAY_SEARCH_DELAY)

    output = {
        "rollback": rollback,
        "review_needed": review_needed,
        "retry_sample": retry_results,
    }
    OUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    print("\n" + "=" * 60)
    print(f"Auto-rollback (suspicious title confirmed): {len(rollback)}")
    print(f"Review needed (clean or unverifiable): {len(review_needed)}")
    print(f"Retry sample: {sum(1 for r in retry_results if r['outcome'] == 'now found')}/{len(retry_results)} recovered")
    print("=" * 60)


if __name__ == "__main__":
    main()
