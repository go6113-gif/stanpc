#!/usr/bin/env python3
"""
Import Wikidata member data (nameKr) into the Member table.
Source: data/group_members_wikidata.csv

Matches Group.nameEn + Member.nameEn, then updates Member.nameKr with Wikidata value.
Run with: python import_wikidata_members.py
"""

import csv
import psycopg2
from pathlib import Path
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
POCA = ROOT / "poca-exchange"
load_dotenv(POCA / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
CSV_PATH = ROOT / "data" / "group_members_wikidata.csv"


def normalize_to_slug(name: str) -> str:
    """Convert group name to slug format."""
    return (
        name.lower()
        .replace("&", "and")
        .replace(" ", "-")
    )


def main():
    print("Starting Wikidata member import...")

    # Parse database URL
    parsed_url = urlparse(DATABASE_URL)
    db_config = {
        "host": parsed_url.hostname,
        "port": parsed_url.port or 5432,
        "database": parsed_url.path.lstrip("/"),
        "user": parsed_url.username,
        "password": parsed_url.password,
    }

    # Connect to database
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        print("✓ Connected to database")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return

    # Load groups into memory for faster lookup
    cursor.execute('SELECT id, slug, "nameEn" FROM groups')
    groups = cursor.fetchall()
    group_by_name_en = {row[2].lower(): row[0] for row in groups}
    group_by_slug = {row[1]: row[0] for row in groups}
    print(f"✓ Loaded {len(groups)} groups from DB")

    # Read CSV
    rows = []
    try:
        with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        print(f"✓ Loaded {len(rows)} rows from Wikidata CSV")

        # Debug: print first row
        if rows:
            print(f"  First row keys: {list(rows[0].keys())}")
            print(f"  First row sample: {rows[0]}")
    except Exception as e:
        print(f"❌ CSV read failed: {e}")
        cursor.close()
        conn.close()
        return

    updated = 0
    skipped = 0
    errors = 0

    # Process each row
    for i, row in enumerate(rows, 1):
        group_name = row.get("Group_Name", "").strip()
        member_name_en = row.get("Member_Name_EN", "").strip()
        member_name_ko = row.get("Member_Name_KO", "").strip()

        # Skip if no Korean name provided
        if not member_name_ko:
            skipped += 1
            continue

        # Find group by nameEn (case-insensitive) or by slug
        group_id = group_by_name_en.get(group_name.lower()) or group_by_slug.get(
            normalize_to_slug(group_name)
        )

        if not group_id:
            print(f"  ⚠️  Group not found: {group_name}")
            skipped += 1
            continue

        # Find member by nameEn within the group
        try:
            cursor.execute(
                'SELECT id FROM members WHERE "groupId" = %s AND "nameEn" = %s',
                (group_id, member_name_en),
            )
            result = cursor.fetchone()

            if not result:
                print(f"  ⚠️  Member not found: {group_name} / {member_name_en}")
                skipped += 1
                continue

            member_id = result[0]

            # Update member nameKr
            cursor.execute(
                'UPDATE members SET "nameKr" = %s WHERE id = %s',
                (member_name_ko, member_id),
            )
            conn.commit()

            updated += 1

            # Progress update every 100 rows
            if i % 100 == 0:
                print(f"  Progress: {i}/{len(rows)} ({updated} updated)")

        except Exception as e:
            print(f"  ❌ Error processing {group_name} / {member_name_en}: {e}")
            conn.rollback()
            errors += 1

    print("\n" + "=" * 60)
    print(f"Import complete: {updated} updated, {skipped} skipped, {errors} errors")
    print("=" * 60)

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
