import os
import json
import time
import urllib.request
import urllib.parse
import re
from datetime import datetime
from html.parser import HTMLParser
from html import unescape

OUTPUT_FILE = "data/dcinside_parsed.json"
RAW_HTML_FILE = "data/dcinside_raw.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://search.dcinside.com/'
}

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# 1단계: DCInside 검색 결과 HTML 수집
def fetch_dcinside_raw():
    """DCInside 검색 결과에서 원본 HTML 수집"""
    keywords = ["포카", "포토카드", "바인더"]
    raw_data = []

    log("📥 DCInside 원본 HTML 수집 시작...")

    for kw in keywords:
        encoded_kw = urllib.parse.quote(kw, encoding='utf-8')
        # DCInside 검색 URL (갤러리 검색 포함)
        url = f"https://search.dcinside.com/combine/q/{encoded_kw}"

        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                html_content = resp.read().decode('utf-8', errors='ignore')
                raw_data.append({
                    "keyword": kw,
                    "url": url,
                    "html": html_content,
                    "fetch_time": datetime.now().isoformat(),
                    "length": len(html_content)
                })
                log(f"   ✅ '{kw}' 검색 완료 ({len(html_content)} bytes)")
            time.sleep(2)
        except Exception as e:
            log(f"   ❌ '{kw}' 수집 실패: {e}")

    # 원본 HTML 저장
    os.makedirs("data", exist_ok=True)
    with open(RAW_HTML_FILE, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, ensure_ascii=False, indent=2)

    return raw_data

# 2단계: HTML에서 게시글 정보 추출
class DCInsideParser(HTMLParser):
    """DCInside 검색 결과 HTML 파서"""

    def __init__(self):
        super().__init__()
        self.posts = []
        self.current_post = {}
        self.in_list = False
        self.in_title = False
        self.in_gallery = False
        self.in_date = False
        self.in_count = False
        self.temp_text = ""
        self.capture_next_link = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        # 게시글 리스트 아이템 시작
        if tag == 'li' and 'class' in attrs_dict:
            if 'list_item' in attrs_dict.get('class', '') or 'search_result' in attrs_dict.get('class', ''):
                self.in_list = True
                self.current_post = {}

        # 제목 링크
        if tag == 'a' and self.in_list:
            href = attrs_dict.get('href', '')
            # 게시글 URL 추출 (갤러리 게시글 패턴)
            if '/gall/' in href or '/board/' in href:
                self.current_post['url'] = href
                self.in_title = True
                self.capture_next_link = True

        # 갤러리명 추출
        if tag == 'a' and 'gallery' in attrs_dict.get('class', ''):
            self.in_gallery = True

        # 날짜/댓글 수 관련 span/em
        if tag in ['span', 'em', 'time']:
            class_name = attrs_dict.get('class', '')
            if 'date' in class_name or 'time' in class_name:
                self.in_date = True
            elif 'count' in class_name or 'comment' in class_name:
                self.in_count = True

    def handle_endtag(self, tag):
        if tag == 'li' and self.in_list:
            self.in_list = False
            if self.current_post:
                self.posts.append(self.current_post)
            self.current_post = {}

        if tag == 'a' and self.in_title:
            self.in_title = False

        if tag == 'a' and self.in_gallery:
            self.in_gallery = False

        if tag in ['span', 'em', 'time']:
            if self.in_date:
                self.in_date = False
            if self.in_count:
                self.in_count = False

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        if self.in_title:
            self.current_post['title'] = data

        if self.in_gallery:
            self.current_post['gallery'] = data

        if self.in_date:
            self.current_post['date'] = data

        if self.in_count:
            if 'comments' not in self.current_post:
                self.current_post['comments'] = 0
            # 숫자만 추출
            numbers = re.findall(r'\d+', data)
            if numbers:
                self.current_post['comments'] = int(numbers[0])

def parse_dcinside_html(html_content):
    """HTML 파싱 및 게시글 추출"""
    parser = DCInsideParser()
    try:
        parser.feed(html_content)
    except Exception as e:
        log(f"   ⚠️ 파싱 중 오류: {e}")

    return parser.posts

