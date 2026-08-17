#!/usr/bin/env python3
"""
Collect real photocard images from eBay and Naver APIs
"""

import json
import logging
import os
from typing import List, Dict, Optional
import requests
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EbayPhotoCardCollector:
    """Collect photocard listings from eBay Browse API"""

    BASE_URL = "https://api.ebay.com/buy/browse/v1"

    def __init__(self, app_id: str, cert_id: str):
        self.app_id = app_id
        self.cert_id = cert_id
        self.token = None

    def get_auth_token(self) -> Optional[str]:
        """Get OAuth 2.0 access token"""
        try:
            auth_url = "https://api.ebay.com/identity/v1/oauth2/token"
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = {
                "grant_type": "client_credentials",
                "scope": "https://api.ebay.com/oauth/api_scope/buy.browse",
                "client_id": self.app_id,
                "client_secret": self.cert_id
            }

            response = requests.post(auth_url, headers=headers, data=data, timeout=10)
            response.raise_for_status()
            token_data = response.json()

            self.token = token_data.get("access_token")
            logger.info(f"✅ eBay OAuth token obtained")
            return self.token

        except Exception as e:
            logger.error(f"Failed to get eBay token: {e}")
            return None

    def search_photocards(self, query: str = "photocard", limit: int = 50) -> List[Dict]:
        """Search for photocard listings on eBay"""
        if not self.token:
            self.get_auth_token()

        if not self.token:
            logger.error("No eBay auth token available")
            return []

        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }

            params = {
                "q": query,
                "limit": min(limit, 50),
                "filter": "priceCurrency:USD"
            }

            response = requests.get(
                f"{self.BASE_URL}/item_summary/search",
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            items = data.get("itemSummaries", [])

            results = []
            for item in items[:limit]:
                # Only include items with images
                if "image" in item and item.get("image", {}).get("imageUrl"):
                    results.append({
                        "id": item.get("itemId"),
                        "title": item.get("title", ""),
                        "image": item.get("image", {}).get("imageUrl"),
                        "url": item.get("itemWebUrl", ""),
                        "price": item.get("price", {}).get("value"),
                        "source": "ebay"
                    })

            logger.info(f"✅ eBay: Found {len(results)} listings with images")
            return results

        except Exception as e:
            logger.error(f"eBay search failed: {e}")
            return []


class NaverImageCollector:
    """Collect photocard images from Naver Image Search API"""

    BASE_URL = "https://openapi.naver.com/v1/search/image"

    def __init__(self, client_id: str):
        self.client_id = client_id

    def search_images(self, query: str = "포토카드", limit: int = 50) -> List[Dict]:
        """Search for photocard images on Naver"""
        try:
            headers = {
                "X-Naver-Client-Id": self.client_id,
                "X-Naver-Client-Secret": self.client_id  # Using as both ID and secret for simplicity
            }

            params = {
                "query": query,
                "display": min(limit, 100),
                "start": 1,
                "sort": "sim"
            }

            response = requests.get(
                self.BASE_URL,
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            items = data.get("items", [])

            results = []
            for item in items[:limit]:
                results.append({
                    "id": f"naver_{len(results)}",
                    "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                    "image": item.get("link"),
                    "url": item.get("link"),
                    "source": "naver"
                })

            logger.info(f"✅ Naver: Found {len(results)} image results")
            return results

        except Exception as e:
            logger.error(f"Naver search failed: {e}")
            return []


def collect_real_photocard_data(ebay_limit: int = 50, naver_limit: int = 50) -> List[Dict]:
    """
    Collect photocard images from both eBay and Naver
    """
    logger.info("\n" + "="*70)
    logger.info("🌐 COLLECTING REAL PHOTOCARD DATA")
    logger.info("="*70 + "\n")

    all_results = []

    # eBay collection
    logger.info("📦 eBay Collection")
    logger.info("-" * 70)
    ebay_app_id = os.getenv("EBAY_APP_ID") or "MOONKYUL-StanPC-PRD-da49b9009-63003dc3"
    ebay_cert_id = os.getenv("EBAY_CERT_ID") or "PRD-a49b90096d39-47e0-4103-8b4a-3607"

    ebay_collector = EbayPhotoCardCollector(ebay_app_id, ebay_cert_id)
    ebay_results = ebay_collector.search_photocards("BTS photocard", limit=ebay_limit)
    all_results.extend(ebay_results)

    # Naver collection
    logger.info("\n📸 Naver Image Collection")
    logger.info("-" * 70)
    naver_key = os.getenv("NAVER_API_KEY") or "bGKGrkyT6eirHx0TQveT6y12ljmy7IH9yFp84ZXk"
    naver_collector = NaverImageCollector(naver_key)
    naver_results = naver_collector.search_images("포토카드", limit=naver_limit)
    all_results.extend(naver_results)

    logger.info(f"\n✅ Total collected: {len(all_results)} images")
    logger.info("="*70 + "\n")

    return all_results


if __name__ == "__main__":
    results = collect_real_photocard_data(ebay_limit=50, naver_limit=50)

    # Save results
    output_file = "photocard_collection_real_data.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total": len(results),
            "data": results
        }, f, indent=2, ensure_ascii=False)

    logger.info(f"💾 Saved to {output_file}")
