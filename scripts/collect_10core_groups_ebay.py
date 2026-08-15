#!/usr/bin/env python3
"""
10개 핵심 그룹 전용 eBay 실물 포토카드 대량 수집기.

biasroom_photocards_master.csv의 "그룹당 24건 상한"(페이지네이션 아티팩트,
FULL_AUDIT_MASTER.md 4-2절 참조)을 해제하기 위해, eBay Browse API로 그룹당
최대 300건의 실제 판매 매물(이미지 URL + 가격 + 판매자 + 상태 포함)을 직접
수집한다. scripts/collect_ebay_data.py의 검증된 OAuth/Browse API 호출 로직을
재사용하되, 10개 타깃 그룹으로 범위를 좁히고 그룹당 목표 건수를 300으로 올렸다.

eBay 검색 결과는 "공식 카드 도감"이 아니라 실제 판매 중인 매물이므로, 같은
카드가 여러 판매자에게서 중복 노출되거나 판매자가 붙인 제목이 제각각일 수
있다. item_id 기준으로만 중복 제거하며, Member/Version 태깅 등 카탈로그
정규화는 이 스크립트의 범위 밖이다 (후속 단계).

출력: data/ebay_10core_groups.json (그룹별 raw listing + per-group 카운트)
"""

import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "poca-exchange" / ".env")
load_dotenv(_ROOT / ".env")

OUTPUT_FILE = _ROOT / "data" / "ebay_10core_groups.json"
TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
BROWSE_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
APP_SCOPE = "https://api.ebay.com/oauth/api_scope"

APP_ID = os.getenv("EBAY_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("EBAY_CLIENT_SECRET", "")

# 10개 핵심 그룹 — biasroom_groups_master.csv의 Name_EN 표기와 일치시켜
# 나중에 Group 테이블과 그대로 매칭 가능하게 함.
TARGET_GROUPS = [
    "BTS",
    "SEVENTEEN",
    "Stray Kids",
    "ENHYPEN",
    "TOMORROW X TOGETHER",
    "NewJeans",
    "IVE",
    "aespa",
    "LE SSERAFIM",
    "TWICE",
]

PAGE_SIZE = 150       # eBay Browse API 1페이지 최대 200, 여유를 두고 150
PAGES_PER_GROUP = 2   # 150 x 2 = 300건 목표
GOAL_PER_GROUP = 300


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def get_app_token():
    resp = requests.post(
        TOKEN_URL,
        auth=(APP_ID, CLIENT_SECRET),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials", "scope": APP_SCOPE},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def browse_search(token, keyword, limit, offset):
    resp = requests.get(
        BROWSE_SEARCH_URL,
        params={"q": keyword, "limit": limit, "offset": offset},
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        timeout=25,
    )
    resp.raise_for_status()
    return resp.json()


def normalize_item(item, group):
    price = item.get("price") or {}
    img = (item.get("image") or {}).get("imageUrl", "")
    if not img:
        thumbs = item.get("thumbnailImages") or []
        img = thumbs[0].get("imageUrl") if thumbs else ""
    return {
        "group": group,
        "item_id": item.get("itemId", ""),
        "title": item.get("title", ""),
        "image_url": img,
        "price": float(price.get("value", 0) or 0),
        "currency": price.get("currency", "USD"),
        "condition": item.get("condition", ""),
        "seller": (item.get("seller") or {}).get("username"),
        "item_location": (item.get("itemLocation") or {}).get("country", ""),
        "url": item.get("itemWebUrl", ""),
        "collected_at": datetime.now().isoformat(timespec="seconds"),
    }


def collect():
    if not APP_ID or not CLIENT_SECRET:
        raise SystemExit("EBAY_CLIENT_ID/EBAY_CLIENT_SECRET가 설정되지 않았습니다.")

    log(f"App ID 적용: {APP_ID[:12]}...{APP_ID[-4:]}")
    token = get_app_token()
    log("OAuth client_credentials 토큰 발급 완료")

    per_group_items = {}
    per_group_market_total = {}
    per_group_errors = {}

    for group in TARGET_GROUPS:
        keyword = f"{group} photocard"
        log(f"[{group}] 수집 시작 (keyword='{keyword}', 목표 {GOAL_PER_GROUP}건)")
        collected = []
        seen_ids = set()
        try:
            for page in range(PAGES_PER_GROUP):
                data = browse_search(token, keyword, PAGE_SIZE, page * PAGE_SIZE)
                if page == 0:
                    per_group_market_total[group] = data.get("total", 0)
                summaries = data.get("itemSummaries") or []
                for it in summaries:
                    norm = normalize_item(it, group)
                    if not norm["item_id"] or norm["item_id"] in seen_ids:
                        continue
                    if not norm["image_url"]:
                        continue  # 이미지 없는 매물은 카드 데이터로 쓸모 없음
                    seen_ids.add(norm["item_id"])
                    collected.append(norm)
                log(f"  page {page+1}: +{len(summaries)}건 (누적 유효 {len(collected)}건)")
                if len(summaries) < PAGE_SIZE:
                    break
                time.sleep(0.3)
        except Exception as e:
            per_group_errors[group] = f"{type(e).__name__}: {e}"
            log(f"  ❌ 오류: {per_group_errors[group]}")

        per_group_items[group] = collected
        eBay_total = per_group_market_total.get(group, "n/a")
        log(f"[{group}] 완료: 유효 이미지 매물 {len(collected)}건 확보 (eBay 전체 매물 수: {eBay_total})")
        time.sleep(0.3)

    total_collected = sum(len(v) for v in per_group_items.values())

    payload = {
        "meta": {
            "platform": "eBay Browse API",
            "collected_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "marketplace": "EBAY_US",
            "target_groups": TARGET_GROUPS,
            "goal_per_group": GOAL_PER_GROUP,
            "per_group_collected_count": {g: len(v) for g, v in per_group_items.items()},
            "per_group_ebay_market_total": per_group_market_total,
            "per_group_errors": per_group_errors,
            "total_collected": total_collected,
        },
        "items_by_group": per_group_items,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    log(f"[OK] 전체 완료: {total_collected}건 저장 -> {OUTPUT_FILE}")
    log("")
    log("=== 그룹별 최종 결과 ===")
    for g in TARGET_GROUPS:
        cnt = len(per_group_items.get(g, []))
        mkt = per_group_market_total.get(g, "n/a")
        err = per_group_errors.get(g, "")
        status = f"ERROR: {err}" if err else "OK"
        log(f"  {g:22s} 확보 {cnt:4d}건 / eBay 전체 매물 {mkt} / {status}")


if __name__ == "__main__":
    collect()
