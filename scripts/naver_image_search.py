#!/usr/bin/env python3
"""
Naver Image Search API client for photocard image sourcing.
Complements eBay sourcing with Korean domestic marketplace coverage.
"""

import requests
import logging
from typing import Dict, List, Optional
from urllib.parse import quote

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NaverImageSearchClient:
    """
    Naver Image Search API wrapper (NAVER API HUB).
    Uses Application Client ID and Secret from NAVER API HUB console.
    """

    def __init__(self, client_id: str, client_secret: str):
        """
        Initialize Naver API HUB client (NCP API Gateway).

        Args:
            client_id: NAVER API HUB Client ID (X-NCP-APIGW-API-KEY-ID)
            client_secret: NAVER API HUB Client Secret (X-NCP-APIGW-API-KEY)
        """
        self.client_id = client_id
        self.client_secret = client_secret
        # NAVER API HUB Image Search API endpoint.
        # Correct host: naverapihub.apigw.ntruss.com (NOT naveropenapi.*)
        self.api_url = "https://naverapihub.apigw.ntruss.com/search/v1/image"
        self.session = requests.Session()
        # NCP API Gateway headers (official spec)
        self.session.headers.update({
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret,
        })

    def search_images(
        self,
        query: str,
        limit: int = 30,
        sort: str = "sim",  # similarity
        start: int = 1,
    ) -> List[Dict]:
        """
        Search images on Naver.

        Args:
            query: Search query (e.g., "BTS RM 포토카드")
            limit: Max results (1-100)
            sort: Sort by 'sim' (relevance) or 'date' (recent)
            start: Pagination start (1-indexed)

        Returns:
            List of image results with URL, title, source info
        """
        limit = min(max(limit, 1), 100)  # Clamp 1-100

        try:
            params = {
                "query": query,
                "display": limit,
                "start": start,
                "sort": sort,
            }

            response = self.session.get(self.api_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            results = []

            for item in data.get("items", []):
                results.append({
                    "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                    "link": item.get("link", ""),
                    "image": item.get("image", ""),
                    "source": item.get("sizeheight"),  # height
                    "source_width": item.get("sizewidth"),
                    "source_height": item.get("sizeheight"),
                    "platform": "naver",
                })

            logger.info(f"  ✓ Naver: Found {len(results)} results for '{query}'")
            return results

        except Exception as e:
            logger.error(f"Naver API error for '{query}': {e}")
            return []

    def search_photocard_batch(
        self,
        queries: List[str],
        limit_per_query: int = 30,
    ) -> Dict[str, List[Dict]]:
        """
        Batch search multiple queries (for multiple card versions/members).

        Args:
            queries: List of search queries
            limit_per_query: Results per query

        Returns:
            Dict mapping query → list of image results
        """
        results = {}
        for query in queries:
            logger.info(f"Searching: {query}")
            results[query] = self.search_images(query, limit=limit_per_query)

        return results

    def download_image_to_bytes(self, image_url: str, timeout: int = 10) -> Optional[bytes]:
        """
        Download image bytes from Naver result URL.

        Args:
            image_url: Image URL from search result
            timeout: Request timeout in seconds

        Returns:
            Image bytes, or None on failure
        """
        try:
            response = self.session.get(image_url, timeout=timeout, allow_redirects=True)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Failed to download {image_url}: {e}")
            return None
