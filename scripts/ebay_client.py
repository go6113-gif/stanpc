#!/usr/bin/env python3
"""
eBay Browse API Client for Photocard Collection
Searches and retrieves REAL photocard listings from eBay (Browse API,
Client Credentials Grant). Falls back to a real public web image search
if the eBay API has no usable results, and only falls back to clearly
labeled mock data as an absolute last resort (e.g. no credentials).
"""

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
import logging

import requests
from dotenv import load_dotenv

from web_image_fallback import search_web_images

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Credentials live in poca-exchange/.env (this is a Python sibling project
# sharing the same eBay Developer application as the Next.js app).
_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT.parent / "poca-exchange" / ".env")
load_dotenv(_ROOT / ".env")  # allow a root-level override too, if present

TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
BROWSE_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
APP_SCOPE = "https://api.ebay.com/oauth/api_scope"
TOKEN_CACHE_FILE = _ROOT / ".ebay_token_cache.json"
EXPIRY_SAFETY_MARGIN_S = 60


@dataclass
class PhotocardListing:
    """Photocard listing data structure (eBay item or web-search fallback)."""
    item_id: str
    title: str
    image_url: str
    price: float
    currency: str
    seller: str
    condition: str
    url: str
    source: str  # "ebay" | "web_search" | "mock"
    raw_data: Dict


