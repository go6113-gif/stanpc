# pSEO 랜딩 페이지 수익화 & 가입 전환 CTA 구현 가이드

## 📋 개요

pSEO 검색 유입 → My Vault 가입 → 제휴 수익화의 **3단계 전환 동선**을 구현합니다.

---

## 🎯 구현된 3단계 트래픽 전환 구조

```
[구글 검색 유입]
       │
       ▼
[1. 멤버 랜딩 페이지: /wiki/[group]/[member]]
  ├─ ① Hero Inline CTA ──────> "Add to My Vault" (회원가입 유도)
  ├─ ② 카드 셀 (Have/Wish) ──> 소셜 로그인 모달 + 개인화 컬렉션
  ├─ ③ 제휴 링크 (Buy) ──────> eBay/Pocamarket 클릭 → CPS 수익
  └─ ④ 이탈 감지 모달 ────────> 손실 방지 (재가입 유도)
       │
       ▼
[2. 스티키 바: 스크롤 30%]
  └─ Card Generator 공유 유도 ──> 바이럴 루프 (신규 유입)
```

---

## 📁 구현된 파일 구조

### **컴포넌트** (`components/wiki/`)

| 파일 | 역할 | 트리거 |
|------|------|--------|
| `HeroInlineCTA.tsx` | Hero 섹션 블루 바 (My Vault 유도) | 페이지 로드 |
| `QuickCheckInButton.tsx` | Have/Wish 버튼 + 소셜 로그인 | 각 카드 셀 |
| `AffiliateCardCell.tsx` | 제휴 링크 포함 카드 셀 | 카드 클릭 |
| `StickyBottomBar.tsx` | 하단 고정 바 | 스크롤 30% 이상 |
| `ExitIntentModal.tsx` | 이탈 감지 팝업 | 마우스 Leave (PC) |
| `VaultAuthModal.tsx` | 소셜 로그인 모달 | CTA 버튼 클릭 |
| `WikiPageWrapper.tsx` | NextAuth 제공자 래핑 | 페이지 렌더링 |

### **유틸리티** (`lib/`)

| 파일 | 역할 |
|------|------|
| `affiliate.ts` | eBay/Pocamarket/DK Shop 제휴 링크 생성 & 추적 |

### **API 엔드포인트** (`app/api/vault/`)

| 경로 | 메서드 | 역할 |
|------|--------|------|
| `/api/vault/card` | `POST` | 카드를 My Vault에 추가 (Have/Wish) |
| `/api/vault/card` | `GET` | 카드가 Vault에 있는지 확인 |

---

## 🚀 각 CTA의 동작 흐름

### **①️⃣ Hero Inline CTA** (상단 블루 바)

**배치:** Stats Bar 아래
**메시지:** "Tracking [Member]'s 42 photocards. Save to My Vault & Track Total Value"
**버튼:** "+ Add to My Vault"

```
비로그인 유저
  ├─ [+ Add to My Vault] 클릭
  │  └─ VaultAuthModal 팝업 (Google / X 로그인)
  │     └─ 로그인 성공
  │        └─ /vault로 리다이렉트 (컬렉션 생성)
  │
로그인 유저
  └─ [+ Add to My Vault] 클릭
     └─ /vault로 직접 이동
```

**변환 목표:** 단순 방문자 → My Vault 사용자

---

### **②️⃣ Quick Check-in (Have/Wish 버튼)** (각 카드 셀)

**배치:** 각 카드 썸네일 하단
**버튼:** "[보유 ✓]" + "[원함 ★]"

```
비로그인 유저
  ├─ [보유 ✓] 클릭
  │  └─ VaultAuthModal 팝업 (triggerAction: 'have')
  │     └─ 로그인 성공
  │        └─ 카드 자동 추가 (tags: ['In Hand'])
  │
로그인 유저
  └─ [보유 ✓] / [원함 ★] 클릭
     └─ /api/vault/card POST 요청
        └─ 즉시 컬렉션에 추가
           └─ 토스트 알림: "컬렉션에 추가되었습니다"
```

**변환 목표:** 클릭으로 즉시 개인화 컬렉션 구축

---

### **③️⃣ 제휴 링크 (eBay/Pocamarket)** (가격 표시 영역)

**배치:** 카드 셀 하단 (가격 있을 시만 노출)
**버튼:** "[eBay]" "[Pocamarket]"

```
유저가 가격 영역 [eBay] 클릭
  ├─ /api/tracking/outbound POST (클릭 추적)
  │  └─ OutboundClick 기록 (analytics)
  │
  └─ getAffiliateLink('ebay') 생성
     ├─ Search Query: "{memberName} {cardName}"
     ├─ EPN Campaign ID: process.env.EBAY_EPN_CAMPAIGN_ID
     ├─ Referral: stanpc 태그
     │
     └─ rover.ebay.com/?campid=xxxx&keyword=... 오픈
        └─ 사용자가 구매
           └─ CPS 수수료 발생 ✅
```

