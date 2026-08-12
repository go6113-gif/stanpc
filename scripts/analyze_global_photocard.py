#!/usr/bin/env python3
"""
5개 플랫폼(eBay / Naver / Bluesky / Tumblr / DCInside) 포토카드 데이터 통합 정량 분석기.

출력: data/global_photocard_stats.json  (보고서 작성용 원천 수치)
"""

import csv
import json
import re
import statistics
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "global_photocard_stats.json"

# ---------------------------------------------------------------- 분류 사전

TRADE_PATTERNS = [
    # 한국어
    r"팝니다", r"삽니다", r"구합니다", r"양도", r"교환", r"판매", r"구매", r"거래",
    r"분철", r"택포", r"일괄", r"직거래", r"중고", r"에눌", r"네고", r"입금", r"계좌",
    r"드림", r"나눔", r"가격", r"만원", r"원가", r"배송비", r"선입금", r"쿨거",
    # 영어 / 국제 팬덤 은어
    r"\bwts\b", r"\bwtb\b", r"\bwtt\b", r"\blfs\b", r"\bfor sale\b", r"\bselling\b",
    r"\bsale\b", r"\bbuy\b", r"\bprice\b", r"\bshipping\b", r"\bship\b", r"\bpaypal\b",
    r"\bpreorder\b", r"\bpre-order\b", r"\bin stock\b", r"\brestock\b", r"\border\b",
    r"\bstore\b", r"\bshop\b", r"\bbundle\b", r"\blot\b", r"\bauction\b", r"\bdm to\b",
    r"\$\d", r"₩\d", r"€\d", r"£\d",
]

COLLECT_PATTERNS = [
    # 한국어 - 수집/자랑/인증/소통
    r"인증", r"자랑", r"후기", r"개봉", r"언박싱", r"포카깡", r"깡", r"모았", r"모으",
    r"수집", r"완성", r"보관", r"바인더", r"탑꾸", r"다꾸", r"꾸미", r"최애", r"덕질",
    r"추천", r"질문", r"정보", r"공유", r"구경", r"컬렉션", r"진열", r"정리",
    # 영어
    r"\bcollection\b", r"\bcollecting\b", r"\bcollector\b", r"\bpulled\b", r"\bpull\b",
    r"\bunboxing\b", r"\bunbox\b", r"\bbinder\b", r"\bbias\b", r"\bwishlist\b",
    r"\bfinally\b", r"\bgot\b", r"\bdeco\b", r"\bshowing\b", r"\bmy cards\b",
    r"\bfavorite\b", r"\blove\b", r"\bcute\b", r"\bhelp\b", r"\bquestion\b",
    r"\brecommend\b", r"\btips?\b", r"\bguide\b", r"\bhow to\b", r"\borganiz",
]

TRADE_RE = re.compile("|".join(TRADE_PATTERNS), re.I)
COLLECT_RE = re.compile("|".join(COLLECT_PATTERNS), re.I)

