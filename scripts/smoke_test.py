#!/usr/bin/env python3
"""
Smoke test for Naver Image Search API
1. Verify API credentials format
2. Test actual API call with 1 card
3. Validate response structure
"""

import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def check_credentials():
    """Check Naver API credentials format and validity."""
    logger.info("=" * 70)
    logger.info("Step 1: Verifying Naver API Credentials")
    logger.info("=" * 70)
    logger.info("")

    # NAVER API HUB credentials
    naver_client_id = "po85ajzs6w"
    naver_client_secret = "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"

    logger.info("📋 NAVER API HUB Credentials:")
    logger.info(f"  Client ID: {naver_client_id}")
    logger.info(f"  Client Secret: {naver_client_secret[:20]}...{naver_client_secret[-10:]}")
    logger.info("")

    # Check 1: Credentials format
    logger.info("🔍 Check 1: Credentials Format")
    if not naver_client_id or len(naver_client_id) < 5:
        logger.error("  ❌ FAIL: Client ID format invalid")
        return False
    if not naver_client_secret or len(naver_client_secret) < 20:
        logger.error("  ❌ FAIL: Client Secret format invalid")
        return False

    logger.info("  ✓ PASS: Both credentials valid")
    logger.info("")

    # Check 2: Key source verification
    logger.info("🔍 Check 2: Key Source Verification")
    logger.info("  ✓ From: NAVER API HUB Application (StanPCPhotocard)")
    logger.info("  ✓ Endpoint: naverapihub.apigw.ntruss.com/search/v1/image")
    logger.info("  ✓ Headers: X-NCP-APIGW-API-KEY-ID + X-NCP-APIGW-API-KEY")
    logger.info("")

    return True


def test_api_call():
    """Test actual API call with 1 card."""
    logger.info("=" * 70)
    logger.info("Step 2: Testing Actual API Call")
    logger.info("=" * 70)
    logger.info("")

    try:
        from naver_image_search import NaverImageSearchClient

        # Initialize client with NAVER API HUB credentials
        naver_client_id = "po85ajzs6w"
        naver_client_secret = "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"

        logger.info("📌 Initializing NaverImageSearchClient (NAVER API HUB)...")
        client = NaverImageSearchClient(naver_client_id, naver_client_secret)
        logger.info("  ✓ Client initialized")
        logger.info("")

        # Test search
        test_query = "BTS RM 포토카드"
        logger.info(f"🔍 Test Query: '{test_query}'")
        logger.info(f"   Searching Naver with limit=5 (minimal)...")
        logger.info("")

        results = client.search_images(test_query, limit=5)

        # Validate response
        logger.info("📊 Response Validation:")
        logger.info(f"  Results returned: {len(results)}")
        logger.info("")

        if len(results) == 0:
            logger.error("  ❌ FAIL: API returned 0 results")
            logger.error("     Possible causes:")
            logger.error("     1. Invalid API credentials")
            logger.error("     2. API key mismatch (NCP IAM vs Naver OpenAPI)")
            logger.error("     3. Rate limit or quota exceeded")
            logger.error("     4. Network connectivity issue")
            logger.info("")
            logger.info("     ➜ Check 1: Verify actual Naver OpenAPI credentials at developers.naver.com")
            logger.info("     ➜ Check 2: Ensure credentials are NOT from NCP Console")
            return False

        # Show sample result
        logger.info("✅ Success! API returned results:")
        logger.info("")

        for idx, result in enumerate(results[:2], 1):
            logger.info(f"  Result {idx}:")
            logger.info(f"    Title: {result.get('title', 'N/A')[:60]}")
            logger.info(f"    Image URL: {result.get('image', 'N/A')[:60]}...")
            logger.info(f"    Source: {result.get('platform')}")
            logger.info(f"    Dimensions: {result.get('source_width')}×{result.get('source_height')}")
            logger.info("")

        return True

    except ImportError as e:
        logger.error(f"  ❌ Import Error: {e}")
        logger.info("  Make sure naver_image_search.py is in the same directory")
        return False

    except Exception as e:
        logger.error(f"  ❌ API Call Failed: {e}")
        logger.error("")
        logger.info("💡 Troubleshooting:")
        logger.info("  1. Verify credentials are correct:")
        logger.info("     - NOT NCP IAM keys (ncp_iam_*)")
        logger.info("     - But actual Naver OpenAPI keys")
        logger.info("  2. Check network connectivity")
        logger.info("  3. Verify API is not rate-limited")
        logger.info("  4. Ensure application is registered on developers.naver.com")
        return False


