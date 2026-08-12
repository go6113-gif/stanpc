#!/usr/bin/env python3
"""
Reddit 포토카드 데이터 수집기
r/kpopcollections, r/kpopforsale에서 포토카드 관련 게시글과 댓글을 수집합니다.
결과: data/reddit_photocard_posts.json
"""

import praw
import json
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class PhotocardDataCollector:
    """Reddit 포토카드 데이터 수집 클래스"""

    def __init__(self):
        """Reddit API 인증 초기화"""
        self.client_id = os.getenv('REDDIT_CLIENT_ID')
        self.client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        self.user_agent = os.getenv('REDDIT_USER_AGENT', 'PhotocardCollector/1.0')
        self.username = os.getenv('REDDIT_USERNAME')
        self.password = os.getenv('REDDIT_PASSWORD')

        if not all([self.client_id, self.client_secret, self.username, self.password]):
            raise ValueError("Reddit 인증 정보가 필요합니다. .env 파일을 확인하세요.")

        try:
            self.reddit = praw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent=self.user_agent,
                username=self.username,
                password=self.password
            )
            _ = self.reddit.user.me()
            logger.info("✓ Reddit API 인증 성공")
        except Exception as e:
            logger.error(f"✗ Reddit API 인증 실패: {e}")
            raise

    def collect_photocard_posts(self, subreddit_name, sort='top', time_filter='month', limit=100):
        """
        포토카드 관련 게시글 수집

        Args:
            subreddit_name: Subreddit 이름
            sort: 정렬 ('top', 'new', 'hot')
            time_filter: 시간 필터 ('all', 'year', 'month', 'week', 'day', 'hour')
            limit: 수집할 포스트 수

        Returns:
            포스트 정보와 댓글이 포함된 딕셔너리
        """
        posts_data = []
        photocard_keywords = ['photocard', 'pc', 'photocards', 'poca', 'album', 'cd']

        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            logger.info(f"r/{subreddit_name}에서 '{sort}' 포스트 수집 중... (limit: {limit})")

            # 정렬 방식에 따라 포스트 가져오기
            if sort == 'top':
                posts = subreddit.top(time_filter=time_filter, limit=limit)
            elif sort == 'new':
                posts = subreddit.new(limit=limit)
            else:
                posts = subreddit.hot(limit=limit)

            for post in posts:
                # 포토카드 관련 게시글만 필터링
                is_photocard_related = any(
                    keyword.lower() in post.title.lower() or
                    keyword.lower() in post.selftext.lower()
                    for keyword in photocard_keywords
                )

                if is_photocard_related or sort == 'new':  # new 정렬은 전부 수집
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
                        'permalink': f"https://reddit.com{post.permalink}",
                        'comments': []
                    }

                    # 댓글 수집
                    logger.info(f"  └─ '{post.title[:40]}...'에서 댓글 수집 중")
                    comments = self._collect_post_comments(post, limit=50)
                    post_info['comments'] = comments
                    post_info['num_comments_collected'] = len(comments)

                    posts_data.append(post_info)

                    logger.info(f"     └─ {len(comments)}개 댓글 수집 완료")

            logger.info(f"✓ r/{subreddit_name}에서 {len(posts_data)}개 포스트 수집 완료")
            return posts_data

        except Exception as e:
            logger.error(f"✗ r/{subreddit_name} 데이터 수집 실패: {e}")
            raise

    def _collect_post_comments(self, submission, limit=50):
        """포스트의 댓글 수집"""
        comments_data = []

        try:
            submission.comments.replace_more(limit=0)  # "more comments" 제거

            for comment in submission.comments[:limit]:
                if isinstance(comment, praw.models.Comment):
                    comment_info = {
                        'comment_id': comment.id,
                        'author': str(comment.author),
                        'created_utc': datetime.fromtimestamp(comment.created_utc).isoformat(),
                        'score': comment.score,
                        'text': comment.body,
                        'permalink': f"https://reddit.com{comment.permalink}"
                    }
                    comments_data.append(comment_info)

        except Exception as e:
            logger.warning(f"댓글 수집 중 오류 발생: {e}")

        return comments_data

    def collect_all_photocard_data(self):
        """모든 포토카드 데이터 수집"""
        all_data = {
            'metadata': {
                'collected_at': datetime.now().isoformat(),
                'total_posts': 0,
                'total_comments': 0,
                'subreddits': []
            },
            'posts_by_subreddit': {}
        }

        # 수집할 subreddit 설정
        subreddit_configs = [
            {
                'name': 'kpopcollections',
                'description': 'K-pop 포토카드 컬렉션 커뮤니티',
                'sort': 'top',
                'time_filter': 'month',
                'limit': 50
            },
            {
                'name': 'kpopforsale',
                'description': 'K-pop 포토카드 판매 커뮤니티',
                'sort': 'new',
                'limit': 50
            }
        ]

        print("\n" + "=" * 80)
        print("Reddit 포토카드 데이터 수집 시작")
        print("=" * 80 + "\n")

        for config in subreddit_configs:
            subreddit_name = config['name']
            logger.info(f"\n📍 r/{subreddit_name} ({config['description']})")

            try:
                # 게시글 수집
                collect_params = {
                    'subreddit_name': subreddit_name,
                    'sort': config['sort'],
                    'limit': config['limit']
                }

                if 'time_filter' in config:
                    collect_params['time_filter'] = config['time_filter']
                else:
                    collect_params['time_filter'] = 'all'

                posts = self.collect_photocard_posts(**collect_params)

                if posts:
                    all_data['posts_by_subreddit'][subreddit_name] = posts
                    all_data['metadata']['subreddits'].append({
                        'name': subreddit_name,
                        'posts_count': len(posts),
                        'comments_count': sum(len(p['comments']) for p in posts)
                    })
                    all_data['metadata']['total_posts'] += len(posts)
                    all_data['metadata']['total_comments'] += sum(len(p['comments']) for p in posts)

            except Exception as e:
                logger.error(f"r/{subreddit_name} 수집 실패: {e}")

        return all_data

    def save_to_json(self, data, filename='reddit_photocard_posts.json'):
        """데이터를 JSON으로 저장"""
        try:
            output_dir = Path('data')
            output_dir.mkdir(exist_ok=True)
            output_path = output_dir / filename

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(f"✓ JSON 저장 완료: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"✗ JSON 저장 실패: {e}")
            raise

    def print_summary(self, data):
        """수집 결과 요약 출력"""
        print("\n" + "=" * 80)
        print("📊 수집 완료 요약")
        print("=" * 80 + "\n")

        metadata = data['metadata']
        print(f"수집 시간: {metadata['collected_at']}")
        print(f"총 포스트: {metadata['total_posts']}개")
        print(f"총 댓글: {metadata['total_comments']}개")

        print("\n각 Subreddit별 통계:")
        for sub_info in metadata['subreddits']:
            print(f"  • r/{sub_info['name']}")
            print(f"    - 포스트: {sub_info['posts_count']}개")
            print(f"    - 댓글: {sub_info['comments_count']}개")

        print("\n포스트별 상세 정보:")
        for subreddit, posts in data['posts_by_subreddit'].items():
            print(f"\n  r/{subreddit}:")
            for post in posts[:5]:  # 상위 5개만 표시
                print(f"    1️⃣ {post['title'][:50]}")
                print(f"       ⬆️ {post['score']} | 💬 {post['num_comments_collected']}")

        print("\n" + "=" * 80)


def main():
    """메인 함수"""
    try:
        collector = PhotocardDataCollector()

        # 모든 포토카드 데이터 수집
        photocard_data = collector.collect_all_photocard_data()

        # JSON 저장
        output_file = collector.save_to_json(photocard_data)

        # 결과 요약 출력
        collector.print_summary(photocard_data)

        print(f"\n✓ 모든 데이터가 {output_file}에 저장되었습니다!")
        print()

        return 0

    except Exception as e:
        logger.error(f"프로그램 오류: {e}")
        return 1


if __name__ == '__main__':
    exit(main())