class eBayClient:
    """eBay Browse API client for real photocard searches, with a
    real-web-image-search fallback and a last-resort mock fallback."""

    def __init__(self):
        self.client_id = os.getenv("EBAY_CLIENT_ID", "")
        self.client_secret = os.getenv("EBAY_CLIENT_SECRET", "")
        self.has_credentials = bool(self.client_id and self.client_secret)

        if not self.has_credentials:
            logger.warning("⚠️  EBAY_CLIENT_ID/SECRET not set - real eBay API unavailable")

    # ---- OAuth token handling (mirrors poca-exchange/lib/ebay.ts) ----

    def _read_token_cache(self) -> Optional[Dict]:
        try:
            with open(TOKEN_CACHE_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return None

    def _write_token_cache(self, access_token: str, expires_at: float) -> None:
        try:
            with open(TOKEN_CACHE_FILE, "w") as f:
                json.dump({"access_token": access_token, "expires_at": expires_at}, f)
        except OSError as e:
            logger.warning(f"⚠️  Could not write token cache: {e}")

    def _is_valid(self, cache: Optional[Dict]) -> bool:
        if not cache:
            return False
        return cache.get("expires_at", 0) - EXPIRY_SAFETY_MARGIN_S > time.time()

    def _fetch_fresh_token(self) -> Dict:
        resp = requests.post(
            TOKEN_URL,
            auth=(self.client_id, self.client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials", "scope": APP_SCOPE},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        expires_at = time.time() + data["expires_in"]
        return {"access_token": data["access_token"], "expires_at": expires_at}

    def _get_app_token(self) -> str:
        cache = self._read_token_cache()
        if self._is_valid(cache):
            return cache["access_token"]

        logger.info("🔑 Fetching fresh eBay OAuth app token...")
        fresh = self._fetch_fresh_token()
        self._write_token_cache(fresh["access_token"], fresh["expires_at"])
        return fresh["access_token"]

    # ---- Real eBay Browse API search ----

    def _search_ebay_real(self, query: str, limit: int) -> List[PhotocardListing]:
        token = self._get_app_token()

        resp = requests.get(
            BROWSE_SEARCH_URL,
            params={"q": query, "limit": limit},
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        listings = []
        for item in data.get("itemSummaries", []):
            thumbnails = item.get("thumbnailImages") or []
            image_url = (
                (thumbnails[0].get("imageUrl") if thumbnails else None)
                or item.get("image", {}).get("imageUrl")
            )
            if not image_url:
                continue  # skip listings without any usable image

            price = item.get("price", {})
            listings.append(PhotocardListing(
                item_id=item.get("itemId", ""),
                title=item.get("title", query),
                image_url=image_url,
                price=float(price.get("value", 0) or 0),
                currency=price.get("currency", "USD"),
                seller=item.get("seller", {}).get("username", "unknown"),
                condition=item.get("condition", "Unknown"),
                url=item.get("itemWebUrl", ""),
                source="ebay",
                raw_data=item,
            ))

        return listings[:limit]

    # ---- Fallback: real web image search (no synthetic data) ----

    def _search_web_fallback(self, query: str, limit: int) -> List[PhotocardListing]:
        results = search_web_images(f"{query} kpop", limit=limit)
        listings = []
        for idx, item in enumerate(results, 1):
            listings.append(PhotocardListing(
                item_id=f"web_{idx:03d}",
                title=item["title"],
                image_url=item["image_url"],
                price=0.0,
                currency="USD",
                seller="web_search",
                condition="Unknown",
                url=item.get("source_page", ""),
                source="web_search",
                raw_data=item,
            ))
        return listings

    # ---- Last resort: explicitly labeled mock/placeholder data ----

    def _get_mock_data(self, query: str, limit: int) -> List[PhotocardListing]:
        logger.warning(f"⚠️  Using MOCK placeholder images for '{query}' - NOT real photocards")
        mock_listings = [
            {
                "item_id": "mock_001",
                "title": f"[MOCK] {query} Photocard",
                "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
                "price": 25.99,
                "seller": "mock_seller",
                "condition": "New",
                "url": "https://ebay.com/itm/mock_001",
            },
        ]
        listings = []
        for item in mock_listings[:limit]:
            listings.append(PhotocardListing(
                item_id=item["item_id"],
                title=item["title"],
                image_url=item["image_url"],
                price=item["price"],
                currency="USD",
                seller=item["seller"],
                condition=item["condition"],
                url=item["url"],
                source="mock",
                raw_data=item,
            ))
        return listings

    # ---- Public entry point: real API -> web fallback -> mock ----

    def search_photocards(self, query: str, limit: int = 4) -> List[PhotocardListing]:
        """
        Search for real photocard images, preferring the eBay Browse API.

        Priority: (1) eBay Browse API, (2) real web image search fallback
        if eBay yields no results or credentials are missing, (3) mock
        placeholder data as an absolute last resort (clearly tagged
        source="mock" so downstream consumers can distinguish it).
        """
        if self.has_credentials:
            try:
                logger.info(f"🔍 Searching eBay Browse API for: '{query}'")
                listings = self._search_ebay_real(query, limit)
                if listings:
                    logger.info(f"  ✓ eBay API returned {len(listings)} real listing(s)")
                    return listings
                logger.warning(f"  ⚠️  eBay API returned 0 usable listings for '{query}'")
            except requests.exceptions.RequestException as e:
                logger.error(f"  ❌ eBay API request failed: {e}")
            except Exception as e:
                logger.error(f"  ❌ eBay API error: {e}")

        logger.info(f"🌐 Falling back to web image search for: '{query}'")
        web_listings = self._search_web_fallback(query, limit)
        if web_listings:
            return web_listings

        logger.warning(f"  ⚠️  Web fallback found nothing for '{query}' - using mock data")
        return self._get_mock_data(query, limit)


def search_photocards(query: str, limit: int = 4) -> List[Dict]:
    """Convenience function returning plain dicts."""
    client = eBayClient()
    listings = client.search_photocards(query, limit)

    return [
        {
            "item_id": listing.item_id,
            "title": listing.title,
            "image_url": listing.image_url,
            "price": listing.price,
            "currency": listing.currency,
            "seller": listing.seller,
            "condition": listing.condition,
            "url": listing.url,
            "source": listing.source,
        }
        for listing in listings
    ]


if __name__ == "__main__":
    results = search_photocards("Stray Kids photocard", limit=4)
    print(f"Found {len(results)} listings:")
    for item in results:
        print(f"  • [{item['source']}] {item['title']} - ${item['price']} ({item['seller']})")
        print(f"    {item['image_url'][:90]}")
