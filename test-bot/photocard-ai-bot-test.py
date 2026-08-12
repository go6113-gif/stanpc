#!/usr/bin/env python3
"""
Photocard AI Bot Test Script
Processes and evaluates photocard images from URLs.
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Tuple
import logging

import cv2
import numpy as np
from PIL import Image
import requests
from io import BytesIO

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Photocard aspect ratio (width:height)
PHOTOCARD_ASPECT_RATIO = 1 / 1.54

class PhotocardProcessor:
    def __init__(self):
        self.images = {}
        self.scores = {}

    def download_image(self, url_or_path: str, timeout: int = 10) -> Tuple[bool, np.ndarray]:
        """Download image from URL or load from local path."""
        try:
            # Check if it's a local file path
            path = Path(url_or_path)
            if path.exists():
                img = Image.open(path)
                return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Handle file:// URLs
            if url_or_path.startswith('file://'):
                file_path = url_or_path.replace('file:///', '').replace('/', '\\')
                path = Path(file_path)
                if path.exists():
                    img = Image.open(path)
                    return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Try URL download
            response = requests.get(url_or_path, timeout=timeout)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Failed to load {url_or_path}: {e}")
            return False, None

    def detect_photocard_region(self, img: np.ndarray) -> Tuple[int, int, int, int]:
        """
        Detect photocard region using edge detection.
        Returns bounding box (x, y, w, h).
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            h, w = gray.shape
            return 0, 0, w, h

        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)

        # Add padding
        padding = 10
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(img.shape[1] - x, w + 2 * padding)
        h = min(img.shape[0] - y, h + 2 * padding)

        return x, y, w, h

    def straighten_image(self, img: np.ndarray) -> np.ndarray:
        """Detect and correct image rotation."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 50)

        if lines is None:
            return img

        angles = []
        for line in lines:
            rho, theta = line[0]
            angle = np.degrees(theta) - 90
            if abs(angle) < 45:
                angles.append(angle)

        if angles:
            median_angle = np.median(angles)
            h, w = img.shape[:2]
            center = (w // 2, h // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            img = cv2.warpAffine(img, rotation_matrix, (w, h))

        return img

    def process_image(self, img: np.ndarray) -> np.ndarray:
        """
        Process image: straighten, detect region, crop, and remove watermark area.
        """
        # Straighten
        img = self.straighten_image(img)

        # Detect photocard region
        x, y, w, h = self.detect_photocard_region(img)
        img_cropped = img[y:y+h, x:x+w]

        # Resize to standard resolution
        standard_h = 400
        standard_w = int(standard_h / 1.54)
        img_resized = cv2.resize(img_cropped, (standard_w, standard_h))

        return img_resized

    def calculate_sharpness(self, img: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = np.var(laplacian)
        # Normalize to 0-100 scale (typical max ~1000)
        return min(100, (sharpness / 10.0))

    def calculate_aspect_ratio_score(self, img: np.ndarray) -> float:
        """Score based on aspect ratio proximity to 1:1.54."""
        h, w = img.shape[:2]
        actual_ratio = w / h
        target_ratio = 1 / 1.54

        ratio_diff = abs(actual_ratio - target_ratio) / target_ratio
        score = max(0, 100 - (ratio_diff * 100))
        return min(100, score)

    def calculate_resolution_score(self, img: np.ndarray) -> float:
        """Score based on image resolution."""
        h, w = img.shape[:2]
        pixels = h * w
        target_pixels = 400 * 260

        if pixels < 100000:
            return 10
        elif pixels < target_pixels:
            return (pixels / target_pixels) * 90 + 10
        else:
            return 100

    def calculate_noise_score(self, img: np.ndarray) -> float:
        """Score based on noise level (inverse of contrast)."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # Calculate Laplacian variance (edges/noise indicator)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        noise_level = np.var(laplacian)

        # Higher variance = more texture (good for photocards)
        # Normalize to 0-100
        if noise_level < 100:
            score = 30
        elif noise_level < 500:
            score = (noise_level - 100) / 4 + 30
        else:
            score = 100

        return min(100, max(0, score))

    def calculate_brightness_score(self, img: np.ndarray) -> float:
        """Score based on brightness and contrast."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        brightness = np.mean(gray)
        contrast = np.std(gray)

        # Ideal brightness around 128, good contrast > 30
        brightness_penalty = abs(brightness - 128) / 128
        contrast_score = min(100, (contrast / 50) * 100)

        brightness_score = max(0, 100 - (brightness_penalty * 50))

        return (brightness_score + contrast_score) / 2

    def evaluate_image(self, img: np.ndarray) -> dict:
        """Calculate overall quality score."""
        sharpness = self.calculate_sharpness(img)
        aspect_ratio = self.calculate_aspect_ratio_score(img)
        resolution = self.calculate_resolution_score(img)
        noise = self.calculate_noise_score(img)
        brightness = self.calculate_brightness_score(img)

        # Weighted average
        overall_score = (
            sharpness * 0.30 +
            aspect_ratio * 0.20 +
            resolution * 0.20 +
            noise * 0.15 +
            brightness * 0.15
        )

        return {
            "overall": overall_score,
            "sharpness": sharpness,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "noise": noise,
            "brightness": brightness
        }

    def run(self, image_urls: List[str]):
        """Process multiple images and select the best one."""
        logger.info(f"Processing {len(image_urls)} images...")

        for idx, url in enumerate(image_urls, 1):
            logger.info(f"\n[Image {idx}/{len(image_urls)}] Processing {url}")

            # Download
            success, img = self.download_image(url)
            if not success:
                continue

            logger.info(f"  Downloaded: {img.shape}")

            # Process
            img_processed = self.process_image(img)
            logger.info(f"  Processed: {img_processed.shape}")

            # Evaluate
            scores = self.evaluate_image(img_processed)
            self.images[idx] = img_processed
            self.scores[idx] = scores

            # Log scores
            logger.info(f"  Scores:")
            logger.info(f"    Overall:      {scores['overall']:.1f}")
            logger.info(f"    Sharpness:    {scores['sharpness']:.1f}")
            logger.info(f"    Aspect Ratio: {scores['aspect_ratio']:.1f}")
            logger.info(f"    Resolution:   {scores['resolution']:.1f}")
            logger.info(f"    Noise:        {scores['noise']:.1f}")
            logger.info(f"    Brightness:   {scores['brightness']:.1f}")

        # Select best image
        if not self.images:
            logger.error("No images processed successfully!")
            return

        best_idx = max(self.scores, key=lambda x: self.scores[x]['overall'])
        best_score = self.scores[best_idx]['overall']

        logger.info(f"\n{'='*50}")
        logger.info(f"BEST IMAGE: Image {best_idx}")
        logger.info(f"Overall Score: {best_score:.1f}/100")
        logger.info(f"{'='*50}")

        # Save best image
        output_path = OUTPUT_DIR / "best_card.png"
        cv2.imwrite(str(output_path), self.images[best_idx])
        logger.info(f"Saved to: {output_path}")

        # Save detailed report
        self._save_report(best_idx)

    def _save_report(self, best_idx: int):
        """Save detailed evaluation report."""
        report = {
            "best_image_index": best_idx,
            "best_score": self.scores[best_idx]['overall'],
            "all_scores": {}
        }

        for idx, scores in self.scores.items():
            report["all_scores"][f"image_{idx}"] = {
                k: float(v) for k, v in scores.items()
            }

        report_path = OUTPUT_DIR / "evaluation_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        logger.info(f"Report saved to: {report_path}")


def main():
    if len(sys.argv) < 2:
        logger.error("Usage: python photocard-ai-bot-test.py <url1> [url2] [url3] ...")
        logger.info("\nExample:")
        logger.info("  python photocard-ai-bot-test.py 'https://example.com/card1.jpg' 'https://example.com/card2.jpg'")
        sys.exit(1)

    image_urls = sys.argv[1:]
    processor = PhotocardProcessor()
    processor.run(image_urls)


if __name__ == "__main__":
    main()
