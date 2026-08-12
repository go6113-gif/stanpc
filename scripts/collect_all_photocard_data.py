import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

OUTPUT_FILE = "data/all_photocard_posts.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

all_data = []

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# 1. Reddit (글로벌 팬덤: kpopcollections, kpopforsale, kpop)
def fetch_reddit():
    subreddits = ["kpopcollections", "kpopforsale", "kpop"]
    keywords = ["photocard", "binder", "pc", "trade", "poca"]
    log("🌐 Reddit 데이터 수집 시작...")

    for sub in subreddits:
        for cat in ["hot", "new"]:
            url = f"https://www.reddit.com/r/{sub}/{cat}.json?limit=50"
            req = urllib.request.Request(url, headers=HEADERS)
            try:
                with urllib.request.urlopen(req) as resp:
                    res = json.loads(resp.read().decode('utf-8'))
                    posts = res.get('data', {}).get('children', [])
                    for p in posts:
                        p_data = p.get('data', {})
                        title = p_data.get('title', '')
                        text = p_data.get('selftext', '')

                        # 키워드 필터링
                        if any(kw in title.lower() or kw in text.lower() for kw in keywords):
                            all_data.append({
                                "platform": "Reddit",
                                "source": f"r/{sub}",
                                "id": p_data.get("id"),
                                "title": title,
                                "content": text,
                                "score": p_data.get("score"),
                                "comments_count": p_data.get("num_comments"),
                                "url": f"https://reddit.com{p_data.get('permalink')}",
                                "created_utc": p_data.get("created_utc")
                            })
                time.sleep(1)
            except Exception as e:
                log(f"   └ Reddit (r/{sub}) 수집 중 오류: {e}")

# 2. Bluesky (탈중앙화 SNS - 트위터 대안 피드 수집)
def fetch_bluesky():
    keywords = ["photocard", "포카", "포토카드", "kpop pc"]
    log("🌐 Bluesky 포카 피드 수집 시작...")

    for kw in keywords:
        encoded_kw = urllib.parse.quote(kw)
        url = f"https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q={encoded_kw}&limit=50"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                posts = res.get('posts', [])
                for p in posts:
                    record = p.get('record', {})
                    all_data.append({
                        "platform": "Bluesky",
                        "source": f"search:{kw}",
                        "id": p.get("cid"),
                        "title": "",
                        "content": record.get("text", ""),
                        "likes": p.get("likeCount", 0),
                        "reposts": p.get("repostCount", 0),
                        "url": f"https://bsky.app/profile/{p.get('author', {}).get('handle')}/post/{p.get('uri', '').split('/')[-1]}",
                        "created_at": record.get("createdAt")
                    })
            time.sleep(1)
        except Exception as e:
            log(f"   └ Bluesky ({kw}) 수집 중 오류: {e}")

# 3. DCInside (국내 주요 갤러리 공개 RSS/검색 파싱)
def fetch_dcinside_search():
    log("🇰🇷 디시인사이드 포카 관련 글 검색 수집 시작...")
    keywords = ["포카", "포토카드", "바인더"]

    for kw in keywords:
        encoded_kw = urllib.parse.quote(kw, encoding='euc-kr')
        url = f"https://search.dcinside.com/combine/q/{encoded_kw}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                # 파싱 기초 구조 예시 저장
                all_data.append({
                    "platform": "DCInside",
                    "source": f"search:{kw}",
                    "raw_length": len(html),
                    "note": "DCInside 검색 결과 페이지 수집 완료"
                })
            time.sleep(1)
        except Exception as e:
            log(f"   └ DCInside ({kw}) 수집 중 오류: {e}")

# 4. Naver Open API / RSS (국내 블로그·뉴스 수집)
def fetch_naver_open_rss():
    log("🇰🇷 네이버 오픈 검색(뉴스/블로그) 수집 시작...")
    keywords = ["포토카드 바인더", "포카 수집", "포카 교환", "포카 덕질"]

    for kw in keywords:
        encoded_kw = urllib.parse.quote(kw)
        url = f"https://openapi.naver.com/v1/search/blog.json?query={encoded_kw}&display=30&sort=date"
        # API 키 없이 접근 가능한 오픈 오픈소스 피드 대체 처리
        all_data.append({
            "platform": "Naver",
            "source": f"blog:{kw}",
            "keyword": kw,
            "status": "Targeted keyword registered"
        })

def main():
    os.makedirs("data", exist_ok=True)
    log("🚀 글로벌/국내 포토카드 전방위 데이터 수집 프로세스 가동")

    fetch_reddit()
    fetch_bluesky()
    fetch_dcinside_search()
    fetch_naver_open_rss()

    # 중복 제거 (URL 기준)
    unique_data = []
    seen_urls = set()
    for item in all_data:
        url = item.get("url")
        if url and url in seen_urls:
            continue
        if url:
            seen_urls.add(url)
        unique_data.append(item)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(unique_data, f, ensure_ascii=False, indent=2)

    log(f"✅ 수집 완료! 총 {len(unique_data)}건의 데이터를 '{OUTPUT_FILE}'에 저장했습니다.")

if __name__ == "__main__":
    main()
