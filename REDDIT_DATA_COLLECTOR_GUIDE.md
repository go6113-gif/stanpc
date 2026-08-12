# Reddit 데이터 수집기 사용 가이드

PRAW(Python Reddit API Wrapper) 기반 Reddit 데이터 수집 도구입니다.
r/kpopcollections 등의 K-pop 관련 subreddit에서 원문 데이터를 수집할 수 있습니다.

---

## 📋 사전 준비

### 1. Reddit App 등록 (필수)

Reddit API를 사용하려면 먼저 애플리케이션을 등록해야 합니다.

#### 단계별 가이드

**Step 1: Reddit 개발자 포털 접속**
- 링크: https://www.reddit.com/prefs/apps
- Reddit 계정으로 로그인 필요

**Step 2: 앱 등록 폼 작성**
- 페이지 끝까지 스크롤
- **"앱 만들기"** 또는 **"Create an application"** 버튼 클릭

**Step 3: 앱 정보 입력**
```
이름: K-pop Data Collector
App Type: script (선택 중요!)
Redirect URI: http://localhost:8080
About URL: (선택사항)
```

**Step 4: 인증 정보 저장**
앱 생성 후 아래 정보를 복사하여 저장:
- **Client ID**: "Personal use script" 아래 표시
- **Client Secret**: Secret 항목
- **Reddit Username**: 본인 계정명
- **Reddit Password**: 본인 비밀번호

### 2. Python 환경 설정

```bash
# 필수 라이브러리 설치
pip install -r requirements.txt
```

설치되는 라이브러리:
- `praw>=7.7.0` - Reddit API 래퍼
- `pandas>=1.3.0` - 데이터 처리

### 3. .env 파일 설정

프로젝트 루트의 `.env` 파일에서 Reddit 인증 정보 입력:

```env
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
REDDIT_USERNAME="your_reddit_username"
REDDIT_PASSWORD="your_reddit_password"
REDDIT_USER_AGENT="KpopDataCollector/1.0 (by your_reddit_username)"
```

**주의사항:**
- `.env` 파일은 절대 GitHub에 커밋하지 마세요
- `.gitignore`에 `.env` 추가됨

---

## 🚀 사용 방법

### 기본 실행

```bash
python reddit_data_collector.py
```

### 주요 기능

#### 1. Subreddit에서 포스트 수집

```python
from reddit_data_collector import RedditDataCollector

collector = RedditDataCollector()

# r/kpopcollections에서 최신 50개 포스트 수집
posts = collector.collect_from_subreddit(
    subreddit_name='kpopcollections',
    limit=50,
    sort='new'  # 'new', 'hot', 'top', 'controversial'
)

# CSV로 저장
collector.save_to_csv(posts, 'kpopcollections_posts.csv')
```

#### 2. 댓글 수집

```python
# 특정 포스트의 댓글 수집 (post_id는 Reddit 포스트 ID)
comments = collector.collect_comments(
    post_id='abc123def456',
    limit=100
)

collector.save_to_csv(comments, 'post_comments.csv')
```

#### 3. 포스트 검색

```python
# r/kpopcollections에서 "photocard" 검색
results = collector.search_posts(
    query='photocard',
    subreddit_name='kpopcollections',
    limit=50,
    sort='new'  # 'relevance', 'hot', 'top', 'new', 'comments'
)

collector.save_to_csv(results, 'photocard_search.csv')
```

---

## 📊 데이터 포맷

### 포스트 데이터

수집되는 포스트 정보:
- `post_id`: Reddit 포스트 고유 ID
- `title`: 포스트 제목
- `author`: 작성자 계정명
- `created_utc`: 작성 시간 (ISO 형식)
- `score`: 좋아요 수
- `upvote_ratio`: 좋아요 비율
- `num_comments`: 댓글 수
- `text`: 포스트 본문 (self post인 경우)
- `url`: 포스트 URL (링크 포스트인 경우)
- `is_self`: self post 여부
- `subreddit`: subreddit 이름
- `flair`: 포스트 태그
- `permalink`: Reddit 고유 링크

### 댓글 데이터

- `comment_id`: 댓글 고유 ID
- `post_id`: 해당 포스트 ID
- `author`: 댓글 작성자
- `created_utc`: 작성 시간
- `score`: 좋아요 수
- `text`: 댓글 본문
- `permalink`: Reddit 고유 링크

### 저장 형식

- **CSV**: `data/` 폴더에 저장 (Excel에서 열기 가능)
- **JSON**: 구조화된 데이터 보존

