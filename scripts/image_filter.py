#!/usr/bin/env python3
"""
Image filtering for photocard sourcing.
Multi-stage screening: title keywords, aspect ratio, grid pattern detection.
"""

import cv2
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Korean keywords to exclude (lot/set/bundle patterns)
EXCLUDE_KEYWORDS = [
    "lot", "set", "bundle", "묶음", "셋트", "모음", "일괄",
    "세트", "패키지", "조합", "상자", "박스", "킹", "마스터",
]


def has_excluded_keywords(title: str) -> bool:
    """
    Check if title contains lot/set/bundle keywords (Korean + English).

    Args:
        title: Item title

    Returns:
        True if excluded keywords found
    """
    title_lower = title.lower()
    for keyword in EXCLUDE_KEYWORDS:
        if keyword in title_lower:
            logger.debug(f"    ⚠️  Excluded keyword '{keyword}' in title")
            return True
    return False


def check_aspect_ratio(image: np.ndarray, min_ratio: float = 0.65, max_ratio: float = 0.80) -> Tuple[bool, float]:
    """
    Check if image matches photocard aspect ratio (portrait orientation).
    Photocard is ~85.6 mm × 120 mm (width × height).
    Aspect ratio: width/height ≈ 0.71

    Args:
        image: Input image (BGR or RGB)
        min_ratio: Minimum aspect ratio (default 0.65 = slightly wider than standard)
        max_ratio: Maximum aspect ratio (default 0.80 = squarer tolerance)

    Returns:
        Tuple (is_valid, actual_ratio)
    """
    h, w = image.shape[:2]
    ratio = w / h

    is_valid = min_ratio <= ratio <= max_ratio
    return is_valid, ratio


def detect_grid_pattern(image: np.ndarray, threshold_lines: int = 8) -> Tuple[bool, int]:
    """
    Detect grid/dividing patterns in image.
    Multiple photocard layout (3x3 grid, 2x5 arrangement, etc.) contains
    visible grid lines or regular dividing patterns.

    Strategy:
    1. Convert to grayscale
    2. Apply Canny edge detection
    3. Detect horizontal and vertical lines using Hough transform
    4. Count significant lines
    5. If too many regular lines → likely grid pattern

    Args:
        image: Input image (BGR or RGB)
        threshold_lines: Min count of lines to trigger grid detection

    Returns:
        Tuple (has_grid, line_count)
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # Apply Canny edge detection
        edges = cv2.Canny(gray, 50, 150)

        # Detect lines using Hough transform
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 50)

        if lines is None:
            return False, 0

        # Count horizontal and vertical lines
        # (rho close to width or 0, theta close to 0 or pi/2)
        significant_lines = 0
        for line in lines:
            rho, theta = line[0]
            # Horizontal lines: theta ~ 0
            is_horizontal = abs(theta) < np.pi / 8 or abs(theta - np.pi) < np.pi / 8
            # Vertical lines: theta ~ pi/2
            is_vertical = abs(theta - np.pi / 2) < np.pi / 8

            if is_horizontal or is_vertical:
                significant_lines += 1

        has_grid = significant_lines >= threshold_lines
        logger.debug(f"    Grid pattern: {significant_lines} lines detected")

        return has_grid, significant_lines

    except Exception as e:
        logger.debug(f"    Grid detection error: {e}")
        return False, 0


def apply_source_filters(
    image: np.ndarray,
    title: str,
    min_width: int = 300,
    min_height: int = 400,
) -> Dict:
    """
    Apply all source-specific filters.

    Returns dict with keys:
    - is_valid: bool (passes all filters)
    - filters: dict with individual check results
    - reason: str (reason for rejection, if any)
    """
    filters = {
        "keyword_filter": not has_excluded_keywords(title),
        "dimensions_valid": image.shape[1] >= min_width and image.shape[0] >= min_height,
        "grid_pattern": None,  # Will set below
        "aspect_ratio": None,  # Will set below
    }

    # Check aspect ratio
    ratio_valid, ratio = check_aspect_ratio(image)
    filters["aspect_ratio"] = {
        "is_valid": ratio_valid,
        "ratio": ratio,
    }

    # Check grid pattern
    has_grid, line_count = detect_grid_pattern(image)
    filters["grid_pattern"] = {
        "has_grid": has_grid,
        "line_count": line_count,
    }

    # Determine overall validity
    reasons = []
    if not filters["keyword_filter"]:
        reasons.append("excluded keyword in title")
    if not filters["dimensions_valid"]:
        reasons.append(f"dimensions {image.shape[1]}x{image.shape[0]} too small")
    if not filters["aspect_ratio"]["is_valid"]:
        reasons.append(f"aspect ratio {ratio:.3f} outside range")
    if filters["grid_pattern"]["has_grid"]:
        reasons.append("grid pattern detected (multi-card layout)")

    is_valid = (
        filters["keyword_filter"]
        and filters["dimensions_valid"]
        and filters["aspect_ratio"]["is_valid"]
        and not filters["grid_pattern"]["has_grid"]
    )

    return {
        "is_valid": is_valid,
        "filters": filters,
        "reason": ", ".join(reasons) if reasons else "passes all filters",
    }


def batch_filter_images(
    image_results: List[Dict],
    image_bytes_loader,  # Function(url) -> np.ndarray or None
) -> Dict:
    """
    Filter batch of image search results.

    Args:
        image_results: List of dicts with 'image' (URL) and 'title' keys
        image_bytes_loader: Callable that takes URL and returns cv2 image

    Returns:
        Dict with 'valid', 'filtered_out', breakdown
    """
    valid = []
    filtered_out = []

    for result in image_results:
        url = result.get("image")
        title = result.get("title", "")

        try:
            # Download and decode image
            img = image_bytes_loader(url)
            if img is None:
                filtered_out.append({
                    "result": result,
                    "reason": "download failed",
                })
                continue

            # Apply filters
            filter_result = apply_source_filters(img, title)

            if filter_result["is_valid"]:
                valid.append({
                    "result": result,
                    "image": img,
                    "filters": filter_result["filters"],
                })
            else:
                filtered_out.append({
                    "result": result,
                    "reason": filter_result["reason"],
                })

        except Exception as e:
            filtered_out.append({
                "result": result,
                "reason": f"processing error: {e}",
            })

    return {
        "valid_count": len(valid),
        "filtered_count": len(filtered_out),
        "total": len(image_results),
        "pass_rate": f"{len(valid) / len(image_results) * 100:.1f}%" if image_results else "N/A",
        "valid": valid,
        "filtered_out": filtered_out,
    }
