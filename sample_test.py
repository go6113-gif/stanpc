#!/usr/bin/env python3
"""
Photocard Bot - Real Image Test Runner
Tests with actual photocard images from public sources.
"""

import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent

# Default live-data query — was previously a hardcoded list of generic
# Unsplash stock photos (headshots/product shots, not photocards at all),
# which is why the crop pipeline had nothing card-shaped to actually find.
DEFAULT_EBAY_QUERY = "BTS RM photocard"


def fetch_ebay_sample_urls(query: str = DEFAULT_EBAY_QUERY, limit: int = 4):
    """Fetch real, live top image URLs from eBay Browse API for a query."""
    sys.path.insert(0, str(SCRIPT_DIR))
    from ebay_client import search_photocards

    results = search_photocards(query, limit=limit)
    if not results:
        print(f"No eBay results for '{query}' — check EBAY_CLIENT_ID/SECRET in poca-exchange/.env")
        sys.exit(1)

    print(f"eBay results for '{query}':")
    for i, item in enumerate(results, 1):
        print(f"  {i}. {item['title']} (${item['price']} {item['currency']})")

    return [item["image_url"] for item in results]


def run_test_with_real_images(query: str = DEFAULT_EBAY_QUERY):
    """Run bot test with live eBay Browse API images."""
    print("=" * 70)
    print("🎴 Photocard AI Bot - Real Image Test")
    print("=" * 70)

    urls = fetch_ebay_sample_urls(query)
    print(f"\nTesting with {len(urls)} live eBay photocard images...")

    print("\n" + "=" * 70)
    print("Processing...")
    print("=" * 70 + "\n")

    # Run the main bot script
    cmd = ["python", str(SCRIPT_DIR / "photocard-ai-bot-test.py")] + urls

    try:
        result = subprocess.run(cmd, capture_output=False, text=True)

        if result.returncode == 0:
            print("\n" + "=" * 70)
            print("✅ Test completed successfully!")
            print("=" * 70)
            print("\n📁 Output files generated:")
            print(f"  • output/best_card.png - Best quality processed image")
            print(f"  • output/comparison_result.png - Side-by-side comparison")
            print(f"  • output/evaluation_report.json - Detailed scores")
            print("\n" + "=" * 70)

        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Error: photocard-ai-bot-test.py not found!")
        print("Make sure you're running this from the D:\\Poca_exchange directory.")
        sys.exit(1)


def run_test_with_urls(urls):
    """Run bot test with provided URLs."""
    print("=" * 70)
    print("🎴 Photocard AI Bot - Custom URL Test")
    print("=" * 70)
    print(f"\nTesting with {len(urls)} image(s)...")

    print("\n" + "=" * 70)
    print("Processing...")
    print("=" * 70 + "\n")

    cmd = ["python", str(SCRIPT_DIR / "photocard-ai-bot-test.py")] + urls

    try:
        result = subprocess.run(cmd, capture_output=False, text=True)

        if result.returncode == 0:
            print("\n" + "=" * 70)
            print("✅ Test completed successfully!")
            print("=" * 70)
            print("\n📁 Output files generated:")
            print(f"  • output/best_card.png - Best quality processed image")
            print(f"  • output/comparison_result.png - Side-by-side comparison")
            print(f"  • output/evaluation_report.json - Detailed scores")
            print("\n" + "=" * 70)

        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Error: photocard-ai-bot-test.py not found!")
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Photocard Bot Test Runner - Tests with real images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test with live eBay search results (recommended)
  python sample_test.py --real

  # Test with a different eBay search query
  python sample_test.py --real --query "SEVENTEEN Hoshi photocard"

  # Test with custom URLs
  python sample_test.py --urls "https://example.com/card1.jpg" "https://example.com/card2.jpg"

  # Test with local files
  python sample_test.py --urls "C:/path/to/card1.jpg" "C:/path/to/card2.jpg"
        """
    )

    parser.add_argument(
        "--real",
        action="store_true",
        help="Test with live eBay Browse API images (default)"
    )
    parser.add_argument(
        "--query",
        default=DEFAULT_EBAY_QUERY,
        help=f"eBay search query for --real (default: '{DEFAULT_EBAY_QUERY}')"
    )
    parser.add_argument(
        "--urls",
        nargs="+",
        help="Test with provided image URLs or local file paths"
    )

    args = parser.parse_args()

    if args.urls:
        run_test_with_urls(args.urls)
    elif args.real or (not args.urls and not sys.argv[1:]):
        # Default to real image test if no args
        run_test_with_real_images(args.query)
    else:
        parser.print_help()
        sys.exit(1)
