# Reddit Developer Portal - Script App 등록 가이드

Reddit API를 사용하기 위해 Script 타입 애플리케이션을 등록하는 상세 절차입니다.

---

## 📋 준비 사항

- Reddit 계정 (없으면 먼저 가입: https://www.reddit.com)
- 웹 브라우저
- 메모장 또는 텍스트 에디터

---

## 🔑 Step-by-Step 등록 절차

### Step 1: Reddit 개발자 포털 접속

1. 브라우저에서 다음 URL 열기:
   ```
   https://www.reddit.com/prefs/apps
   ```

2. Reddit 계정으로 로그인
   - 우측 상단 "Log In" 클릭
   - 계정명과 비밀번호 입력
   - "Sign in" 클릭

3. 다시 https://www.reddit.com/prefs/apps 접속

### Step 2: 앱 등록 폼 찾기

프리퍼런스 페이지에서:

1. 페이지 왼쪽 메뉴에서 **"Apps"** 또는 **"Authorized applications"** 클릭
   (만약 바로 보이지 않으면 페이지를 아래로 스크롤)

2. 페이지 중간~하단에 다음 텍스트가 보입니다:
   ```
   "are you a developer? create an app"
   또는
   "개발자입니까? 앱을 만드세요"
   ```

3. **"create an app"** 또는 **"create application"** 링크 클릭

### Step 3: 앱 정보 입력

등록 폼이 나타나면 다음과 같이 입력합니다:

#### ✅ 필수 필드

**1️⃣ Name (앱 이름)**
```
K-pop Data Collector
또는
PhotoCard Collector Reddit Bot
또는 원하는 이름
```

**2️⃣ App type (앱 유형) - 이것이 가장 중요합니다!**
- 다음 3개 옵션 중 **"script"** 선택:
  - `web app` (웹 애플리케이션)
  - `installed app` (설치형 앱)
  - `script` ✅ **이것을 선택하세요!**

**3️⃣ Description (설명, 선택사항)**
```
K-pop photocard data collection for personal research
또는 비워둬도 됨
```

**4️⃣ About URL (선택사항)**
- 비워둬도 됨

**5️⃣ Redirect URI (리다이렉트 URI)**
- Script 타입인 경우 필수이지만, 실제로 사용하지 않음
- 다음 값 입력:
  ```
  http://localhost:8080
  ```
  또는
  ```
  http://127.0.0.1:8080
  ```

### Step 4: 앱 생성 및 정보 저장

1. **"Create app"** 버튼 클릭

2. 성공하면 앱 정보 페이지가 나타남

3. 다음 정보 **정확히 복사하여 저장**:

#### 📌 Client ID
- **"personal use script"** 글자 바로 아래
- 긴 문자열 (예: `aBcDeFgHiJkLmNoPqRsT`)
- 이것을 복사: `.env` 파일의 `REDDIT_CLIENT_ID`

#### 📌 Client Secret
- **"secret"** 라벨 옆의 긴 문자열
- 예: `xYzAbCdEfGhIjKlMnOpQrStUvWxYz`
- 이것을 복사: `.env` 파일의 `REDDIT_CLIENT_SECRET`

---

## 🔐 .env 파일 설정

Reddit 정보와 App 정보를 `.env` 파일에 입력합니다.

프로젝트 루트에서 `.env` 파일을 열고:

```env
# Reddit API Configuration
# Reddit App 등록: https://www.reddit.com/prefs/apps

REDDIT_CLIENT_ID="여기에_Client_ID_붙여넣기"
REDDIT_CLIENT_SECRET="여기에_Client_Secret_붙여넣기"
REDDIT_USERNAME="당신의_Reddit_계정명"
REDDIT_PASSWORD="당신의_Reddit_비밀번호"
REDDIT_USER_AGENT="KpopDataCollector/1.0 (by 당신의_Reddit_계정명)"
```

### 예시

```env
REDDIT_CLIENT_ID="aBcDeFgHiJkLmNoPqRsT"
REDDIT_CLIENT_SECRET="xYzAbCdEfGhIjKlMnOpQrStUvWxYz"
REDDIT_USERNAME="my_reddit_username"
REDDIT_PASSWORD="MySecurePassword123!"
REDDIT_USER_AGENT="KpopDataCollector/1.0 (by my_reddit_username)"
```

---

## ⚠️ 주의사항

### 보안 주의

1. **절대 공개하지 마세요:**
   - Client ID
   - Client Secret
   - Reddit 비밀번호

2. **`.env` 파일 보호:**
   - `.gitignore`에 `.env` 추가됨 (이미 되어있음)
   - GitHub에 커밋하지 않기

3. **비밀번호 저장:**
   - 특수문자를 포함하고 있다면 큰따옴표로 감싸기
   - 예: `REDDIT_PASSWORD="Pass@word!123"`

### App Type 선택 중요성

- **Script** (✅ 올바른 선택)
  - 개인적인 데이터 수집/자동화
  - 명령줄 도구
  - 스크립트 기반 수집

- **Installed App** (웹 기반 애플리케이션 아님)
  - 모바일/데스크톱 앱
  - 웹 브라우저가 아닌 앱

- **Web App** (❌ 데이터 수집에는 부적절)
  - 웹 서비스 (웹사이트)
  - OAuth 기반 인증 필요

---

## 🧪 설정 검증

설정이 완료되었는지 테스트합니다:

```bash
python test_reddit_setup.py
```

출력:
```
✓ REDDIT_CLIENT_ID: aBcDeFgHi...
✓ REDDIT_CLIENT_SECRET: xYzAbCdEfGh...
✓ REDDIT_USERNAME: my_reddit_username
✓ REDDIT_PASSWORD: (설정됨)
✓ praw: 7.7.0
✓ pandas: 1.3.0
✓ 연결 성공!
  계정: u/my_reddit_username
  Karma: 1234
```

모든 항목에 ✓ 마크가 나타나면 성공입니다!

---

## 🚀 데이터 수집 시작

### 자동 수집 (권장)

```bash
python reddit_photocard_collector.py
```

### 커스텀 수집

```bash
python reddit_demo.py
```

### 설정 테스트

```bash
python test_reddit_setup.py
```

---

## 📊 생성된 파일

수집 후 다음 파일들이 생성됩니다:

```
data/
├── reddit_photocard_posts.json      # 포토카드 포스트 및 댓글
├── kpopcollections_posts_*.csv      # kpopcollections 포스트
├── kpopforsale_posts_*.csv          # kpopforsale 포스트
└── photocard_search_*.csv           # 검색 결과
```

---

## ❓ 문제 해결

### "Invalid credentials" 에러

**원인:** 인증 정보가 잘못됨

**해결:**
1. `.env` 파일의 모든 값 재확인
2. 복사-붙여넣기 시 공백이 없는지 확인
3. Reddit App이 제대로 생성되었는지 확인
4. Reddit 비밀번호 재확인 (특수문자 주의)

### "Forbidden - 403" 에러

**원인:** API 요청 제한 초과

**해결:**
- 요청 간격을 더 길게
- 한 번에 수집하는 데이터 양 줄이기

### App 생성 후 Client Secret이 보이지 않음

**해결:**
1. 앱 이름 클릭하여 상세 페이지 진입
2. "personal use script" 섹션에서 확인
3. "secret" 옆에 있는 긴 문자열이 Client Secret

---

## 🔗 참고 링크

- [Reddit Preferences/Apps](https://www.reddit.com/prefs/apps)
- [PRAW 공식 문서](https://praw.readthedocs.io/)
- [Reddit API 개발자 문서](https://www.reddit.com/dev/api)
- [Reddit API OAuth2 가이드](https://github.com/reddit-archive/reddit/wiki/OAuth2)

---

## 💡 팁

### 1. 여러 Reddit 계정 사용

각 계정마다 다른 Script App을 생성하고, `.env.{account_name}` 파일을 만들어 관리할 수 있습니다.

### 2. User Agent 설정

Reddit에서 권장하는 User Agent 형식:
```
<platform>:<app-id>:<version> (by <reddit-username>)
```

예:
```
REDDIT_USER_AGENT="windows:photocard-collector:1.0 (by my_reddit_username)"
```

### 3. Rate Limiting 준수

Reddit API 요청 제한:
- 60초에 최대 60개 요청
- 대량 수집 시 요청 간 지연 추가

```python
import time
time.sleep(1)  # 1초 대기
```

---

**마지막 업데이트:** 2026-08-12