# 3단계: 정규표현식 기반 보조 파싱 (HTMLParser로 놓친 부분 보완)
def extract_posts_with_regex(html_content, keyword):
    """정규표현식으로 게시글 정보 추출 (HTMLParser 보완)"""
    posts = []

    # 전형적인 검색 결과 패턴
    # 제목, URL, 갤러리명, 날짜, 댓글 수 추출

    # 패턴 1: DCInside 갤러리 게시글
    pattern = r'<a[^>]*href="([^"]*?(?:/gall/|/board/)[^"]*?)"[^>]*title="([^"]*?)"[^>]*>([^<]*?)</a>'
    matches = re.finditer(pattern, html_content)

    for match in matches:
        url, title_attr, title_text = match.groups()
        title = title_attr or title_text or ""

        if title.strip():
            post = {
                'keyword': keyword,
                'title': unescape(title.strip()),
                'url': url,
                'gallery': '',
                'date': '',
                'comments': 0
            }
            posts.append(post)

    # 패턴 2: 갤러리명 추출 (각 게시글마다)
    gallery_pattern = r'<a[^>]*class="[^"]*gallery[^"]*"[^>]*>([^<]*?)</a>'
    galleries = re.findall(gallery_pattern, html_content)

    for i, gallery in enumerate(galleries):
        if i < len(posts):
            posts[i]['gallery'] = gallery.strip()

    # 패턴 3: 날짜 추출
    date_pattern = r'<(?:span|em|time)[^>]*class="[^"]*(?:date|time)[^"]*"[^>]*>([^<]*?)</(?:span|em|time)>'
    dates = re.findall(date_pattern, html_content)

    for i, date in enumerate(dates):
        if i < len(posts):
            posts[i]['date'] = date.strip()

    return posts

# 4단계: 데이터 분석 및 저장
def analyze_and_save(all_posts):
    """추출된 게시글 분석 및 저장"""

    # 중복 제거 (URL 기준)
    unique_posts = {}
    for post in all_posts:
        url = post.get('url', '')
        if url and url not in unique_posts:
            unique_posts[url] = post

    posts_list = list(unique_posts.values())

    # 분석
    analysis = {
        "total_posts": len(posts_list),
        "keywords": list(set(p.get('keyword', '') for p in posts_list)),
        "galleries": list(set(p.get('gallery', '') for p in posts_list if p.get('gallery'))),
        "avg_comments": sum(p.get('comments', 0) for p in posts_list) / max(len(posts_list), 1),
        "top_galleries": {},
        "most_commented": sorted(posts_list, key=lambda x: x.get('comments', 0), reverse=True)[:10],
        "posts": posts_list
    }

    # 갤러리별 게시글 수
    for post in posts_list:
        gallery = post.get('gallery', 'Unknown')
        analysis['top_galleries'][gallery] = analysis['top_galleries'].get(gallery, 0) + 1

    # 저장
    os.makedirs("data", exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)

    return analysis

def main():
    log("🚀 DCInside 데이터 파싱 프로세스 시작\n")

    # Step 1: 원본 HTML 수집
    raw_data = fetch_dcinside_raw()

    if not raw_data:
        log("❌ HTML 수집 실패")
        return

    log(f"\n✅ {len(raw_data)}개 검색결과 HTML 수집 완료\n")

    # Step 2: 각 HTML 파싱
    all_posts = []
    log("🔍 HTML 파싱 시작...\n")

    for item in raw_data:
        keyword = item['keyword']
        html = item['html']

        log(f"📄 '{keyword}' 파싱 중...")

        # 이중 파싱 (HTMLParser + Regex)
        posts_html = parse_dcinside_html(html)
        posts_regex = extract_posts_with_regex(html, keyword)

        # Regex 결과가 더 안정적일 경우가 많음
        posts = posts_regex if posts_regex else posts_html

        for post in posts:
            if 'keyword' not in post:
                post['keyword'] = keyword

        all_posts.extend(posts)
        log(f"   → {len(posts)}개 게시글 추출 완료\n")

    if not all_posts:
        log("⚠️ 파싱된 게시글이 없습니다. HTML 구조가 예상과 다를 수 있습니다.")
        log("data/dcinside_raw.json 에서 HTML을 직접 확인하세요.")
        return

    # Step 3: 분석 및 저장
    log("📊 데이터 분석 및 저장...\n")
    analysis = analyze_and_save(all_posts)

    # 결과 출력
    log(f"✅ 파싱 완료!\n")
    log(f"📈 통계:")
    log(f"   • 총 게시글: {analysis['total_posts']}건")
    log(f"   • 검색 키워드: {', '.join(analysis['keywords'])}")
    log(f"   • 갤러리 수: {len(analysis['galleries'])}개")
    log(f"   • 평균 댓글: {analysis['avg_comments']:.1f}개\n")

    if analysis['top_galleries']:
        log(f"🏆 상위 갤러리:")
        for gallery, count in sorted(analysis['top_galleries'].items(), key=lambda x: x[1], reverse=True)[:5]:
            log(f"   • {gallery}: {count}개")

    log(f"\n💾 결과 저장:")
    log(f"   • {OUTPUT_FILE}")
    log(f"   • {RAW_HTML_FILE}")

if __name__ == "__main__":
    main()
