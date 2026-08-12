#!/usr/bin/env python3
"""
Sample test runner with local test images.
Generates synthetic test images and evaluates them.
"""

import subprocess
import sys
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
SAMPLE_DIR = SCRIPT_DIR / "sample_images"

def create_sample_photocard(quality: str = "good") -> np.ndarray:
    """
    Create a synthetic photocard image for testing.

    Args:
        quality: 'good', 'blurry', 'low_res', 'tilted', or 'noisy'
    """
    # Create base image
    width, height = 400, 615
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)

    # Add gradient background
    for y in range(height):
        color_val = int(200 + 55 * (y / height))
        draw.rectangle([(0, y), (width, y + 1)], fill=(color_val, color_val - 20, color_val - 40))

    # Add sample text (simulating photocard content)
    draw.rectangle([(20, 20), (380, 200)], fill=(100, 150, 200), outline='black', width=2)
    draw.text((40, 50), "PHOTOCARD", fill='white')
    draw.text((40, 100), "Sample Image", fill='white')

    # Add noise pattern
    img_array = np.array(img)
    if quality == "noisy":
        noise = np.random.normal(0, 20, img_array.shape)
        img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)

    img = Image.fromarray(img_array)

    # Apply quality-specific modifications
    if quality == "blurry":
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
    elif quality == "low_res":
        img = img.resize((150, 231))  # Downscale
        img = img.resize((width, height))  # Upscale back
    elif quality == "tilted":
        img = img.rotate(15, fillcolor='white')

    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def save_sample_images():
    """Generate and save sample photocard images."""
    SAMPLE_DIR.mkdir(exist_ok=True)

    qualities = {
        "good": "High quality photocard - clear and well-lit",
        "blurry": "Blurry photocard - focus issues",
        "low_res": "Low resolution photocard - small pixels",
        "tilted": "Tilted photocard - needs rotation correction",
        "noisy": "Noisy photocard - grainy texture"
    }

    print("Generating sample photocard images...")
    for quality, description in qualities.items():
        img = create_sample_photocard(quality)
        path = SAMPLE_DIR / f"sample_{quality}.png"
        cv2.imwrite(str(path), img)
        print(f"  ✓ {quality:10} - {description} -> {path.name}")

    return SAMPLE_DIR


def run_test_with_local_images():
    """Run bot test with local sample images."""
    sample_dir = save_sample_images()

    # Get all sample images
    image_paths = sorted(sample_dir.glob("sample_*.png"))

    if not image_paths:
        print("No sample images found!")
        return

    print(f"\nRunning photocard bot test with {len(image_paths)} sample images...")
    print("=" * 60)

    # Convert local paths to strings for processing
    image_paths_str = [str(path.absolute()) for path in image_paths]

    # Run the main bot script
    cmd = ["python", str(SCRIPT_DIR / "photocard-ai-bot-test.py")] + image_paths_str

    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Error: photocard-ai-bot-test.py not found!")
        print("Make sure you're running this from the test-bot directory.")
        sys.exit(1)


def run_test_with_urls(urls):
    """Run bot test with provided URLs."""
    print(f"Running photocard bot test with {len(urls)} image URLs...")
    print("=" * 60)

    cmd = ["python", str(SCRIPT_DIR / "photocard-ai-bot-test.py")] + urls

    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Error: photocard-ai-bot-test.py not found!")
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sample test runner for photocard bot")
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Generate and test with synthetic sample images"
    )
    parser.add_argument(
        "--urls",
        nargs="+",
        help="Test with provided image URLs"
    )

    args = parser.parse_args()

    if args.urls:
        run_test_with_urls(args.urls)
    elif args.sample or (not args.urls and not sys.argv[1:]):
        # Default to sample test if no args
        run_test_with_local_images()
    else:
        parser.print_help()
        sys.exit(1)