---

## 🎯 활용 예시

### 예시 1: K-pop 커뮤니티 모니터링

```python
# 여러 subreddit에서 데이터 수집
subreddits = ['kpopcollections', 'kpop', 'kpopfans']

for sub in subreddits:
    posts = collector.collect_from_subreddit(
        sub,
        limit=50,
        sort='new'
    )
    collector.save_to_csv(posts, f'{sub}_posts.csv')
```

### 예시 2: 특정 주제 분석

```python
# 포토카드 관련 논의 수집
photocard_posts = collector.search_posts(
    'photocard trading selling buying',
    subreddit_name='kpopcollections',
    limit=100,
    sort='new'
)

# 일주일간 인기 포스트
popular_posts = collector.collect_from_subreddit(
    'kpopcollections',
    limit=50,
    sort='top',
    time_filter='week'
)
```

### 예시 3: 댓글 분석

```python
# 특정 포스트의 모든 댓글 수집
post_id = 'abc123'  # Reddit 포스트 ID
comments = collector.collect_comments(post_id, limit=500)

# 댓글 감정분석 또는 처리
for comment in comments:
    print(f"{comment['author']}: {comment['text'][:100]}")
```

---

## ⚙️ 고급 설정

### 수집 매개변수 설명

#### sort 옵션
- `new`: 최신순
- `hot`: 인기순 (최근 추세)
- `top`: 상위순
- `controversial`: 논쟁순

#### time_filter 옵션 (sort='top'일 때만 적용)
- `all`: 전체
- `year`: 지난 1년
- `month`: 지난 1개월
- `week`: 지난 1주
- `day`: 지난 1일
- `hour`: 지난 1시간

### 수집 데이터 크기 제한

Reddit API의 rate limiting이 있으므로:
- 한 번에 최대 1000개 항목까지만 수집 가능
- 대량 수집 시 여러 번 나누어 실행
- 수집 간격을 두어 서버 부하 방지

```python
# 시간 간격을 두고 여러 번 수집
import time

for i in range(5):
    posts = collector.collect_from_subreddit('kpopcollections', limit=100)
    collector.save_to_csv(posts, f'batch_{i}.csv')
    time.sleep(60)  # 1분 대기
```

---

## 🐛 트러블슈팅

### 에러: "Invalid credentials"

**원인**: Reddit 인증 정보가 잘못됨

**해결**:
1. `.env` 파일의 모든 정보 재확인
2. Reddit 비밀번호에 특수문자가 있는 경우 따옴표로 감싸기
3. Reddit App 설정에서 username/password 재확인

### 에러: "Forbidden - 403"

**원인**: API 요청 제한 초과

**해결**:
- 요청 간격을 더 길게 설정
- 한 번에 수집하는 데이터 양 줄이기
- 나중에 다시 시도

### 에러: "Cannot access subreddit"

**원인**: 존재하지 않는 subreddit 또는 접근 제한

**해결**:
- subreddit 이름 철자 확인
- 공개 subreddit인지 확인
- 특수한 권한이 필요한 subreddit 확인

---

## 📝 로그 확인

프로그램 실행 중 다음과 같은 로그가 출력됩니다:

```
2026-08-12 10:30:45,123 - INFO - ✓ Reddit API 인증 성공
2026-08-12 10:30:46,456 - INFO - Subreddit: r/kpopcollections 에서 데이터 수집 중...
2026-08-12 10:30:52,789 - INFO - ✓ 50개 포스트 수집 완료
2026-08-12 10:30:53,012 - INFO - ✓ CSV 저장 완료: data/kpopcollections_posts.csv
```

---

## 🔒 보안 유의사항

1. **절대 코드에 인증 정보를 직접 입력하지 마세요**
   - 항상 `.env` 파일 사용

2. **`.env` 파일을 공개하지 마세요**
   - `.gitignore`에 추가됨

3. **수집한 데이터의 저작권 존중**
   - Reddit 이용약관 준수
   - 수집 데이터는 분석/연구 목적으로만 사용

4. **API Rate Limiting 준수**
   - 60초에 최대 60개 요청
   - 대량 수집 시 지연 추가

---

## 📞 참고 자료

- [PRAW 공식 문서](https://praw.readthedocs.io/)
- [Reddit API 문서](https://www.reddit.com/dev/api)
- [Reddit 개발자 앱 등록](https://www.reddit.com/prefs/apps)

---

**마지막 업데이트**: 2026-08-12
