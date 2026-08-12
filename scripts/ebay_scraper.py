#!/usr/bin/env python3
"""
eBay API Scraper for K-Pop Photocard Pricing Data
Fetches current market prices for photocard listings
"""

import requests
import json
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class eBayScraperConfig:
    """Configuration for eBay API"""
    BASE_URL = "https://api.ebay.com/buy/browse/v1"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    RATE_LIMIT_DELAY = 1.0  # seconds between requests
    TIMEOUT = 10  # seconds
    MAX_RETRIES = 3


class eBayBearerTokenCache:
    """Simple bearer token cache for demo purposes"""
    CACHE_FILE = Path(__file__).parent.parent / ".ebay_token_cache.json"

    @classmethod
    def get_token(cls) -> Optional[str]:
        """Get cached token if available"""
        try:
            if cls.CACHE_FILE.exists():
                with open(cls.CACHE_FILE, 'r') as f:
                    data = json.load(f)
                    if data.get('expires_at', 0) > time.time():
                        return data.get('token')
        except Exception as e:
            logger.warning(f"Failed to read token cache: {e}")
        return None

    @classmethod
    def save_token(cls, token: str, expires_in: int = 3600):
        """Save token to cache"""
        try:
            data = {
                'token': token,
                'expires_at': time.time() + expires_in
            }
            with open(cls.CACHE_FILE, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            logger.warning(f"Failed to save token cache: {e}")


class eBayScraper:
    """eBay photocard price scraper"""

    def __init__(self, bearer_token: Optional[str] = None):
        self.config = eBayScraperConfig()
        self.bearer_token = bearer_token or eBayBearerTokenCache.get_token()
        self.session = requests.Session()
        self._setup_headers()

    def _setup_headers(self):
        """Setup request headers"""
        headers = self.config.HEADERS.copy()
        if self.bearer_token:
            headers['Authorization'] = f'Bearer {self.bearer_token}'
        self.session.headers.update(headers)

    def search_photocards(self,
                         keywords: str,
                         limit: int = 50,
                         sort_by: str = "newlyListed") -> List[Dict]:
        """
        Search for photocard listings on eBay

        Args:
            keywords: Search keywords (e.g., "K-pop photocard BTS")
            limit: Max number of results
            sort_by: Sort order (newlyListed, price, endingSoonest, etc.)

        Returns:
            List of listing data
        """
        results = []
        retry_count = 0

        while retry_count < self.config.MAX_RETRIES:
            try:
                params = {
                    'q': keywords,
                    'limit': min(limit, 200),
                    'sort': sort_by
                }

                logger.info(f"Searching eBay for: {keywords}")
                response = self.session.get(
                    f"{self.config.BASE_URL}/item_summary/search",
                    params=params,
                    timeout=self.config.TIMEOUT
                )

                response.raise_for_status()
                data = response.json()

                if 'itemSummaries' in data:
                    for item in data['itemSummaries']:
                        results.append({
                            'item_id': item.get('itemId'),
                            'title': item.get('title'),
                            'price': item.get('price', {}).get('value'),
                            'currency': item.get('price', {}).get('currency'),
                            'condition': item.get('condition'),
                            'image_url': item.get('image', {}).get('imageUrl'),
                            'listing_url': item.get('itemWebUrl'),
                            'seller': item.get('seller', {}).get('username'),
                            'status': item.get('itemHref'),
                            'fetched_at': datetime.utcnow().isoformat()
                        })

                    logger.info(f"Found {len(results)} listings")
                    time.sleep(self.config.RATE_LIMIT_DELAY)
                    break

            except requests.exceptions.RequestException as e:
                retry_count += 1
                logger.warning(f"Request failed (attempt {retry_count}/{self.config.MAX_RETRIES}): {e}")
                if retry_count < self.config.MAX_RETRIES:
                    time.sleep(2 ** retry_count)  # exponential backoff

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse response: {e}")
                break

        return results

    def get_item_details(self, item_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific item

        Args:
            item_id: eBay item ID

        Returns:
            Item details dict or None
        """
        try:
            logger.info(f"Fetching details for item: {item_id}")
            response = self.session.get(
                f"{self.config.BASE_URL}/items/{item_id}",
                timeout=self.config.TIMEOUT
            )
            response.raise_for_status()
            data = response.json()

            time.sleep(self.config.RATE_LIMIT_DELAY)
            return data

        except Exception as e:
            logger.error(f"Failed to fetch item details: {e}")
            return None

    def save_results(self, results: List[Dict], output_file: str = "ebay_listings.json"):
        """Save search results to JSON file"""
        output_path = Path(__file__).parent.parent / output_file
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(results)} results to {output_file}")
        except Exception as e:
            logger.error(f"Failed to save results: {e}")


def main():
    """Demo usage"""
    # Note: Replace with actual token if available
    scraper = eBayScraper()

    # Example searches
    search_terms = [
        "K-pop photocard BTS",
        "TWICE photocard sealed",
        "Kpop idol card booster"
    ]

    all_results = []
    for term in search_terms:
        results = scraper.search_photocards(term, limit=20)
        all_results.extend(results)

    scraper.save_results(all_results)

    # Print sample results
    if all_results:
        print(f"\nFound {len(all_results)} total listings")
        print(f"\nSample listing:")
        print(json.dumps(all_results[0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
