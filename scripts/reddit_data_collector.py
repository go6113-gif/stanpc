#!/usr/bin/env python3
"""
Reddit 데이터 수집기 - PRAW 기반
K-pop 관련 subreddit에서 원문 데이터를 수집합니다.
"""

import praw
import pandas as pd
import json
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# .env 파일 로드
load_dotenv()


class RedditDataCollector:
    """Reddit 데이터 수집 클래스"""

    def __init__(self):
        """Reddit API 인증 초기화"""
        # 환경 변수에서 인증 정보 로드
        self.client_id = os.getenv('REDDIT_CLIENT_ID')
        self.client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        self.user_agent = os.getenv('REDDIT_USER_AGENT', 'KpopDataCollector/1.0')
        self.username = os.getenv('REDDIT_USERNAME')
        self.password = os.getenv('REDDIT_PASSWORD')

        # 검증
        if not all([self.client_id, self.client_secret, self.username, self.password]):
            raise ValueError("Reddit 인증 정보가 필요합니다. .env 파일을 확인하세요.")

        # Reddit API 인증
        try:
            self.reddit = praw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent=self.user_agent,
                username=self.username,
                password=self.password
            )
            # 인증 테스트
            _ = self.reddit.user.me()
            logger.info("✓ Reddit API 인증 성공")
        except Exception as e:
            logger.error(f"✗ Reddit API 인증 실패: {e}")
            raise

    def collect_from_subreddit(self, subreddit_name, limit=100, sort='new', time_filter='all'):
        """
        Subreddit에서 포스트 수집

        Args:
            subreddit_name: Subreddit 이름 (예: 'kpopcollections')
            limit: 수집할 포스트 수 (기본값: 100)
            sort: 정렬 방식 ('new', 'hot', 'top', 'controversial')
            time_filter: 시간 필터 ('all', 'year', 'month', 'week', 'day', 'hour')

        Returns:
            수집된 포스트 데이터 리스트
        """
        posts_data = []

        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            logger.info(f"Subreddit: r/{subreddit_name} 에서 데이터 수집 중...")

            # 정렬 방식에 따라 포스트 가져오기
            if sort == 'new':
                posts = subreddit.new(limit=limit)
            elif sort == 'hot':
                posts = subreddit.hot(limit=limit)
            elif sort == 'top':
                posts = subreddit.top(time_filter=time_filter, limit=limit)
            elif sort == 'controversial':
                posts = subreddit.controversial(time_filter=time_filter, limit=limit)
            else:
                posts = subreddit.new(limit=limit)

            # 포스트 정보 추출
            for post in posts:
                post_info = {
                    'post_id': post.id,
                    'title': post.title,
                    'author': str(post.author),
                    'created_utc': datetime.fromtimestamp(post.created_utc).isoformat(),
                    'score': post.score,
                    'upvote_ratio': post.upvote_ratio,
                    'num_comments': post.num_comments,
                    'text': post.selftext,
                    'url': post.url,
                    'is_self': post.is_self,
                    'subreddit': post.subreddit.display_name,
                    'flair': post.link_flair_text or '',
                    'permalink': f"https://reddit.com{post.permalink}"
                }
                posts_data.append(post_info)

            logger.info(f"✓ {len(posts_data)}개 포스트 수집 완료")
            return posts_data

        except Exception as e:
            logger.error(f"✗ 데이터 수집 실패: {e}")
            raise

    def collect_comments(self, post_id, limit=100):
        """
        특정 포스트의 댓글 수집

        Args:
            post_id: Reddit 포스트 ID
            limit: 수집할 댓글 수

        Returns:
            댓글 데이터 리스트
        """
        comments_data = []

        try:
            submission = self.reddit.submission(id=post_id)
            submission.comments.replace_more(limit=0)  # "more comments" 제거

            logger.info(f"포스트 {post_id}에서 댓글 수집 중...")

            for comment in submission.comments[:limit]:
                if isinstance(comment, praw.models.Comment):
                    comment_info = {
                        'comment_id': comment.id,
                        'post_id': post_id,
                        'author': str(comment.author),
                        'created_utc': datetime.fromtimestamp(comment.created_utc).isoformat(),
                        'score': comment.score,
                        'text': comment.body,
                        'permalink': f"https://reddit.com{comment.permalink}"
                    }
                    comments_data.append(comment_info)

            logger.info(f"✓ {len(comments_data)}개 댓글 수집 완료")
            return comments_data

        except Exception as e:
            logger.error(f"✗ 댓글 수집 실패: {e}")
            raise

    def search_posts(self, query, subreddit_name=None, limit=100, sort='relevance', time_filter='all'):
        """
        Reddit에서 포스트 검색

        Args:
            query: 검색 쿼리
            subreddit_name: 특정 subreddit에서만 검색 (없으면 전체)
            limit: 수집할 포스트 수
            sort: 정렬 방식 ('relevance', 'hot', 'top', 'new', 'comments')
            time_filter: 시간 필터

        Returns:
            검색 결과 리스트
        """
        posts_data = []

        try:
            if subreddit_name:
                search_obj = self.reddit.subreddit(subreddit_name).search(
                    query, sort=sort, time_filter=time_filter, limit=limit
                )
                logger.info(f"r/{subreddit_name}에서 '{query}' 검색 중...")
            else:
                search_obj = self.reddit.subreddit('all').search(
                    query, sort=sort, time_filter=time_filter, limit=limit
                )
                logger.info(f"전체 Reddit에서 '{query}' 검색 중...")

            for post in search_obj:
                post_info = {
                    'post_id': post.id,
                    'title': post.title,
                    'author': str(post.author),
                    'created_utc': datetime.fromtimestamp(post.created_utc).isoformat(),
                    'score': post.score,
                    'text': post.selftext[:500],  # 처음 500자만
                    'subreddit': post.subreddit.display_name,
                    'permalink': f"https://reddit.com{post.permalink}"
                }
                posts_data.append(post_info)

            logger.info(f"✓ {len(posts_data)}개 검색 결과 수집 완료")
            return posts_data

        except Exception as e:
            logger.error(f"✗ 검색 실패: {e}")
            raise

    def save_to_csv(self, data, filename):
        """데이터를 CSV로 저장"""
        try:
            df = pd.DataFrame(data)
            output_path = Path('data') / filename
            output_path.parent.mkdir(exist_ok=True)
            df.to_csv(output_path, index=False, encoding='utf-8-sig')
            logger.info(f"✓ CSV 저장 완료: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"✗ CSV 저장 실패: {e}")
            raise

    def save_to_json(self, data, filename):
        """데이터를 JSON으로 저장"""
        try:
            output_path = Path('data') / filename
            output_path.parent.mkdir(exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"✓ JSON 저장 완료: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"✗ JSON 저장 실패: {e}")
            raise


def main():
    """메인 함수 - 사용 예시"""
    try:
        collector = RedditDataCollector()

        # 예시 1: r/kpopcollections에서 최신 포스트 수집
        print("\n=== r/kpopcollections 데이터 수집 ===")
        posts = collector.collect_from_subreddit(
            'kpopcollections',
            limit=50,
            sort='new'
        )

        if posts:
            collector.save_to_csv(posts, 'kpopcollections_posts.csv')
            collector.save_to_json(posts, 'kpopcollections_posts.json')

        # 예시 2: 포토카드 관련 검색
        print("\n=== 'photocard' 검색 결과 ===")
        search_results = collector.search_posts(
            'photocard',
            subreddit_name='kpopcollections',
            limit=30,
            sort='new'
        )

        if search_results:
            collector.save_to_csv(search_results, 'photocard_search_results.csv')

        # 예시 3: r/kpop에서 인기 포스트 수집
        print("\n=== r/kpop 인기 포스트 수집 ===")
        kpop_posts = collector.collect_from_subreddit(
            'kpop',
            limit=30,
            sort='top',
            time_filter='week'
        )

        if kpop_posts:
            collector.save_to_csv(kpop_posts, 'kpop_popular_posts.csv')

        print("\n✓ 모든 데이터 수집 완료!")

    except Exception as e:
        logger.error(f"프로그램 오류: {e}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
