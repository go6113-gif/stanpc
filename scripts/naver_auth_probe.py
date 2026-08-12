"""
NAVER API HUB 인증 조합 진단 스크립트

어떤 키 조합이 실제로 통하는지 한 번에 확인한다.
공식 스펙 (https://api.ncloud-docs.com/docs/en/naver-api-hub-search-blog):
    GET https://naverapihub.apigw.ntruss.com/search/v1/blog
    Header: X-NCP-APIGW-API-KEY-ID: {Client ID}
            X-NCP-APIGW-API-KEY:    {Client Secret}
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error

HOST = "https://naverapihub.apigw.ntruss.com"
PROBE_PATH = "/search/v1/blog"
PROBE_QUERY = "포토카드"

# 확인할 후보 자격증명. 환경변수로 넣어두면 자동으로 조합을 만든다.
CANDIDATES = {
    "CLIENT_ID": os.getenv("NAVER_CLIENT_ID", ""),
    "CLIENT_SECRET": os.getenv("NAVER_CLIENT_SECRET", ""),
    "APIGW_PRIMARY": os.getenv("NAVER_APIGW_PRIMARY", ""),
    "APIGW_SECONDARY": os.getenv("NAVER_APIGW_SECONDARY", ""),
}

# (설명, key-id 로 쓸 후보, key 로 쓸 후보)
COMBOS = [
    ("Client ID + Client Secret  (문서 기준)", "CLIENT_ID", "CLIENT_SECRET"),
    ("Client ID + APIGW Primary", "CLIENT_ID", "APIGW_PRIMARY"),
    ("Client ID + APIGW Secondary", "CLIENT_ID", "APIGW_SECONDARY"),
    ("APIGW Primary + Client Secret", "APIGW_PRIMARY", "CLIENT_SECRET"),
]


def probe(key_id: str, key: str):
    """단일 조합 시도. (성공여부, 메시지) 반환."""
    params = urllib.parse.urlencode({
        "query": PROBE_QUERY,
        "display": 1,
        "start": 1,
        "sort": "date",
        "format": "json",
    })
    url = f"{HOST}{PROBE_PATH}?{params}"

    req = urllib.request.Request(url, headers={
        "X-NCP-APIGW-API-KEY-ID": key_id,
        "X-NCP-APIGW-API-KEY": key,
    })

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            total = body.get("total", "?")
            items = body.get("items", [])
            sample = items[0].get("title", "")[:40] if items else "(결과 없음)"
            return True, f"HTTP 200 / total={total} / 샘플: {sample}"
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")[:200]
        return False, f"HTTP {e.code} {e.reason} :: {detail}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def main():
    print("=" * 70)
    print("NAVER API HUB 인증 조합 진단")
    print(f"대상: GET {HOST}{PROBE_PATH}")
    print("=" * 70)

    missing = [name for name, val in CANDIDATES.items() if not val]
    for name, val in CANDIDATES.items():
        state = f"설정됨 (길이 {len(val)})" if val else "미설정"
        print(f"  {name:18s} : {state}")
    print()

    if len(missing) == len(CANDIDATES):
        print("❌ 후보 자격증명이 하나도 설정되지 않았습니다.")
        print("   아래처럼 환경변수를 넣고 다시 실행하세요:")
        print('   $env:NAVER_CLIENT_ID       = "..."')
        print('   $env:NAVER_CLIENT_SECRET   = "..."')
        print('   $env:NAVER_APIGW_PRIMARY   = "..."')
        print('   $env:NAVER_APIGW_SECONDARY = "..."')
        return 1

    winner = None
    for label, id_name, key_name in COMBOS:
        key_id = CANDIDATES.get(id_name, "")
        key = CANDIDATES.get(key_name, "")

        if not key_id or not key:
            print(f"  ⏭  건너뜀 : {label}  (자격증명 미설정)")
            continue

        ok, msg = probe(key_id, key)
        mark = "✅" if ok else "❌"
        print(f"  {mark} {label}")
        print(f"       └ {msg}")

        if ok and winner is None:
            winner = (label, id_name, key_name)

    print()
    print("=" * 70)
    if winner:
        label, id_name, key_name = winner
        print(f"✅ 통하는 조합: {label}")
        print(f"   X-NCP-APIGW-API-KEY-ID  <- {id_name}")
        print(f"   X-NCP-APIGW-API-KEY     <- {key_name}")
        print()
        print("   이제 수집 스크립트를 실행하세요:")
        print("   python scripts/naver_apihub_collect.py")
        rc = 0
    else:
        print("❌ 통하는 조합이 없습니다.")
        print("   위의 HTTP 응답 본문을 확인하세요. 흔한 원인:")
        print("   - 401/403 : 키가 틀렸거나 Application 에 해당 API 가 미등록")
        print("   - 404     : 경로 오타 (정상 경로는 /search/v1/blog)")
        rc = 1
    print("=" * 70)
    return rc


if __name__ == "__main__":
    sys.exit(main())
