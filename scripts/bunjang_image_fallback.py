#!/usr/bin/env python3
"""
Bunjang image fallback for rare/niche photocard sourcing.
Implements safe crawling with delays and error handling.
"""

import requests
import logging
import time
from typing import List, Dict, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Browser User-Agent for legitimate requests
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class BunjangImageFallback:
    """
    Bunjang fallback for rare photocards.
    Includes request delays and blocking error detection.
    """

    def __init__(self, request_delay: float = 3.0):
        """
        Args:
            request_delay: Seconds to wait between search requests (default 3.0)
        """
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT,
            "Referer": "https://m.bunjang.co.kr/",
            "Accept": "application/json",
        })
        self.last_request_time = 0

    def search_and_extract_images(self, query: str, limit: int = 3) -> List[Dict]:
        """
        Search Bunjang and extract images (with delay).

        Args:
            query: Search query
            limit: Max images to return

        Returns:
            List of image dicts or empty list on error
        """
        from bunjang_search import BunjangSearch

        try:
            bunjang = BunjangSearch(request_delay=self.request_delay)
            results = bunjang.search_photocards(query, page=0, limit=limit)

            if results:
                logger.info(f"  ✓ Bunjang: Found {len(results)} images for '{query}'")
            else:
                logger.warning(f"  ⚠️  Bunjang: No results for '{query}'")

            return results

        except requests.exceptions.HTTPError as e:
            # Re-raise blocking errors so caller can stop immediately
            if "403" in str(e) or "429" in str(e):
                logger.error(f"  ❌ Bunjang blocking detected: {e}")
                raise
            logger.warning(f"  ⚠️  Bunjang search error: {e}")
            return []
        except Exception as e:
            logger.error(f"  ❌ Bunjang fallback error: {e}")
            return []
