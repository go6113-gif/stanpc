#!/usr/bin/env python3
"""
Image resizing and optimization for Vision LLM processing.
Converts images to low-resolution (max 512px) to minimize token usage.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Tuple
import requests
from io import BytesIO
from PIL import Image
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VisionImageResizer:
    """Resizes and optimizes images for Vision LLM API."""

    # Target dimensions to minimize token usage
    MAX_DIMENSION = 512
    QUALITY = 75  # JPEG quality for size reduction
    FORMAT = "webp"  # WebP for better compression

    @staticmethod
    def download_image(url: str, timeout: int = 10) -> Optional[Image.Image]:
        """
        Download image from URL.

        Args:
            url: Image URL
            timeout: Request timeout in seconds

        Returns:
            PIL Image object or None on failure
        """
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            return img
        except Exception as e:
            logger.debug(f"Download failed for {url}: {e}")
            return None

    @staticmethod
    def resize_image(
        img: Image.Image,
        max_dim: int = MAX_DIMENSION,
    ) -> Image.Image:
        """
        Resize image to fit within max dimensions while maintaining aspect ratio.

        Args:
            img: PIL Image
            max_dim: Maximum width or height (default 512px)

        Returns:
            Resized PIL Image
        """
        # Convert RGBA to RGB if needed
        if img.mode in ("RGBA", "LA", "P"):
            rgb_img = Image.new("RGB", img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = rgb_img

        # Calculate new dimensions maintaining aspect ratio
        width, height = img.size
        if width > max_dim or height > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            logger.debug(f"  Resized to {img.size}")

        return img

    @staticmethod
    def encode_to_base64(
        img: Image.Image,
        format: str = FORMAT,
        quality: int = QUALITY,
    ) -> str:
        """
        Encode PIL Image to base64 string for LLM API.

        Args:
            img: PIL Image
            format: Image format (webp, jpeg)
            quality: Compression quality (1-95)

        Returns:
            Base64 encoded string
        """
        buffer = BytesIO()
        img.save(buffer, format=format.upper(), quality=quality, optimize=True)
        buffer.seek(0)
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        logger.debug(f"  Encoded to base64: {len(b64_str)} chars")
        return b64_str

    @classmethod
    def process_image_url(
        cls,
        url: str,
        max_dim: int = MAX_DIMENSION,
    ) -> Optional[Tuple[str, Tuple[int, int]]]:
        """
        Download, resize, and encode image from URL.

        Args:
            url: Image URL
            max_dim: Maximum dimension

        Returns:
            Tuple of (base64_string, original_size) or None on failure
        """
        try:
            # Download
            img = cls.download_image(url)
            if img is None:
                return None

            original_size = img.size
            logger.debug(f"  Downloaded: {original_size}")

            # Resize
            img = cls.resize_image(img, max_dim)
            final_size = img.size
            logger.debug(f"  Final size: {final_size}")

            # Encode
            b64 = cls.encode_to_base64(img)

            return b64, original_size

        except Exception as e:
            logger.error(f"Process image error: {e}")
            return None
