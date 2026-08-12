# Reddit 포토카드 데이터 수집 - 완전 설정 가이드

StanPC 프로젝트의 Reddit 데이터 수집 기능 완성 문서입니다.

---

## 📦 설치된 파일 목록

### 🔧 핵심 스크립트

| 파일 | 설명 | 실행 방법 |
|------|------|---------|
| `reddit_photocard_collector.py` | **메인 수집 스크립트** - r/kpopcollections, r/kpopforsale의 포토카드 데이터를 수집하여 JSON으로 저장 | `python reddit_photocard_collector.py` |
| `reddit_data_collector.py` | 범용 Reddit 데이터 수집 라이브러리 (import하여 사용) | Python에서 import |
| `test_reddit_setup.py` | 설정 검증 도구 - 인증 정보와 라이브러리 확인 | `python test_reddit_setup.py` |
| `reddit_demo.py` | 대화형 데모 - 자동/커스텀 수집 선택 가능 | `python reddit_demo.py` |

### 📚 가이드 문서

| 파일 | 내용 |
|------|------|
| `REDDIT_APP_REGISTRATION.md` | ✅ **먼저 읽기** - Reddit Developer Portal 앱 등록 상세 절차 |
| `REDDIT_QUICKSTART.md` | ⚡ 5분 빠른 시작 가이드 |
| `REDDIT_DATA_COLLECTOR_GUIDE.md` | 📖 전체 기능 설명 및 사용법 |
| `REDDIT_SETUP_SUMMARY.md` | 📋 이 문서 - 최종 설정 요약 |

### ⚙️ 설정 파일

| 파일 | 변경 사항 |
|------|---------|
| `.env` | Reddit 인증 정보 추가 (CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD) |
| `requirements.txt` | PRAW & Pandas 라이브러리 추가 |

---

## 🚀 5분 안에 시작하기

### 1️⃣ Reddit App 등록 (2분)

**먼저 이 문서를 읽으세요:** `REDDIT_APP_REGISTRATION.md`

단계 요약:
1. https://www.reddit.com/prefs/apps 접속
2. "create application" 클릭
3. **App Type: "script" 선택** (매우 중요!)
4. Client ID와 Client Secret 복사

### 2️⃣ .env 파일 설정 (1분)

프로젝트 루트의 `.env` 파일 수정:

```env
REDDIT_CLIENT_ID="your_client_id"
REDDIT_CLIENT_SECRET="your_client_secret"
REDDIT_USERNAME="your_username"
REDDIT_PASSWORD="your_password"
REDDIT_USER_AGENT="KpopDataCollector/1.0 (by your_username)"
```

### 3️⃣ 라이브러리 설치 (1분)

```bash
pip install -r requirements.txt
```

### 4️⃣ 설정 검증 (1분)

```bash
python test_reddit_setup.py
```

모든 ✓ 표시가 나오면 준비 완료!

### 5️⃣ 포토카드 데이터 수집 (즉시 실행)

```bash
python reddit_photocard_collector.py
```

**결과:** `data/reddit_photocard_posts.json` 생성!

---

## 📊 데이터 구조

### 생성되는 JSON 파일 구조

```json
{
  "metadata": {
    "collected_at": "2026-08-12T10:30:45.123456",
    "total_posts": 50,
    "total_comments": 150,
    "subreddits": [
      {
        "name": "kpopcollections",
        "posts_count": 30,
        "comments_count": 100
      },
      {
        "name": "kpopforsale",
        "posts_count": 20,
        "comments_count": 50
      }
    ]
  },
  "posts_by_subreddit": {
    "kpopcollections": [
      {
        "post_id": "abc123",
        "title": "[Trading] Looking for IVE photocards",
        "author": "username",
        "created_utc": "2026-08-10T15:30:00",
        "score": 150,
        "upvote_ratio": 0.95,
        "num_comments": 25,
        "text": "Looking to trade IVE photocards...",
        "url": "https://reddit.com/r/kpopcollections/...",
        "is_self": true,
        "subreddit": "kpopcollections",
        "flair": "[Trading]",
        "permalink": "https://reddit.com/r/kpopcollections/...",
        "num_comments_collected": 5,
        "comments": [
          {
            "comment_id": "cde456",
            "author": "commenter",
            "created_utc": "2026-08-10T15:45:00",
            "score": 10,
            "text": "I have these IVE cards...",
            "permalink": "https://reddit.com/r/kpopcollections/..._comment"
          }
        ]
      }
    ],
    "kpopforsale": [
      // 비슷한 구조의 포스트들
    ]
  }
}
```

---

## 🎯 주요 기능

### 1. 자동 포토카드 데이터 수집

```bash
python reddit_photocard_collector.py
```

자동으로:
- r/kpopcollections에서 이달 인기 포스트 50개 수집
- r/kpopforsale에서 최신 포스트 50개 수집
- 각 포스트의 댓글 50개까지 수집
- 모든 데이터를 `data/reddit_photocard_posts.json`에 저장

### 2. 커스텀 데이터 수집

Python에서:
```python
from reddit_data_collector import RedditDataCollector

collector = RedditDataCollector()

# 특정 subreddit 수집
posts = collector.collect_from_subreddit(
    'kpopcollections',
    limit=100,
    sort='top',
    time_filter='month'
)

# 검색
results = collector.search_posts(
    'photocard trading',
    subreddit_name='kpopcollections',
    limit=50
)

# 저장
collector.save_to_json(posts, 'my_posts.json')
```

### 3. 대화형 데모

```bash
python reddit_demo.py
```

옵션:
1. 자동 데모 (여러 subreddit 수집)
2. 사용자 정의 수집
3. 종료

---

## 📝 API 주요 매개변수

