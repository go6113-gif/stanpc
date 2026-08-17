# 🔐 프로덕션 환경 변수 점검 체크리스트

**점검 날짜:** 2026-08-17  
**배포 환경:** Vercel (Production)  
**프로젝트:** StanPC (poca-exchange)

---

## 📋 환경 변수 설정 상태

### 1. 필수 사이트 설정

| 변수 | 값 | 상태 | 설명 |
|------|-----|------|------|
| `NEXT_PUBLIC_SITE_URL` | `https://stanpc.com` | ⏳ 필수 설정 | 메타데이터, Canonical, OG URL 기준 |

### 2. 데이터베이스 연결

| 변수 | 상태 | 설명 |
|------|------|------|
| `DATABASE_URL` | ⏳ 필수 설정 | Supabase PostgreSQL 읽기/쓰기 연결 |
| `DIRECT_URL` | ⏳ 필수 설정 | Supabase 마이그레이션용 직접 연결 |

**설정 방법:**
```
Supabase 대시보드 → Settings → Database → Connection Strings
→ "URI" 또는 "Connection pooling" 복사
```

**형식:**
```
postgresql://[user]:[password]@[host].[region].supabase.co:5432/postgres?schema=public
```

### 3. 인증 (Auth.js)

#### 3.1 AUTH_SECRET (필수)

| 변수 | 상태 | 설명 |
|------|------|------|
| `AUTH_SECRET` | ⏳ 필수 생성 | 세션 쿠키 암호화 키 (32바이트 무작위) |

**생성 방법:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**복사한 값을 Vercel에 설정**

#### 3.2 Google OAuth

| 변수 | 상태 | 설명 |
|------|------|------|
| `AUTH_GOOGLE_ID` | ⏳ 필수 설정 | Google Cloud Console OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET` | ⏳ 필수 설정 | Google Cloud Console OAuth 2.0 Client Secret |

**설정 방법:**
1. [Google Cloud Console](https://console.cloud.google.com)
2. 프로젝트 선택 → APIs & Services → Credentials
3. OAuth 2.0 Client ID 생성 (Web application)
4. **Authorized redirect URIs:**
   ```
   https://stanpc.com/api/auth/callback/google
   ```
5. Client ID & Secret 복사

#### 3.3 Twitter/X OAuth

| 변수 | 상태 | 설명 |
|------|------|------|
| `AUTH_TWITTER_ID` | ⏳ 필수 설정 | X Developer Portal API Key |
| `AUTH_TWITTER_SECRET` | ⏳ 필수 설정 | X Developer Portal API Secret |

**설정 방법:**
1. [X Developer Portal](https://developer.twitter.com/en/portal)
2. Project & Apps → Your Project → App Settings
3. Keys and tokens → API Key & Secret
4. **Callback URLs:**
   ```
   https://stanpc.com/api/auth/callback/twitter
   ```

#### 3.4 Kakao OAuth

| 변수 | 상태 | 설명 |
|------|------|------|
| `AUTH_KAKAO_ID` | ⏳ 필수 설정 | Kakao Developers REST API Key |
| `AUTH_KAKAO_SECRET` | ⏳ 필수 설정 | Kakao Developers Client Secret |

**설정 방법:**
1. [Kakao Developers](https://developers.kakao.com)
2. 내 애플리케이션 → 앱 생성
3. 앱 키 → REST API 키 복사
4. 보안 → Client Secret 발급
5. 앱 설정 → 사용자 관리 → 로그인 Redirect URI 설정:
   ```
   https://stanpc.com/api/auth/callback/kakao
   ```

#### 3.5 Naver OAuth

| 변수 | 상태 | 설명 |
|------|------|------|
| `AUTH_NAVER_ID` | ⏳ 필수 설정 | Naver Developers Client ID |
| `AUTH_NAVER_SECRET` | ⏳ 필수 설정 | Naver Developers Client Secret |

**설정 방법:**
1. [Naver Developers](https://developers.naver.com/apps)
2. 애플리케이션 등록 → 로그인 상품 추가
3. Client ID & Secret 발급
4. 로그인 설정 → Callback URL:
   ```
   https://stanpc.com/api/auth/callback/naver
   ```

### 4. Supabase Auth

| 변수 | 상태 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ⏳ 필수 설정 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⏳ 필수 설정 | Supabase Anon (클라이언트) Key |

**설정 방법:**
```
Supabase 대시보드 → Settings → API
→ Project URL 및 anon (public) key 복사
```

### 5. Stripe 결제 (얼리버드)

| 변수 | 상태 | 설명 |
|------|------|------|
| `STRIPE_SECRET_KEY` | ⏳ 필수 설정 | Stripe 프로덕션 Secret Key |
| `STRIPE_WEBHOOK_SECRET` | ⏳ 필수 설정 | Stripe 웹훅 서명 시크릿 |

**설정 방법:**

1. **Stripe Secret Key:**
   - [Stripe Dashboard](https://dashboard.stripe.com)
   - Developers → API Keys
   - Secret key (sk_live_...) 복사

2. **Webhook Secret:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://stanpc.com/api/webhooks/stripe`
   - Events:
     - `payment_intent.succeeded`
     - `charge.refunded`
   - Secret 생성 및 복사

