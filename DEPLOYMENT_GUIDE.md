# 🚀 StanPC 프로덕션 배포 가이드 (2026-08-17)

## 📋 사전 준비 체크리스트

### ✅ 1단계: 환경 변수 점검 및 설정

#### 필수 환경 변수 (.env.production)

```bash
# 🌐 Site Configuration
NEXT_PUBLIC_SITE_URL="https://stanpc.com"

# 📊 Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"
DIRECT_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"

# 🔐 Auth.js Secret
AUTH_SECRET="[생성: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"]"

# 🔑 OAuth 제공자 (Google)
AUTH_GOOGLE_ID="[Google Cloud Console에서 발급]"
AUTH_GOOGLE_SECRET="[Google Cloud Console에서 발급]"
# Redirect URI: https://stanpc.com/api/auth/callback/google

# 🐦 OAuth 제공자 (Twitter/X)
AUTH_TWITTER_ID="[X Developer Portal에서 발급]"
AUTH_TWITTER_SECRET="[X Developer Portal에서 발급]"
# Callback URL: https://stanpc.com/api/auth/callback/twitter

# 🍫 OAuth 제공자 (Kakao)
AUTH_KAKAO_ID="[Kakao Developers에서 발급]"
AUTH_KAKAO_SECRET="[Kakao Developers에서 발급]"
# Redirect URI: https://stanpc.com/api/auth/callback/kakao

# 💚 OAuth 제공자 (Naver)
AUTH_NAVER_ID="[Naver Developers에서 발급]"
AUTH_NAVER_SECRET="[Naver Developers에서 발급]"
# Callback URL: https://stanpc.com/api/auth/callback/naver

# 🔵 Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="[Supabase 프로젝트 URL]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[Supabase Anon Key]"

# 💳 Stripe (얼리버드 결제)
STRIPE_SECRET_KEY="sk_live_[프로덕션 시크릿 키]"
STRIPE_WEBHOOK_SECRET="whsec_[웹훅 시크릿]"

# 🛒 eBay Affiliate
EBAY_CLIENT_ID="[eBay Browse API Client ID]"
EBAY_CLIENT_SECRET="[eBay Browse API Client Secret]"
EBAY_EPN_CAMPAIGN_ID="[eBay EPN Campaign ID]"

# 🇰🇷 한국 시장 제휴
DKSHOP_AFFILIATE_ID="[DK Shop Affiliate ID]"

# 🔍 Search Console 인증 (선택사항)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="[Google Search Console에서 발급]"
NEXT_PUBLIC_NAVER_SITE_VERIFICATION="[Naver 서치어드바이저에서 발급]"

# 💰 가격 설정 (USD 기준)
NEXT_PUBLIC_ORIGINAL_PRICE_USD=18
NEXT_PUBLIC_DISCOUNT_RATE=0
NEXT_PUBLIC_REFERRER_CREDITS=5
NEXT_PUBLIC_REFEREE_CREDITS=0

# 💱 환율 설정 (표시용)
NEXT_PUBLIC_EXCHANGE_RATE_KRW=1300
NEXT_PUBLIC_EXCHANGE_RATE_JPY=120
NEXT_PUBLIC_EXCHANGE_RATE_EUR=0.95
NEXT_PUBLIC_EXCHANGE_RATE_GBP=0.82
```

#### 환경 변수 설정 방법

**Vercel Dashboard를 통한 설정:**

1. [vercel.com](https://vercel.com) 접속
2. `stanpc` 프로젝트 선택
3. Settings → Environment Variables
4. 위 환경 변수 모두 추가
5. 각 환경(Production, Preview, Development)에 맞게 설정

**또는 Vercel CLI를 통한 설정:**

```bash
cd poca-exchange
vercel env add NEXT_PUBLIC_SITE_URL
# 값 입력: https://stanpc.com

vercel env add DATABASE_URL
# PostgreSQL 연결 문자열 입력

# ... 나머지 환경 변수도 동일하게 추가
```

---

### ✅ 2단계: 정적 자산 및 파비콘 검증

#### Favicon & OG 이미지 (✅ 완료됨)

| 파일 | 위치 | 용도 | 상태 |
|------|------|------|------|
| `icon.svg` | `app/icon.svg` | 브라우저 탭 파비콘 | ✅ 생성됨 |
| `opengraph-image.tsx` | `app/opengraph-image.tsx` | 소셜 미디어 OG 이미지 | ✅ 생성됨 |
| `robots.txt` | `public/robots.txt` | 검색 봇 크롤링 정책 | ✅ 이미 있음 |
| `sitemap.xml` | `/sitemap.xml` (동적) | 검색 엔진 사이트맵 | ✅ 구현됨 |

#### 파비콘 검증 체크리스트

```bash
# 로컬에서 빌드하여 파비콘 생성 확인
cd poca-exchange
npm run build

# 빌드 완료 후 다음 파일 확인
ls -la .next/static/
```

#### OG 이미지 테스트

1. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/sharing)에서 테스트
   - URL: `https://stanpc.com`
   - 올바른 OG 이미지 표시 확인

