import csv
import time
import requests

INPUT_CSV = "poca_master_db.csv"
HEADERS = {
    "User-Agent": "PocaExchangeMVP/1.0.0 ( contact@poca-exchange.com )"
}

with open(INPUT_CSV, mode="r", encoding="utf-8-sig") as f:
    reader = list(csv.DictReader(f))

print("🚀 [2/3] Wikimedia Commons API 아티스트 이미지 수집 테스트 시작...\n")
success = 0

for i, row in enumerate(reader[:30]):
    group = row.get("Group_Name", "")
    member = row.get("Member_Name", "")

    # 검색 키워드 설정 (멤버가 Unknown이면 그룹명만 검색)
    search_query = (
        f"{group} {member}" if member != "Unknown" else f"{group} kpop"
    )

    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{search_query}",
        "gsrnamespace": "6",  # File namespace
        "gsrlimit": "1",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }

    try:
        res = requests.get(url, headers=HEADERS, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            pages = data.get("query", {}).get("pages", {})

            img_url = ""
            for page_id, page_data in pages.items():
                imageinfo = page_data.get("imageinfo", [])
                if imageinfo:
                    img_url = imageinfo[0].get("url", "")
                    break

            if img_url:
                print(
                    f"[{i+1}/30] ✅ 위키 이미지 매칭 성공: {search_query} -> {img_url}"
                )
                success += 1
            else:
                print(f"[{i+1}/30] ❌ 결과 없음: {search_query}")
        else:
            print(f"[{i+1}/30] ⚠️ 응답 에러 ({res.status_code}): {search_query}")
    except Exception as e:
        print(f"[{i+1}/30] ⚠️ 에러: {e}")

    # 위키미디어는 속도 제한이 느슨하므로 0.2초 대기
    time.sleep(0.2)

print(
    f"\n📊 위키미디어 결과: 30건 중 {success}건 매칭 완료 ({success/30*100:.1f}%)"
)