# 실물 바인더 / 규격 / 슬리브 관련 니즈 키워드 (다국어)
NEED_KEYWORDS = {
    "binder_storage": [
        r"\bbinder\b", r"바인더", r"\bcollect ?book\b", r"콜렉트북", r"콜북",
        r"\bstorage\b", r"보관", r"\bcase\b", r"케이스", r"\bholder\b", r"홀더",
        r"\bpocket\b", r"포켓", r"\balbum\b", r"앨범",
    ],
    "sleeve_protect": [
        r"\bsleeves?\b", r"슬리브", r"\btop ?loader\b", r"탑로더", r"토플",
        r"\bprotector\b", r"보호", r"\bpenny sleeve\b", r"하드케이스",
        r"\bhard case\b", r"\blaminat", r"코팅",
    ],
    "size_spec": [
        r"\b\dx\d\b", r"\b(?:a4|a5|a6|b5|b6)\b", r"\bmini\b", r"\bwide\b",
        r"\bstandard\b", r"규격", r"사이즈", r"\bsize\b", r"\d{2,3} ?x ?\d{2,3} ?mm",
        r"\bmm\b", r"\binch\b", r"인치", r"\d+ ?pocket", r"\d+구",
    ],
    "deco_display": [
        r"\bdeco\b", r"탑꾸", r"다꾸", r"꾸미", r"\bsticker\b", r"스티커",
        r"\bkeyring\b", r"키링", r"\bframe\b", r"액자", r"\bdisplay\b", r"진열",
        r"\bstand\b", r"거치",
    ],
    "trade_matching": [
        r"\bwtt\b", r"\btrade\b", r"\btrading\b", r"교환", r"맞교환", r"\bswap\b",
        r"\bmatch\b", r"1:1", r"\bisos?\b", r"\biso\b",
    ],
    "authenticity": [
        r"\bofficial\b", r"정품", r"\bfake\b", r"가품", r"\breal\b", r"진위",
        r"\bauthentic\b", r"\bunofficial\b", r"비공식", r"\bsealed\b", r"미개봉",
    ],
}
NEED_RE = {k: re.compile("|".join(v), re.I) for k, v in NEED_KEYWORDS.items()}

STOPWORDS = set("""
a an the and or of for in on at to with by from is are was were be been this that these those
new used lot set pcs pc item items free ship shipping us usa fast good great best top only
kpop k-pop photocard photocards photo card cards official 포토카드 포카
""".split())


def classify(text):
    """게시물 1건을 '거래/판매' vs '수집/자랑/소통' 축으로 분류."""
    t = text or ""
    trade = bool(TRADE_RE.search(t))
    collect = bool(COLLECT_RE.search(t))
    if trade and not collect:
        return "trade"
    if collect and not trade:
        return "collect"
    if trade and collect:
        # 양쪽 신호가 동시에 있으면 거래 신호 강도로 판정
        return "trade" if len(TRADE_RE.findall(t)) >= len(COLLECT_RE.findall(t)) else "collect"
    return "other"


def need_hits(texts):
    """텍스트 묶음에서 니즈 카테고리별 '언급 게시물 수' 집계."""
    counts = {k: 0 for k in NEED_RE}
    for t in texts:
        for k, rx in NEED_RE.items():
            if rx.search(t or ""):
                counts[k] += 1
    return counts


def top_tokens(texts, n=30):
    c = Counter()
    for t in texts:
        for w in re.findall(r"[a-zA-Z]{3,}|[가-힣]{2,}", (t or "").lower()):
            if w in STOPWORDS:
                continue
            c[w] += 1
    return c.most_common(n)


# ---------------------------------------------------------------- 플랫폼 로더

def load_ebay():
    payload = json.loads((DATA / "ebay_photocard_posts.json").read_text(encoding="utf-8"))
    items = payload["items"]
    return payload["meta"], items


def load_naver():
    rows = json.loads((DATA / "naver_photocard_posts.json").read_text(encoding="utf-8"))
    return [{"text": f"{r.get('title','')} {r.get('description','')}",
             "keyword": r.get("keyword", ""),
             "service": r.get("service", "")} for r in rows]


def load_csv_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def load_bluesky():
    rows = load_csv_rows(DATA / "bluesky_kpop_photocards_large.csv")
    return [{"text": r.get("text", ""), "keyword": r.get("keyword", ""),
             "likes": int(r.get("like_count") or 0),
             "reposts": int(r.get("repost_count") or 0)} for r in rows]


def load_tumblr():
    rows = load_csv_rows(ROOT / "tumblr_kpop_photocards.csv")
    return [{"text": " ".join([r.get("summary", ""), r.get("tags", ""), r.get("caption", "")]),
             "keyword": r.get("searched_tag", ""),
             "tags": r.get("tags", "")} for r in rows]


def load_dcinside():
    raw = json.loads((DATA / "dcinside_raw.json").read_text(encoding="utf-8"))
    posts = []
    for entry in raw:
        titles = re.findall(r'<a[^>]*class="tit_txt"[^>]*>(.*?)</a>', entry["html"], re.S)
        for t in titles:
            clean = re.sub(r"<[^>]+>", "", t)
            clean = (clean.replace("&#34;", '"').replace("&amp;", "&")
                          .replace("&lt;", "<").replace("&gt;", ">").strip())
            posts.append({"text": clean, "keyword": entry.get("keyword", "")})
    return posts


