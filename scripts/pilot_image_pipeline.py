#!/usr/bin/env python3
"""
Pilot image pipeline — TOP 100 cards only (see poca-exchange/_pilot-select-cards.ts
for candidate selection). Does NOT touch the database directly; writes a
progress/result file that a Node script (_pilot-apply-thumbpaths.ts) reads to
apply thumbImagePath updates for eBay-sourced images only.

Resume-safe: re-running skips any card already present in progress["processed_ids"].
"""

import base64
import json
import logging
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
import os

sys.path.insert(0, str(Path(__file__).parent))
from image_pipeline import CardDetector          # WebP compression (card-detection unused here)
from image_processor import ImageProcessor       # letterbox pad + resize for single-subject photos
from bunjang_image_fallback import BunjangImageFallback

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pilot")

ROOT = Path(__file__).parent.parent
POCA = ROOT / "poca-exchange"
load_dotenv(POCA / ".env")

MANIFEST_PATH = Path(__file__).parent / "pilot-manifest.json"
PROGRESS_PATH = Path(__file__).parent / "pilot-progress.json"
OUTPUT_DIR = POCA / "public" / "images" / "cards"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EBAY_SEARCH_DELAY = 1.5   # seconds between eBay search calls (on top of any retry backoff)
FALLBACK_SEARCH_DELAY = 2.0  # seconds between DuckDuckGo fallback calls (unofficial endpoint, be gentle)
EBAY_SEARCH_LIMIT = 10    # widened from 5 so there's room to skip suspicious listings and still find a clean one

# A listing title matching any of these is very likely a multi-card lot/set
# sheet, a merch collage, or an unrelated product — not a photo of the
# single specific card being searched for. Discovered from the 100-card
# pilot: 32 "successes" were accepted blind (first result with any image),
# and manual review found ~5+ of those were exactly this failure mode
# (e.g. a 30-card lot sheet, a JENNIE SOLO photobook instead of a card).
SUSPICIOUS_TITLE_PATTERNS = [
    re.compile(r"\blot\b", re.IGNORECASE),
    re.compile(r"\bset\b", re.IGNORECASE),
    re.compile(r"\bbundle\b", re.IGNORECASE),
    re.compile(r"selca\s*sheet", re.IGNORECASE),
    re.compile(r"\bchecklist\b", re.IGNORECASE),
    re.compile(r"\bcollection\b", re.IGNORECASE),
    re.compile(r"\d+\s*pcs\b", re.IGNORECASE),
    re.compile(r"\bmixed\b", re.IGNORECASE),
]


def suspicious_keyword(title: str) -> str | None:
    """Returns the matched pattern's keyword if `title` looks like a lot/set/
    collage/unrelated-product listing, else None."""
    for pattern in SUSPICIOUS_TITLE_PATTERNS:
        if pattern.search(title):
            return pattern.pattern
    return None


def get_ebay_token() -> str:
    client_id = os.environ["EBAY_CLIENT_ID"]
    client_secret = os.environ["EBAY_CLIENT_SECRET"]
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = requests.post(
        "https://api.ebay.com/identity/v1/oauth2/token",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {basic}",
        },
        data={"grant_type": "client_credentials", "scope": "https://api.ebay.com/oauth/api_scope"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def ebay_search(token: str, query: str, stats: dict) -> tuple[str | None, str | None, int]:
    """Direct Browse API call (not going through eBayScraper's class) so we
    get the real HTTP status back for rate-limit/auth diagnostics, and the
    listing title so we can filter out lot/set/collage/mismatched-product
    listings before accepting an image. Returns
    (image_url_or_None, title_or_None, http_status).

    Walks results in rank order and returns the first one whose title is
    NOT suspicious. If every result in the page is suspicious (or there are
    none), returns (None, None, 200) — a filtered-out miss is reported as a
    failure, never as a wrong image."""
    resp = requests.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        params={"q": query, "limit": EBAY_SEARCH_LIMIT},
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        timeout=15,
    )
    if resp.status_code == 429:
        stats["rate_limited_count"] += 1
        logger.warning(f"⚠️  429 rate limited for query: {query}")
        return None, None, 429
    if not resp.ok:
        logger.warning(f"⚠️  eBay search HTTP {resp.status_code} for query: {query}")
        return None, None, resp.status_code

    data = resp.json()
    skipped = []
    for item in data.get("itemSummaries", []):
        thumb = item.get("thumbnailImages", [{}])[0].get("imageUrl")
        img = thumb or item.get("image", {}).get("imageUrl")
        title = item.get("title", "")
        if not img:
            continue
        bad = suspicious_keyword(title)
        if bad:
            skipped.append((title, bad))
            continue
        if skipped:
            logger.info(f"  (skipped {len(skipped)} suspicious listing(s) before accepting this one)")
        return img, title, 200

    if skipped:
        logger.info(f"  all {len(skipped)} candidate(s) were suspicious — treating as no match")
    return None, None, 200


