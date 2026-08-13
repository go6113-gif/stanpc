#!/usr/bin/env python3
"""
Reset progress.json to reprocess failures with Naver blog fallback.
- Keep: ebay_success (31 items) and processed_ids (31 items)
- Remove: failed (69 items) from processed_ids so they'll be retried with Naver fallback
- Clear: fallback_needed and failed lists
"""

import json
from pathlib import Path

PROGRESS_PATH = Path(__file__).parent / "pilot-progress.json"

with open(PROGRESS_PATH) as f:
    progress = json.load(f)

print(f"Current state:")
print(f"  eBay successes: {len(progress['ebay_success'])}")
print(f"  Fallback needed: {len(progress['fallback_needed'])}")
print(f"  Failed: {len(progress['failed'])}")
print(f"  Processed IDs: {len(progress['processed_ids'])}")
print()

# Keep track of IDs that succeeded
success_ids = {s["id"] for s in progress["ebay_success"]}

# Remove failed IDs from processed_ids so they'll be retried
# But keep success IDs
failed_ids = {f["id"] for f in progress["failed"]}
new_processed_ids = [pid for pid in progress["processed_ids"] if pid in success_ids]

progress["processed_ids"] = new_processed_ids
progress["fallback_needed"] = []
progress["failed"] = []

print(f"After reset:")
print(f"  eBay successes: {len(progress['ebay_success'])} (unchanged)")
print(f"  Fallback needed: 0 (cleared for Naver blog retry)")
print(f"  Failed: 0 (cleared, will retry with Naver)")
print(f"  Processed IDs: {len(progress['processed_ids'])} (kept successful ones only)")
print()

with open(PROGRESS_PATH, "w") as f:
    json.dump(progress, f, indent=2, ensure_ascii=False)

print("✓ Progress reset complete. 69 failed items ready for Naver blog retry.")
