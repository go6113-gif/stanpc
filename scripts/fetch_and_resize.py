import csv
import json
import time
import os
import requests
from io import BytesIO
from PIL import Image

INPUT_CSV = "biasroom_individual_photocards.csv"
OUTPUT_CSV = "biasroom_photocards_detailed.csv"
THUMB_DIR = r"D:\Poca_exchange\thumbs"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://biasroom.com/"
}

def process_photocards():
    print("🚀 개별 포토카드 세부 정보 수집 및 썸네일 가공 시작...\n")

    if not os.path.exists(THUMB_DIR):
        os.makedirs(THUMB_DIR)

    # 기존 ID 목록 불러오기
    items_to_fetch = []
    try:
        with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                card_id = row.get("Card_ID", "").strip()
                if card_id:
                    items_to_fetch.append(card_id)
    except Exception as e:
        print(f"❌ 목록 파일 읽기 실패: {e}")
        return

    total = len(items_to_fetch)
    print(f"📊 총 {total}개 포토카드 상세 데이터 및 이미지 처리 진행 중...")

    detailed_cards = []

    for idx, card_id in enumerate(items_to_fetch, 1):
        url = f"https://biasroom.com/api/market2?flag=wts&id={card_id}&itemType=photocard"
        
        try:
            res = requests.get(url, headers=HEADERS, timeout=8)
            if res.status_code == 200:
                data = res.json()
                
                # API 응답 파싱
                group_name = data.get("groupName") or data.get("group", {}).get("name", "")
                member_name = data.get("memberName") or data.get("member", {}).get("name", "")
                card_name = data.get("name") or data.get("title", "")
                album_title = data.get("albumTitle") or data.get("album", {}).get("title", "")
                raw_img_url = data.get("imageUrl") or data.get("image", "")

                local_thumb_path = ""
                
                # 원본 이미지 다운로드 및 저해상도 썸네일 변환
                if raw_img_url:
                    try:
                        img_res = requests.get(raw_img_url, timeout=5)
                        if img_res.status_code == 200:
                            img = Image.open(BytesIO(img_res.content))
                            
                            # 가로 250px 기준 비율 유지 리사이징
                            img.thumbnail((250, 250))
                            
                            # WebP 포맷으로 저장
                            save_filename = f"{card_id}.webp"
                            save_filepath = os.path.join(THUMB_DIR, save_filename)
                            img.save(save_filepath, "WEBP", quality=80)
                            local_thumb_path = save_filepath
                    except Exception:
                        pass

                detailed_cards.append({
                    "Card_ID": card_id,
                    "Group_Name": group_name,
                    "Member_Name": member_name,
                    "Album_Title": album_title,
                    "Card_Name": card_name,
                    "Original_Image_URL": raw_img_url,
                    "Local_Thumb_Path": local_thumb_path
                })

            time.sleep(0.05) # 서버 부하 방지 미세 대기
        except Exception:
            pass

        if idx % 50 == 0 or idx == total:
            print(f"  ⏳ 진행률: {idx}/{total} 완료 (가공된 포카: {len(detailed_cards)}건)")

    # 결과 CSV 저장
    if detailed_cards:
        keys = detailed_cards[0].keys()
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(detailed_cards)

        print(f"\n✅ 가공 완료! '{OUTPUT_CSV}' 저장됨.")
        print(f"📁 썸네일 저장 경로: '{THUMB_DIR}'")
    else:
        print("⚠️ 세부 데이터를 수집하지 못했습니다.")

if __name__ == "__main__":
    process_photocards()
