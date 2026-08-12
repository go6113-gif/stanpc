#!/usr/bin/env python3
"""
Bungle (번개장터) K-Pop Photocard Crawler
Scrapes used photocard market prices with respectful delays
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import logging
import random
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BungleCrawlerConfig:
    """Configuration for Bungle crawler"""
    BASE_URL = "https://m.bunjang.co.kr/search"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    # Respectful delay between requests
    MIN_DELAY = 1.5
    MAX_DELAY = 3.5
    TIMEOUT = 10
    MAX_RETRIES = 3


class BungleCrawler:
    """Bungle photocard price crawler"""

    def __init__(self):
        self.config = BungleCrawlerConfig()
        self.session = requests.Session()
        self.session.headers.update(self.config.HEADERS)

    def _random_delay(self):
        """Add random delay between requests to be respectful"""
        delay = random.uniform(self.config.MIN_DELAY, self.config.MAX_DELAY)
        time.sleep(delay)

    def search_photocards(self,
                         keywords: str,
                         max_pages: int = 3) -> List[Dict]:
        """
        Search for photocard listings on Bungle

        Args:
            keywords: Search keywords in Korean (e.g., "포토카드", "BTS")
            max_pages: Maximum number of pages to scrape

        Returns:
            List of listing data
        """
        results = []

        for page in range(1, max_pages + 1):
            retry_count = 0

            while retry_count < self.config.MAX_RETRIES:
                try:
                    params = {
                        'q': keywords,
                        'page': page,
                        'order': 'recent'
                    }

                    logger.info(f"Crawling page {page} for: {keywords}")
                    response = self.session.get(
                        self.config.BASE_URL,
                        params=params,
                        timeout=self.config.TIMEOUT
                    )

                    response.raise_for_status()
                    soup = BeautifulSoup(response.content, 'html.parser')

                    # Parse listings
                    listings = soup.find_all('div', class_='item_card')

                    if not listings:
                        logger.info(f"No more listings found on page {page}")
                        return results

                    for listing in listings:
                        try:
                            item_data = self._parse_listing(listing)
                            if item_data:
                                results.append(item_data)
                        except Exception as e:
                            logger.warning(f"Failed to parse listing: {e}")
                            continue

                    logger.info(f"Found {len(listings)} listings on page {page}")
                    self._random_delay()
                    break

                except requests.exceptions.Timeout:
                    retry_count += 1
                    logger.warning(f"Timeout (attempt {retry_count}/{self.config.MAX_RETRIES})")
                    if retry_count < self.config.MAX_RETRIES:
                        time.sleep(2 ** retry_count)

                except requests.exceptions.ConnectionError:
                    retry_count += 1
                    logger.warning(f"Connection error (attempt {retry_count}/{self.config.MAX_RETRIES})")
                    if retry_count < self.config.MAX_RETRIES:
                        time.sleep(2 ** retry_count)

                except requests.exceptions.RequestException as e:
                    retry_count += 1
                    logger.warning(f"Request failed (attempt {retry_count}/{self.config.MAX_RETRIES}): {e}")
                    if retry_count < self.config.MAX_RETRIES:
                        time.sleep(2 ** retry_count)
                    else:
                        break

                except Exception as e:
                    logger.error(f"Unexpected error: {e}")
                    break

        return results

    def _parse_listing(self, listing_elem) -> Optional[Dict]:
        """Parse a single listing element"""
        try:
            # Extract title
            title_elem = listing_elem.find('span', class_='item_title')
            title = title_elem.text.strip() if title_elem else None

            # Extract price
            price_elem = listing_elem.find('strong', class_='item_price')
            price_text = price_elem.text.strip() if price_elem else None

            # Parse price (e.g., "5,000원" -> 5000)
            price = None
            if price_text:
                price_clean = price_text.replace('원', '').replace(',', '').strip()
                try:
                    price = int(price_clean)
                except ValueError:
                    price = None

            # Extract seller
            seller_elem = listing_elem.find('span', class_='seller_name')
            seller = seller_elem.text.strip() if seller_elem else None

            # Extract location
            location_elem = listing_elem.find('span', class_='item_location')
            location = location_elem.text.strip() if location_elem else None

            # Extract item link
            link_elem = listing_elem.find('a', class_='item_link')
            item_link = link_elem.get('href') if link_elem else None

            # Extract image URL
            img_elem = listing_elem.find('img', class_='item_image')
            image_url = img_elem.get('src') if img_elem else None

            if title and price is not None:
                return {
                    'title': title,
                    'price': price,
                    'currency': 'KRW',
                    'seller': seller,
                    'location': location,
                    'image_url': image_url,
                    'item_link': item_link,
                    'platform': 'bungle',
                    'fetched_at': datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.debug(f"Parse error: {e}")

        return None

    def save_results(self, results: List[Dict], output_file: str = "bungle_listings.json"):
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
    crawler = BungleCrawler()

    # Example searches (Korean keywords)
    search_terms = [
        "포토카드",  # Photocard
        "BTS 포토카드",  # BTS photocard
        "TWICE 포토카드"  # TWICE photocard
    ]

    all_results = []
    for term in search_terms:
        logger.info(f"\n--- Searching for: {term} ---")
        results = crawler.search_photocards(term, max_pages=2)
        all_results.extend(results)
        logger.info(f"Found {len(results)} listings for '{term}'")

    crawler.save_results(all_results)

    # Print summary
    if all_results:
        print(f"\n=== Crawl Complete ===")
        print(f"Total listings found: {len(all_results)}")
        print(f"Price range: {min([r['price'] for r in all_results])} - {max([r['price'] for r in all_results])} KRW")
        print(f"\nSample listing:")
        print(json.dumps(all_results[0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
