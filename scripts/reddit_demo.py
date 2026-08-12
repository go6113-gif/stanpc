#!/usr/bin/env python3
"""
Reddit 데이터 수집 데모
r/kpopcollections과 다른 K-pop 커뮤니티에서 데이터를 수집합니다.
"""

import sys
from pathlib import Path
from reddit_data_collector import RedditDataCollector
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def collect_kpop_data():
    """K-pop 커뮤니티 데이터 수집"""
    try:
        collector = RedditDataCollector()

        # 수집할 subreddit 목록
        subreddits = {
            'kpopcollections': {
                'limit': 50,
                'sort': 'new',
                'description': 'K-pop 포토카드 컬렉션 커뮤니티'
            },
            'kpop': {
                'limit': 30,
                'sort': 'top',
                'time_filter': 'week',
                'description': '일반 K-pop 커뮤니티 (이주일 인기글)'
            },
            'kpopfans': {
                'limit': 30,
                'sort': 'new',
                'description': 'K-pop 팬 커뮤니티'
            },
        }

        print("\n" + "=" * 70)
        print(" " * 15 + "K-pop Reddit 데이터 수집 데모")
        print("=" * 70 + "\n")

        # 각 subreddit에서 데이터 수집
        for subreddit, config in subreddits.items():
            print(f"\n📍 {subreddit.upper()}")
            print(f"   {config['description']}")
            print("-" * 70)

            try:
                # 수집 설정
                collect_config = {
                    'subreddit_name': subreddit,
                    'limit': config['limit'],
                    'sort': config['sort'],
                }

                # time_filter가 설정된 경우 추가
                if 'time_filter' in config:
                    collect_config['time_filter'] = config['time_filter']

                # 데이터 수집
                posts = collector.collect_from_subreddit(**collect_config)

                if posts:
                    # 파일명 생성
                    timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
                    csv_file = f'{subreddit}_posts_{timestamp}.csv'
                    json_file = f'{subreddit}_posts_{timestamp}.json'

                    # CSV/JSON 저장
                    collector.save_to_csv(posts, csv_file)
                    collector.save_to_json(posts, json_file)

                    # 미리보기
                    print(f"\n📊 수집된 포스트 샘플 (상위 3개):")
                    for i, post in enumerate(posts[:3], 1):
                        print(f"   {i}. {post['title'][:60]}")
                        print(f"      👤 {post['author']} | ⬆️ {post['score']} | 💬 {post['num_comments']}")

                    print(f"\n✓ {len(posts)}개 포스트 수집 완료")

            except Exception as e:
                logger.error(f"r/{subreddit} 수집 실패: {e}")
                continue

        # 검색 데모
        print("\n\n" + "=" * 70)
        print("🔍 검색 데모: 'photocard' 키워드")
        print("=" * 70 + "\n")

        search_results = collector.search_posts(
            query='photocard',
            subreddit_name='kpopcollections',
            limit=20,
            sort='new'
        )

        if search_results:
            print(f"✓ 검색 결과: {len(search_results)}개")
            print("\n📋 상위 3개 검색 결과:")
            for i, post in enumerate(search_results[:3], 1):
                print(f"   {i}. {post['title'][:60]}")
                print(f"      👤 {post['author']} | ⬆️ {post['score']}")

            # 저장
            timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
            collector.save_to_csv(search_results, f'photocard_search_{timestamp}.csv')
            print(f"\n✓ 검색 결과 저장 완료")

        print("\n" + "=" * 70)
        print("✓ 모든 데이터 수집 완료!")
        print("   생성된 파일들은 data/ 폴더에 저장되었습니다.")
        print("=" * 70 + "\n")

        return 0

    except Exception as e:
        logger.error(f"프로그램 오류: {e}")
        print("\n❌ 오류 발생!")
        print(f"   {e}")
        print("\n도움말:")
        print("   1. .env 파일의 Reddit 인증 정보 확인")
        print("   2. test_reddit_setup.py 실행하여 설정 테스트")
        print("   3. REDDIT_DATA_COLLECTOR_GUIDE.md 참고")
        print()
        return 1


def custom_collection():
    """사용자 정의 데이터 수집"""
    print("\n" + "=" * 70)
    print(" " * 20 + "사용자 정의 데이터 수집")
    print("=" * 70 + "\n")

    try:
        collector = RedditDataCollector()

        # 사용자 입력
        print("수집 설정:")
        subreddit = input("📍 Subreddit 이름 (기본값: kpopcollections): ").strip() or 'kpopcollections'
        limit = input("📊 수집할 포스트 수 (기본값: 50): ").strip()
        limit = int(limit) if limit.isdigit() else 50
        sort = input("🔄 정렬 방식 (new/hot/top/controversial, 기본값: new): ").strip() or 'new'

        print(f"\n수집 시작: r/{subreddit} ({limit}개, {sort}순)...\n")

        posts = collector.collect_from_subreddit(
            subreddit_name=subreddit,
            limit=limit,
            sort=sort
        )

        if posts:
            timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_file = f'{subreddit}_custom_{timestamp}.csv'

            collector.save_to_csv(posts, csv_file)

            print(f"\n✓ 수집 완료: {len(posts)}개 포스트")
            print(f"   저장 위치: data/{csv_file}")
            print()
            return 0

    except Exception as e:
        logger.error(f"오류: {e}")
        print(f"\n❌ 오류 발생: {e}")
        return 1


def main():
    """메인 함수"""
    print("\n╔" + "=" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + "  Reddit K-pop 데이터 수집 도구  ".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "=" * 68 + "╝")

    print("\n옵션:")
    print("  1. 자동 데모 실행 (기본 K-pop subreddit 수집)")
    print("  2. 사용자 정의 수집 (특정 subreddit/키워드)")
    print("  3. 종료")

    choice = input("\n선택 (1/2/3): ").strip()

    if choice == '1':
        return collect_kpop_data()
    elif choice == '2':
        return custom_collection()
    elif choice == '3':
        print("프로그램 종료\n")
        return 0
    else:
        print("잘못된 선택입니다.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