### 정렬 옵션 (sort)
- `new` - 최신순
- `hot` - 인기순 (최근 트렌드)
- `top` - 상위순 ⭐ (포토카드는 이 옵션 권장)
- `controversial` - 논쟁순

### 시간 필터 (time_filter) - sort='top'일 때만 사용
- `all` - 전체
- `year` - 지난 1년
- `month` - 지난 1개월 ⭐ (기본값)
- `week` - 지난 1주
- `day` - 지난 1일
- `hour` - 지난 1시간

### Subreddit 목록
- `kpopcollections` - 포토카드 컬렉션 (많은 트레이딩)
- `kpopforsale` - 포토카드 판매 중심
- `kpop` - 일반 K-pop 뉴스/토론
- `kpopfans` - K-pop 팬 커뮤니티

---

## 🔒 보안 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 있는가? (이미 추가됨)
- [ ] `.env`에 실제 인증 정보 입력했는가?
- [ ] Client Secret을 코드에 직접 입력하지 않았는가?
- [ ] `.env` 파일을 공개 저장소에 커밋하지 않을 것
- [ ] 수집한 데이터의 저작권을 존중할 것

---

## 🐛 일반적인 문제 해결

### Q: "Invalid credentials" 에러

**원인:** `.env` 파일의 인증 정보 오류

**해결:**
1. `.env` 파일 재확인
2. Reddit App의 Client ID/Secret 재확인
3. Reddit 비밀번호에 특수문자 있으면 따옴표로 감싸기
4. `test_reddit_setup.py` 실행하여 검증

### Q: "Forbidden - 403" 에러

**원인:** API Rate Limit 초과

**해결:**
- 요청 간격을 1초 이상으로 설정
- 한 번에 수집하는 데이터 양 줄이기
- 시간을 두고 다시 시도

### Q: App Type을 잘못 선택했어요

**해결:**
1. https://www.reddit.com/prefs/apps 재접속
2. 앱 이름 클릭
3. "delete app" 버튼 클릭
4. 다시 처음부터 "script" 타입으로 생성

### Q: JSON 파일을 Python에서 읽으려면?

```python
import json

with open('data/reddit_photocard_posts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 포토카드 포스트 접근
posts = data['posts_by_subreddit']['kpopcollections']
print(f"총 {len(posts)}개 포스트 수집됨")

for post in posts:
    print(f"- {post['title']}")
    print(f"  댓글: {post['num_comments_collected']}개")
```

---

## 📊 데이터 분석 예시

### 포스트별 상세 정보 추출

```python
import json

with open('data/reddit_photocard_posts.json') as f:
    data = json.load(f)

# 모든 포스트 통계
all_posts = []
for subreddit, posts in data['posts_by_subreddit'].items():
    for post in posts:
        post['source_subreddit'] = subreddit
        all_posts.append(post)

# 점수별 정렬
sorted_posts = sorted(all_posts, key=lambda x: x['score'], reverse=True)

print("인기 포스트 top 10:")
for i, post in enumerate(sorted_posts[:10], 1):
    print(f"{i}. {post['title']}")
    print(f"   Subreddit: r/{post['source_subreddit']}")
    print(f"   Score: {post['score']} | Comments: {post['num_comments']}")
```

### 댓글 감정분석 준비

```python
# 모든 댓글 추출
all_comments = []
for subreddit, posts in data['posts_by_subreddit'].items():
    for post in posts:
        for comment in post['comments']:
            comment['post_title'] = post['title']
            comment['post_subreddit'] = subreddit
            all_comments.append(comment)

print(f"총 {len(all_comments)}개 댓글 수집됨")

# 댓글 샘플
for comment in all_comments[:5]:
    print(f"- {comment['author']}: {comment['text'][:100]}...")
```

---

## 📚 추가 학습 자료

### 공식 문서
- [PRAW 공식 문서](https://praw.readthedocs.io/)
- [Reddit API 개발자 문서](https://www.reddit.com/dev/api)
- [Reddit OAuth2 가이드](https://github.com/reddit-archive/reddit/wiki/OAuth2)

### 추천 다음 단계
1. 데이터 분석 (pandas/matplotlib)
2. 자동 수집 스케줄링 (APScheduler)
3. 데이터베이스 저장 (SQLite/PostgreSQL)
4. 웹 대시보드 구축 (Flask/FastAPI)

---

## ✅ 최종 체크리스트

Reddit 포토카드 데이터 수집 설정 완료:

- [ ] **문서 읽기**
  - [ ] `REDDIT_APP_REGISTRATION.md` - Reddit App 등록
  - [ ] `REDDIT_QUICKSTART.md` - 빠른 시작
  
- [ ] **Reddit 설정**
  - [ ] Reddit 계정 생성
  - [ ] Developer Portal에서 Script App 등록
  - [ ] Client ID/Secret 발급받음
  
- [ ] **프로젝트 설정**
  - [ ] `.env` 파일에 인증 정보 입력
  - [ ] `pip install -r requirements.txt` 실행
  
- [ ] **검증**
  - [ ] `python test_reddit_setup.py` 실행
  - [ ] 모든 테스트 통과 ✓
  
- [ ] **데이터 수집**
  - [ ] `python reddit_photocard_collector.py` 실행
  - [ ] `data/reddit_photocard_posts.json` 생성 확인

**모든 체크 완료 → Reddit 포토카드 데이터 수집 준비 완료! 🎉**

---

## 📞 문의 사항

- 기술적 문제: 각 스크립트의 `--help` 옵션 확인
- API 문제: [Reddit API 공식 문서](https://www.reddit.com/dev/api) 참고
- PRAW 라이브러리: [PRAW GitHub Issues](https://github.com/praw-dev/praw/issues)

---

**설정 완료 날짜:** 2026-08-12  
**최종 업데이트:** 2026-08-12
