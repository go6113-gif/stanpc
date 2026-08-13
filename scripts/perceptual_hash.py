#!/usr/bin/env python3
"""
Perceptual hashing for image cross-validation.
Compares eBay and Naver search results to detect duplicate/same card.
"""

import cv2
import numpy as np
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def average_hash(image: np.ndarray, hash_size: int = 8) -> str:
    """
    Generate average hash (aHash) for perceptual comparison.

    Algorithm:
    1. Resize to hash_size x hash_size
    2. Convert to grayscale
    3. Compute average pixel value
    4. Create hash: 1 if pixel > avg, 0 otherwise
    5. Return as binary string

    Args:
        image: Input image (BGR or RGB)
        hash_size: Hash grid size (default 8x8 = 64-bit hash)

    Returns:
        Binary string of length hash_size²
    """
    # Resize to hash_size x hash_size
    resized = cv2.resize(image, (hash_size, hash_size))

    # Convert to grayscale
    if len(resized.shape) == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    else:
        gray = resized

    # Compute average
    avg = gray.mean()

    # Generate hash
    hash_bits = (gray > avg).flatten()
    hash_str = "".join(map(str, hash_bits.astype(int)))

    return hash_str


def dhash(image: np.ndarray, hash_size: int = 8) -> str:
    """
    Generate difference hash (dHash) for perceptual comparison.

    Algorithm:
    1. Resize to (hash_size+1) x hash_size
    2. Convert to grayscale
    3. Compare adjacent pixels horizontally
    4. Create hash: 1 if left < right, 0 otherwise

    dHash is more robust to resizing/compression than aHash.

    Args:
        image: Input image (BGR or RGB)
        hash_size: Hash grid size (default 8x8)

    Returns:
        Binary string of length hash_size²
    """
    # Resize to (hash_size+1) x hash_size to compare adjacent pairs
    resized = cv2.resize(image, (hash_size + 1, hash_size))

    # Convert to grayscale
    if len(resized.shape) == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    else:
        gray = resized

    # Compare adjacent horizontal pixels
    # hash[i,j] = 1 if pixel[i,j] > pixel[i,j+1], else 0
    hash_bits = (gray[:, :-1] > gray[:, 1:]).flatten()
    hash_str = "".join(map(str, hash_bits.astype(int)))

    return hash_str


def hamming_distance(hash1: str, hash2: str) -> int:
    """
    Calculate Hamming distance between two hash strings.
    Counts number of differing bits.

    Args:
        hash1: Binary string
        hash2: Binary string

    Returns:
        Hamming distance (number of differing bits)
    """
    if len(hash1) != len(hash2):
        raise ValueError(f"Hash lengths differ: {len(hash1)} vs {len(hash2)}")

    return sum(c1 != c2 for c1, c2 in zip(hash1, hash2))


def similarity_score(hash1: str, hash2: str) -> float:
    """
    Calculate normalized similarity score (0.0 to 1.0).
    1.0 = identical, 0.0 = completely different

    Args:
        hash1: Binary string
        hash2: Binary string

    Returns:
        Similarity score in [0, 1]
    """
    if len(hash1) != len(hash2):
        return 0.0

    distance = hamming_distance(hash1, hash2)
    max_distance = len(hash1)
    return 1.0 - (distance / max_distance)


def compare_images(
    image1: np.ndarray,
    image2: np.ndarray,
    similarity_threshold: float = 0.85,
) -> dict:
    """
    Compare two images using multiple perceptual hash methods.

    Args:
        image1: First image (eBay)
        image2: Second image (Naver)
        similarity_threshold: Threshold for "likely same card" (0.0-1.0)

    Returns:
        Dict with similarity scores and verdict
    """
    # Compute hashes using multiple algorithms
    ahash1 = average_hash(image1)
    ahash2 = average_hash(image2)
    dhash1 = dhash(image1)
    dhash2 = dhash(image2)

    # Calculate similarities
    asim = similarity_score(ahash1, ahash2)
    dsim = similarity_score(dhash1, dhash2)

    # Average similarity
    avg_sim = (asim + dsim) / 2

    # Verdict
    if avg_sim >= similarity_threshold:
        verdict = "likely_match"
    elif avg_sim >= 0.70:
        verdict = "possible_match"
    else:
        verdict = "different"

    return {
        "average_hash": {
            "hash1": ahash1,
            "hash2": ahash2,
            "similarity": asim,
        },
        "difference_hash": {
            "hash1": dhash1,
            "hash2": dhash2,
            "similarity": dsim,
        },
        "average_similarity": avg_sim,
        "verdict": verdict,
        "is_match": avg_sim >= similarity_threshold,
    }


def batch_compare_images(
    image_pairs: list,  # List of (ebay_img, naver_img) tuples
    similarity_threshold: float = 0.85,
) -> dict:
    """
    Compare multiple image pairs in batch.

    Args:
        image_pairs: List of (image1, image2) tuples
        similarity_threshold: Match threshold

    Returns:
        Summary of matches and non-matches
    """
    high_confidence = []
    medium_confidence = []
    low_confidence = []

    for idx, (img1, img2) in enumerate(image_pairs):
        try:
            result = compare_images(img1, img2, similarity_threshold)

            if result["verdict"] == "likely_match":
                high_confidence.append({
                    "index": idx,
                    "similarity": result["average_similarity"],
                    "result": result,
                })
            elif result["verdict"] == "possible_match":
                medium_confidence.append({
                    "index": idx,
                    "similarity": result["average_similarity"],
                    "result": result,
                })
            else:
                low_confidence.append({
                    "index": idx,
                    "similarity": result["average_similarity"],
                    "result": result,
                })

        except Exception as e:
            logger.warning(f"Comparison error for pair {idx}: {e}")

    return {
        "high_confidence": high_confidence,
        "medium_confidence": medium_confidence,
        "low_confidence": low_confidence,
        "summary": {
            "high": len(high_confidence),
            "medium": len(medium_confidence),
            "low": len(low_confidence),
            "total": len(image_pairs),
        },
    }
