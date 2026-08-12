#!/usr/bin/env python3
"""
Reddit 설정 테스트 스크립트
인증 정보가 올바르게 설정되었는지 확인합니다.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import sys

def check_environment():
    """환경 변수 확인"""
    print("=" * 60)
    print("📋 Reddit API 설정 확인")
    print("=" * 60)

    # .env 파일 로드
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env 파일을 찾을 수 없습니다.")
        print("   현재 디렉토리:", Path.cwd())
        return False

    load_dotenv()

    # 필수 환경 변수 확인
    required_vars = [
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET',
        'REDDIT_USERNAME',
        'REDDIT_PASSWORD'
    ]

    all_set = True
    for var in required_vars:
        value = os.getenv(var)
        if value and value != f'your_{var.lower()}_here':
            status = "✓"
            display = f"{value[:20]}..." if len(value) > 20 else value
        else:
            status = "❌"
            display = "(설정되지 않음)"
            all_set = False

        print(f"{status} {var}: {display}")

    print()
    return all_set


def check_praw_installation():
    """PRAW 설치 확인"""
    print("=" * 60)
    print("📦 라이브러리 확인")
    print("=" * 60)

    try:
        import praw
        print(f"✓ praw: {praw.__version__}")
    except ImportError:
        print("❌ praw가 설치되지 않았습니다.")
        print("   실행: pip install -r requirements.txt")
        return False

    try:
        import pandas
        print(f"✓ pandas: {pandas.__version__}")
    except ImportError:
        print("❌ pandas가 설치되지 않았습니다.")
        return False

    try:
        import dotenv
        print(f"✓ python-dotenv: 설치됨")
    except ImportError:
        print("❌ python-dotenv가 설치되지 않았습니다.")
        return False

    print()
    return True


def test_reddit_connection():
    """Reddit API 연결 테스트"""
    print("=" * 60)
    print("🔌 Reddit API 연결 테스트")
    print("=" * 60)

    try:
        import praw

        client_id = os.getenv('REDDIT_CLIENT_ID')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        username = os.getenv('REDDIT_USERNAME')
        password = os.getenv('REDDIT_PASSWORD')

        # 유효성 확인
        if not all([client_id, client_secret, username, password]):
            print("❌ 필수 환경 변수가 설정되지 않았습니다.")
            return False

        if any(x.startswith('your_') for x in [client_id, client_secret, username, password]):
            print("❌ 환경 변수가 아직 설정되지 않았습니다.")
            print("   .env 파일을 수정하여 실제 값으로 변경하세요.")
            return False

        print("Reddit API 연결 시도 중...")
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent='TestCollector/1.0',
            username=username,
            password=password
        )

        # 인증 테스트
        user = reddit.user.me()
        print(f"✓ 연결 성공!")
        print(f"  계정: u/{user.name}")
        print(f"  Karma: {user.link_karma + user.comment_karma}")
        print()
        return True

    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        print()
        return False


def test_sample_subreddit():
    """샘플 subreddit 데이터 수집"""
    print("=" * 60)
    print("🧪 샘플 데이터 수집 테스트")
    print("=" * 60)

    try:
        import praw

        client_id = os.getenv('REDDIT_CLIENT_ID')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        username = os.getenv('REDDIT_USERNAME')
        password = os.getenv('REDDIT_PASSWORD')

        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent='TestCollector/1.0',
            username=username,
            password=password
        )

        print("r/test에서 최신 3개 포스트 수집 중...")
        subreddit = reddit.subreddit('test')

        posts = []
        for i, post in enumerate(subreddit.new(limit=3)):
            posts.append({
                'title': post.title,
                'author': str(post.author),
                'score': post.score,
            })
            print(f"  {i+1}. {post.title[:50]}...")

        print(f"\n✓ 샘플 수집 성공! ({len(posts)}개 포스트)")
        print()
        return True

    except Exception as e:
        print(f"❌ 샘플 수집 실패: {e}")
        print()
        return False


def main():
    """메인 테스트 함수"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  Reddit 데이터 수집기 - 설정 테스트  ".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print()

    results = []

    # 1. 환경 변수 확인
    env_ok = check_environment()
    results.append(("환경 변수", env_ok))

    # 2. 라이브러리 확인
    lib_ok = check_praw_installation()
    results.append(("라이브러리", lib_ok))

    # 3. API 연결 테스트
    conn_ok = test_reddit_connection()
    results.append(("API 연결", conn_ok))

    # 4. 샘플 데이터 수집
    sample_ok = test_sample_subreddit()
    results.append(("샘플 수집", sample_ok))

    # 최종 결과
    print("=" * 60)
    print("📊 최종 결과")
    print("=" * 60)

    for test_name, passed in results:
        status = "✓" if passed else "❌"
        print(f"{status} {test_name}")

    print()

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("✓ 모든 테스트 통과! Reddit 데이터 수집 준비 완료")
        print()
        print("다음 단계:")
        print("  1. python reddit_data_collector.py 실행")
        print("  2. 또는 커스텀 스크립트 작성하여 사용")
        print()
        return 0
    else:
        print("❌ 일부 테스트 실패. 위의 에러 메시지를 확인하세요.")
        print()
        print("도움말:")
        print("  1. .env 파일의 Reddit 인증 정보 재확인")
        print("  2. requirements.txt 설치 재확인")
        print("  3. REDDIT_DATA_COLLECTOR_GUIDE.md 참고")
        print()
        return 1


if __name__ == '__main__':
    sys.exit(main())
