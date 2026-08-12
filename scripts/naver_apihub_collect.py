"""
StanPC 세션 2: NAVER API HUB 포토카드 원문 데이터 수집

공식 스펙 (https://api.ncloud-docs.com/docs/en/naver-api-hub-search-blog)
    GET https://naverapihub.apigw.ntruss.com/search/v1/{service}
    Header: X-NCP-APIGW-API-KEY-ID: {Client ID}
            X-NCP-APIGW-API-KEY:    {Client Secret}

환경변수:
    NAVER_APIGW_KEY_ID  - X-NCP-APIGW-API-KEY-ID 값
    NAVER_APIGW_KEY     - X-NCP-APIGW-API-KEY 값
어떤 키를 넣어야 하는지 모르면 먼저 scripts/naver_auth_probe.py 를 실행할 것.
"""

import os
import re
import sys
import json
import time
import html
import hashlib
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from typing import Any

HOST = "https://naverapihub.apigw.ntruss.com"
OUTPUT_FILE = os.path.join("data", "naver_photocard_posts.json")

KEY_ID = os.getenv("NAVER_APIGW_KEY_ID", "")
KEY = os.getenv("NAVER_APIGW_KEY", "")

TARGET_KEYWORDS = [
    "포토카드 바인더",
    "포카 수집",
    "포카 덕질",
    "포토카드 교환",
    "포토카드 판매",
]

# API HUB Application 에 등록한 서비스들
SERVICES = {
    "blog": "블로그",
    "news": "뉴스",
    "cafearticle": "카페",
    "kin": "지식iN",
    "webkr": "웹문서",
}

# 검색 API 는 start 최대 1000, display 최대 100
PAGES_PER_KEYWORD = 3
DISPLAY = 100
REQUEST_INTERVAL = 0.3

TAG_RE = re.compile(r"<[^>]+>")


def log(msg: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {msg}")


def clean(text: str) -> str:
    """검색 결과의 <b> 하이라이트 태그와 HTML 엔티티를 제거한다."""
    return html.unescape(TAG_RE.sub("", text or "")).strip()


def search(service: str, keyword: str, start: int) -> tuple[list[dict], str | None]:
    """단일 요청. (items, 에러메시지) 반환."""
    params = urllib.parse.urlencode({
        "query": keyword,
        "display": DISPLAY,
        "start": start,
        "sort": "date",
        "format": "json",
    })
    req = urllib.request.Request(
        f"{HOST}/search/v1/{service}?{params}",
        headers={
            "X-NCP-APIGW-API-KEY-ID": KEY_ID,
            "X-NCP-APIGW-API-KEY": KEY,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8")).get("items", []), None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:150]
        return [], f"HTTP {e.code} {e.reason} :: {body}"
    except Exception as e:
        return [], f"{type(e).__name__}: {e}"


def normalize(service: str, keyword: str, item: dict) -> dict[str, Any]:
    """서비스별로 다른 응답 필드를 공통 스키마로 정규화한다."""
    url = item.get("link", "")
    record = {
        "id": hashlib.md5(url.encode()).hexdigest(),
        "service": service,
        "service_label": SERVICES[service],
        "keyword": keyword,
        "title": clean(item.get("title", "")),
        "description": clean(item.get("description", "")),
        "url": url,
        "collected_at": datetime.now().isoformat(timespec="seconds"),
    }

    # 서비스마다 존재하는 필드만 선택적으로 덧붙인다
    if service == "blog":
        record["author"] = item.get("bloggername", "")
        record["author_url"] = item.get("bloggerlink", "")
        record["posted_date"] = item.get("postdate", "")
    elif service == "news":
        record["original_url"] = item.get("originallink", "")
        record["posted_date"] = item.get("pubDate", "")
    elif service == "cafearticle":
        record["author"] = item.get("cafename", "")
        record["author_url"] = item.get("cafeurl", "")

    return record


def collect() -> list[dict]:
    seen: set[str] = set()
    posts: list[dict] = []
    failures: dict[str, str] = {}

    for service, label in SERVICES.items():
        log(f"[{label}] 수집 시작")
        service_count = 0

        for keyword in TARGET_KEYWORDS:
            for page in range(PAGES_PER_KEYWORD):
                start = page * DISPLAY + 1
                items, error = search(service, keyword, start)

                if error:
                    # 같은 서비스에서 반복 실패하면 남은 키워드는 건너뛴다
                    failures[service] = error
                    log(f"   x {label} 실패: {error}")
                    break

                if not items:
                    break

                new = 0
                for item in items:
                    record = normalize(service, keyword, item)
                    if not record["url"] or record["url"] in seen:
                        continue
                    seen.add(record["url"])
                    posts.append(record)
                    new += 1

                service_count += new
                time.sleep(REQUEST_INTERVAL)

                if len(items) < DISPLAY:
                    break

            if service in failures:
                break

        if service not in failures:
            log(f"   o {label} {service_count}건")

    if failures:
        log("")
        log("실패한 서비스:")
        for service, error in failures.items():
            log(f"   - {SERVICES[service]}({service}): {error}")
        log("   → Application 에 해당 API 가 등록되어 있는지 NCP 콘솔에서 확인하세요.")

    return posts


def report(posts: list[dict]) -> None:
    print()
    print("=" * 60)
    print(f"수집 완료: 총 {len(posts)}건  ->  {OUTPUT_FILE}")
    print("=" * 60)

    if not posts:
        print("수집된 데이터가 없습니다. 위 오류 메시지를 확인하세요.")
        return

    by_service: dict[str, int] = {}
    by_keyword: dict[str, int] = {}
    for post in posts:
        by_service[post["service_label"]] = by_service.get(post["service_label"], 0) + 1
        by_keyword[post["keyword"]] = by_keyword.get(post["keyword"], 0) + 1

    print("\n[서비스별]")
    for name, count in sorted(by_service.items(), key=lambda x: -x[1]):
        print(f"   {name:8s} {count:5d}건")

    print("\n[키워드별]")
    for name, count in sorted(by_keyword.items(), key=lambda x: -x[1]):
        print(f"   {name:12s} {count:5d}건")

    print("\n[샘플 3건]")
    for post in posts[:3]:
        print(f"   - ({post['service_label']}) {post['title'][:50]}")
        print(f"     {post['url']}")
    print()


def main() -> int:
    log("[세션 2] NAVER API HUB 포토카드 데이터 수집")

    if not KEY_ID or not KEY:
        log("오류: NAVER_APIGW_KEY_ID / NAVER_APIGW_KEY 환경변수가 필요합니다.")
        log("어떤 키가 맞는지 모르면 먼저 실행: python scripts/naver_auth_probe.py")
        return 1

    posts = collect()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    report(posts)
    return 0 if posts else 1


if __name__ == "__main__":
    sys.exit(main())
