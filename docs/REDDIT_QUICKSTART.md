# Reddit 데이터 수집 - 빠른 시작 가이드

5분 안에 Reddit에서 K-pop 데이터를 수집할 수 있습니다.

---

## ⚡ 3단계 빠른 설정

### Step 1: Reddit App 등록 (2분)

1. https://www.reddit.com/prefs/apps 열기
2. 로그인 후 페이지 끝까지 스크롤
3. **"앱 만들기"** 클릭
4. 다음 정보 입력:
   ```
   이름: K-pop Data Collector
   App Type: script
   Redirect URI: http://localhost:8080
   ```
5. **생성** 클릭
6. 다음 정보 복사:
   - **Client ID** (제목 아래)
   - **Client Secret**

### Step 2: 환경 설정 (1분)

프로젝트 루트의 `.env` 파일 수정:

```env
REDDIT_CLIENT_ID="복사한_Client_ID"
REDDIT_CLIENT_SECRET="복사한_Client_Secret"
REDDIT_USERNAME="reddit_계정명"
REDDIT_PASSWORD="reddit_비밀번호"
REDDIT_USER_AGENT="KpopDataCollector/1.0 (by reddit_계정명)"
```

### Step 3: 라이브러리 설치 (2분)

```bash
pip install -r requirements.txt
```

---

## 🚀 데이터 수집 시작

### 옵션 1: 자동 데모 실행 (가장 쉬움)

```bash
python reddit_demo.py
```

이 스크립트가 자동으로:
- r/kpopcollections에서 최신 50개 포스트 수집
- r/kpop에서 이주일 인기 포스트 수집
- r/kpopfans에서 최신 30개 포스트 수집
- "photocard" 검색 결과 수집

### 옵션 2: 설정 테스트

```bash
python test_reddit_setup.py
```

Reddit 인증 정보가 올바른지 확인합니다.

### 옵션 3: 커스텀 수집

```python
from reddit_data_collector import RedditDataCollector

collector = RedditDataCollector()

# r/kpopcollections에서 최신 100개 포스트 수집
posts = collector.collect_from_subreddit(
    'kpopcollections',
    limit=100,
    sort='new'
)

# CSV 저장
collector.save_to_csv(posts, 'my_data.csv')

# JSON 저장
collector.save_to_json(posts, 'my_data.json')
```

---

## 📊 수집된 데이터 위치

모든 데이터는 `data/` 폴더에 저장됩니다:

```
data/
├── kpopcollections_posts_20260812_103045.csv
├── kpopcollections_posts_20260812_103045.json
├── kpop_posts_20260812_103046.csv
├── photocard_search_20260812_103050.csv
└── ...
```

---

## 🎯 활용 예시

### 예시 1: 특정 주제 검색

```python
from reddit_data_collector import RedditDataCollector

collector = RedditDataCollector()

# "trading" 관련 포스트 검색
results = collector.search_posts(
    'trading',
    subreddit_name='kpopcollections',
    limit=50
)

collector.save_to_csv(results, 'trading_posts.csv')
```

### 예시 2: 댓글 분석

```python
# 특정 포스트의 댓글 수집
comments = collector.collect_comments(
    post_id='abc123def',  # Reddit 포스트 ID
    limit=500
)

collector.save_to_csv(comments, 'post_comments.csv')
```

### 예시 3: 다중 Subreddit 수집

```python
for subreddit in ['kpopcollections', 'kpop', 'kpopfans']:
    posts = collector.collect_from_subreddit(subreddit, limit=50)
    collector.save_to_csv(posts, f'{subreddit}_posts.csv')
```

---

## ❓ 자주 묻는 질문

### Q: "Invalid credentials" 에러가 나옵니다.

**A:**
1. `.env` 파일의 모든 정보 재확인
2. Reddit 비밀번호에 특수문자가 있으면 따옴표로 감싸기
3. Reddit App이 제대로 등록되었는지 확인 (type: script)

### Q: 대량의 데이터를 수집하려면?

**A:**
```python
import time

for i in range(10):
    posts = collector.collect_from_subreddit('kpopcollections', limit=100)
    collector.save_to_csv(posts, f'batch_{i}.csv')
    time.sleep(60)  # 1분 대기 - API 제한 준수
```

### Q: CSV 파일을 Excel에서 열 수 없습니다.

**A:**
- 파일 확장자가 `.csv`인지 확인
- Excel에서 "데이터" → "텍스트/CSV 가져오기" 사용
- 인코딩을 UTF-8로 설정

### Q: 특정 시간 범위의 데이터만 수집하려면?

**A:**
`time_filter` 매개변수 사용:
```python
posts = collector.collect_from_subreddit(
    'kpopcollections',
    limit=50,
    sort='top',
    time_filter='month'  # 'all', 'year', 'month', 'week', 'day', 'hour'
)
```

---

## 📚 더 알아보기

- **전체 가이드**: `REDDIT_DATA_COLLECTOR_GUIDE.md` 참고
- **API 문서**: [PRAW 공식 문서](https://praw.readthedocs.io/)
- **Reddit API**: [Reddit 개발자 문서](https://www.reddit.com/dev/api)

---

## ✅ 체크리스트

Reddit 데이터 수집을 시작하기 전에 확인하세요:

- [ ] Reddit App 등록 완료 (https://www.reddit.com/prefs/apps)
- [ ] Client ID/Secret 취득
- [ ] `.env` 파일에 인증 정보 입력
- [ ] `pip install -r requirements.txt` 실행
- [ ] `python test_reddit_setup.py` 테스트 완료
- [ ] `python reddit_demo.py` 또는 커스텀 스크립트 실행

---

**준비 완료! 행운을 빕니다! 🎉**