# ---------------------------------------------------------------- eBay 정량

def analyze_ebay(meta, items):
    prices = [i["price"] for i in items if i.get("price")]
    ships = [i["shipping_cost"] for i in items if i.get("shipping_cost") is not None]
    free_ship = sum(1 for s in ships if s == 0)
    calc_ship = sum(1 for i in items if i.get("shipping_type") == "CALCULATED")
    fixed_ship = sum(1 for i in items if i.get("shipping_type") == "FIXED")

    def pstats(vals):
        if not vals:
            return {}
        s = sorted(vals)
        q = statistics.quantiles(s, n=100) if len(s) > 2 else [s[0]] * 99
        return {
            "n": len(s),
            "min": round(min(s), 2),
            "p25": round(q[24], 2),
            "median": round(statistics.median(s), 2),
            "mean": round(statistics.mean(s), 2),
            "p75": round(q[74], 2),
            "p90": round(q[89], 2),
            "p99": round(q[98], 2),
            "max": round(max(s), 2),
        }

    # 가격대 분포
    bands = {"~$5": 0, "$5-10": 0, "$10-20": 0, "$20-50": 0, "$50-100": 0, "$100+": 0}
    for p in prices:
        if p < 5: bands["~$5"] += 1
        elif p < 10: bands["$5-10"] += 1
        elif p < 20: bands["$10-20"] += 1
        elif p < 50: bands["$20-50"] += 1
        elif p < 100: bands["$50-100"] += 1
        else: bands["$100+"] += 1

    titles = [i["title"] for i in items]

    # 그룹별 가격
    group_stats = {}
    for g in sorted({i["keyword_group"] for i in items}):
        gi = [i for i in items if i["keyword_group"] == g]
        gp = [i["price"] for i in gi if i.get("price")]
        gs = [i["shipping_cost"] for i in gi if i.get("shipping_cost") is not None]
        group_stats[g] = {
            "listings": len(gi),
            "share_pct": round(len(gi) / len(items) * 100, 1),
            "price": pstats(gp),
            "shipping_median": round(statistics.median(gs), 2) if gs else None,
            "free_shipping_pct": round(sum(1 for s in gs if s == 0) / len(gs) * 100, 1) if gs else None,
        }

    # 배송비/가격 비율
    pairs = [(i["price"], i["shipping_cost"]) for i in items
             if i.get("price") and i.get("shipping_cost") is not None and i["shipping_cost"] > 0]
    ship_ratio = [round(s / p * 100, 1) for p, s in pairs if p > 0]

    # 낱장 vs 묶음(lot/bundle/set) 매물
    lot_re = re.compile(r"\b(lot|bundle|set of|\d+ ?pcs|\d+pcs|full set|complete set)\b", re.I)
    lot_n = sum(1 for t in titles if lot_re.search(t))
    lot_prices = [i["price"] for i in items if lot_re.search(i["title"]) and i.get("price")]
    single_prices = [i["price"] for i in items if not lot_re.search(i["title"]) and i.get("price")]

    return {
        "meta": {
            "api_requested": meta["api_requested"],
            "api_used": meta["api_used"],
            "finding_api_note": meta["finding_api_note"],
            "collected_at": meta["collected_at"],
            "raw_count": meta["raw_count"],
            "unique_count": meta["unique_count"],
            "marketplace_totals": meta["per_keyword_marketplace_total"],
        },
        "listings": len(items),
        "price": pstats(prices),
        "price_bands": bands,
        "price_bands_pct": {k: round(v / len(prices) * 100, 1) for k, v in bands.items()},
        "shipping": {
            "with_shipping_value": len(ships),
            "free_shipping": free_ship,
            "free_shipping_pct": round(free_ship / len(ships) * 100, 1) if ships else 0,
            "paid_shipping_median": round(statistics.median([s for s in ships if s > 0]), 2),
            "paid_shipping_mean": round(statistics.mean([s for s in ships if s > 0]), 2),
            "calculated_type": calc_ship,
            "calculated_pct": round(calc_ship / len(items) * 100, 1),
            "fixed_type": fixed_ship,
            "shipping_to_price_ratio_median_pct": round(statistics.median(ship_ratio), 1) if ship_ratio else None,
        },
        "groups": group_stats,
        "lot_vs_single": {
            "lot_listings": lot_n,
            "lot_pct": round(lot_n / len(items) * 100, 1),
            "lot_price_median": round(statistics.median(lot_prices), 2) if lot_prices else None,
            "single_price_median": round(statistics.median(single_prices), 2) if single_prices else None,
        },
        "condition": Counter(i.get("condition") or "Unspecified" for i in items).most_common(8),
        "buying_options": Counter(i.get("listing_type") or "" for i in items).most_common(6),
        "top_categories": Counter(i.get("category") or "" for i in items).most_common(10),
        "seller_concentration": {
            "unique_sellers": len({i.get("seller") for i in items if i.get("seller")}),
            "top10_share_pct": round(
                sum(c for _, c in Counter(i.get("seller") for i in items if i.get("seller")).most_common(10))
                / len(items) * 100, 1),
            "top_sellers": Counter(i.get("seller") for i in items if i.get("seller")).most_common(10),
        },
        "title_needs": need_hits(titles),
        "title_needs_pct": {k: round(v / len(titles) * 100, 1) for k, v in need_hits(titles).items()},
        "top_title_tokens": top_tokens(titles, 40),
    }


