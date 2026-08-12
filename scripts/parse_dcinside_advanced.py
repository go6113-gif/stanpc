"""
DCInside 포토카드 커뮤니티 데이터 수집 및 분석
- Strategy 1: 주요 포카 갤러리 직접 접근 (안정적)
- Strategy 2: Selenium 브라우저 자동화 (선택 사항)
"""

import os
import json
import time
import urllib.request
import re
from datetime import datetime
from html import unescape

OUTPUT_FILE = "data/dcinside_posts_analysis.json"
GALLERY_DATA_FILE = "data/dcinside_galleries.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9'
}

# 포카 관련 주요 갤러리 (DCInside 커뮤니티의 포카/앨범 메인 갤러리들)
PHOTOCARD_GALLERIES = {
    'kpop': {'name': 'K-POP 갤러리', 'url': 'https://gall.dcinside.com/kpop'},
    'photocard': {'name': '포토카드 갤러리', 'url': 'https://gall.dcinside.com/photocard'},
    'mini': {'name': '포토카드 미니갤러리', 'url': 'https://gall.dcinside.com/mini/photocard'},
    'collect': {'name': '덕질 갤러리', 'url': 'https://gall.dcinside.com/collect'},
}

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# Strategy 1: 갤러리 게시글 목록 직접 파싱
def fetch_gallery_posts(gallery_key, gallery_info):
    """갤러리의 게시글 목록 페이지 수집 및 파싱"""

    log(f"📥 '{gallery_info['name']}' 에서 게시글 수집...")

    posts = []
    url = gallery_info['url']

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')

            # 게시글 행 추출 (갤러리의 일반적인 구조)
            # <tr class="ub-content" ...> 패턴
            rows = re.finditer(
                r'<tr[^>]*class="[^"]*ub-content[^"]*"[^>]*data-no="(\d+)"[^>]*>(.*?)</tr>',
                html,
                re.DOTALL
            )

            for row_match in rows:
                post_no = row_match.group(1)
                row_html = row_match.group(2)

                # 제목 추출
                title_match = re.search(r'<a[^>]*href="[^"]*view[^"]*"[^>]*title="([^"]*)"[^>]*>([^<]*)</a>', row_html)
                title = title_match.group(2).strip() if title_match else ""

                # URL 구성
                post_url = f"{url}/posts/{post_no}" if post_no else ""

                # 작성자/갤러리명
                author_match = re.search(r'<td[^>]*class="[^"]*ub-author[^"]*"[^>]*>([^<]*)</td>', row_html)
                author = author_match.group(1).strip() if author_match else ""

                # 날짜 추출
                date_match = re.search(r'<span[^>]*class="[^"]*gall_date[^"]*"[^>]*>([^<]*)</span>', row_html)
                date_str = date_match.group(1).strip() if date_match else ""

                # 댓글/추천 수
                # <td class="ub-num">숫자</td>
                num_matches = re.findall(r'<td[^>]*class="[^"]*ub-num[^"]*"[^>]*>(\d+)</td>', row_html)

                post = {
                    'gallery': gallery_info['name'],
                    'gallery_key': gallery_key,
                    'post_no': post_no,
                    'title': unescape(title),
                    'url': post_url,
                    'author': author,
                    'date': date_str,
                    'comments': int(num_matches[0]) if num_matches else 0,
                    'likes': int(num_matches[1]) if len(num_matches) > 1 else 0,
                }

                if title.strip():  # 제목이 있을 때만 추가
                    posts.append(post)

            log(f"   ✅ {len(posts)}개 게시글 추출 완료")

    except Exception as e:
        log(f"   ❌ 오류: {e}")

    time.sleep(1)  # Rate limiting
    return posts

# 텍스트 분석: 키워드 추출
def analyze_keywords(posts):
    """게시글 제목에서 주요 키워드 추출"""

    # 불용어 (stopwords)
    stopwords = {
        '입니다', '있습니다', '했습니다', '합니다', '됩니다',
        '한다', '있다', '된다', '하다', '이다', '이것', '저것',
        '것', '수', '들', '을', '를', '이', '가', '는', '과', '와',
        '포카', '포토카드', '바인더', '앨범', '포카세트',
        '자', '해', '네', '요', '뭔가', '진짜', '정말', '너무'
    }

    keyword_freq = {}

    for post in posts:
        title = post.get('title', '').lower()

        # 2글자 이상 명사/키워드 추출 (단순 문자 분리)
        words = re.findall(r'[가-힣]{2,}', title)

        for word in words:
            if word not in stopwords and len(word) >= 2:
                keyword_freq[word] = keyword_freq.get(word, 0) + 1

    # 빈도순 정렬
    sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)

    return sorted_keywords[:30]  # 상위 30개

