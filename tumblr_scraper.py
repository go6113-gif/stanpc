import time
import pandas as pd
import pytumblr

# 1. Tumblr API 인증
CONSUMER_KEY = '5cKW6d0bGaj55aOwnJFPgd25mo3w6tJIaVXRdii6SLFRh94P8M'
client = pytumblr.TumblrRestClient(CONSUMER_KEY)

# 2. 수집 대상 핵심 태그
tags = [
    'photocard',
    'kpop photocard',
    'photocard template',
    'photocard checklist',
    'wts photocard',
    'wtt photocard',
    'kpop binder',
]

collected_data = []

for tag in tags:
    print(f"=== Tumblr 수집 시작: #{tag} ===")
    before_timestamp = None

    # 태그당 최대 15페이지 탐색
    for page in range(15):
        # params에서 'tag' 제거 (첫 번째 위치 인수로 전달되므로)
        params = {'limit': 20}
        if before_timestamp:
            params['before'] = before_timestamp

        try:
            # tag 인수는 위치 인수로 전달
            posts = client.tagged(tag, **params)

            if not posts or not isinstance(posts, list):
                print(f"  - #{tag}: 더 이상 불러올 포스트가 없습니다.")
                break

            for post in posts:
                collected_data.append(
                    {
                        'searched_tag': tag,
                        'post_id': post.get('id'),
                        'blog_name': post.get('blog_name'),
                        'post_url': post.get('post_url'),
                        'date': post.get('date'),
                        'timestamp': post.get('timestamp'),
                        'summary': post.get('summary', ''),
                        'tags': ', '.join(post.get('tags', [])),
                        'caption': post.get('caption', ''),
                    }
                )

            print(
                f"  - Page {page + 1}: {len(posts)}개 포스트 수집 (누적 {len(collected_data)}건)"
            )

            before_timestamp = posts[-1].get('timestamp')
            time.sleep(0.5)

        except Exception as e:
            print(f"  - 오류 발생 (#{tag}, Page {page + 1}): {e}")
            break

# 3. 데이터프레임 변환 및 CSV 저장
df = pd.DataFrame(collected_data)

if not df.empty:
    df = df.drop_duplicates(subset=['post_id'])
    file_name = 'tumblr_kpop_photocards.csv'
    df.to_csv(file_name, index=False, encoding='utf-8-sig')
    print(
        f"\n[수집 완료] 중복 제거 후 총 {len(df)}건의 포스트가 '{file_name}' 파일에 저장되었습니다."
    )
else:
    print("\n수집된 데이터가 없습니다.")