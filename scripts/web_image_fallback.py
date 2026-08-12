#!/usr/bin/env python3
"""
Web Image Search Fallback (no API key required)
Used when the eBay Browse API returns no usable listing images for a
query - falls back to a real public image search (DuckDuckGo Images)
instead of silently generating synthetic/mock placeholder images.
"""

import re
import logging
from typing import Dict, List

import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def search_web_images(query: str, limit: int = 4, timeout: int = 10) -> List[Dict]:
    """
    Search for real images on the public web (DuckDuckGo Images, no API key).

    Args:
        query: Search query (e.g., "Stray Kids photocard")
        limit: Maximum number of image results
        timeout: Per-request timeout in seconds

    Returns:
        List of dicts: {"title", "image_url", "source_page", "width", "height"}
        Empty list if the search fails for any reason (caller should treat
        this as "no fallback images available", not raise.
    """
    try:
        token_resp = requests.get(
            "https://duckduckgo.com/",
            params={"q": query},
            headers=HEADERS,
            timeout=timeout,
        )
        token_resp.raise_for_status()

        match = re.search(r"vqd=['\"]?([\d-]+)['\"]?", token_resp.text)
        if not match:
            logger.warning(f"⚠️  web image fallback: could not extract vqd token for '{query}'")
            return []
        vqd = match.group(1)

        search_resp = requests.get(
            "https://duckduckgo.com/i.js",
            params={
                "l": "us-en",
                "o": "json",
                "q": query,
                "vqd": vqd,
                "f": ",,,",
                "p": "1",
            },
            headers={**HEADERS, "Referer": "https://duckduckgo.com/"},
            timeout=timeout,
        )
        search_resp.raise_for_status()
        data = search_resp.json()

        results = []
        for item in data.get("results", [])[:limit]:
            image_url = item.get("image")
            if not image_url:
                continue
            results.append({
                "title": item.get("title", query),
                "image_url": image_url,
                "source_page": item.get("url", ""),
                "width": item.get("width"),
                "height": item.get("height"),
            })

        if results:
            logger.info(f"✓ web image fallback: found {len(results)} real images for '{query}'")
        else:
            logger.warning(f"⚠️  web image fallback: no results for '{query}'")

        return results

    except Exception as e:
        logger.warning(f"⚠️  web image fallback failed for '{query}': {e}")
        return []


if __name__ == "__main__":
    results = search_web_images("Stray Kids photocard", limit=3)
    print(f"Found {len(results)} images:")
    for r in results:
        print(f"  • {r['title'][:60]} -> {r['image_url'][:80]}")
