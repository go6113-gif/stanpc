import csv
import json
import random
import time
import requests

INPUT_GROUPS_CSV = "biasroom_groups_master.csv"
OUTPUT_CARDS_CSV = "biasroom_photocards_master.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,"
        " like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Referer": "https://biasroom.com/",
}


def fetch_photocards_pipeline(max_groups_to_process=5):
    print("🚀 [Biasroom 파이프라인] 정제된 엔드포인트 수집 시작...\n")

    groups = []
    try:
        with open(INPUT_GROUPS_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                groups.append(row)
    except Exception as e:
        print(f"❌ 그룹 마스터 파일 읽기 실패: {e}")
        return

    print(
        f"📋 총 {len(groups)}개 그룹 중 상위 {max_groups_to_process}개 그룹 샘플"
        " 수집 진행\n"
    )

    all_card_rows = []

    for idx, g in enumerate(groups[:max_groups_to_process], 1):
        group_id = g["Group_ID"]
        group_name = g["Name_EN"] or g["Name_KR"]
        print(f"[{idx}/{max_groups_to_process}] 🔎 [{group_name}] 데이터 조회 중...")

        albums_url = (
            f"https://biasroom.com/api/album-versions?groupId={group_id}"
        )
        try:
            res = requests.get(albums_url, headers=HEADERS, timeout=10)
            if res.status_code == 200:
                data = res.json()
                album_versions = data.get("albumVersions", [])

                print(f"  - 감지된 앨범 버전: {len(album_versions)}개")

                for ver in album_versions:
                    ver_id = ver.get("id", "")
                    ver_name = ver.get("name", "")
                    album_obj = ver.get("album", {})
                    album_title = album_obj.get("title", "")
                    img_url = ver.get("image_url", "")

                    all_card_rows.append({
                        "Group_Name": group_name,
                        "Album_Title": album_title,
                        "Version_ID": ver_id,
                        "Version_Name": ver_name,
                        "Release_Date": ver.get("release_date", ""),
                        "Image_URL": img_url,
                    })

            else:
                print(f"  ⚠️ 응답 실패 (코드: {res.status_code})")

        except Exception as e:
            print(f"  ❌ 에러 발생: {e}")

        sleep_time = random.uniform(1.5, 2.5)
        print(f"  ⏳ 그룹 간 안전 대기 ({sleep_time:.2f}초)...\n")
        time.sleep(sleep_time)

    # 결과 CSV 저장
    if all_card_rows:
        keys = all_card_rows[0].keys()
        with open(OUTPUT_CARDS_CSV, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(all_card_rows)
        print(
            f"✅ 수집 완료! '{OUTPUT_CARDS_CSV}'에 총 {len(all_card_rows)}건"
            " 저장됨."
        )
    else:
        print("⚠️ 수집된 데이터가 없습니다.")


if __name__ == "__main__":
    fetch_photocards_pipeline(max_groups_to_process=931)