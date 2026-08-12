#!/usr/bin/env python3
"""
Photocard Image Processing Pipeline
- Multi-card detection and single card cropping
- 1:1.54 aspect ratio normalization
- 30-50KB WebP compression
"""

import cv2
import numpy as np
from pathlib import Path
import logging
import json
from typing import List, Dict, Tuple, Optional
from PIL import Image
from datetime import datetime
import io

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CardDetectionConfig:
    """Configuration for card detection"""
    TARGET_ASPECT_RATIO = 1 / 1.54  # width / height (約 0.649)
    MIN_CARD_AREA = 5000  # Minimum pixel area for a valid card
    MAX_CARD_AREA = 1000000  # Maximum pixel area
    TARGET_WIDTH = 300  # Target width after normalization
    MIN_QUALITY = 70
    MAX_QUALITY = 95
    TARGET_SIZE_KB = 40  # Target size in KB
    MIN_SIZE_KB = 30
    MAX_SIZE_KB = 50

    # Thumbnail configuration
    THUMBNAIL_WIDTH = 100  # Thumbnail width
    THUMBNAIL_QUALITY = 75


class ImageMetadata:
    """Metadata for processed image"""
    def __init__(self, filename: str, original_size_kb: float,
                 webp_size_kb: float, dimensions: tuple):
        self.filename = filename
        self.original_size_kb = original_size_kb
        self.webp_size_kb = webp_size_kb
        self.dimensions = dimensions  # (width, height)
        self.compression_ratio = original_size_kb / webp_size_kb if webp_size_kb > 0 else 0
        self.processed_at = datetime.now().isoformat()


