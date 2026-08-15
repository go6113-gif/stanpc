#!/usr/bin/env python3
"""Debug script to check group/member matching in DB."""

import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / "poca-exchange" / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
parsed_url = urlparse(DATABASE_URL)
db_config = {
    "host": parsed_url.hostname,
    "port": parsed_url.port or 5432,
    "database": parsed_url.path.lstrip("/"),
    "user": parsed_url.username,
    "password": parsed_url.password,
}

conn = psycopg2.connect(**db_config)
cursor = conn.cursor()

# Test groups: &TEAM, 100%, 14U, 15&, 2NE1, BTS
test_groups = ["&TEAM", "100%", "14U", "15&", "2NE1", "BTS", "Stray Kids"]

for group_name in test_groups:
    cursor.execute('SELECT id, slug, "nameEn", "nameKr" FROM groups WHERE "nameEn" = %s', (group_name,))
    result = cursor.fetchone()

    if result:
        print(f"\n✓ Group '{group_name}' found:")
        print(f"  id={result[0]}, slug={result[1]}, nameEn={result[2]}, nameKr={result[3]}")

        # Get first 3 members
        group_id = result[0]
        cursor.execute('SELECT id, "nameEn", "nameKr" FROM members WHERE "groupId" = %s LIMIT 3', (group_id,))
        members = cursor.fetchall()
        print(f"  First 3 members:")
        for m in members:
            print(f"    nameEn={m[1]}, nameKr={m[2]}")
    else:
        print(f"\n✗ Group '{group_name}' NOT found in DB")
        # Try to find similar
        cursor.execute('SELECT id, "nameEn" FROM groups WHERE "nameEn" ILIKE %s LIMIT 3', (f"%{group_name}%",))
        similar = cursor.fetchall()
        if similar:
            print(f"  Similar groups: {', '.join([row[1] for row in similar])}")

cursor.close()
conn.close()
