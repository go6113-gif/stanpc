#!/usr/bin/env python3
"""
Bulk-fetch album/version artwork off the external CDN and convert it into
self-hosted WebP assets.

Context: `data/biasroom_photocards_master.csv` is named "photocards" but
actually holds ALBUM/VERSION rows (6,646 unique Version_IDs). Until now the
app hotlinked `biasroomcdn.com` directly, which breaks the moment that host
turns on referer checks. This script pulls each image once, downsizes it and
writes it under `public/images/album-versions/<Version_ID>.webp`.

Deliberate deviations worth knowing:
  - Output goes to `album-versions/`, NOT `images/cards/`. The latter holds
    member photocards (`aespa-karina-spicy.webp`); mixing album artwork into
    it reproduces the exact naming confusion this dataset already caused.
  - Existing files are skipped, so the run is resumable after an interrupt.
  - Failures never abort the batch; they land in the manifest with a reason
    so a follow-up pass can retry just those.
"""

from __future__ import annotations

import asyncio
import csv
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from PIL import Image, ImageFile

# Some CDN objects are truncated mid-stream; decode what arrived rather than
# throwing away an otherwise usable image.
ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(r"D:\StanPC")
CSV_PATH = ROOT / "data" / "biasroom_photocards_master.csv"
OUT_DIR = ROOT / "poca-exchange" / "public" / "images" / "album-versions"
MANIFEST_PATH = ROOT / "data" / "album_version_image_manifest.json"
PUBLIC_PREFIX = "/images/album-versions"

CONCURRENCY = 10
MAX_RETRIES = 3
MAX_WIDTH = 800
WEBP_QUALITY = 80
TIMEOUT = httpx.Timeout(30.0, connect=15.0)

# A real browser UA: the default httpx agent is a common blanket-block trigger.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
}


def load_rows() -> list[dict[str, str]]:
    """Read the version rows, keeping only those with a usable image URL."""
    with io.open(CSV_PATH, encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))

    seen: set[str] = set()
    out: list[dict[str, str]] = []
    for r in rows:
        vid = (r.get("Version_ID") or "").strip()
        url = (r.get("Image_URL") or "").strip()
        if not vid or not url.startswith("http") or vid in seen:
            continue
        seen.add(vid)
        out.append(
            {
                "version_id": vid,
                "group": (r.get("Group_Name") or "").strip(),
                "album": (r.get("Album_Title") or "").strip(),
                "version_name": (r.get("Version_Name") or "").strip(),
                "release_date": (r.get("Release_Date") or "").strip(),
                "url": url,
            }
        )
    return out


def to_webp(raw: bytes, dest: Path) -> tuple[int, int, int]:
    """Downscale to MAX_WIDTH and encode WebP. Returns (w, h, bytes)."""
    with Image.open(io.BytesIO(raw)) as im:
        im.load()

        # Flatten palette/CMYK into something WebP accepts, preserving alpha
        # only where the source actually had it.
        has_alpha = im.mode in ("RGBA", "LA") or (
            im.mode == "P" and "transparency" in im.info
        )
        im = im.convert("RGBA" if has_alpha else "RGB")

        if im.width > MAX_WIDTH:
            new_h = max(1, round(im.height * MAX_WIDTH / im.width))
            im = im.resize((MAX_WIDTH, new_h), Image.LANCZOS)

        buf = io.BytesIO()
        im.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
        data = buf.getvalue()

        tmp = dest.with_suffix(".webp.part")
        tmp.write_bytes(data)
        os.replace(tmp, dest)  # atomic: a killed run never leaves a half file
        return im.width, im.height, len(data)


class Progress:
    """Single-line console counter: `1234/6646 [ 19%] ok=1200 skip=30 fail=4`."""

    def __init__(self, total: int) -> None:
        self.total = total
        self.done = 0
        self.ok = 0
        self.skipped = 0
        self.failed = 0
        self.bytes_out = 0
        self.started = time.monotonic()
        self._last = 0.0

    def tick(self, force: bool = False) -> None:
        self.done += 1
        now = time.monotonic()
        if not force and now - self._last < 0.2 and self.done < self.total:
            return
        self._last = now
        pct = self.done * 100 // self.total if self.total else 100
        elapsed = now - self.started
        rate = self.done / elapsed if elapsed > 0 else 0
        eta = (self.total - self.done) / rate if rate > 0 else 0
        sys.stdout.write(
            f"\r  {self.done}/{self.total} [{pct:3d}%] "
            f"ok={self.ok} skip={self.skipped} fail={self.failed} "
            f"{self.bytes_out / 1048576:.0f}MB  ETA {eta / 60:.1f}m   "
        )
        sys.stdout.flush()