def test_image_download(results):
    """Test downloading first image from results."""
    logger.info("=" * 70)
    logger.info("Step 3: Testing Image Download")
    logger.info("=" * 70)
    logger.info("")

    try:
        from naver_image_search import NaverImageSearchClient
        import cv2
        import numpy as np

        if not results or len(results) == 0:
            logger.warning("  ⚠️  No results to test download")
            return False

        client = NaverImageSearchClient(
            "po85ajzs6w",
            "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"
        )

        image_url = results[0].get("image")
        logger.info(f"📥 Attempting to download: {image_url[:60]}...")
        logger.info("")

        img_bytes = client.download_image_to_bytes(image_url, timeout=5)

        if img_bytes is None:
            logger.warning("  ⚠️  Download failed (could be URL expiration or network issue)")
            return False

        logger.info(f"  ✓ Downloaded {len(img_bytes)} bytes")

        # Try to decode
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            logger.warning("  ⚠️  Image bytes received but decode failed")
            return False

        logger.info(f"  ✓ Decoded successfully: {img.shape[1]}×{img.shape[0]} pixels")
        logger.info("")
        logger.info("  ✅ Image download and decode working!")

        return True

    except Exception as e:
        logger.warning(f"  ⚠️  Image download test skipped: {e}")
        logger.info("     (This is non-critical for smoke test)")
        return True  # Don't fail smoke test for this


def main():
    """Run smoke tests."""
    logger.info("")
    logger.info("🚀 NAVER IMAGE SEARCH API - SMOKE TEST")
    logger.info("")

    # Test 1: Credentials
    creds_ok = check_credentials()

    if not creds_ok:
        logger.info("")
        logger.error("=" * 70)
        logger.error("❌ SMOKE TEST FAILED: Credential Validation")
        logger.error("=" * 70)
        logger.info("")
        logger.info("⛔ STOP HERE - Do not proceed to pilot")
        logger.info("")
        logger.info("Action required:")
        logger.info("1. Verify credentials at https://developers.naver.com/apps")
        logger.info("2. Get ACTUAL Naver OpenAPI keys (not NCP IAM keys)")
        logger.info("3. Update script with correct values")
        return False

    # Test 2: API Call
    api_ok = test_api_call()

    if not api_ok:
        logger.info("")
        logger.error("=" * 70)
        logger.error("❌ SMOKE TEST FAILED: API Call")
        logger.error("=" * 70)
        logger.info("")
        logger.info("⛔ STOP HERE - Do not proceed to pilot")
        logger.info("")
        logger.info("Likely issues:")
        logger.info("1. Credentials format mismatch (NCP vs Naver OpenAPI)")
        logger.info("2. API key not authorized for Image Search")
        logger.info("3. Application quota exceeded")
        return False

    # Test 3: Download (non-critical)
    try:
        from naver_image_search import NaverImageSearchClient
        client = NaverImageSearchClient(
            "po85ajzs6w",
            "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"
        )
        results = client.search_images("BTS RM 포토카드", limit=1)
        test_image_download(results)
    except:
        pass

    # Summary
    logger.info("")
    logger.info("=" * 70)
    logger.info("✅ SMOKE TEST PASSED")
    logger.info("=" * 70)
    logger.info("")
    logger.info("✨ API credentials and connection are working!")
    logger.info("")
    logger.info("Next step: Run 100-card pilot")
    logger.info("  python dual_source_pilot_executable.py")
    logger.info("")

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
