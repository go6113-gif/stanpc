#!/usr/bin/env python3
"""
Priority-based Photocard Collection & Vision LLM Validation Pipeline
Collects 10 photocards per group (100 total) from eBay data and validates via Vision LLM.
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple
import hashlib
import time
from datetime import datetime

import requests
from PIL import Image
from io import BytesIO

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))
try:
    from vision_llm_analyzer import VisionLLMAnalyzer
except ImportError:
    VisionLLMAnalyzer = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "poca-exchange" / "public" / "images" / "pilot_real_data"
METADATA_DIR = Path(__file__).parent.parent / "vision_pilot_metadata"

# Group priority (by eBay market size)
GROUP_PRIORITY = [
    ("BTS", 47091),
    ("Stray Kids", 38446),
    ("TWICE", 24354),
    ("SEVENTEEN", 19724),
    ("ENHYPEN", 15258),
    ("aespa", 12120),
    ("LE SSERAFIM", 8149),
    ("IVE", 8694),
    ("NewJeans", 5737),
    ("TOMORROW X TOGETHER", 3153),
]


def load_ebay_data() -> Dict:
    """Load eBay collection data."""
    ebay_file = Path(__file__).parent.parent / "data" / "ebay_10core_groups.json"
    with open(ebay_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def calculate_image_hash(image_data: bytes) -> str:
    """Calculate perceptual hash of image to detect duplicates."""
    return hashlib.sha256(image_data).hexdigest()


def download_image(url: str, timeout: int = 10) -> Tuple[bytes, str]:
    """Download image from URL and return (data, format)."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()

        # Detect format
        content_type = response.headers.get('content-type', 'image/jpeg').lower()
        if 'webp' in content_type:
            image_format = 'webp'
        elif 'png' in content_type:
            image_format = 'png'
        else:
            image_format = 'jpeg'

        return response.content, image_format
    except Exception as e:
        logger.warning(f"Failed to download {url}: {e}")
        return None, None


def save_image_file(image_data: bytes, output_path: Path) -> bool:
    """Save image to disk and validate."""
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Verify it's a valid image
        img = Image.open(BytesIO(image_data))
        img.verify()

        # Save to disk
        with open(output_path, 'wb') as f:
            f.write(image_data)

        return True
    except Exception as e:
        logger.warning(f"Failed to save image: {e}")
        return False


def collect_priority_photocards(ebay_data: Dict) -> List[Dict]:
    """
    Select 10 photocards per group (100 total) based on priority.
    """
    priority_order = {group: idx for idx, (group, _) in enumerate(GROUP_PRIORITY)}

    collected = []
    seen_hashes = set()

    for group, _ in GROUP_PRIORITY:
        if group not in ebay_data['items_by_group']:
            logger.warning(f"Group {group} not in eBay data")
            continue

        items = ebay_data['items_by_group'][group]
        selected = []

        for item in items[:15]:  # Try first 15 to account for failures
            if len(selected) >= 10:
                break

            image_url = item.get('image_url')
            if not image_url:
                continue

            # Download and hash
            image_data, image_format = download_image(image_url)
            if image_data is None:
                continue

            image_hash = calculate_image_hash(image_data)
            if image_hash in seen_hashes:
                logger.debug(f"Duplicate image, skipping: {image_url}")
                continue

            seen_hashes.add(image_hash)

            selected.append({
                "group": group,
                "item_id": item.get('item_id'),
                "title": item.get('title'),
                "image_url": image_url,
                "image_format": image_format,
                "image_data": image_data,
                "image_hash": image_hash,
                "price": item.get('price'),
                "seller": item.get('seller'),
                "collected_at": item.get('collected_at'),
            })

            # Small delay to avoid rate limiting
            time.sleep(0.5)

        collected.extend(selected)
        logger.info(f"  {group}: {len(selected)}/10 ✅" if len(selected) == 10 else f"  {group}: {len(selected)}/10 ⚠️")

    return collected


