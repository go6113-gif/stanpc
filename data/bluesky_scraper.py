import time
import pandas as pd
from atproto import Client

# 1. 클라이언트 로그인
client = Client()
HANDLE = 'go6113.bsky.social'
APP_PASSWORD = 'em5e-b3nn-fwym-suxl'

client.login(HANDLE, APP_PASSWORD)

# 2. 검색 키워드 및 태그 세분화
keywords = [
    '#photocard',
    '#wtsphotocard',
    '#wttphotocard',
    '#wtbphotocard',
    '#kpopcollection',
    '#kpoptrade',
    'kpop photocard',
    'binder sale',
]

collected_data = []
MAX_PAGES_PER_KEYWORD = 15  # 키워드당 수집할 페이지 수 (페이지당 최대 100건)

for kw in keywords:
    print(f"=== 수집 시작: {kw} ===")
    cursor = None

    for page in range(MAX_PAGES_PER_KEYWORD):
        params = {'q': kw, 'limit': 100}
        if cursor:
            params['cursor'] = cursor

        try:
            # Bluesky 검색 API 호출
            response = client.app.bsky.feed.search_posts(params=params)
            posts = response.posts

            if not posts:
                print(f"  - {kw}: 더 이상 불러올 게시글이 없습니다.")
                break

            for post in posts:
                collected_data.append(
                    {
                        'keyword': kw,
                        'created_at': post.indexed_at,
                        'author_handle': post.author.handle,
                        'text': post.record.text,
                        'like_count': post.like_count,
                        'repost_count': post.repost_count,
                        'post_uri': post.uri,
                    }
                )

            print(
                f"  - Page {page + 1}: {len(posts)}개 게시글 수집 완료 (누적 {len(collected_data)}건)"
            )

            # 다음 페이지를 위한 커서 갱신
            cursor = getattr(response, 'cursor', None)
            if not cursor:
                break

            time.sleep(0.5)  # API 요청 과부하 방지

        except Exception as e:
            print(f"  - 오류 발생 ({kw}, Page {page + 1}): {e}")
            break

# 3. 데이터프레임 변환 및 중복 제거
df = pd.DataFrame(collected_data)

if not df.empty:
    # 동일한 게시글(URI) 중복 제거
    df = df.drop_duplicates(subset=['post_uri'])

    # 4. CSV 저장
    file_name = 'bluesky_kpop_photocards_large.csv'
    df.to_csv(file_name, index=False, encoding='utf-8-sig')
    print(
        f"\n[수집 완료] 중복 제거 후 총 {len(df)}건의 유니크 게시글이 '{file_name}'에 저장되었습니다."
    )
else:
    print("\n수집된 데이터가 없습니다.")