# 감정/주제 분류 (간단한 규칙 기반)
def categorize_posts(posts):
    """게시글을 주제별로 분류"""

    categories = {
        '자랑/인증': {'posts': [], 'keywords': ['인증', '자랑', '갖고', '완성', '구했다', '구함', '받았다']},
        '구매/판매': {'posts': [], 'keywords': ['팝니다', '팝니다', '사세요', '팔아요', '찾습니다', '찾아요']},
        '교환/거래': {'posts': [], 'keywords': ['바꿔', '교환', '맞춰', '바꾸', '거래', '양도']},
        '정보공유': {'posts': [], 'keywords': ['정보', '가이드', '후기', '팁', '초보', '어떻게', '어디서']},
        '팬덤활동': {'posts': [], 'keywords': ['응원', '덕질', '최애', '멤버', '뮤직비디오', '콘서트']},
    }

    for post in posts:
        title = post.get('title', '').lower()
        categorized = False

        for category, info in categories.items():
            if any(keyword in title for keyword in info['keywords']):
                info['posts'].append(post)
                categorized = True
                break

        if not categorized:
            # 기타로 분류
            if 'etc' not in categories:
                categories['기타'] = {'posts': [], 'keywords': []}
            categories['기타']['posts'].append(post)

    return categories

def main():
    log("🚀 DCInside 포토카드 커뮤니티 데이터 수집 및 분석\n")

    all_posts = []
    gallery_stats = {}

    # Step 1: 주요 갤러리에서 데이터 수집
    log("📊 주요 포카 갤러리 데이터 수집...\n")

    for gallery_key, gallery_info in PHOTOCARD_GALLERIES.items():
        posts = fetch_gallery_posts(gallery_key, gallery_info)
        all_posts.extend(posts)
        gallery_stats[gallery_key] = {
            'name': gallery_info['name'],
            'post_count': len(posts),
            'avg_comments': sum(p.get('comments', 0) for p in posts) / max(len(posts), 1) if posts else 0,
            'avg_likes': sum(p.get('likes', 0) for p in posts) / max(len(posts), 1) if posts else 0,
        }

    if not all_posts:
        log("\n⚠️ 수집된 게시글이 없습니다.")
        log("💡 해결 방법:")
        log("   1. Selenium 사용: pip install selenium")
        log("   2. 스크립트 실행: python scripts/parse_dcinside_selenium.py")
        log("   3. 또는 API 문서 확인: DCInside 갤러리 구조 변경 가능성")
        return

    # Step 2: 데이터 분석
    log(f"\n✅ {len(all_posts)}개 게시글 수집 완료\n")
    log("🔍 텍스트 분석 중...\n")

    # 키워드 분석
    top_keywords = analyze_keywords(all_posts)

    # 주제 분류
    categorized = categorize_posts(all_posts)

    # Step 3: 통합 분석 결과
    analysis = {
        'metadata': {
            'collected_at': datetime.now().isoformat(),
            'total_posts': len(all_posts),
            'gallery_count': len([g for g in gallery_stats.values() if g['post_count'] > 0]),
            'date_range': 'Last page of galleries',
        },
        'gallery_stats': gallery_stats,
        'top_keywords': [{'keyword': kw, 'frequency': freq} for kw, freq in top_keywords],
        'category_analysis': {
            category: {
                'count': len(info['posts']),
                'percentage': f"{len(info['posts'])/len(all_posts)*100:.1f}%",
                'sample_posts': [p['title'] for p in info['posts'][:3]]
            }
            for category, info in categorized.items()
        },
        'top_posts': sorted(all_posts, key=lambda x: x.get('comments', 0) + x.get('likes', 0), reverse=True)[:15],
        'posts': all_posts
    }

    # 결과 저장
    os.makedirs("data", exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)

    # Step 4: 결과 출력
    log("\n" + "="*70)
    log("📈 수집 및 분석 완료\n")

    log(f"📊 통계:")
    log(f"   • 총 게시글: {analysis['metadata']['total_posts']}건")
    log(f"   • 활동 갤러리: {analysis['metadata']['gallery_count']}개\n")

    log(f"🏆 갤러리별 통계:")
    for gallery_key, stats in gallery_stats.items():
        if stats['post_count'] > 0:
            log(f"   • {stats['name']}: {stats['post_count']}개 (평균 댓글: {stats['avg_comments']:.1f}개)")

    log(f"\n🔤 상위 키워드 (포카 수집 관심사):")
    for i, (keyword, freq) in enumerate(top_keywords[:10], 1):
        log(f"   {i:2d}. {keyword:8s} ({freq}회)")

    log(f"\n📂 주제별 게시글 분류:")
    for category, data in analysis['category_analysis'].items():
        log(f"   • {category}: {data['count']}건 ({data['percentage']})")
        for sample in data['sample_posts'][:1]:
            log(f"      - {sample[:50]}")

    log(f"\n💬 댓글 많은 인기 게시글:")
    for i, post in enumerate(analysis['top_posts'][:5], 1):
        engagement = post.get('comments', 0) + post.get('likes', 0)
        log(f"   {i}. [{post['gallery']}] {post['title'][:40]} (반응: {engagement})")

    log(f"\n💾 결과 저장: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
