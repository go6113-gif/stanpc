#!/usr/bin/env python3
"""
eBay 글로벌 포토카드 매물 수집기

1순위: eBay Finding API (findItemsByKeywords, SECURITY-APPNAME=EBAY_APP_ID)
2순위: eBay Browse API (item_summary/search, OAuth client_credentials)

Finding API(svcs.ebay.com)는 eBay가 공식 은퇴시킨 레거시 서비스로 현재
HTTP 418을 반환한다. 이 경우 eBay가 지정한 공식 후속 API인 Browse API로
자동 전환하며, 어떤 API가 실제로 사용됐는지 결과 메타데이터에 기록한다.

출력: data/ebay_photocard_posts.json
"""

import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "poca-exchange" / ".env")
load_dotenv(_ROOT / ".env")

OUTPUT_FILE = _ROOT / "data" / "ebay_photocard_posts.json"

FINDING_URL = "https://svcs.ebay.com/services/search/FindingService/v1"
TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
BROWSE_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
APP_SCOPE = "https://api.ebay.com/oauth/api_scope"

# EBAY_APP_ID 우선, 없으면 프로젝트가 이미 보유한 EBAY_CLIENT_ID(=App ID)를 사용
APP_ID = os.getenv("EBAY_APP_ID") or os.getenv("EBAY_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("EBAY_CLIENT_SECRET", "")

# 키워드를 분석 축(collection / storage_deco / trade / fandom)별로 그룹화
KEYWORD_GROUPS = {
    "artist_photocard": [
        "kpop photocard",
        "bts photocard",
        "stray kids photocard",
        "seventeen photocard",
        "twice photocard",
        "newjeans photocard",
        "blackpink photocard",
        "ateez photocard",
        "enhypen photocard",
        "txt photocard",
        "le sserafim photocard",
        "ive photocard",
        "aespa photocard",
    ],
    "storage_binder": [
        "photocard binder",
        "kpop photocard album",
        "photocard collect book",
        "photocard storage case",
        "photocard holder",
    ],
    "protect_sleeve": [
        "photocard sleeves",
        "photocard toploader",
        "photocard protector",
        "penny sleeves photocard",
    ],
    "deco_display": [
        "photocard deco",
        "photocard keyring",
        "photocard frame display",
        "photocard sticker deco",
    ],
    "trade_market": [
        "kpop photocard lot",
        "rare photocard kpop",
        "photocard bundle kpop",
        "official photocard sealed",
    ],
}

PER_KEYWORD_LIMIT = 200   # Browse API 1페이지 최대치
PAGES_PER_KEYWORD = 2     # 키워드당 최대 400건


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# --------------------------------------------------------------------------
# 1순위: Finding API
# --------------------------------------------------------------------------

def try_finding_api(keyword, entries=100):
    """Finding API 호출. 성공 시 item 리스트, 실패 시 예외 발생."""
    params = {
        "OPERATION-NAME": "findItemsByKeywords",
        "SERVICE-VERSION": "1.13.0",
        "SECURITY-APPNAME": APP_ID,
        "RESPONSE-DATA-FORMAT": "JSON",
        "REST-PAYLOAD": "",
        "GLOBAL-ID": "EBAY-US",
        "keywords": keyword,
        "paginationInput.entriesPerPage": str(entries),
    }
    url = f"{FINDING_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "StanPC-Research/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    root = data["findItemsByKeywordsResponse"][0]
    if root["ack"][0] != "Success":
        raise RuntimeError(f"Finding API ack={root['ack'][0]}")
    return root.get("searchResult", [{}])[0].get("item", [])


def normalize_finding_item(item, keyword, group):
    price = item["sellingStatus"][0]["currentPrice"][0]
    ship = (item.get("shippingInfo") or [{}])[0]
    ship_cost = ship.get("shippingServiceCost", [{}])[0]
    return {
        "platform": "eBay",
        "api": "finding",
        "keyword": keyword,
        "keyword_group": group,
        "item_id": item.get("itemId", [""])[0],
        "title": item.get("title", [""])[0],
        "price": float(price.get("__value__", 0) or 0),
        "currency": price.get("@currencyId", "USD"),
        "shipping_cost": float(ship_cost.get("__value__", 0) or 0) if ship_cost else None,
        "shipping_type": ship.get("shippingType", [None])[0],
        "condition": (item.get("condition") or [{}])[0].get("conditionDisplayName", [""])[0],
        "listing_type": (item.get("listingInfo") or [{}])[0].get("listingType", [""])[0],
        "category": (item.get("primaryCategory") or [{}])[0].get("categoryName", [""])[0],
        "seller": None,
        "item_location": item.get("location", [""])[0],
        "url": item.get("viewItemURL", [""])[0],
        "image_url": item.get("galleryURL", [""])[0],
        "listing_start": (item.get("listingInfo") or [{}])[0].get("startTime", [""])[0],
        "collected_at": datetime.now().isoformat(timespec="seconds"),
    }


# --------------------------------------------------------------------------
# 2순위: Browse API
# --------------------------------------------------------------------------

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


def normalize_browse_item(item, keyword, group):
    price = item.get("price") or {}
    ship_opts = item.get("shippingOptions") or [{}]
    ship = ship_opts[0]
    ship_cost_obj = ship.get("shippingCost") or {}
    ship_cost = ship_cost_obj.get("value")
    cats = item.get("categories") or [{}]
    return {
        "platform": "eBay",
        "api": "browse",
        "keyword": keyword,
        "keyword_group": group,
        "item_id": item.get("itemId", ""),
        "title": item.get("title", ""),
        "price": float(price.get("value", 0) or 0),
        "currency": price.get("currency", "USD"),
        "shipping_cost": float(ship_cost) if ship_cost is not None else None,
        "shipping_type": ship.get("shippingCostType"),
        "condition": item.get("condition", ""),
        "listing_type": ",".join(item.get("buyingOptions") or []),
        "category": cats[0].get("categoryName", ""),
        "seller": (item.get("seller") or {}).get("username"),
        "seller_feedback": (item.get("seller") or {}).get("feedbackPercentage"),
        "item_location": (item.get("itemLocation") or {}).get("country", ""),
        "url": item.get("itemWebUrl", ""),
        "image_url": (item.get("image") or {}).get("imageUrl", ""),
        "listing_start": item.get("itemCreationDate", ""),
        "collected_at": datetime.now().isoformat(timespec="seconds"),
    }


# --------------------------------------------------------------------------

def collect():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    if not APP_ID:
        raise SystemExit("EBAY_APP_ID(또는 EBAY_CLIENT_ID)가 설정되지 않았습니다.")

    log(f"🔑 App ID 적용: {APP_ID[:12]}...{APP_ID[-4:]}")

    api_used = "finding"
    finding_note = None
    token = None

    # --- Finding API 가용성 점검 ---
    log("🧪 eBay Finding API 가용성 점검 중...")
    try:
        try_finding_api("kpop photocard", entries=1)
        log("   └ Finding API 사용 가능")
    except Exception as e:
        finding_note = f"{type(e).__name__}: {e}"
        api_used = "browse"
        log(f"   └ Finding API 사용 불가 ({finding_note})")
        log("   └ eBay 공식 후속 API인 Browse API로 자동 전환")
        token = get_app_token()
        log("   └ OAuth client_credentials 토큰 발급 완료")

    all_items = []
    per_keyword_counts = {}
    total_available = {}

    for group, keywords in KEYWORD_GROUPS.items():
        log(f"📦 [{group}] 그룹 수집 시작 ({len(keywords)}개 키워드)")
        for kw in keywords:
            got = 0
            try:
                if api_used == "finding":
                    items = try_finding_api(kw, entries=100)
                    for it in items:
                        all_items.append(normalize_finding_item(it, kw, group))
                    got = len(items)
                else:
                    for page in range(PAGES_PER_KEYWORD):
                        data = browse_search(
                            token, kw, PER_KEYWORD_LIMIT, page * PER_KEYWORD_LIMIT
                        )
                        if page == 0:
                            total_available[kw] = data.get("total", 0)
                        summaries = data.get("itemSummaries") or []
                        for it in summaries:
                            all_items.append(normalize_browse_item(it, kw, group))
                        got += len(summaries)
                        if len(summaries) < PER_KEYWORD_LIMIT:
                            break
                        time.sleep(0.3)
                log(f"   └ '{kw}': {got}건 (eBay 전체 매물 {total_available.get(kw, 'n/a')}건)")
            except Exception as e:
                log(f"   └ '{kw}' 수집 실패: {type(e).__name__}: {e}")
            time.sleep(0.3)

            per_keyword_counts[kw] = got

    # itemId 기준 중복 제거 (키워드 간 교차 노출 제거)
    unique, seen = [], set()
    for it in all_items:
        key = it.get("item_id") or it.get("url")
        if key in seen:
            continue
        seen.add(key)
        unique.append(it)

    payload = {
        "meta": {
            "platform": "eBay",
            "collected_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "api_requested": "finding",
            "api_used": api_used,
            "finding_api_note": finding_note,
            "marketplace": "EBAY_US",
            "keyword_groups": KEYWORD_GROUPS,
            "raw_count": len(all_items),
            "unique_count": len(unique),
            "per_keyword_collected": per_keyword_counts,
            "per_keyword_marketplace_total": total_available,
        },
        "items": unique,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    log(f"✅ 수집 완료: 원본 {len(all_items)}건 → 중복 제거 {len(unique)}건")
    log(f"   저장 위치: {OUTPUT_FILE}")


if __name__ == "__main__":
    collect()
