#!/usr/bin/env python3
"""
Generate metadata manifest for locally downloaded photocard images.

Scans D:\StanPC\downloaded_pcs and outputs:
- D:\StanPC\data\local_photocard_images_manifest.json

Structure:
  downloaded_pcs/{group}/{member}/{album}/{image}.webp
  -> { filePath, group, groupNameEn, member, album, sequence, ... }
"""

import json
import os
import hashlib
from pathlib import Path
from typing import TypedDict, Optional
from collections import defaultdict

# Group name mapping (lowercase → English)
GROUP_NAME_MAP = {
    "bts": "BTS",
    "seventeen": "SEVENTEEN",
}

class ImageMetadata(TypedDict):
    filePath: str
    group: str
    groupNameEn: str
    member: str
    album: str
    sequence: int
    fileName: str
    fileSize: int
    checksum: str

class ManifestStats(TypedDict):
    totalImages: int
    groupCount: int
    memberCount: int
    albumCount: int
    groupMembers: dict[str, int]
    albumsPerGroup: dict[str, int]

def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 checksum of file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return f"sha256:{sha256_hash.hexdigest()}"

def extract_sequence_from_filename(filename: str) -> Optional[int]:
    """
    Extract sequence number from filename: {member}_{album}_{sequence:02d}.webp
    Returns: sequence or None if invalid.
    """
    if not filename.endswith(".webp"):
        return None

    name_part = filename[:-5]  # Remove .webp
    parts = name_part.rsplit("_", 1)

    if len(parts) != 2:
        return None

    _, seq_str = parts

    try:
        return int(seq_str)
    except ValueError:
        return None

def generate_manifest():
    """Generate and save metadata manifest."""
    base_path = Path("D:\\StanPC\\downloaded_pcs")
    output_path = Path("D:\\StanPC\\data\\local_photocard_images_manifest.json")

    images: list[ImageMetadata] = []
    group_stats = defaultdict(set)  # group -> set of members
    album_stats = defaultdict(set)  # group -> set of albums

    if not base_path.exists():
        print(f"❌ Error: {base_path} not found")
        return

    print(f"Scanning {base_path}...")

    # Iterate through groups
    for group_dir in base_path.iterdir():
        if not group_dir.is_dir():
            continue

        group = group_dir.name.lower()
        if group not in GROUP_NAME_MAP:
            print(f"⚠ Unknown group: {group}")
            continue

        group_name_en = GROUP_NAME_MAP[group]

        # Iterate through members
        for member_dir in group_dir.iterdir():
            if not member_dir.is_dir():
                continue

            member = member_dir.name.lower()
            group_stats[group].add(member)

            # Iterate through albums
            for album_dir in member_dir.iterdir():
                if not album_dir.is_dir():
                    continue

                album = album_dir.name.lower()
                album_stats[group].add(album)

                # Iterate through images
                for image_file in sorted(album_dir.iterdir()):
                    if not image_file.is_file():
                        continue

                    filename = image_file.name
                    sequence = extract_sequence_from_filename(filename)

                    if sequence is None:
                        print(f"⚠ Skipped invalid filename: {image_file.relative_to(base_path)}")
                        continue

                    # Compute metadata
                    relative_path = image_file.relative_to(base_path.parent).as_posix()
                    file_size = image_file.stat().st_size
                    checksum = compute_sha256(str(image_file))

                    metadata: ImageMetadata = {
                        "filePath": relative_path,
                        "group": group,
                        "groupNameEn": group_name_en,
                        "member": member,
                        "album": album,
                        "sequence": sequence,
                        "fileName": filename,
                        "fileSize": file_size,
                        "checksum": checksum,
                    }

                    images.append(metadata)

    # Build stats
    stats: ManifestStats = {
        "totalImages": len(images),
        "groupCount": len(group_stats),
        "memberCount": sum(len(members) for members in group_stats.values()),
        "albumCount": len(set(a for albums in album_stats.values() for a in albums)),
        "groupMembers": {group: len(members) for group, members in group_stats.items()},
        "albumsPerGroup": {group: len(albums) for group, albums in album_stats.items()},
    }

    # Write manifest
    manifest = {
        "images": images,
        "stats": stats,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Manifest saved to {output_path}")
    print(f"\n📊 Statistics:")
    print(f"  Total images: {stats['totalImages']}")
    print(f"  Groups: {stats['groupCount']}")
    print(f"  Members: {stats['memberCount']}")
    print(f"  Albums: {stats['albumCount']}")
    print(f"\nGroup breakdown:")
    for group, member_count in stats['groupMembers'].items():
        album_count = stats['albumsPerGroup'].get(group, 0)
        print(f"  {group.upper()}: {member_count} members, {album_count} unique albums")

if __name__ == "__main__":
    generate_manifest()