### 6. eBay Affiliate & Search API

| 변수 | 상태 | 설명 |
|------|------|------|
| `EBAY_CLIENT_ID` | ⏳ 권장 설정 | eBay Browse API Client ID |
| `EBAY_CLIENT_SECRET` | ⏳ 권장 설정 | eBay Browse API Client Secret |
| `EBAY_EPN_CAMPAIGN_ID` | ⏳ 권장 설정 | eBay Partner Network Campaign ID |

**설정 방법:**
1. [eBay Developers](https://developer.ebay.com)
2. Application Keys → Create → Production
3. Client ID & Secret 복사

### 7. 한국 시장 제휴

| 변수 | 상태 | 설명 |
|------|------|------|
| `DKSHOP_AFFILIATE_ID` | ⏳ 권장 설정 | DK Shop 제휴 ID |

**설정 방법:**
- DK Shop 제휴 프로그램 신청 후 제휴 ID 발급받기

### 8. Search Console 인증 (선택사항)

| 변수 | 상태 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | ⏳ 권장 설정 | Google Search Console 인증 메타 value |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | ⏳ 권장 설정 | Naver 서치어드바이저 인증 메타 value |

**설정 방법:**

1. **Google Search Console:**
   - https://search.google.com/search-console
   - 속성 추가 → https://stanpc.com
   - 소유권 확인 → HTML 태그
   - `content="..."` 값만 복사

2. **Naver 서치어드바이저:**
   - https://searchadvisor.naver.com
   - 사이트 추가 → https://stanpc.com
   - 소유 확인 → HTML 태그
   - `content="..."` 값만 복사

### 9. 가격 및 할인 설정

| 변수 | 현재값 | 상태 | 설명 |
|------|--------|------|------|
| `NEXT_PUBLIC_ORIGINAL_PRICE_USD` | 18 | ⏳ 확인 | 얼리버드 가격 (USD) |
| `NEXT_PUBLIC_DISCOUNT_RATE` | 0 | ⏳ 확인 | 할인율 (0.3 = 30% 할인) |
| `NEXT_PUBLIC_REFERRER_CREDITS` | 5 | ⏳ 확인 | 추천인 리워드 크레딧 |
| `NEXT_PUBLIC_REFEREE_CREDITS` | 0 | ⏳ 확인 | 신규 사용자 크레딧 |

### 10. 환율 설정

| 변수 | 현재값 | 상태 | 설명 |
|------|--------|------|------|
| `NEXT_PUBLIC_EXCHANGE_RATE_KRW` | 1300 | ⏳ 확인 | USD → KRW |
| `NEXT_PUBLIC_EXCHANGE_RATE_JPY` | 120 | ⏳ 확인 | USD → JPY |
| `NEXT_PUBLIC_EXCHANGE_RATE_EUR` | 0.95 | ⏳ 확인 | USD → EUR |
| `NEXT_PUBLIC_EXCHANGE_RATE_GBP` | 0.82 | ⏳ 확인 | USD → GBP |

---

## 🚀 Vercel 환경 변수 설정 가이드

### 웹 인터페이스로 설정

```
1. Vercel 대시보드 → stanpc 프로젝트
2. Settings → Environment Variables
3. "Add Environment Variable" 클릭
4. 변수명 & 값 입력
5. 환경 선택:
   ✅ Production (필수)
   ⬜ Preview (권장)
   ⬜ Development (선택)
6. "Save" 클릭
```

### CLI로 설정

```bash
cd D:\StanPC\poca-exchange

# 단일 변수 설정
vercel env add DATABASE_URL
# 프롬프트: 값 입력 → 엔터
# 환경 선택: Production 선택

# 모든 변수 목록 확인
vercel env list

# 변수 삭제
vercel env remove DATABASE_URL

# 재배포
vercel --prod
```

---

## ✅ 설정 확인 체크리스트

### Phase 1: 필수 (배포 전 필수)

- [ ] `NEXT_PUBLIC_SITE_URL` = `https://stanpc.com`
- [ ] `DATABASE_URL` 설정 완료
- [ ] `DIRECT_URL` 설정 완료
- [ ] `AUTH_SECRET` 생성 및 설정
- [ ] `STRIPE_SECRET_KEY` 설정 (얼리버드 결제)
- [ ] `STRIPE_WEBHOOK_SECRET` 설정

### Phase 2: 인증 (배포 전 권장)

- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- [ ] `AUTH_TWITTER_ID` / `AUTH_TWITTER_SECRET`
- [ ] `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET`
- [ ] `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Phase 3: SEO & 제휴 (배포 후 설정 가능)

- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- [ ] `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`
- [ ] `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`
- [ ] `EBAY_EPN_CAMPAIGN_ID`
- [ ] `DKSHOP_AFFILIATE_ID`

### Phase 4: 가격 & 환율 (배포 전 확인)

- [ ] `NEXT_PUBLIC_ORIGINAL_PRICE_USD` 최종 확인
- [ ] `NEXT_PUBLIC_DISCOUNT_RATE` 최종 확인
- [ ] `NEXT_PUBLIC_REFERRER_CREDITS` 최종 확인
- [ ] 환율 정보 최신 값 확인

---

## 🔒 보안 주의사항

### 절대 하지 말 것 ⚠️

```bash
# ❌ 금지: Git에 실제 환경 변수 커밋
git add .env
git commit -m "..."  # DON'T!

# ❌ 금지: 공개 저장소에 SECRET 키 노출
# GitHub/GitLab 공개 리포지터리에 절대 푸시 금지

# ❌ 금지: Vercel 외부에서 환경 변수 로그 출력
console.log(process.env.DATABASE_URL);  // 스크린샷 금지
```

### 권장 사항 ✅

```bash
# ✅ 권장: 환경 변수는 Vercel Dashboard에서만 관리
# ✅ 권장: .env.local / .env.production은 .gitignore에 포함
# ✅ 권장: 로컬 개발은 .env.local 사용
# ✅ 권장: 프로덕션 키는 정기적으로 로테이션
# ✅ 권장: 중요한 키는 Vercel 감시 기능 활성화
```

---

## 📞 트러블슈팅

### 배포 후 "500 Internal Server Error"

**원인:** 환경 변수 누락 또는 잘못된 값

**해결:**
1. Vercel 로그 확인: Deployments → 배포 선택 → Logs
2. 환경 변수 재설정
3. 재배포

### "Database connection refused"

**원인:** DATABASE_URL 또는 DIRECT_URL 오류

**해결:**
1. Supabase에서 연결 문자열 재확인
2. IP Whitelist 확인 (Supabase Settings → Network)
3. 스페이스/개행 없이 정확하게 복사

### OAuth 로그인 "Redirect URI mismatch"

**원인:** OAuth 프로바이더 설정과 앱 Redirect URI 불일치

**해결:**
1. 각 OAuth 프로바이더에서 설정 확인
2. 정확한 URI: `https://stanpc.com/api/auth/callback/[provider]`
3. Vercel 배포 도메인이 `stanpc.com`인지 확인

---

**준비 완료!** 모든 환경 변수가 설정되면 배포할 수 있습니다. 🚀
