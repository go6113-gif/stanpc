import csv
import json
import requests

# 바이어스룸 API 엔드포인트
API_URL = "https://biasroom.com/api/groups?includeAlbumVersionCount=true"
OUTPUT_CSV = "biasroom_groups_master.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,"
        " like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Referer": "https://biasroom.com/",
}


def fetch_groups_master():
    print("🚀 바이어스룸 전체 그룹 마스터 데이터 수집 시작...\n")

    try:
        res = requests.get(API_URL, headers=HEADERS, timeout=10)

        if res.status_code == 200:
            data = res.json()

            # 응답 구조에 맞춰 데이터 리스트 추출 (배열 형태 혹은 { groups: [...] } 형태)
            groups = data if isinstance(data, list) else data.get("groups", [])

            print(
                f"✅ 성공적으로 데이터를 수신했습니다! (총 {len(groups)}개"
                " 그룹 감지)"
            )

            # CSV 저장을 위한 정제
            collected_rows = []
            for item in groups:
                row = {
                    "Group_ID": item.get("id", ""),
                    "Name_EN": item.get("name", ""),
                    "Name_KR": item.get("koreanName", "")
                    or item.get("aliases", ""),
                    "Album_Count": item.get("albumCount", 0),
                    "Version_Count": item.get("versionCount", 0),
                    "Image_URL": item.get("imageUrl", "")
                    or item.get("logoUrl", ""),
                }
                collected_rows.append(row)

            # CSV 파일 출력
            if collected_rows:
                keys = collected_rows[0].keys()
                with open(
                    OUTPUT_CSV, "w", newline="", encoding="utf-8-sig"
                ) as f:
                    writer = csv.DictWriter(f, fieldnames=keys)
                    writer.writeheader()
                    writer.writerows(collected_rows)

                print(
                    f"\n📁 마스터 파일 저장 완료: '{OUTPUT_CSV}' (총"
                    f" {len(collected_rows)}건)"
                )
                print(
                    "💡 이제 이 그룹 ID들을 사용해 앨범, 멤버, 세부 포카"
                    " 데이터까지 한 번에 긁어올 수 있습니다!"
                )
            else:
                print("⚠️ 수집된 그룹 데이터의 형식을 재확인해야 합니다.")
                print(
                    "샘플 응답 일부:",
                    json.dumps(data, ensure_ascii=False)[:300],
                )

        else:
            print(f"❌ API 접근 실패 (상태 코드: {res.status_code})")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")


if __name__ == "__main__":
    fetch_groups_master()