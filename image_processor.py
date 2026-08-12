#!/usr/bin/env python3
"""
Image Processing Module
Handles aspect ratio correction, padding, and letterboxing.
"""

import cv2
import numpy as np
from typing import Tuple, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageProcessor:
    """Processes images with aspect ratio correction and padding."""

    # Standard photocard aspect ratios
    PHOTOCARD_RATIOS = {
        "standard": 1 / 1.54,      # Width / Height (portrait)
        "square": 1.0,
        "landscape": 1.54,
    }

    @staticmethod
    def get_target_ratio(target_type: str = "standard") -> float:
        """Get target aspect ratio."""
        return ImageProcessor.PHOTOCARD_RATIOS.get(target_type, 1/1.54)

    @staticmethod
    def calculate_padding(img: np.ndarray, target_ratio: float) -> Dict:
        """
        Calculate padding needed to match target aspect ratio.

        Args:
            img: Input image
            target_ratio: Target width/height ratio

        Returns:
            Padding information
        """
        h, w = img.shape[:2]
        current_ratio = w / h

        padding_info = {
            "current_ratio": round(current_ratio, 3),
            "target_ratio": round(target_ratio, 3),
            "needs_padding": abs(current_ratio - target_ratio) > 0.05
        }

        if current_ratio < target_ratio:
            # Image too tall - add horizontal padding
            target_w = int(h * target_ratio)
            pad_left = (target_w - w) // 2
            pad_right = target_w - w - pad_left
            padding_info["pad_top"] = 0
            padding_info["pad_bottom"] = 0
            padding_info["pad_left"] = pad_left
            padding_info["pad_right"] = pad_right
            padding_info["direction"] = "horizontal"

        elif current_ratio > target_ratio:
            # Image too wide - add vertical padding
            target_h = int(w / target_ratio)
            pad_top = (target_h - h) // 2
            pad_bottom = target_h - h - pad_top
            padding_info["pad_top"] = pad_top
            padding_info["pad_bottom"] = pad_bottom
            padding_info["pad_left"] = 0
            padding_info["pad_right"] = 0
            padding_info["direction"] = "vertical"

        else:
            # Ratios match
            padding_info["pad_top"] = 0
            padding_info["pad_bottom"] = 0
            padding_info["pad_left"] = 0
            padding_info["pad_right"] = 0
            padding_info["direction"] = "none"

        padding_info["new_width"] = w + padding_info.get("pad_left", 0) + padding_info.get("pad_right", 0)
        padding_info["new_height"] = h + padding_info.get("pad_top", 0) + padding_info.get("pad_bottom", 0)

        return padding_info

    @staticmethod
    def apply_letterbox_padding(img: np.ndarray, target_ratio: float,
                               border_color: Tuple[int, int, int] = (255, 255, 255)) -> Tuple[np.ndarray, Dict]:
        """
        Apply letterbox padding to match target aspect ratio.

        Args:
            img: Input image (BGR)
            target_ratio: Target width/height ratio
            border_color: RGB color for padding (white default)

        Returns:
            Padded image and padding info
        """
        padding_info = ImageProcessor.calculate_padding(img, target_ratio)

        if not padding_info["needs_padding"]:
            logger.info(f"✓ Image already matches target ratio ({padding_info['current_ratio']:.3f})")
            return img, padding_info

        # Apply padding
        padded = cv2.copyMakeBorder(
            img,
            padding_info["pad_top"],
            padding_info["pad_bottom"],
            padding_info["pad_left"],
            padding_info["pad_right"],
            cv2.BORDER_CONSTANT,
            value=border_color
        )

        logger.info(f"✓ Applied {padding_info['direction']} padding:")
        logger.info(f"  Original: {img.shape[1]}x{img.shape[0]} ({padding_info['current_ratio']:.3f})")
        logger.info(f"  Padded:   {padded.shape[1]}x{padded.shape[0]} ({padded.shape[1]/padded.shape[0]:.3f})")

        return padded, padding_info

    @staticmethod
    def resize_to_standard(img: np.ndarray, target_height: int = 400,
                          target_ratio: float = None) -> np.ndarray:
        """
        Resize image to standard photocard dimensions.

        Args:
            img: Input image
            target_height: Target height in pixels
            target_ratio: Target aspect ratio (if None, uses standard)

        Returns:
            Resized image
        """
        if target_ratio is None:
            target_ratio = ImageProcessor.get_target_ratio()

        target_width = int(target_height * target_ratio)

        # First apply padding to match ratio
        padded, pad_info = ImageProcessor.apply_letterbox_padding(img, target_ratio)

        # Then resize to target dimensions
        resized = cv2.resize(padded, (target_width, target_height), interpolation=cv2.INTER_LANCZOS4)

        logger.info(f"✓ Resized to standard: {target_width}x{target_height}")

        return resized

    @staticmethod
    def validate_aspect_ratio(img: np.ndarray, target_ratio: float = None, tolerance: float = 0.05) -> Dict:
        """
        Validate if image matches target aspect ratio.

        Args:
            img: Input image
            target_ratio: Target aspect ratio (if None, uses standard)
            tolerance: Allowed deviation

        Returns:
            Validation result
        """
        if target_ratio is None:
            target_ratio = ImageProcessor.get_target_ratio()

        h, w = img.shape[:2]
        current_ratio = w / h

        is_valid = abs(current_ratio - target_ratio) <= tolerance

        return {
            "is_valid": is_valid,
            "current_ratio": round(current_ratio, 3),
            "target_ratio": round(target_ratio, 3),
            "deviation": round(abs(current_ratio - target_ratio), 3),
            "tolerance": tolerance
        }

    @staticmethod
    def process_pipeline(img: np.ndarray, target_height: int = 400) -> Dict:
        """
        Complete image processing pipeline.

        Args:
            img: Input image
            target_height: Target height for resize

        Returns:
            Dictionary with processed image and metadata
        """
        h, w = img.shape[:2]

        # Step 1: Validate input
        logger.info(f"📸 Processing image: {w}x{h}")

        # Step 2: Apply padding
        target_ratio = ImageProcessor.get_target_ratio()
        padded, pad_info = ImageProcessor.apply_letterbox_padding(img, target_ratio)

        # Step 3: Resize
        processed = ImageProcessor.resize_to_standard(img, target_height)

        # Step 4: Validate output
        validation = ImageProcessor.validate_aspect_ratio(processed, target_ratio)

        return {
            "original": {
                "width": w,
                "height": h,
                "ratio": round(w/h, 3)
            },
            "processed": {
                "width": processed.shape[1],
                "height": processed.shape[0],
                "ratio": round(processed.shape[1]/processed.shape[0], 3)
            },
            "padding": pad_info,
            "validation": validation,
            "image": processed,
            "status": "success" if validation["is_valid"] else "warning"
        }


if __name__ == "__main__":
    # Test image processor
    processor = ImageProcessor()
    print("✓ ImageProcessor initialized")
    print(f"  • Standard ratio: {processor.get_target_ratio():.3f} (1:1.54)")
    print("  • Ready to apply padding and resize")