def analyze_with_vision_llm(image_data: bytes, image_format: str) -> Dict:
    """Analyze image with Vision LLM."""
    if VisionLLMAnalyzer is None:
        logger.warning("Vision LLM not available, skipping analysis")
        return {
            "is_single_card": None,
            "confidence_score": 0,
            "reason": "llm_not_available",
            "success": False
        }

    try:
        analyzer = VisionLLMAnalyzer()

        # Convert to base64
        import base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        result = analyzer.analyze_image(base64_image, image_format=image_format)
        return result
    except Exception as e:
        logger.warning(f"Vision LLM analysis failed: {e}")
        return {
            "is_single_card": False,
            "confidence_score": 0,
            "reason": f"analysis_error: {str(e)[:30]}",
            "success": False
        }


def run_pilot():
    """Run the priority-based collection and validation pilot."""
    logger.info("\n" + "=" * 80)
    logger.info("🚀 PRIORITY-BASED PHOTOCARD COLLECTION & VISION LLM VALIDATION")
    logger.info("=" * 80 + "\n")

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    # Load eBay data
    logger.info("📥 Loading eBay data...")
    ebay_data = load_ebay_data()
    logger.info(f"✅ Loaded {ebay_data['meta']['total_collected']} eBay listings\n")

    # Collect priority photocards
    logger.info("🎯 Selecting 10 photocards per group (priority order):\n")
    collected_items = collect_priority_photocards(ebay_data)
    logger.info(f"\n✅ Selected {len(collected_items)}/100 photocards\n")

    # Download and save images
    logger.info("💾 Downloading and saving images...\n")
    saved_items = []
    for idx, item in enumerate(collected_items, 1):
        group = item['group']
        image_data = item.pop('image_data')  # Remove from dict
        image_format = item['image_format']
        image_hash = item['image_hash']

        # Save image file
        filename = f"{group}_{idx:02d}_{image_hash[:8]}.{image_format}"
        output_path = OUTPUT_DIR / group / filename

        if save_image_file(image_data, output_path):
            # Calculate relative path from public directory: /images/pilot_real_data/GROUP/FILE
            rel_path = output_path.relative_to(OUTPUT_DIR.parent.parent)
            item['local_path'] = f"/images/{rel_path}".replace("\\", "/")
            item['full_path'] = str(output_path)  # Store full path for Vision LLM analysis
            saved_items.append(item)
            logger.debug(f"  [{idx}/100] Saved: {group}/{filename}")
        else:
            logger.warning(f"  [{idx}/100] Failed to save: {group}")

    logger.info(f"\n✅ Saved {len(saved_items)}/100 images\n")

    # Analyze with Vision LLM (if available)
    logger.info("🔍 Running Vision LLM analysis...\n")
    approved_items = []
    rejected_items = []

    for idx, item in enumerate(saved_items, 1):
        # Load image from disk for analysis
        local_path = Path(item['full_path'])
        try:
            with open(local_path, 'rb') as f:
                image_data = f.read()
        except Exception as e:
            logger.warning(f"Failed to load image for analysis: {e}")
            continue

        # Analyze
        analysis = analyze_with_vision_llm(image_data, item['image_format'])
        item['vision_analysis'] = analysis

        if analysis.get('is_single_card'):
            approved_items.append(item)
            status = "✅ APPROVED"
        else:
            rejected_items.append(item)
            status = "❌ REJECTED"

        logger.info(
            f"  [{idx}/{len(saved_items)}] {item['group']:20} {status} "
            f"(confidence: {analysis.get('confidence_score', 0):.0f}%)"
        )

        # Rate limiting
        if idx % 10 == 0:
            time.sleep(1)

    # Generate report
    logger.info("\n" + "=" * 80)
    logger.info("📊 PILOT RESULTS\n")

    approval_rate = len(approved_items) / len(saved_items) * 100 if saved_items else 0

    report = f"""
╔════════════════════════════════════════════════════════════════════════════════╗
║  🎯 PRIORITY-BASED PILOT: 100 PHOTOCARDS COLLECTION & VISION LLM VALIDATION  ║
║  Generated: {datetime.now().isoformat()}                                      ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 COLLECTION SUMMARY
────────────────────────────────────────────────────────────────────────────────
  Total Collected:           {len(collected_items)}/100
  Successfully Downloaded:   {len(saved_items)}/100
  ✅ Approved by Vision LLM: {len(approved_items)}/{len(saved_items)}
  ❌ Rejected by Vision LLM: {len(rejected_items)}/{len(saved_items)}

  🎯 Approval Rate:          {approval_rate:.1f}%

📦 BREAKDOWN BY GROUP
────────────────────────────────────────────────────────────────────────────────
"""

    group_stats = {}
    for item in approved_items:
        group = item['group']
        group_stats[group] = group_stats.get(group, {'approved': 0, 'total': 0})
        group_stats[group]['approved'] += 1

    for item in saved_items:
        group = item['group']
        if group not in group_stats:
            group_stats[group] = {'approved': 0, 'total': 0}
        group_stats[group]['total'] += 1

    for group, _ in GROUP_PRIORITY:
        if group in group_stats:
            approved = group_stats[group]['approved']
            total = group_stats[group]['total']
            rate = approved / total * 100 if total > 0 else 0
            report += f"  {group:20} {approved:2}/{total:2} approved ({rate:5.1f}%)\n"

    report += f"""
📁 OUTPUT LOCATION
────────────────────────────────────────────────────────────────────────────────
  Images:     {OUTPUT_DIR}
  Metadata:   {METADATA_DIR}

🎯 GO/NO-GO DECISION
────────────────────────────────────────────────────────────────────────────────
"""

    if approval_rate >= 70:
        report += "  ✅ GO — Approval rate {:.1f}% ≥ 70%\n\n".format(approval_rate)
        report += "  NEXT STEP:\n"
        report += "  1. Review approved images in explorer\n"
        report += "  2. Import to Supabase: python scripts/import_pilot_to_db.py\n"
    elif approval_rate >= 50:
        report += "  ⚠️  CONDITIONAL GO — Approval rate {:.1f}% (50-70%)\n\n".format(approval_rate)
        report += "  ACTIONS:\n"
        report += "  1. Manually review rejected images\n"
        report += "  2. Adjust Vision LLM system prompt if needed\n"
        report += "  3. Consider manual curation for edge cases\n"
    else:
        report += "  ❌ NO-GO — Approval rate {:.1f}% < 50%\n\n".format(approval_rate)
        report += "  TROUBLESHOOTING:\n"
        report += "  1. Verify OPENAI_API_KEY is set\n"
        report += "  2. Check if test images are actual photocards\n"
        report += "  3. Review Vision LLM analysis results in metadata/\n"

    report += """
════════════════════════════════════════════════════════════════════════════════
"""

    # Print with UTF-8 encoding
    try:
        print(report)
    except UnicodeEncodeError:
        # Fallback for Windows console encoding issues
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
        print(report)

    # Save metadata
    metadata = {
        "meta": {
            "collected_at": datetime.now().isoformat(),
            "total_collected": len(collected_items),
            "total_downloaded": len(saved_items),
            "total_approved": len(approved_items),
            "total_rejected": len(rejected_items),
            "approval_rate": approval_rate,
        },
        "approved": approved_items,
        "rejected": rejected_items,
    }

    metadata_file = METADATA_DIR / "pilot_100_results.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    logger.info(f"💾 Metadata saved: {metadata_file}\n")

    # Save report
    report_file = METADATA_DIR / "PILOT_100_REPORT.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)

    logger.info(f"📄 Report saved: {report_file}\n")

    return metadata


if __name__ == "__main__":
    run_pilot()