# ---------------------------------------------------------------- 실행

def analyze_text_platform(name, records):
    texts = [r["text"] for r in records]
    cls = Counter(classify(t) for t in texts)
    n = len(records)
    nh = need_hits(texts)
    return {
        "posts": n,
        "classification": dict(cls),
        "classification_pct": {k: round(v / n * 100, 1) for k, v in cls.items()},
        "collect_pct": round(cls["collect"] / n * 100, 1),
        "trade_pct": round(cls["trade"] / n * 100, 1),
        "other_pct": round(cls["other"] / n * 100, 1),
        "needs": nh,
        "needs_pct": {k: round(v / n * 100, 1) for k, v in nh.items()},
        "top_tokens": top_tokens(texts, 30),
        "keywords_used": Counter(r.get("keyword", "") for r in records).most_common(20),
    }


def main():
    meta, ebay_items = load_ebay()
    result = {}

    result["ebay"] = analyze_ebay(meta, ebay_items)
    # eBay는 마켓플레이스이므로 정의상 거래/판매 100%
    result["ebay"]["classification_pct"] = {"trade": 100.0, "collect": 0.0, "other": 0.0}

    for name, loader in [("naver", load_naver), ("bluesky", load_bluesky),
                         ("tumblr", load_tumblr), ("dcinside", load_dcinside)]:
        recs = loader()
        result[name] = analyze_text_platform(name, recs)

    # 플랫폼 횡단 니즈 집계
    cross = {k: 0 for k in NEED_RE}
    total_posts = 0
    for p in ["ebay", "naver", "bluesky", "tumblr", "dcinside"]:
        src = result[p].get("title_needs") or result[p].get("needs")
        for k in cross:
            cross[k] += src.get(k, 0)
        total_posts += result[p].get("listings") or result[p].get("posts")
    result["cross_platform"] = {
        "total_records": total_posts,
        "need_mentions": cross,
        "need_mentions_pct": {k: round(v / total_posts * 100, 1) for k, v in cross.items()},
    }

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: (v if k == "cross_platform" else
                          {kk: vv for kk, vv in v.items() if kk not in
                           ("top_tokens", "top_title_tokens", "keywords_used")})
                      for k, v in result.items()}, ensure_ascii=False, indent=2))
    print(f"\n>>> saved {OUT}")


if __name__ == "__main__":
    main()
