# Onboarding & Early-Bird Flow Components

이 디렉토리는 StanPC의 16~25세 K-pop 컬렉터를 위한 완전한 온보딩 및 얼리버드 결제 흐름을 구현합니다.

## 📦 Components

### 1. **OnboardingSpotlight.tsx**
3단계 스포트라이트 온보딩 흐름

**Features:**
- Step 1: 아티스트 선택 (그리드 UI)
- Step 2: 첫 포카 슬롯인 (펄스 애니메이션)
- Step 3: 완성 (폭죽 연출 with canvas-confetti)

**Usage:**
```tsx
import { OnboardingSpotlight } from '@/components/onboarding/OnboardingSpotlight';

<OnboardingSpotlight 
  onComplete={() => console.log('Done!')}
  artists={[{ id: 'bts', name: 'BTS' }]}
/>
```

**Props:**
- `onComplete?`: () => void - 완료 시 콜백
- `artists?`: Array - 아티스트 목록 (기본값: BTS, BLACKPINK, etc.)

---

### 2. **OnboardingGuideModal.tsx**
3-탭 캐러셀 모달 - 가치 제안 티징

**Features:**
- Tab 1: AI 스마트 자동 분류 (오픈 예정)
- Tab 2: 스마트 교환 카드 (No-Touch)
- Tab 3: 실시간 시세 대시보드
- 탭 네비게이션 (이전/다음 버튼 + 도트 인디케이터)

**Usage:**
```tsx
import { OnboardingGuideModal } from '@/components/onboarding/OnboardingGuideModal';

<OnboardingGuideModal 
  onNext={() => setStage('payment')}
  onSkip={() => setStage('payment')}
/>
```

**Props:**
- `onNext?`: () => void - 완료 시 콜백
- `onSkip?`: () => void - 나중에 보기 시 콜백

---

### 3. **EarlyBirdPaymentModal.tsx**
$18 얼리버드 특가 결제 모달

**Features:**
- 가격 앵커링 ($24 정가 대비 50% OFF → $18)
- 재고 진행률 바 (현재 1,842 / 3,000명)
- 6가지 포함 기능 목록 (체크 아이콘)
- Stripe 안전 결제 배지
- 성공 상태 애니메이션

**Usage:**
```tsx
import { EarlyBirdPaymentModal } from '@/components/pricing/EarlyBirdPaymentModal';

<EarlyBirdPaymentModal 
  onClose={() => handleClose()}
  onPurchase={async (price) => {
    // Call Stripe API
    await handleStripePayment(price);
  }}
  currentSales={1842}
  totalSlots={3000}
/>
```

**Props:**
- `onClose?`: () => void - 모달 닫기
- `onPurchase?`: (priceUSD: number) => Promise<void> - 결제 핸들러
- `currentSales?`: number - 현재 판매 수 (기본값: 1842)
- `totalSlots?`: number - 전체 슬롯 (기본값: 3000)

---

### 4. **OnboardingFlow.tsx**
온보딩 전체 흐름 관리 (State 오케스트레이션)

**Features:**
- 4 Stage Flow: Spotlight → Guide → Payment → Complete
- 자동 단계 전환
- 건너뛰기 옵션 지원

**Usage:**
```tsx
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

<OnboardingFlow 
  onComplete={() => router.push('/vault')}
  artists={artistList}
/>
```

---

### 5. **PhotocardSlot.tsx** (vault/PhotocardSlot.tsx)
9-포켓 바인더 슬롯 - 상태별 렌더링

**3가지 상태:**

#### Case 1: 소유 카드 (isOwned = true)
```
[컬러 이미지] + 💎 소장 뱃지
```
- Visual: 선명한 컬러
- Badge: 우측 상단 "💎 소장"

#### Case 2: 위시 카드 (isWish = true, isOwned = false)
```
[컬러 이미지] + 💖 하트 뱃지
```
- Visual: 선명한 도감 원본 컬러
- Badge: 우측 상단 핑크 하트

#### Case 3: 미보유/노위시 (둘 다 false)
```
[흑백 반투명 이미지] + [💖 위시 추가 캡슐 버튼]
```
- Visual: grayscale, opacity-50
- Center Overlay: "💖 위시 추가" 버튼
- onClick: Wish 상태로 즉시 전환 + Toast

**Usage:**
```tsx
import { PhotocardSlot } from '@/components/vault/PhotocardSlot';

<PhotocardSlot
  cardId="card-123"
  imageUrl="/cards/bts-v.jpg"
  isOwned={true}
  isWish={false}
  memberName="V"
  albumName="BE"
  onWishToggle={async (id, state) => {
    // API call to update wish status
  }}
  onCardClick={(id) => {
    // Open card detail modal
  }}
/>
```