async def fetch_one(
    client: httpx.AsyncClient,
    sem: asyncio.Semaphore,
    item: dict[str, str],
    prog: Progress,
) -> dict:
    dest = OUT_DIR / f"{item['version_id']}.webp"
    rec = {
        **item,
        "local_path": f"{PUBLIC_PREFIX}/{item['version_id']}.webp",
        "status": "pending",
    }

    # Resume: an existing non-empty file is treated as already done.
    if dest.exists() and dest.stat().st_size > 0:
        rec["status"] = "skipped"
        rec["bytes"] = dest.stat().st_size
        prog.skipped += 1
        prog.bytes_out += rec["bytes"]
        prog.tick()
        return rec

    last_err = ""
    async with sem:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = await client.get(item["url"])
                if resp.status_code != 200:
                    last_err = f"HTTP {resp.status_code}"
                    # 4xx other than 429 will not fix themselves; stop early.
                    if 400 <= resp.status_code < 500 and resp.status_code != 429:
                        break
                    await asyncio.sleep(1.5 * attempt)
                    continue

                w, h, size = await asyncio.to_thread(to_webp, resp.content, dest)
                rec.update(
                    status="ok",
                    bytes=size,
                    width=w,
                    height=h,
                    source_bytes=len(resp.content),
                )
                prog.ok += 1
                prog.bytes_out += size
                prog.tick()
                return rec

            except Exception as exc:  # network, decode, or disk
                last_err = f"{type(exc).__name__}: {exc}"[:160]
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(1.5 * attempt)

    rec["status"] = "failed"
    rec["error"] = last_err
    prog.failed += 1
    prog.tick()
    return rec


async def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    items = load_rows()
    print(f"Source   : {CSV_PATH}")
    print(f"Target   : {OUT_DIR}")
    print(f"Versions : {len(items)} unique image URLs")
    print(f"Options  : concurrency={CONCURRENCY} retries={MAX_RETRIES} "
          f"max-width={MAX_WIDTH}px quality={WEBP_QUALITY}\n")

    prog = Progress(len(items))
    sem = asyncio.Semaphore(CONCURRENCY)
    limits = httpx.Limits(
        max_connections=CONCURRENCY, max_keepalive_connections=CONCURRENCY
    )

    async with httpx.AsyncClient(
        headers=HEADERS, timeout=TIMEOUT, limits=limits, follow_redirects=True
    ) as client:
        results = await asyncio.gather(
            *(fetch_one(client, sem, it, prog) for it in items)
        )

    prog.tick(force=True)
    elapsed = time.monotonic() - prog.started
    print("\n")

    total_bytes = sum(r.get("bytes", 0) for r in results if r["status"] != "failed")
    source_bytes = sum(r.get("source_bytes", 0) for r in results)

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_csv": str(CSV_PATH),
        "output_dir": str(OUT_DIR),
        "public_prefix": PUBLIC_PREFIX,
        "options": {
            "concurrency": CONCURRENCY,
            "max_retries": MAX_RETRIES,
            "max_width": MAX_WIDTH,
            "webp_quality": WEBP_QUALITY,
        },
        "stats": {
            "total": len(items),
            "downloaded": prog.ok,
            "skipped_existing": prog.skipped,
            "failed": prog.failed,
            "elapsed_seconds": round(elapsed, 1),
            "final_bytes": total_bytes,
            "final_mb": round(total_bytes / 1048576, 1),
            "source_bytes_this_run": source_bytes,
            "source_mb_this_run": round(source_bytes / 1048576, 1),
        },
        "items": results,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    saved = (
        f"{(1 - total_bytes / source_bytes) * 100:.1f}%" if source_bytes else "n/a"
    )
    print("=" * 62)
    print(f"  downloaded      : {prog.ok}")
    print(f"  skipped (exists): {prog.skipped}")
    print(f"  failed          : {prog.failed}")
    print(f"  elapsed         : {elapsed / 60:.1f} min")
    print(f"  final size      : {total_bytes / 1048576:.1f} MB")
    print(f"  compression     : {saved} smaller than source")
    print(f"  manifest        : {MANIFEST_PATH}")
    print("=" * 62)

    if prog.failed:
        print(f"\n  {prog.failed} failed — re-run to retry just those.")
        for r in results:
            if r["status"] == "failed":
                print(f"    {r['version_id']}  {r.get('error', '')[:80]}")
                break
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