class CardDetector:
    """Detect and extract individual cards from multi-card images"""

    def __init__(self):
        self.config = CardDetectionConfig()

    def detect_cards(self, image_path: str) -> List[np.ndarray]:
        """
        Detect individual cards in an image with multiple cards

        Args:
            image_path: Path to image file

        Returns:
            List of cropped card images
        """
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                logger.error(f"Failed to load image: {image_path}")
                return []

            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Threshold
            _, binary = cv2.threshold(blurred, 150, 255, cv2.THRESH_BINARY)

            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            cards = []
            for contour in contours:
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(contour)

                # Filter by area and aspect ratio
                area = w * h
                aspect_ratio = w / h if h > 0 else 0

                # Photocard aspect ratio typically 0.6~0.7
                if (self.config.MIN_CARD_AREA < area < self.config.MAX_CARD_AREA and
                    0.5 < aspect_ratio < 0.8):

                    # Add margin
                    margin = 10
                    x = max(0, x - margin)
                    y = max(0, y - margin)
                    w = min(image.shape[1] - x, w + 2 * margin)
                    h = min(image.shape[0] - y, h + 2 * margin)

                    card = image[y:y+h, x:x+w]
                    cards.append(card)

            logger.info(f"Detected {len(cards)} cards in {Path(image_path).name}")
            return cards

        except Exception as e:
            logger.error(f"Card detection failed: {e}")
            return []

    def normalize_aspect_ratio(self, card: np.ndarray) -> np.ndarray:
        """
        Normalize card to 1:1.54 aspect ratio (width:height)

        Args:
            card: Card image array

        Returns:
            Normalized card image
        """
        h, w = card.shape[:2]
        current_ratio = w / h

        if current_ratio > self.config.TARGET_ASPECT_RATIO:
            # Image is too wide, crop width
            new_w = int(h * self.config.TARGET_ASPECT_RATIO)
            x_offset = (w - new_w) // 2
            card = card[:, x_offset:x_offset+new_w]
        else:
            # Image is too tall, crop height
            new_h = int(w / self.config.TARGET_ASPECT_RATIO)
            y_offset = (h - new_h) // 2
            card = card[y_offset:y_offset+new_h, :]

        # Resize to target width
        h, w = card.shape[:2]
        target_h = int(self.config.TARGET_WIDTH / self.config.TARGET_ASPECT_RATIO)
        card = cv2.resize(card, (self.config.TARGET_WIDTH, target_h), interpolation=cv2.INTER_CUBIC)

        return card

    def compress_to_webp(self, card: np.ndarray, target_kb: float = 40) -> bytes:
        """
        Compress card image to WebP format with adaptive quality

        Args:
            card: Card image (OpenCV format)
            target_kb: Target size in KB

        Returns:
            WebP image bytes
        """
        # Convert BGR to RGB for PIL
        card_rgb = cv2.cvtColor(card, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(card_rgb)

        # Binary search for quality level
        quality_low, quality_high = self.config.MIN_QUALITY, self.config.MAX_QUALITY
        best_quality = self.config.MIN_QUALITY
        best_bytes = None

        for _ in range(5):  # 5 iterations should be enough
            quality = (quality_low + quality_high) // 2

            # Compress to WebP
            buffer = io.BytesIO()
            pil_image.save(buffer, format='WEBP', quality=quality)
            webp_bytes = buffer.getvalue()
            size_kb = len(webp_bytes) / 1024

            logger.debug(f"Quality {quality}: {size_kb:.1f} KB")

            if self.config.MIN_SIZE_KB <= size_kb <= self.config.MAX_SIZE_KB:
                # Perfect fit
                return webp_bytes

            if size_kb < self.config.MIN_SIZE_KB:
                # Too small, increase quality
                quality_low = quality + 1
                best_quality = quality + 1
            else:
                # Too large, decrease quality
                quality_high = quality - 1
                best_quality = quality

            best_bytes = webp_bytes

        if best_bytes is None:
            buffer = io.BytesIO()
            pil_image.save(buffer, format='WEBP', quality=best_quality)
            best_bytes = buffer.getvalue()

        size_kb = len(best_bytes) / 1024
        logger.debug(f"Final: Quality {best_quality}: {size_kb:.1f} KB")

        return best_bytes

    def generate_thumbnail(self, card: np.ndarray) -> bytes:
        """
        Generate thumbnail from card image

        Args:
            card: Card image (OpenCV format)

        Returns:
            WebP thumbnail bytes
        """
        h, w = card.shape[:2]

        # Calculate thumbnail height maintaining aspect ratio
        thumbnail_h = int(self.config.THUMBNAIL_WIDTH / self.config.TARGET_ASPECT_RATIO)

        # Resize to thumbnail
        thumbnail = cv2.resize(card, (self.config.THUMBNAIL_WIDTH, thumbnail_h),
                              interpolation=cv2.INTER_CUBIC)

        # Convert to WebP
        thumbnail_rgb = cv2.cvtColor(thumbnail, cv2.COLOR_BGR2RGB)
        pil_thumbnail = Image.fromarray(thumbnail_rgb)

        buffer = io.BytesIO()
        pil_thumbnail.save(buffer, format='WEBP', quality=self.config.THUMBNAIL_QUALITY)
        return buffer.getvalue()


class ImagePipeline:
    """Complete image processing pipeline"""

    def __init__(self, output_dir: str = "output"):
        self.detector = CardDetector()
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def process_image(self, image_path: str, generate_thumbnail: bool = True) -> Dict:
        """
        Process single image through full pipeline

        Args:
            image_path: Path to input image
            generate_thumbnail: Whether to generate thumbnail image

        Returns:
            Processing result dict
        """
        image_path = Path(image_path)
        logger.info(f"Processing: {image_path.name}")

        result = {
            'input_file': image_path.name,
            'success': False,
            'cards_detected': 0,
            'cards_saved': 0,
            'output_files': [],
            'errors': []
        }

        try:
            # Detect cards
            cards = self.detector.detect_cards(str(image_path))
            result['cards_detected'] = len(cards)

            if not cards:
                logger.warning(f"No cards detected in {image_path.name}")
                return result

            # Process each card
            for idx, card in enumerate(cards):
                try:
                    # Normalize aspect ratio
                    normalized = self.detector.normalize_aspect_ratio(card)
                    dimensions = (normalized.shape[1], normalized.shape[0])

                    # Compress to WebP
                    webp_bytes = self.detector.compress_to_webp(normalized)
                    size_kb = len(webp_bytes) / 1024

                    # Save main image
                    stem = image_path.stem
                    output_file = self.output_dir / f"{stem}_card_{idx+1}.webp"
                    with open(output_file, 'wb') as f:
                        f.write(webp_bytes)

                    file_info = {
                        'file': output_file.name,
                        'size_kb': round(size_kb, 2),
                        'dimensions': f"{dimensions[0]}x{dimensions[1]}",
                        'aspect_ratio': f"{dimensions[0]/dimensions[1]:.3f}"
                    }

                    # Generate and save thumbnail (optional)
                    if generate_thumbnail:
                        try:
                            thumbnail_bytes = self.detector.generate_thumbnail(normalized)
                            thumbnail_file = self.output_dir / f"{stem}_card_{idx+1}_thumb.webp"
                            with open(thumbnail_file, 'wb') as f:
                                f.write(thumbnail_bytes)
                            thumbnail_kb = len(thumbnail_bytes) / 1024
                            file_info['thumbnail'] = {
                                'file': thumbnail_file.name,
                                'size_kb': round(thumbnail_kb, 2)
                            }
                            logger.info(f"Generated thumbnail: {thumbnail_file.name} ({thumbnail_kb:.1f} KB)")
                        except Exception as e:
                            logger.warning(f"Failed to generate thumbnail for card {idx+1}: {e}")

                    result['cards_saved'] += 1
                    result['output_files'].append(file_info)
                    logger.info(f"Saved: {output_file.name} ({size_kb:.1f} KB)")

                except Exception as e:
                    result['errors'].append(f"Card {idx+1}: {str(e)}")
                    logger.error(f"Failed to process card {idx+1}: {e}")

            result['success'] = result['cards_saved'] > 0

        except Exception as e:
            result['errors'].append(str(e))
            logger.error(f"Pipeline error: {e}")

        return result

    def process_batch(self, image_dir: str = "sample_images", generate_thumbnail: bool = True) -> Dict:
        """
        Process all images in a directory

        Args:
            image_dir: Input directory path
            generate_thumbnail: Whether to generate thumbnails

        Returns:
            Batch processing summary
        """
        image_dir = Path(image_dir)
        if not image_dir.exists():
            logger.error(f"Input directory not found: {image_dir}")
            return {'error': 'Input directory not found'}

        supported_formats = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        image_files = [f for f in image_dir.glob('*') if f.suffix.lower() in supported_formats]

        logger.info(f"Found {len(image_files)} images in {image_dir}")

        results = []
        total_cards = 0
        total_saved = 0
        total_webp_size_kb = 0
        total_thumbnail_size_kb = 0

        for image_file in image_files:
            result = self.process_image(str(image_file), generate_thumbnail=generate_thumbnail)
            results.append(result)
            total_cards += result['cards_detected']
            total_saved += result['cards_saved']

            # Calculate total sizes
            for output_file in result['output_files']:
                total_webp_size_kb += output_file['size_kb']
                if 'thumbnail' in output_file:
                    total_thumbnail_size_kb += output_file['thumbnail']['size_kb']

        summary = {
            'total_images': len(image_files),
            'total_cards_detected': total_cards,
            'total_cards_saved': total_saved,
            'success_rate': f"{100 * total_saved / total_cards:.1f}%" if total_cards > 0 else "N/A",
            'storage_summary': {
                'total_webp_size_mb': round(total_webp_size_kb / 1024, 2),
                'total_thumbnail_size_mb': round(total_thumbnail_size_kb / 1024, 2)
            },
            'output_directory': str(self.output_dir),
            'results': results
        }

        return summary

    def save_report(self, batch_result: Dict, report_file: str = "processing_report.json"):
        """Save processing report"""
        report_path = self.output_dir / report_file
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(batch_result, f, indent=2, ensure_ascii=False)
            logger.info(f"Report saved to {report_path}")
        except Exception as e:
            logger.error(f"Failed to save report: {e}")


def main():
    """Demo usage"""
    pipeline = ImagePipeline(output_dir="output")
    batch_result = pipeline.process_batch(image_dir="sample_images", generate_thumbnail=True)
    pipeline.save_report(batch_result)

    print(f"\n{'='*60}")
    print(f"IMAGE PIPELINE RESULTS")
    print(f"{'='*60}")
    print(f"Total images processed: {batch_result['total_images']}")
    print(f"Total cards detected: {batch_result['total_cards_detected']}")
    print(f"Total cards saved: {batch_result['total_cards_saved']}")
    print(f"Success rate: {batch_result['success_rate']}")

    if 'storage_summary' in batch_result:
        print(f"\nStorage Summary:")
        print(f"  Main images: {batch_result['storage_summary']['total_webp_size_mb']} MB")
        print(f"  Thumbnails: {batch_result['storage_summary']['total_thumbnail_size_mb']} MB")

    print(f"\nOutput directory: {batch_result['output_directory']}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