**Props:**
- `cardId`: string (필수)
- `imageUrl?`: string
- `fallbackImageUrl?`: string
- `isOwned`: boolean (필수)
- `isWish`: boolean (필수)
- `albumName?`: string
- `memberName?`: string
- `onWishToggle?`: (cardId, newState) => Promise<void>
- `onCardClick?`: (cardId) => void
- `showText?`: boolean (기본값: true)
- `showBadges?`: boolean (기본값: true)

---

### 6. **NinePocketBinder.tsx** (vault/NinePocketBinder.tsx)
9-포켓 바인더 전체 그리드 렌더링

**Features:**
- 3x3 레이아웃 (9개 슬롯)
- 자동 빈 슬롯 채우기 (+ 아이콘)
- 통계 카운터 (소장/위시/미소유)
- 바인더 시각화 (노란색 배경, 종이 질감)

**Usage:**
```tsx
import { NinePocketBinder } from '@/components/vault/NinePocketBinder';

<NinePocketBinder
  cards={cardList}
  title="나의 바인더"
  onWishToggle={handleWishToggle}
  onCardClick={handleCardClick}
/>
```

---

## 🎨 Design System

### Colors & Gradients
- **Primary**: Blue-500 to Purple-500
- **Success**: Green-600
- **Alert**: Red-500, Yellow-500
- **Neutral**: Neutral-900 (light), Neutral-100 (dark)

### Animations
- **Framer Motion**: 모든 전환 애니메이션 적용
- **Canvas Confetti**: 폭죽 효과 (confetti 함수)
- **Hover States**: scale, shadow 변화

### Responsive
- Mobile: 375px ~ (보정된 텍스트, 터치 영역)
- Tablet: 768px ~
- Desktop: 1280px ~

---

## 📱 Integration with Vault

### Example: Full Flow Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { NinePocketBinder } from '@/components/vault/NinePocketBinder';

export function VaultPageClient() {
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('has_completed_onboarding');
    setHasCompleted(completed === 'true');
  }, []);

  if (!hasCompleted) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setHasCompleted(true);
        }}
      />
    );
  }

  return (
    <main className="p-6 md:p-12">
      <NinePocketBinder
        cards={userCards}
        title="내 바인더"
        onWishToggle={handleWishToggle}
        onCardClick={handleCardClick}
      />
    </main>
  );
}
```

---

## ✅ Build Checklist

- [x] TypeScript 타입 검증 (tsc --noEmit)
- [x] 모든 의존성 설치 (framer-motion, canvas-confetti, lucide-react)
- [x] Dark mode 지원
- [x] 반응형 디자인 (mobile/tablet/desktop)
- [x] Toast 컴포넌트 (별도 파일)
- [ ] 실제 Stripe 결제 로직 연결
- [ ] 실제 API 데이터 연결
- [ ] E2E 테스트 작성

---

## 🚀 Deployment Notes

### Environment Variables
```env
NEXT_PUBLIC_ORIGINAL_PRICE_USD=24
NEXT_PUBLIC_DISCOUNT_RATE=0.5  # 50% OFF → $12 (but UI shows $18 for $24 annual)
NEXT_PUBLIC_ANNUAL_RENEWAL_USD=24
```

### Audio Assets
- Place `public/sounds/slot-in.mp3` in the public directory for slot animation sound

---

## 📝 Korean Copy Guidelines

- **Casual Tone**: 반말 사용 (16-25세 타깃)
- **Emoji-Heavy**: 이모지 자유롭게 사용
- **Action-Oriented**: "지금", "간단히" 등 즉시성 강조
- **Benefit-First**: 기능보다 혜택을 먼저 제시

Example:
- ❌ "AI 기술을 사용한 자동 분류 시스템입니다"
- ✅ "사진만 올리면 AI가 멤버·미공포까지 알아서 꽂아줍니다"

---

## 🐛 Known Limitations

1. **Stripe Integration**: Mock 상태 (handlePaymentPurchase 함수 필요)
2. **Image Fallback**: 이미지 로드 실패 시 회색 플레이스홀더 표시
3. **Sound**: slot-in.mp3 없으면 무시 (오류 없음)
4. **Stock Count**: 실시간 업데이트 미지원 (정적 값 사용)

---

## 📚 References

- **CLAUDE.md**: 프로젝트 마스터 설정
- **pricing.config.ts**: 글로벌 가격 정책
- **Framer Motion Docs**: https://www.framer.com/motion
- **Canvas Confetti**: https://www.npmjs.com/package/canvas-confetti
