import csv
import json
import os
import re
import time
import requests

INPUT_CSV = "poca_master_db.csv"
OUTPUT_CSV = "poca_master_db_mb.csv"
CACHE_FILE = "mb_cache.json"

HEADERS = {
    "User-Agent": "PocaExchangeMVP/1.0.0 ( contact@poca-exchange.com )"
}

# 캐시 로드
group_cache = {}
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        group_cache = json.load(f)


def get_clean_name(name):
    return re.sub(r"[^a-zA-Z0-9]", "", name)


def fetch_cover_art(group_name):
    if group_name in group_cache:
        return group_cache[group_name]

    search_names = [group_name]
    clean_name = get_clean_name(group_name)
    if clean_name and clean_name != group_name:
        search_names.append(clean_name)

    cover_url = ""
    for name in search_names:
        url = f'https://musicbrainz.org/ws/2/release-group/?query=artist:"{name}"&fmt=json&limit=1'

        # Retry 로직 (최대 3회)
        for attempt in range(3):
            try:
                res = requests.get(url, headers=HEADERS, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    rgs = data.get("release-groups", [])
                    if rgs:
                        rg_id = rgs[0].get("id")
                        cover_url = f"https://coverartarchive.org/release-group/{rg_id}/front-250"
                        break
                elif res.status_code == 503:
                    time.sleep(2)  # 과부하 시 대기
            except Exception:
                time.sleep(1)

        if cover_url:
            break

    group_cache[group_name] = cover_url
    return cover_url


def main():
    print("🚀 [1단계] MusicBrainz 3,860건 전수 앨범 자켓 수집 시작...\n")

    with open(INPUT_CSV, mode="r", encoding="utf-8-sig") as f:
        reader = list(csv.DictReader(f))

    fieldnames = list(reader[0].keys())
    if "Album_Cover_URL" not in fieldnames:
        fieldnames.append("Album_Cover_URL")

    rows = []
    success_count = 0

    for i, row in enumerate(reader):
        group = row.get("Group_Name", "")

        cover_url = fetch_cover_art(group)
        row["Album_Cover_URL"] = cover_url

        if cover_url:
            success_count += 1

        rows.append(row)

        # 50건마다 진행 상황 및 캐시 저장
        if (i + 1) % 50 == 0 or (i + 1) == len(reader):
            print(
                f"[{i+1}/{len(reader)}] 처리 완료... (현재 성공률: {success_count/(i+1)*100:.1f}%)"
            )
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(group_cache, f, ensure_ascii=False, indent=2)

            time.sleep(0.5)

    with open(OUTPUT_CSV, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(
        f"\n✅ 완료! 총 {len(reader)}건 중 {success_count}건 수집 성공 ({success_count/len(reader)*100:.1f}%)"
    )
    print(f"📁 저장 파일: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()