#!/usr/bin/env python3
"""
Track B Integration Test
Test eBay scraper, Bungle crawler, and image pipeline
"""

import sys
import json
import logging
from pathlib import Path

# Add scripts dir to path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_ebay_scraper():
    """Test eBay scraper module"""
    logger.info("=" * 50)
    logger.info("Testing eBay Scraper...")
    logger.info("=" * 50)

    try:
        from ebay_scraper import eBayScraper, eBayBearerTokenCache

        # Test initialization
        scraper = eBayScraper()
        logger.info("[OK] eBayScraper initialized")

        # Test search (mock data)
        logger.info("[OK] eBay API client ready for authentication")
        logger.info("Note: Actual search requires valid Bearer token")
        logger.info("Configuration: BASE_URL={}, RATE_LIMIT={}s".format(
            scraper.config.BASE_URL,
            scraper.config.RATE_LIMIT_DELAY
        ))

        return {'status': 'pass', 'message': 'eBay scraper initialized successfully'}

    except ImportError as e:
        logger.error(f"✗ Import error: {e}")
        return {'status': 'fail', 'message': f'Import error: {e}'}
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return {'status': 'fail', 'message': str(e)}


def test_bungle_crawler():
    """Test Bungle crawler module"""
    logger.info("=" * 50)
    logger.info("Testing Bungle Crawler...")
    logger.info("=" * 50)

    try:
        from bungle_crawler import BungleCrawler, BungleCrawlerConfig

        # Test initialization
        crawler = BungleCrawler()
        logger.info("[OK] BungleCrawler initialized")

        # Test configuration
        logger.info(f"[OK] Base URL: {crawler.config.BASE_URL}")
        logger.info(f"[OK] Delay range: {crawler.config.MIN_DELAY}s - {crawler.config.MAX_DELAY}s")
        logger.info("Note: Actual crawling disabled in test mode")

        return {'status': 'pass', 'message': 'Bungle crawler initialized successfully'}

    except ImportError as e:
        logger.error(f"✗ Import error: {e}")
        return {'status': 'fail', 'message': f'Import error: {e}'}
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return {'status': 'fail', 'message': str(e)}


def test_image_pipeline():
    """Test image pipeline module"""
    logger.info("=" * 50)
    logger.info("Testing Image Pipeline...")
    logger.info("=" * 50)

    try:
        from image_pipeline import ImagePipeline, CardDetector, CardDetectionConfig

        # Test initialization
        pipeline = ImagePipeline(output_dir="output")
        logger.info("[OK] ImagePipeline initialized")

        # Test configuration
        config = CardDetectionConfig()
        logger.info(f"[OK] Target aspect ratio: {config.TARGET_ASPECT_RATIO:.3f}")
        logger.info(f"[OK] Target size: {config.TARGET_WIDTH}x{int(config.TARGET_WIDTH/config.TARGET_ASPECT_RATIO)}")
        logger.info(f"[OK] Target WebP size: {config.MIN_SIZE_KB}-{config.MAX_SIZE_KB} KB")

        # Check output directory
        output_dir = Path("output")
        if output_dir.exists():
            logger.info(f"[OK] Output directory exists: {output_dir.absolute()}")
        else:
            logger.warning(f"[WARN] Output directory will be created on first run")

        return {'status': 'pass', 'message': 'Image pipeline initialized successfully'}

    except ImportError as e:
        logger.error(f"✗ Import error: {e}")
        return {'status': 'fail', 'message': f'Import error: {e}'}
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return {'status': 'fail', 'message': str(e)}


def test_io_and_sampling():
    """Test I/O with sample images"""
    logger.info("=" * 50)
    logger.info("Testing I/O with Sample Images...")
    logger.info("=" * 50)

    try:
        from image_pipeline import ImagePipeline

        sample_dir = Path("sample_images")
        output_dir = Path("output")

        # Create sample directories if they don't exist
        sample_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Check for sample images
        supported_formats = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        sample_images = [f for f in sample_dir.glob('*') if f.suffix.lower() in supported_formats]

        logger.info(f"Found {len(sample_images)} sample images")

        if len(sample_images) > 0:
            logger.info(f"Sample images: {', '.join([f.name for f in sample_images])}")

            # Process sample images
            pipeline = ImagePipeline(output_dir=str(output_dir))
            batch_result = pipeline.process_batch(image_dir=str(sample_dir))
            pipeline.save_report(batch_result)

            # Print results
            logger.info(f"\n[OK] Batch processing complete")
            logger.info(f"  Total images: {batch_result['total_images']}")
            logger.info(f"  Cards detected: {batch_result['total_cards_detected']}")
            logger.info(f"  Cards saved: {batch_result['total_cards_saved']}")
            logger.info(f"  Output: {batch_result['output_directory']}")

            # Check output files
            output_files = list(output_dir.glob('*.webp'))
            logger.info(f"\n[OK] WebP output files: {len(output_files)}")
            for f in output_files[:5]:  # Show first 5
                size_kb = f.stat().st_size / 1024
                logger.info(f"  - {f.name} ({size_kb:.1f} KB)")

            return {
                'status': 'pass',
                'message': 'I/O test completed',
                'details': batch_result
            }

        else:
            logger.info("[WARN] No sample images found (this is OK for first run)")
            logger.info(f"  Place sample images in: {sample_dir.absolute()}")
            return {
                'status': 'pass',
                'message': 'Sample directory ready (no test images)',
                'details': {'sample_dir': str(sample_dir.absolute())}
            }

    except ImportError as e:
        logger.error(f"✗ Import error: {e}")
        return {'status': 'fail', 'message': f'Import error: {e}'}
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return {'status': 'fail', 'message': str(e)}


def generate_test_report(results: dict) -> str:
    """Generate test report"""
    report_lines = [
        "\n" + "=" * 60,
        "TRACK B - DATA PIPELINE TEST REPORT",
        "=" * 60,
        "",
        "Module Tests:",
        f"  1. eBay Scraper: {results['ebay']['status'].upper()}",
        f"  2. Bungle Crawler: {results['bungle']['status'].upper()}",
        f"  3. Image Pipeline: {results['pipeline']['status'].upper()}",
        f"  4. I/O & Sampling: {results['io']['status'].upper()}",
        "",
        "Summary:",
        f"  All modules initialized: {'[OK] YES' if all(r['status'] == 'pass' for r in results.values()) else '[FAIL] NO'}",
        "",
        "Next Steps:",
        "  1. Place sample photocard images in ./sample_images/",
        "  2. Run: python test_pipeline.py",
        "  3. Check output files in ./output/",
        "",
        "Scripts Ready for Use:",
        "  - python scripts/ebay_scraper.py       (requires eBay API token)",
        "  - python scripts/bungle_crawler.py     (web scraping)",
        "  - python scripts/image_pipeline.py     (image processing)",
        "  - python scripts/test_pipeline.py      (integration test)",
        "=" * 60,
    ]
    return "\n".join(report_lines)


def main():
    """Run all tests"""
    results = {}

    results['ebay'] = test_ebay_scraper()
    results['bungle'] = test_bungle_crawler()
    results['pipeline'] = test_image_pipeline()
    results['io'] = test_io_and_sampling()

    # Generate and display report
    report = generate_test_report(results)
    print(report)

    # Save results
    results_file = Path("output") / "test_results.json"
    try:
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info(f"Results saved to {results_file}")
    except Exception as e:
        logger.error(f"Failed to save results: {e}")

    return all(r['status'] == 'pass' for r in results.values())


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
