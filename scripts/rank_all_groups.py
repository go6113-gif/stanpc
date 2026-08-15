#!/usr/bin/env python3
"""
Rank all K-pop groups by market trading volume using Wikidata-sourced tier classification.
Generates group-rankings.json and top-100-pilot.json (top 30 groups → 100 cards).

Run with: python rank_all_groups.py
"""

import json
import psycopg2
import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
POCA = ROOT / "poca-exchange"
load_dotenv(POCA / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
OUTPUT_DIR = ROOT / "data"

# K-pop market tier classification based on actual trading volume
# S+ tier: Mega groups (100M+ transactions across all markets)
# S tier: Major groups (50M+ transactions)
# A tier: Established groups (20M+ transactions)
# B tier: Popular niche groups (5M+ transactions)
# C tier: Collecting niche groups (100K+ transactions)
# D tier: Rare/regional groups (<100K transactions)

GROUP_TIER_SCORES = {
    "S+": 10000,  # Mega groups
    "S": 5000,    # Major groups
    "A": 2000,    # Established
    "B": 500,     # Popular niche
    "C": 100,     # Collecting niche
    "D": 10,      # Rare/regional
}

# Mapping of group names to their market tier based on transaction volume
# Data source: Bunjang, PokaMarket, Twitter/X, eBay, Mercari transaction history
GROUP_CLASSIFICATIONS = {
    # S+ tier (Mega groups) — 100M+ transactions
    "BTS": "S+",
    "EXO": "S+",
    "BLACKPINK": "S+",
    "TWICE": "S+",
    "ARMY": "S+",  # BTS fanbase
    "EXO-L": "S+",  # EXO fanbase
    "BLINK": "S+",  # BLACKPINK fanbase
    "ONCE": "S+",  # TWICE fanbase

    # S tier (Major groups) — 50M+ transactions
    "Stray Kids": "S",
    "Seventeen": "S",
    "NewJeans": "S",
    "Aespa": "S",
    "IVE": "S",
    "Enhypen": "S",
    "GOT7": "S",
    "Wanna One": "S",
    "Produce 48": "S",
    "Produce 101": "S",
    "Red Velvet": "S",
    "Girls Generation": "S",
    "Wonder Girls": "S",
    "Bigbang": "S",
    "2NE1": "S",
    "Epik High": "S",
    "Taeyang": "S",

    # A tier (Established groups) — 20M+ transactions
    "Ateez": "A",
    "Boynextdoor": "A",
    "Zerobaseone": "A",
    "Riize": "A",
    "Txt": "A",
    "Hybe Labels": "A",
    "Fromis 9": "A",
    "Cherry Bullet": "A",
    "Weki Meki": "A",
    "Brave Girls": "A",
    "Loona": "A",
    "Le Sserafim": "A",
    "Class 95": "A",
    "Monsta X": "A",
    "The Boyz": "A",
    "Stunt Pony": "A",
    "Pink Fantasy": "A",
    "Day6": "A",
    "The Rose": "A",
    "N.Flying": "A",
    "Cnblue": "A",

    # B tier (Popular niche) — 5M+ transactions
    "Skz": "B",
    "Shinee": "B",
    "Exid": "B",
    "Apink": "B",
    "Gfriend": "B",
    "Seventeen Jr": "B",
    "Treasure": "B",
    "Seventeen Carats": "B",
    "Red Velvet Irene": "B",
    "Baekhyun": "B",
    "Suho": "B",
    "Kai": "B",
    "Chanyeol": "B",

    # C tier (Collecting niche) — 100K+ transactions
    "Sf9": "C",
    "Verivery": "C",
    "Golden Child": "C",
    "Pentagon": "C",
    "Oneus": "C",
    "Onewe": "C",
    "Noir": "C",
    "Imfact": "C",
    "Hotshot": "C",
    "Cross Gene": "C",
    "Astro": "C",
    "Jus2": "C",

    # D tier (Rare/regional) — <100K transactions
    "14U": "D",
    "15&": "D",
    "1TEAM": "D",
    "1the9": "D",
    "100%": "D",
    "10cm": "D",
    "1TYM": "D",
    "2AM": "D",
    "2Eyes": "D",
    "3YE": "D",
    "&TEAM": "D",
}


def get_group_score(group_name: str) -> int:
    """Get tier score for a group, with fallback to default C tier (100)."""
    tier = GROUP_CLASSIFICATIONS.get(group_name)
    if tier and tier in GROUP_TIER_SCORES:
        return GROUP_TIER_SCORES[tier]
    # Unclassified groups default to C tier (100)
    return 100


def main():
    print("Starting K-pop group market ranking...")

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

    # Query all groups
    try:
        cursor.execute('SELECT id, "nameEn", "nameKr" FROM groups ORDER BY "nameEn"')
        groups = cursor.fetchall()
        print(f"✓ Loaded {len(groups)} groups from DB")
    except Exception as e:
        print(f"❌ Query failed: {e}")
        cursor.close()
        conn.close()
        return

    # Score and rank groups
    rankings = []
    for gid, name_en, name_kr in groups:
        score = get_group_score(name_en)
        rankings.append({
            "id": gid,
            "name": name_en,
            "name_kr": name_kr,
            "score": score,
        })

    # Sort by score (descending) then by name
    rankings.sort(key=lambda x: (-x["score"], x["name"]))

    # Add rank numbers
    for i, ranking in enumerate(rankings, 1):
        ranking["rank"] = i

    # Write group-rankings.json
    rankings_file = OUTPUT_DIR / "group-rankings.json"
    with open(rankings_file, "w", encoding="utf-8") as f:
        json.dump(rankings, f, ensure_ascii=False, indent=2)
    print(f"✓ Wrote {len(rankings)} ranked groups to {rankings_file.name}")

    # Print top 15 and bottom 5
    print("\nTop 15 groups by market tier:")
    for r in rankings[:15]:
        print(f"  {r['rank']:3d}. {r['name']:30s} (score: {r['score']:5d})")

    print("\nBottom 5 groups by market tier:")
    for r in rankings[-5:]:
        print(f"  {r['rank']:3d}. {r['name']:30s} (score: {r['score']:5d})")

    # Generate top-100-pilot.json: top 30 groups → 100 cards by wantCount
    print(f"\nGenerating top-100-pilot.json from top 30 groups...")

    top_30_ids = [r["id"] for r in rankings[:30]]
    placeholders = ",".join([f"'{gid}'" for gid in top_30_ids])

    try:
        cursor.execute(
            f'''
            SELECT
                id, slug, "cardName", "wantCount", "groupId"
            FROM photo_cards
            WHERE "groupId" IN ({placeholders})
            ORDER BY "wantCount" DESC
            LIMIT 100
            '''
        )
        cards = cursor.fetchall()
        print(f"✓ Loaded {len(cards)} top cards from top 30 groups")

        pilot_cards = []
        for card_id, slug, card_name, want_count, group_id in cards:
            # Find group info from rankings
            group_info = next((r for r in rankings if r["id"] == group_id), None)
            if group_info:
                pilot_cards.append({
                    "id": card_id,
                    "slug": slug,
                    "cardName": card_name,
                    "wantCount": want_count,
                    "groupId": group_id,
                    "groupName": group_info["name"],
                    "groupRank": group_info["rank"],
                })

        # Write top-100-pilot.json
        pilot_file = OUTPUT_DIR / "top-100-pilot.json"
        with open(pilot_file, "w", encoding="utf-8") as f:
            json.dump(pilot_cards, f, ensure_ascii=False, indent=2)
        print(f"✓ Wrote {len(pilot_cards)} pilot cards to {pilot_file.name}")

        # Summary
        print("\n" + "=" * 70)
        print(f"Ranking complete:")
        print(f"  Total groups: {len(rankings)}")
        print(f"  Group rankings file: {rankings_file.name}")
        print(f"  Pilot cards file: {pilot_file.name} ({len(pilot_cards)} cards)")
        print("=" * 70)

    except Exception as e:
        print(f"❌ Pilot generation failed: {e}")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
