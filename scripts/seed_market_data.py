#!/usr/bin/env python3
"""
Market Data Seeder for StanPC
- Collects photocard data from eBay (via ebay_scraper) and Bungle (via bungle_crawler)
- Transforms data into Prisma-compatible JSON format
- Exports to seed_data.json for Node.js Prisma seeding
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Import scrapers
from ebay_scraper import eBayScraper
from bungle_crawler import BungleCrawler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "seed_data"
OUTPUT_FILE = OUTPUT_DIR / "seed_data.json"


class PhotocardDataNormalizer:
    """Normalize scraper output to Prisma schema"""

    # Photocard slug mapping (group/member -> slug)
    # In production, this would query the database to find existing PhotoCard records
    PHOTOCARD_SLUGS = {
        "TWICE/TZUYU": "twice-tzuyu-Feel-Special",
        "BLACKPINK/JENNIE": "blackpink-jennie-aptober",
        "EXO/SEHUN": "exo-sehun-obsession",
        "Stray Kids/FELIX": "stray-kids-felix-noeasy",
        "SEVENTEEN/JOSHUA": "seventeen-joshua-sector17",
        "Red Velvet/JOY": "red-velvet-joy-feel-good",
        "TXT/YEONJUN": "txt-yeonjun-chaos",
        "aespa/KARINA": "aespa-karina-spicy",
        "NCT Dream/MARK": "nct-dream-mark-hello-future",
        "TWICE/SANA": "twice-sana-scientist",
        "NewJeans/HANNI": "newjeans-hanni-attention",
        "IVE/WONYOUNG": "ive-wonyoung-either-or",
    }

    @staticmethod
    def extract_price_and_currency(price_str: Optional[str]) -> Tuple[Optional[float], str]:
        """Extract price value and currency from string"""
        if not price_str:
            return None, "USD"

        price_str = str(price_str).strip()

        # Handle USD ($)
        if price_str.startswith("$"):
            try:
                price = float(price_str[1:].replace(",", ""))
                return price, "USD"
            except ValueError:
                pass

        # Handle KRW (₩)
        if price_str.startswith("₩"):
            try:
                price = float(price_str[1:].replace(",", ""))
                return price / 1000, "USD"  # Convert KRW to approximate USD
            except ValueError:
                pass

        # Handle JPY (¥)
        if price_str.startswith("¥"):
            try:
                price = float(price_str[1:].replace(",", ""))
                return price / 100, "USD"  # Convert JPY to approximate USD
            except ValueError:
                pass

        # Try parsing as plain number
        try:
            return float(price_str), "USD"
        except ValueError:
            return None, "USD"

    @staticmethod
    def find_photocard_slug(title: str, market: str) -> Optional[str]:
        """Find matching photocard slug from title"""
        title_upper = title.upper()

        # Simple heuristic: find key patterns
        for slug in PhotocardDataNormalizer.PHOTOCARD_SLUGS.values():
            parts = slug.split("-")
            # Check if group/member names are in title
            if len(parts) >= 3:
                group = parts[0].upper()
                member = parts[1].upper()
                if group in title_upper and member in title_upper:
                    return slug

        return None

    @classmethod
    def normalize_ebay_listing(cls, listing: Dict) -> Dict:
        """Convert eBay listing to PriceHistory format"""
        price, currency = cls.extract_price_and_currency(listing.get("price"))

        return {
            "market": "ebay",
            "price": price,
            "currency": currency,
            "sourceUrl": listing.get("url"),
            "title": listing.get("title", ""),
            "itemId": listing.get("itemId", ""),  # For GlobalSKUMapping
        }

    @classmethod
    def normalize_bungle_listing(cls, listing: Dict) -> Dict:
        """Convert Bungle listing to PriceHistory format"""
        price, currency = cls.extract_price_and_currency(listing.get("price"))

        return {
            "market": "bunjang",  # Bungle market code
            "price": price,
            "currency": currency,
            "sourceUrl": listing.get("url"),
            "title": listing.get("title", ""),
            "itemId": listing.get("id", ""),  # Bungle item ID
        }


class SeedDataGenerator:
    """Generate seed data from scrapers"""

    def __init__(self):
        self.price_history_records: List[Dict] = []
        self.sku_mapping_records: List[Dict] = []
        self.normalizer = PhotocardDataNormalizer()

    def collect_ebay_data(self, search_keywords: List[str]) -> None:
        """Collect eBay photocard listings"""
        logger.info("Starting eBay data collection...")
        scraper = eBayScraper()

        for keyword in search_keywords:
            try:
                logger.info(f"Searching eBay for: {keyword}")
                listings = scraper.search_photocards(keyword, max_results=10)

                for listing in listings:
                    normalized = self.normalizer.normalize_ebay_listing(listing)

                    # Find matching photocard slug
                    photocard_slug = self.normalizer.find_photocard_slug(
                        listing.get("title", ""), "ebay"
                    )

                    if not photocard_slug:
                        logger.warning(
                            f"Could not match eBay listing: {listing.get('title')}"
                        )
                        continue

                    # Add to price history
                    if normalized.get("price"):
                        self.price_history_records.append(
                            {
                                "photocard_slug": photocard_slug,
                                "price": normalized["price"],
                                "currency": normalized["currency"],
                                "market": normalized["market"],
                                "sourceUrl": normalized["sourceUrl"],
                                "createdAt": datetime.utcnow().isoformat(),
                            }
                        )

                    # Add to SKU mapping
                    if normalized.get("itemId"):
                        self.sku_mapping_records.append(
                            {
                                "photocard_slug": photocard_slug,
                                "market": normalized["market"],
                                "sku": normalized["itemId"],
                                "skuUrl": normalized["sourceUrl"],
                                "lastChecked": datetime.utcnow().isoformat(),
                                "isActive": True,
                            }
                        )

            except Exception as e:
                logger.error(f"Error collecting eBay data for '{keyword}': {e}")

    def collect_bungle_data(self, search_keywords: List[str]) -> None:
        """Collect Bungle photocard listings"""
        logger.info("Starting Bungle data collection...")
        crawler = BungleCrawler()

        for keyword in search_keywords:
            try:
                logger.info(f"Crawling Bungle for: {keyword}")
                listings = crawler.search_photocards(keyword, max_pages=2)

                for listing in listings:
                    normalized = self.normalizer.normalize_bungle_listing(listing)

                    # Find matching photocard slug
                    photocard_slug = self.normalizer.find_photocard_slug(
                        listing.get("title", ""), "bunjang"
                    )

                    if not photocard_slug:
                        logger.warning(
                            f"Could not match Bungle listing: {listing.get('title')}"
                        )
                        continue

                    # Add to price history
                    if normalized.get("price"):
                        self.price_history_records.append(
                            {
                                "photocard_slug": photocard_slug,
                                "price": normalized["price"],
                                "currency": normalized["currency"],
                                "market": normalized["market"],
                                "sourceUrl": normalized["sourceUrl"],
                                "createdAt": datetime.utcnow().isoformat(),
                            }
                        )

                    # Add to SKU mapping
                    if normalized.get("itemId"):
                        self.sku_mapping_records.append(
                            {
                                "photocard_slug": photocard_slug,
                                "market": normalized["market"],
                                "sku": normalized["itemId"],
                                "skuUrl": normalized["sourceUrl"],
                                "lastChecked": datetime.utcnow().isoformat(),
                                "isActive": True,
                            }
                        )

            except Exception as e:
                logger.error(f"Error collecting Bungle data for '{keyword}': {e}")

    def save_seed_data(self) -> Path:
        """Save collected data to JSON file for Prisma seeding"""
        OUTPUT_DIR.mkdir(exist_ok=True)

        seed_data = {
            "priceHistory": self.price_history_records,
            "globalSKUMapping": self.sku_mapping_records,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "priceHistoryCount": len(self.price_history_records),
                "skuMappingCount": len(self.sku_mapping_records),
            },
        }

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(seed_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Seed data saved to: {OUTPUT_FILE}")
        logger.info(f"  - PriceHistory records: {len(self.price_history_records)}")
        logger.info(f"  - SKUMapping records: {len(self.sku_mapping_records)}")

        return OUTPUT_FILE

    def print_summary(self) -> None:
        """Print data collection summary"""
        logger.info("=" * 60)
        logger.info("DATA COLLECTION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"PriceHistory records collected: {len(self.price_history_records)}")
        logger.info(f"GlobalSKUMapping records collected: {len(self.sku_mapping_records)}")

        if self.price_history_records:
            logger.info("\nSample PriceHistory record:")
            logger.info(json.dumps(self.price_history_records[0], indent=2))

        if self.sku_mapping_records:
            logger.info("\nSample SKUMapping record:")
            logger.info(json.dumps(self.sku_mapping_records[0], indent=2))


def main():
    """Main seeding workflow"""
    logger.info("Starting StanPC Market Data Seeding...")

    # Search keywords for scrapers
    search_keywords = [
        "TWICE TZUYU 포토카드",
        "BLACKPINK JENNIE 포토카드",
        "EXO SEHUN 포토카드",
        "Stray Kids FELIX photocard",
        "SEVENTEEN photocard",
    ]

    try:
        generator = SeedDataGenerator()

        # Collect eBay data
        generator.collect_ebay_data(search_keywords[:3])  # Test with first 3 keywords

        # Collect Bungle data
        generator.collect_bungle_data(search_keywords[:3])

        # Save to JSON
        seed_file = generator.save_seed_data()

        # Print summary
        generator.print_summary()

        logger.info("\n✅ Seeding data generated successfully!")
        logger.info(f"Next step: Run Node.js seed script to insert into Prisma DB")
        logger.info(f"  npm run db:seed")

        return seed_file

    except Exception as e:
        logger.error(f"Fatal error during seeding: {e}", exc_info=True)
        return None


if __name__ == "__main__":
    main()
