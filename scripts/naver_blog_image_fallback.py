#!/usr/bin/env python3
"""
Naver blog search fallback for photocard image sourcing.
When eBay fails, searches Naver blog and extracts images from blog posts.
"""

import requests
import logging
from typing import List, Dict, Optional
from urllib.parse import quote
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NaverBlogImageFallback:
    """
    Naver API HUB blog search + image extraction fallback.
    Searches blogs, fetches post HTML, extracts og:image or first <img> tag.
    """

    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.blog_search_url = "https://naverapihub.apigw.ntruss.com/search/v1/blog"
        self.session = requests.Session()
        self.session.headers.update({
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret,
        })

    def search_and_extract_images(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search Naver blog, fetch first N posts, extract images.
        Returns list of {url, title, source} dicts.
        """
        results = []

        try:
            # Step 1: Search blogs
            blog_results = self._search_blogs(query, limit)
            if not blog_results:
                logger.warning(f"  ⚠️  No Naver blog results for '{query}'")
                return []

            # Step 2: Extract images from each blog post
            for i, blog_item in enumerate(blog_results[:limit], 1):
                link = blog_item.get("link")
                title = blog_item.get("title", "").replace("<b>", "").replace("</b>", "")

                if not link:
                    continue

                # Fetch blog post HTML and extract image
                img_url = self._extract_image_from_blog(link)
                if img_url:
                    results.append({
                        "url": img_url,
                        "title": title,
                        "source": "naver_blog",
                        "blog_link": link,
                    })
                    if len(results) >= limit:
                        break

            if results:
                logger.info(f"  ✓ Naver blog: Found {len(results)} images for '{query}'")
            else:
                logger.warning(f"  ⚠️  Naver blog: No extractable images in {len(blog_results)} posts")

            return results

        except Exception as e:
            logger.error(f"Naver blog fallback error for '{query}': {e}")
            return []

    def _search_blogs(self, query: str, display: int = 5) -> List[Dict]:
        """Search Naver blog API."""
        try:
            params = {
                "query": query,
                "display": display,
                "start": 1,
                "sort": "sim",
            }
            resp = self.session.get(self.blog_search_url, params=params, timeout=10)
            resp.raise_for_status()

            data = resp.json()
            return data.get("items", [])

        except Exception as e:
            logger.error(f"Naver blog search error: {e}")
            return []

    def _extract_image_from_blog(self, blog_url: str, timeout: int = 10) -> Optional[str]:
        """
        Fetch blog post HTML, extract og:image or first <img src>.
        """
        try:
            resp = requests.get(blog_url, timeout=timeout, allow_redirects=True)
            resp.raise_for_status()
            resp.encoding = "utf-8"

            soup = BeautifulSoup(resp.text, "html.parser")

            # Try og:image first (meta tag)
            og_image = soup.find("meta", property="og:image")
            if og_image and og_image.get("content"):
                return og_image["content"]

            # Fall back to first <img> with src in body (exclude very small images)
            for img in soup.find_all("img"):
                src = img.get("src")
                if src and ("http" in src or src.startswith("/")):
                    # Skip tiny images (thumbnails, icons)
                    width = img.get("width")
                    height = img.get("height")
                    if width or height:
                        try:
                            w, h = int(width or 0), int(height or 0)
                            if w < 200 and h < 200:
                                continue
                        except (ValueError, TypeError):
                            pass

                    # Resolve relative URLs
                    if src.startswith("/"):
                        # Try to extract domain from blog_url
                        from urllib.parse import urlparse
                        domain = urlparse(blog_url).netloc
                        src = f"https://{domain}{src}"

                    return src

            return None

        except Exception as e:
            logger.warning(f"  ⚠️  Failed to extract image from {blog_url}: {e}")
            return None