def process_to_webp(image_bytes: bytes) -> bytes:
    """Single-photo normalize (letterbox pad + resize) then WebP-compress.
    image_pipeline.py's CardDetector.detect_cards() is a multi-card
    contact-sheet detector (contour/threshold blob finder) — unsuited to a
    normal single-subject eBay listing photo, so we skip it and go straight
    to ImageProcessor's pad/resize, then reuse CardDetector's WebP
    compression search (that part isn't card-detection-specific)."""
    import cv2
    import numpy as np

    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("cv2 could not decode downloaded image")

    normalized = ImageProcessor.resize_to_standard(img, target_height=400)
    detector = CardDetector()
    return detector.compress_to_webp(normalized)


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_progress(progress: dict):
    PROGRESS_PATH.write_text(json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    manifest = load_json(MANIFEST_PATH, [])
    if not manifest:
        logger.error(f"No manifest found at {MANIFEST_PATH} — run _pilot-select-cards.ts first")
        return

    progress = load_json(PROGRESS_PATH, {
        "processed_ids": [],
        "ebay_success": [],
        "fallback_needed": [],
        "failed": [],
        "stats": {"rate_limited_count": 0, "started_at": None, "finished_at": None},
    })
    if progress["stats"]["started_at"] is None:
        progress["stats"]["started_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    processed = set(progress["processed_ids"])
    remaining = [c for c in manifest if c["id"] not in processed]
    logger.info(f"Manifest: {len(manifest)} cards, {len(processed)} already processed, {len(remaining)} remaining")

    if not remaining:
        logger.info("Nothing to do — all manifest cards already processed.")
        save_progress(progress)
        return

    token = get_ebay_token()
    logger.info("✓ eBay OAuth token acquired")

    start_time = time.time()

    for i, card in enumerate(remaining, 1):
        logger.info(f"[{i}/{len(remaining)}] {card['slug']} — \"{card['searchQuery']}\"")

        try:
            image_url, title, status = ebay_search(token, card["searchQuery"], progress["stats"])
        except Exception as e:
            logger.error(f"eBay search errored for {card['slug']}: {e}")
            image_url, title, status = None, None, "error"

        if image_url:
            try:
                img_resp = requests.get(image_url, timeout=15)
                img_resp.raise_for_status()
                webp_bytes = process_to_webp(img_resp.content)

                out_path = OUTPUT_DIR / f"{card['slug']}.webp"
                out_path.write_bytes(webp_bytes)

                thumb_path = f"/images/cards/{card['slug']}.webp"
                progress["ebay_success"].append({
                    "id": card["id"],
                    "slug": card["slug"],
                    "sourceImageUrl": image_url,
                    "sourceTitle": title,
                    "localPath": str(out_path),
                    "thumbImagePath": thumb_path,
                    "sizeKb": round(len(webp_bytes) / 1024, 1),
                })
                logger.info(f"  ✓ saved {out_path.name} ({len(webp_bytes)/1024:.1f} KB)")
            except Exception as e:
                logger.warning(f"  ⚠️  eBay image found but processing failed: {e}")
                progress["failed"].append({"id": card["id"], "slug": card["slug"], "reason": f"image processing failed: {e}"})
        else:
            # eBay found nothing — try Bunjang (번개장터) fallback for rare/niche photocards.
            # Bunjang images are processed and saved. Request delay enforced to prevent IP blocking.
            time.sleep(FALLBACK_SEARCH_DELAY)
            try:
                bunjang_client = BunjangImageFallback(request_delay=3.0)
                fallback_results = bunjang_client.search_and_extract_images(card["searchQuery"], limit=3)
            except requests.exceptions.HTTPError as e:
                if "403" in str(e) or "429" in str(e):
                    logger.error(f"  ❌ Bunjang blocking detected: {e}")
                    logger.error("  Aborting pilot to prevent IP ban")
                    progress["stats"]["blocked_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    progress["stats"]["last_processed_index"] = i - 1
                    save_progress(progress)
                    raise SystemExit("Bunjang blocking detected — pilot aborted")
                fallback_results = []
            except Exception as e:
                fallback_results = []
                logger.warning(f"  Bunjang fallback errored: {e}")

            if fallback_results:
                # Process and save Bunjang images
                for fb in fallback_results:
                    try:
                        img_resp = requests.get(fb["url"], timeout=15)
                        img_resp.raise_for_status()
                        webp_bytes = process_to_webp(img_resp.content)

                        out_path = OUTPUT_DIR / f"{card['slug']}.webp"
                        out_path.write_bytes(webp_bytes)

                        thumb_path = f"/images/cards/{card['slug']}.webp"
                        progress["ebay_success"].append({
                            "id": card["id"],
                            "slug": card["slug"],
                            "sourceImageUrl": fb["url"],
                            "sourceTitle": fb["title"],
                            "source": "bunjang",
                            "localPath": str(out_path),
                            "thumbImagePath": thumb_path,
                            "sizeKb": round(len(webp_bytes) / 1024, 1),
                        })
                        logger.info(f"  ✓ Bunjang saved {out_path.name} ({len(webp_bytes)/1024:.1f} KB)")
                        break  # Only take first successful image
                    except Exception as e:
                        logger.warning(f"  ⚠️  Bunjang image processing failed: {e}")
                        continue

                if card["id"] not in [s["id"] for s in progress["ebay_success"]]:
                    # All Bunjang images failed to process
                    progress["failed"].append({"id": card["id"], "slug": card["slug"], "reason": "eBay empty, Bunjang images failed to process"})
                    logger.info("  ✗ Bunjang found items but image processing failed")
            else:
                progress["failed"].append({"id": card["id"], "slug": card["slug"], "reason": "eBay empty, Bunjang empty too"})
                logger.info("  ✗ complete failure — no eBay, no Bunjang results")

        progress["processed_ids"].append(card["id"])
        save_progress(progress)  # persist after every card — resume safety
        time.sleep(EBAY_SEARCH_DELAY)

    elapsed = time.time() - start_time
    progress["stats"]["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    progress["stats"]["last_run_elapsed_sec"] = round(elapsed, 1)
    save_progress(progress)

    logger.info("=" * 60)
    logger.info(f"Done. eBay success: {len(progress['ebay_success'])}, "
                f"fallback needed: {len(progress['fallback_needed'])}, "
                f"failed: {len(progress['failed'])}")
    logger.info(f"Elapsed this run: {elapsed:.1f}s, rate-limited responses: {progress['stats']['rate_limited_count']}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
