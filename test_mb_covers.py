import csv
import time
import requests

INPUT_CSV = "poca_master_db.csv"
HEADERS = {
    "User-Agent": "PocaExchangeMVP/1.0.0 ( contact@poca-exchange.com )"
}

with open(INPUT_CSV, mode="r", encoding="utf-8-sig") as f:
    reader = list(csv.DictReader(f))

print("🚀 MusicBrainz 앨범 자켓 수집 테스트 시작...\n")
success = 0

for i, row in enumerate(reader[:30]):
    group = row.get("Group_Name", "")
    url = f'https://musicbrainz.org/ws/2/release-group/?query=artist:"{group}"&fmt=json&limit=1'

    try:
        res = requests.get(url, headers=HEADERS, timeout=5)
        if res.status_code == 200:
            data = res.json()
            rgs = data.get("release-groups", [])
            if rgs:
                rg_id = rgs[0].get("id")
                cover_url = (
                    f"https://coverartarchive.org/release-group/{rg_id}/front-250"
                )
                print(f"[{i+1}/30] ✅ 자켓 매칭 성공: {group} -> {cover_url}")
                success += 1
            else:
                print(f"[{i+1}/30] ❌ 결과 없음: {group}")
        else:
            print(f"[{i+1}/30] ⚠️ 응답 에러 ({res.status_code}): {group}")
    except Exception as e:
        print(f"[{i+1}/30] ⚠️ 에러: {e}")

    time.sleep(1)

print(
    f"\n📊 결과: 30건 중 {success}건 매칭 완료 ({success/30*100:.1f}%)"
)