**환경변수 설정 필요:**
```env
EBAY_EPN_CAMPAIGN_ID=5338182771  # eBay Partner Network ID
EBAY_TOOLID=sellertoolkit
DKSHOP_AFFILIATE_ID=your-id
```

**변환 목표:** 시세 확인 → 즉시 구매 링크 클릭

---

### **④️⃣ Exit-Intent Modal** (이탈 감지)

**트리거:** PC에서 마우스가 브라우저 닫기 영역으로 이동 (`mouseleave` 이벤트)

```
비로그인 유저가 페이지 떠나려 함 (마우스 Leave)
  ├─ localStorage에 '하루 안 보기' 검사
  │  └─ 없으면 팝업 표시
  │
  └─ ExitIntentModal 팝업
     ├─ 제목: "Don't lose your wishlist!"
     ├─ 메시지: "Save your [Member] collection in 5 seconds"
     ├─ CTA: "[Save Collection (Free)]"
     │  └─ VaultAuthModal 팝업
     │     └─ 로그인 후 /vault로 이동
     │
     └─ 버튼: "[No thanks]"
        └─ localStorage에 24시간 기간으로 '안 보기' 저장
```

**변환 목표:** 손실 방지 (Bounce Rate 감소)

---

### **⑤️⃣ Sticky Bottom Bar** (스크롤 30% 이상)

**노출 조건:** 페이지 스크롤 깊이 30% 이상

```
스크롤 30% 도달
  ├─ localStorage에 '하루 안 보기' 검사
  │  └─ 없으면 스티키 바 표시
  │
  └─ StickyBottomBar 노출 (화면 하단 고정)
     ├─ 메시지: "🎨 Show off your [Member] collection to X/Twitter!"
     ├─ CTA: "[Generate My Card 🎨]" → /card-generator
     │
     └─ 버튼: "[✕ Dismiss]"
        └─ 24시간 동안 안 보기 (localStorage)
```

**변환 목표:** 자랑 카드 생성 → X/트위터 공유 → 바이럴 루프

---

## 🔄 전환 데이터 추적

### **추적되는 이벤트**

| 이벤트 | 저장 위치 | 분석용도 |
|--------|---------|---------|
| 제휴 링크 클릭 | `OutboundClick` 테이블 | CPS 수익 추적 |
| Vault 카드 추가 | `UserBinderCard` 테이블 | 컬렉션 크기 |
| 소셜 로그인 | NextAuth Session | 회원가입 퍼널 |

### **OutboundClick 스키마** (기존)

```typescript
model OutboundClick {
  id        String   @id @default(cuid())
  userId    String
  cardId    String
  platform  String   // 'ebay', 'pocamarket', 'dk-shop'
  timestamp DateTime @default(now())
}
```

---

## ⚙️ 구성 및 커스터마이징

### **제휴 링크 새로운 플랫폼 추가**

`lib/affiliate.ts`의 함수를 확장:

```typescript
// 새 플랫폼 추가
export function generateMercariAffiliateLink(config: AffiliateConfig): string {
  // 로직 구현
}

// getAffiliateLink에 케이스 추가
case 'mercari':
  return generateMercariAffiliateLink(config);
```

### **제휴 링크 파라미터 커스터마이징**

`AffiliateCardCell.tsx`에서 `getAffiliateLink()` 호출 시 전달:

```typescript
const affiliateConfig: AffiliateConfig = {
  platform: 'ebay',
  cardName: cardName || 'Photocard',
  memberName,     // 자동 검색 쿼리에 포함
  groupName,
  estimatedPrice, // 선택: 가격별 필터 적용 가능
};
```

### **모달 메시지 한국어/영어 전환**

`VaultAuthModal.tsx`와 `ExitIntentModal.tsx`의 문자열 수정:

```typescript
// 다국어 지원 (선택사항)
const messages = {
  ko: { title: "내 Vault에 저장", ... },
  en: { title: "Save to My Vault", ... }
};
```

---

## 📊 전환율 최적화 체크리스트

### **A/B 테스트 포인트**

- [ ] Hero CTA 문구 (현재: "Add to My Vault" vs "Track Collection")
- [ ] 버튼 색상 (현재: 파란색 vs 초록색)
- [ ] Exit-Intent 트리거 타이밍 (현재: 즉시 vs 3초 지연)
- [ ] Sticky Bar 표시 조건 (현재: 스크롤 30% vs 50%)
- [ ] 모달의 신뢰 메시지 (현재: "100% Free" vs "No Credit Card Required")

### **분석 메트릭**

