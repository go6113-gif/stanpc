import pandas as pd
from google_play_scraper import reviews_all

APP_ID = "com.biasroom.app"
countries = [
    ("us", "en"), ("kr", "ko"), ("jp", "ja"), ("ph", "en"),
    ("id", "id"), ("th", "th"), ("gb", "en"), ("br", "pt"),
    ("tw", "zh"), ("vn", "vi"), ("my", "ms"), ("mx", "es")
]

all_reviews = []
seen_ids = set()

print(f"[{APP_ID}] 리뷰 수집 시작...")

for country, lang in countries:
    print(f"-> [{country.upper()}] 수집 중...")
    try:
        reviews = reviews_all(APP_ID, lang=lang, country=country)
        added = 0
        for r in reviews:
            if r["reviewId"] not in seen_ids:
                seen_ids.add(r["reviewId"])
                all_reviews.append({
                    "작성자": r.get("userName"),
                    "평점": r.get("score"),
                    "작성일": r.get("at"),
                    "내용": r.get("content"),
                    "공감수": r.get("thumbsUpCount"),
                    "답글": r.get("replyContent"),
                    "국가": country
                })
                added += 1
        print(f"   └ {added}개 수집 완료")
    except Exception as e:
        print(f"   └ [{country}] 오류: {e}")

df = pd.DataFrame(all_reviews)
df.to_csv("biasroom_reviews.csv", index=False, encoding="utf-8-sig")
print(f"\n총 {len(df)}개 리뷰가 'D:\\StanPC\\biasroom_reviews.csv' 파일로 저장되었습니다.")
