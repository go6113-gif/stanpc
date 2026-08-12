import json
import requests

# Stray Kids 또는 &TEAM 그룹 ID 테스트
test_group_id = "cmeqz8psl002p136w6g8us9kk"  # Stray Kids ID
url = f"https://biasroom.com/api/album-versions?groupId={test_group_id}"

headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,"
        " like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Referer": "https://biasroom.com/",
}

print("🔎 API 구조 진단 중...")
res = requests.get(url, headers=headers)

if res.status_code == 200:
    data = res.json()
    print("✅ 응답 성공! 데이터 샘플:")
    print(json.dumps(data, ensure_ascii=False, indent=2)[:1000])
else:
    print(f"❌ 실패 (상태 코드: {res.status_code})")