```sql
-- CTA 클릭율
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN has_vault_interaction = true THEN 1 END) as vault_interactions,
  ROUND(100.0 * COUNT(CASE WHEN has_vault_interaction = true THEN 1 END) / COUNT(*), 2) as cta_click_rate
FROM wiki_sessions;

-- 제휴 링크 전환
SELECT 
  platform,
  COUNT(*) as clicks,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(100.0 * COUNT(DISTINCT user_id) / total_sessions, 2) as conversion_rate
FROM outbound_clicks oc, (SELECT COUNT(*) as total_sessions FROM wiki_sessions) t
GROUP BY platform;

-- 회원가입 퍼널
SELECT 
  'visit' as stage, COUNT(*) as count FROM wiki_sessions
UNION ALL
SELECT 
  'cta_click' as stage, COUNT(*) FROM vault_cta_clicks
UNION ALL
SELECT 
  'auth_modal_open' as stage, COUNT(*) FROM auth_sessions
UNION ALL
SELECT 
  'signup_complete' as stage, COUNT(DISTINCT id) FROM users;
```

---

## 🧪 로컬 테스트

### **1. 환경변수 설정**

`.env.local`에 추가:

```env
# eBay Partner Network
EBAY_EPN_CAMPAIGN_ID=5338182771
EBAY_TOOLID=sellertoolkit

# NextAuth (Google/X)
AUTH_GOOGLE_ID=your-client-id
AUTH_GOOGLE_SECRET=your-client-secret
AUTH_TWITTER_ID=your-client-id
AUTH_TWITTER_SECRET=your-client-secret
```

### **2. 개발 서버 실행**

```bash
npm run dev
# http://localhost:3000/wiki/[group]/[member] 접속
```

### **3. 각 CTA 테스트**

| 테스트 | 단계 |
|--------|------|
| Hero CTA | 비로그인 상태 → "+ Add to My Vault" 클릭 → 모달 확인 |
| Have/Wish | 비로그인 상태 → "[보유 ✓]" 클릭 → 모달 확인 |
| 제휴 링크 | "[eBay]" 클릭 → rover.ebay.com 새 탭 오픈 확인 |
| Exit-Intent | 페이지에서 마우스 Leave (위쪽) → 팝업 확인 |
| Sticky Bar | 페이지 30% 스크롤 → 하단 바 노출 |

### **4. LocalStorage 확인** (개발자 도구)

```javascript
// Console에서 실행
localStorage.getItem('exit-intent-modal-dismissed')
localStorage.getItem('sticky-bar-dismissed')
```

---

## 🔗 관련 페이지

- **OG Image 생성:** `/docs/OG_IMAGE_SPEC.md`
- **My Vault API:** `/app/api/vault/route.ts`
- **Card Generator:** `/app/card-generator/page.tsx`
- **Wiki 페이지:** `/app/wiki/[group]/[member]/page.tsx`

---

## 📝 마이그레이션 노트

### **기존 코드에서 변경사항**

1. **Wiki 멤버 페이지** (`app/wiki/[group]/[member]/page.tsx`)
   - `HeroInlineCTA` 추가 (Stats Bar 아래)
   - 기존 카드 Link → `AffiliateCardCell` 컴포넌트로 변경
   - `ExitIntentModal`, `StickyBottomBar` 추가
   - `WikiPageWrapper`로 페이지 전체 래핑

2. **새 API 엔드포인트**
   - `/api/vault/card` (POST/GET)

3. **새 컴포넌트** (7개)
   - wiki/ 폴더에 총 7개의 클라이언트 컴포넌트 추가

---

## 🎓 추가 학습

### **제휴 마케팅 최적화**

- eBay EPN: https://affiliates.ebay.com/
- Pocamarket: 데이터 정책 검토 필요
- DK Shop: affiliate@dkshop.co.kr 문의

### **모달 UX 패턴**

- Exit-Intent 효과: 10-25% 이탈 감소
- 모달 디스미스 (1회/일): 사용자 피로도 완화
- 신뢰 메시지: "Free", "No Credit Card" → 11% 전환율 향상

---

## ❓ FAQ

**Q: 제휴 링크에서 수익을 못 받으면?**
- A: EPN Campaign ID 확인, rovery.ebay.com 형식 검증, 쿠키 기간(30일) 확인

**Q: Exit-Intent가 작동하지 않으면?**
- A: PC 테스트만 가능 (모바일 미지원), 마우스 Leave 이벤트 리스너 확인

**Q: 모달이 24시간 안 나타나면?**
- A: LocalStorage의 `exit-intent-modal-dismissed` 또는 `sticky-bar-dismissed` 값 확인, 개발자 도구에서 삭제

---

**작성일:** 2026-08-12  
**최종 업데이트:** 2026-08-12  
**담당자:** Claude Code AI