2. [Twitter Card Validator](https://cards-dev.twitter.com/validator)에서 테스트
   - URL: `https://stanpc.com`
   - Twitter Card 메타데이터 확인

---

### ✅ 3단계: 배포 실행

#### 옵션 1: Git Push를 통한 자동 배포 (권장)

**사전 조건:**
- Vercel이 GitHub와 연결되어 있어야 함
- `stanpc` 프로젝트가 Vercel에 등록되어 있어야 함

**배포 명령:**

```bash
# 1. 변경사항 커밋
cd D:\StanPC
git add poca-exchange/
git commit -m "feat: Production deployment ready - SEO & UX infrastructure complete"

# 2. Main 브랜치로 푸시 (자동 배포 트리거)
git push origin main

# 3. Vercel 대시보드에서 배포 진행상황 모니터링
# https://vercel.com/dashboard/stanpc
```

**배포 진행 확인:**
- Vercel은 자동으로 빌드 시작
- 빌드 완료 후 Production 환경에 배포
- ~3-5분 후 https://stanpc.com에서 라이브 확인

#### 옵션 2: Vercel CLI를 통한 직접 배포

```bash
# 1. Vercel CLI 설치 (이미 설치된 경우 생략)
npm install -g vercel

# 2. 프로젝트 디렉터리로 이동
cd D:\StanPC\poca-exchange

# 3. 로그인
vercel login

# 4. 프로덕션 배포
vercel --prod

# 5. 배포 완료 대기
# 콘솔에서 배포 진행상황 확인
```

#### 배포 검증 체크리스트

배포 완료 후 다음 항목을 확인하세요:

```bash
# 1. 사이트 접속 가능 확인
curl -I https://stanpc.com
# HTTP/1.1 200 OK 확인

# 2. 파비콘 로드 확인
curl -I https://stanpc.com/icon.svg
# HTTP/1.1 200 OK 확인

# 3. Sitemap 접근 확인
curl https://stanpc.com/sitemap.xml | head -20
# <?xml version="1.0" 로 시작 확인

# 4. Robots.txt 확인
curl https://stanpc.com/robots.txt | head -10
# Sitemap 경로 포함 확인

# 5. OG 메타데이터 확인
curl -s https://stanpc.com | grep -i "og:" | head -5
```

---

## 📊 배포 후 SEO 최적화

### 1단계: Google Search Console 등록

**시간:** ~10분

```bash
# 1. Google Search Console 접속
# https://search.google.com/search-console

# 2. 새 속성 추가
# - URL: https://stanpc.com
# - 소유권 확인 방법 선택:
#   a. HTML 파일 업로드 (권장 안 함 - Next.js 앱)
#   b. HTML 태그 (권장)
#   c. Google Analytics (설정되어 있으면 자동)

# 3. HTML 태그 방법 선택 시:
# - content="..." 값만 복사
# - .env.production에 추가:
#   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="[값]"

# 4. 배포 완료 후 GSC에서 "소유권 확인" 버튼 클릭

# 5. Sitemap 제출
# - Sitemaps → 새 사이트맵 추가
# - URL: https://stanpc.com/sitemap.xml
# - 제출
```

### 2단계: Naver 서치어드바이저 등록 (한국 SEO)

**시간:** ~10분

```bash
# 1. Naver 서치어드바이저 접속
# https://searchadvisor.naver.com

# 2. 신규 사이트 등록
# - URL: https://stanpc.com

# 3. 소유 확인
# - HTML 태그 → content 값 복사
# - .env.production에 추가:
#   NEXT_PUBLIC_NAVER_SITE_VERIFICATION="[값]"

# 4. 배포 후 확인 버튼 클릭

# 5. 사이트맵 제출
# - 요청 → 사이트맵 제출
# - URL: https://stanpc.com/sitemap.xml
```

### 3단계: Google Analytics 4 설정 (선택사항)

```bash
# 1. Google Analytics 생성
# https://analytics.google.com

# 2. 측정 ID 생성
# - 속성 생성 → 한국 선택
# - 측정 ID (G-XXXXXXXXXX) 확인

# 3. lib/gtag.ts에 통합
# export const GA_ID = 'G-XXXXXXXXXX';
```

---

## 🔍 배포 후 모니터링

### 실시간 모니터링 (처음 24시간)

```bash
# Vercel Analytics
# https://vercel.com/dashboard/stanpc/analytics

# 모니터링 항목:
# - Page Views
# - Web Vitals (LCP, CLS, FID)
# - Edge Function 실행 시간
# - API 응답 시간

# Google Search Console
# https://search.google.com/search-console

# 모니터링 항목:
# - 색인 생성 상태
# - 크롤링 오류 (있으면 즉시 해결)
# - 클릭 수 및 노출
# - 평균 클릭율 (CTR)
```

### 정기 모니터링 (주간)

1. **성능 모니터링**
   - Core Web Vitals 점수 확인
   - 페이지 로드 시간 추이
   - API 응답 시간

2. **SEO 모니터링**
   - 색인된 페이지 수 (월별 증가 추적)
   - 새 크롤링 오류 감시
   - 순위 추이 (주요 키워드)

3. **기능 모니터링**
   - 지불 처리 오류 없음
   - API 에러 로그 확인
   - 사용자 피드백 수집

---

## 🆘 배포 후 트러블슈팅

### 문제: Sitemap이 로드되지 않음

**원인:** 데이터베이스 연결 실패

```bash
# 해결:
# 1. Vercel 환경변수 확인
vercel env list

# 2. DATABASE_URL / DIRECT_URL 재설정

# 3. 재배포
vercel --prod
```

### 문제: 파비콘이 표시되지 않음

**원인:** 브라우저 캐시 또는 Next.js 빌드 이슈

```bash
# 해결:
# 1. 로컬 빌드 테스트
npm run build

# 2. 캐시 무효화 (Vercel Dashboard)
# Settings → Git → Ignore Build Cache → 재배포

# 3. 브라우저 캐시 삭제
# Ctrl+Shift+Delete (개발자 도구에서 캐시 삭제)
```

### 문제: OG 이미지가 소셜 미디어에 표시 안 됨

**원인:** og:image 캐시 문제

```bash
# 해결:
# 1. Facebook Sharing Debugger에서 다시 스크래핑
# https://developers.facebook.com/tools/debug/sharing

# 2. "Scrape Again" 버튼 클릭

# 3. Twitter Card Validator에서 테스트
# https://cards-dev.twitter.com/validator

# 4. 48시간 대기 (최종 폴백)
```

---

## 📞 지원 및 추가 리소스

### 공식 문서
- [Next.js 16 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel 배포 문서](https://vercel.com/docs)
- [Prisma PostgreSQL 가이드](https://www.prisma.io/docs/orm/overview/databases/postgresql)

### 구글 SEO
- [Google 검색 개선 가이드](https://developers.google.com/search/docs)
- [Google Search Console 헬프](https://support.google.com/webmasters)

### 한국 SEO
- [Naver 웹마스터 도구](https://searchadvisor.naver.com)
- [Naver 검색 로봇 이용 안내](https://webmaster.naver.com/help/index.naver)

---

## ✅ 최종 체크리스트

배포 전 다음 항목을 모두 확인하세요:

### 환경 변수
- [ ] DATABASE_URL 및 DIRECT_URL 설정
- [ ] AUTH_SECRET 설정 (무작위 생성)
- [ ] OAuth 제공자 인증서 설정 (Google, Twitter, Kakao, Naver)
- [ ] Supabase URL 및 Anon Key 설정
- [ ] Stripe Secret Key 설정
- [ ] Search Console 인증 메타태그 설정

### 정적 자산
- [ ] icon.svg 생성 및 검증
- [ ] opengraph-image.tsx 생성 및 검증
- [ ] robots.txt 확인
- [ ] sitemap.ts 기능 테스트

### 배포
- [ ] TypeScript 빌드 성공 (0 에러)
- [ ] Production build 성공
- [ ] Git main 브랜치 최신 커밋 푸시
- [ ] Vercel 환경 변수 모두 설정

### SEO
- [ ] Google Search Console 등록
- [ ] Naver 서치어드바이저 등록
- [ ] Sitemap.xml 제출
- [ ] robots.txt 제출

### 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Google Analytics 4 설정 (선택)
- [ ] 에러 로깅 설정 (Sentry 등)

---

**배포 준비 완료!** 🚀

위 체크리스트를 모두 완료하고 배포하면 stanpc.com이 공식 런칭됩니다.

**배포 예상 시간:** 5-10분  
**ESO 인덱싱 기간:** 3-7일 (Google), 1-3주 (Naver)

행운을 빕니다! ✨
