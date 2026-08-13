#!/usr/bin/env python3
"""
Bunjang (번개장터) search API wrapper for photocard sourcing.
Safe crawling with request delays and error handling.
"""

import requests
import logging
import re
import time
from typing import List, Dict, Optional
from urllib.parse import quote

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bunjang API endpoints (try both)
BUNJANG_API_URLS = [
    "https://api.bungi.kr/api/1/find_v2.json",
    "https://m.bunjang.co.kr/api/1/find_v2.json",
]

# Noise patterns: exclude purchase requests, bulk/sets, random packs
NOISE_PATTERNS = [
    re.compile(r"구해요", re.IGNORECASE),      # Looking for / Want to buy
    re.compile(r"구매", re.IGNORECASE),        # Purchase / Buy
    re.compile(r"삽니다", re.IGNORECASE),      # I will buy
    re.compile(r"일괄", re.IGNORECASE),        # Bulk / All at once
    re.compile(r"세트", re.IGNORECASE),        # Set
    re.compile(r"랜덤팩", re.IGNORECASE),      # Random pack
    re.compile(r"랜덤포카", re.IGNORECASE),    # Random photocard
    re.compile(r"판판", re.IGNORECASE),        # Pan-pan (bulk discount)
    re.compile(r"대량", re.IGNORECASE),        # Large quantity
    re.compile(r"박스", re.IGNORECASE),        # Box (implies bulk)
]

# Browser User-Agent for legitimate requests
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class BunjangSearch:
    """
    Bunjang search client with safety measures:
    - Request delays to prevent IP blocking
    - Noise filtering (purchase requests, bulk items)
    - Error handling (403, 429, etc.)
    """

    def __init__(self, request_delay: float = 3.0):
        """
        Args:
            request_delay: Seconds to wait between requests (2.5-3.0 recommended)
        """
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT,
            "Referer": "https://m.bunjang.co.kr/",
            "Accept": "application/json",
        })
        self.last_request_time = 0

    def search_photocards(self, query: str, page: int = 0, limit: int = 10) -> List[Dict]:
        """
        Search Bunjang for photocards.

        Args:
            query: Search query (e.g., "BTS RM 포토카드")
            page: Page number (0-indexed)
            limit: Max results to return

        Returns:
            List of product dicts with url, title, image
        """
        # Enforce request delay
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)

        results = []
        last_error = None

        for api_url in BUNJANG_API_URLS:
            try:
                params = {
                    "q": query,
                    "page": page,
                    "limit": limit,
                }

                logger.info(f"  Searching Bunjang (page {page}): {api_url}")
                resp = self.session.get(api_url, params=params, timeout=15)

                # Check for blocking errors
                if resp.status_code == 403:
                    logger.error(f"❌ 403 Forbidden: Bunjang is blocking requests")
                    raise requests.exceptions.HTTPError("403 Forbidden - IP blocked")
                if resp.status_code == 429:
                    logger.error(f"❌ 429 Too Many Requests: Rate limited")
                    raise requests.exceptions.HTTPError("429 Rate Limited")

                resp.raise_for_status()
                data = resp.json()

                # Extract products from response
                products = data.get("data", {}).get("list", [])
                if not products:
                    logger.warning(f"  No results on page {page}")
                    self.last_request_time = time.time()
                    return []

                # Filter and extract results
                for prod in products:
                    title = prod.get("title", "")
                    product_id = prod.get("oid")

                    # Skip noisy listings
                    if self._is_noise(title):
                        logger.debug(f"    SKIP (noise): {title[:60]}")
                        continue

                    # Extract image
                    image_url = prod.get("product_image") or prod.get("image")
                    if not image_url:
                        logger.debug(f"    SKIP (no image): {title[:60]}")
                        continue

                    # Ensure full URL
                    if image_url.startswith("/"):
                        image_url = f"https://m.bunjang.co.kr{image_url}"

                    results.append({
                        "url": image_url,
                        "title": title,
                        "product_id": product_id,
                        "source": "bunjang",
                        "bunjang_link": prod.get("detail_url", ""),
                    })

                    if len(results) >= limit:
                        break

                self.last_request_time = time.time()

                if results:
                    logger.info(f"  ✓ Bunjang: Found {len(results)} images")
                    return results

            except requests.exceptions.HTTPError as e:
                last_error = str(e)
                logger.warning(f"  ⚠️  {api_url}: {e}")
                if "403" in str(e) or "429" in str(e):
                    # Stop immediately on blocking errors
                    break
                # Try next endpoint
                continue
            except Exception as e:
                last_error = str(e)
                logger.warning(f"  ⚠️  {api_url}: {e}")
                continue

        self.last_request_time = time.time()

        if last_error and ("403" in last_error or "429" in last_error):
            raise requests.exceptions.HTTPError(last_error)

        logger.warning(f"  No Bunjang results for '{query}'")
        return []

    def _is_noise(self, title: str) -> bool:
        """Check if title matches noise patterns (bulk, purchase requests, etc.)."""
        for pattern in NOISE_PATTERNS:
            if pattern.search(title):
                return True
        return False
