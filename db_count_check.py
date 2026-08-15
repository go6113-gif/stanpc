#!/usr/bin/env python3
"""
DB 데이터 건수 조회 스크립트
사용: python3 db_count_check.py
"""

import psycopg2
import json
from datetime import datetime

conn_string = "postgresql://postgres:7600gorae8900@db.odocxoxthfokcmwieibn.supabase.co:5432/postgres"

try:
    print("🔗 Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    tables = [
        "Group", "Album", "PhotoCard", "PriceHistory",
        "Member", "Artist", "Version", "User",
        "UserBinderCard", "GlobalSKUMapping",
        "WaitlistSignup", "Badge", "Notification",
        "Reaction", "BundleMatch", "TradeRoom"
    ]

    print("📊 Querying table counts...\n")
    results = {}

    for table in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
            count = cursor.fetchone()[0]
            results[table] = count
            print(f"  {table:20} : {count:6,d}")
        except psycopg2.errors.UndefinedTable:
            results[table] = 0
            print(f"  {table:20} : ⚠️  Table not found")
        except Exception as e:
            results[table] = None
            print(f"  {table:20} : ❌ {str(e)[:40]}")

    cursor.close()
    conn.close()

    print("\n" + "="*60)
    print("📁 Summary (JSON format):")
    print("="*60)
    print(json.dumps({
        "timestamp": datetime.now().isoformat(),
        "source": "Supabase PostgreSQL",
        "counts": results
    }, indent=2))

    print("\n✅ Results saved to console above")

except Exception as e:
    print(f"❌ CONNECTION ERROR: {e}")
    print("\n⚠️  Make sure:")
    print("  1. Internet connection is active")
    print("  2. Supabase is reachable (db.odocxoxthfokcmwieibn.supabase.co:5432)")
    print("  3. psycopg2 is installed: pip install psycopg2-binary")
