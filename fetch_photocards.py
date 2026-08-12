import csv
import json
import time
import requests

API_URL = "https://biasroom.com/api/albums?flag=wts&wtsStatus=listed"
OUTPUT_CSV = "biasroom_individual_photocards.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://biasroom.com/"
}

def fetch_photocards_data():
    print("🚀 확인된 정식 API로 개별 포토카드 데이터 수집 시작...\n")

    try:
        res = requests.get(API_URL, headers=HEADERS, timeout=10)
        
        if res.status_code == 200:
            data = res.json()
            items = data if isinstance(data, list) else data.get("albums", data.get("items", []))

            print(f"✅ 성공적으로 데이터를 수신했습니다! (총 {len(items)}개 항목 감지)")

            collected_rows = []
            for item in items:
                # API 응답 구조에 맞춘 필드 추출
                card_id = item.get("id", "")
                group_name = item.get("groupName") or (item.get("group", {}).get("name") if isinstance(item.get("group"), dict) else "")
                member_name = item.get("memberName") or (item.get("member", {}).get("name") if isinstance(item.get("member"), dict) else "")
                album_title = item.get("title") or item.get("albumTitle", "")
                image_url = item.get("imageUrl") or item.get("coverUrl", "")

                collected_rows.append({
                    "Card_ID": card_id,
                    "Group_Name": group_name,
                    "Member_Name": member_name,
                    "Album_Title": album_title,
                    "Image_URL": image_url
                })

            if collected_rows:
                keys = collected_rows[0].keys()
                with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
                    writer = csv.DictWriter(f, fieldnames=keys)
                    writer.writeheader()
                    writer.writerows(collected_rows)

                print(f"\n📁 파일 저장 완료: '{OUTPUT_CSV}' (총 {len(collected_rows)}건)")
            else:
                print("⚠️ 데이터 배열을 파싱하지 못했습니다. 샘플 응답 일부를 확인합니다.")
                print(json.dumps(data, ensure_ascii=False)[:300])

        else:
            print(f"❌ API 접근 실패 (상태 코드: {res.status_code})")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    fetch_photocards_data()
