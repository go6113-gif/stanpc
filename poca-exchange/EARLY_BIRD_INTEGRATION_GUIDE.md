# 🚀 Early-Bird Onboarding & Payment Integration Guide

StanPC의 16~25세 K-pop 컬렉터를 위한 완전한 온보딩 및 $18 얼리버드 결제 시스템 구현 가이드입니다.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Integration Steps](#integration-steps)
4. [Stripe Payment Setup](#stripe-payment-setup)
5. [Testing & Verification](#testing--verification)
6. [Deployment Checklist](#deployment-checklist)

---

## Overview

### 🎯 User Journey (4 Stages)

```
┌─────────────────┐
│   3-Step        │  Step 1: 아티스트 선택 (그리드)
│ Spotlight       │  Step 2: 첫 포카 슬롯인 (펄스 애니메이션)
│  Onboarding     │  Step 3: 완성 (폭죽) → localStorage 저장
└────────┬────────┘
         │ onComplete()
         ▼
┌─────────────────┐
│ AI Value        │  Tab 1: AI 스마트 분류
│ Teasing Modal   │  Tab 2: 스마트 교환 카드
│ (3-Carousel)    │  Tab 3: 실시간 시세
└────────┬────────┘
         │ onNext() 또는 onSkip()
         ▼
┌─────────────────┐
│  $18 Early-     │  가격 앵커링 ($24 → $18)
│  Bird Payment   │  재고 바 (1,842/3,000)
│    Modal        │  Stripe 결제 프로세스
└────────┬────────┘
         │ onPurchase() → API 호출
         ▼
┌─────────────────┐
│  Success State  │  폭죽 애니메이션
│  + Redirect to  │  localStorage 업데이트
│   /vault        │  로그인 상태 업데이트
└─────────────────┘
```

---

## Component Architecture

### File Structure

```
components/
├── onboarding/
│   ├── OnboardingSpotlight.tsx      # Step 1-3 (artist select → slot-in → confetti)
│   ├── OnboardingGuideModal.tsx     # 3-tab value teasing carousel
│   ├── OnboardingFlow.tsx           # State orchestration (4 stages)
│   └── README.md                    # Detailed component docs
├── pricing/
│   └── EarlyBirdPaymentModal.tsx    # $18 payment with price anchoring
├── vault/
│   ├── PhotocardSlot.tsx            # Individual slot (3 states: owned/wish/no-wish)
│   ├── NinePocketBinder.tsx         # 3x3 grid + stats
│   └── ...
├── Toast.tsx                         # Toast notification component
└── ...

app/
├── test/
│   ├── onboarding/page.tsx          # Demo: OnboardingFlow
│   └── binder/page.tsx              # Demo: NinePocketBinder + PhotocardSlot
└── vault/
    ├── page.tsx                     # Main vault page (integrates OnboardingFlow)
    └── VaultPageClient.tsx          # Client component
```

---

## Integration Steps

### Step 1: Add Onboarding Check to Vault Page

**File**: `app/vault/VaultPageClient.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { NinePocketBinder } from '@/components/vault/NinePocketBinder';

interface VaultPageClientProps {
  isDemoMode?: boolean;
}

export default function VaultPageClient({ isDemoMode }: VaultPageClientProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setHasCompletedOnboarding(true);
      return;
    }

    // Check localStorage first
    const stored = localStorage.getItem('has_completed_onboarding');
    if (stored === 'true') {
      setHasCompletedOnboarding(true);
    }

    // TODO: Also check API/DB for user.onboarding_completed flag
    // This ensures the check persists across sessions
  }, [isDemoMode]);

  if (!hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setHasCompletedOnboarding(true);
          // TODO: API call to set user.onboarding_completed = true
        }}
      />
    );
  }

  // Existing vault content
  return (
    <main className="p-6 md:p-12">
      {/* Your existing vault components */}
      <NinePocketBinder cards={userCards} title="내 바인더" />
    </main>
  );
}
```

### Step 2: Add User Model Field to Prisma Schema

**File**: `prisma/schema.prisma`

```prisma
model User {
  // ... existing fields
  
  // Onboarding & Payment Tracking
  has_completed_onboarding  Boolean   @default(false)
  has_purchased_early_bird  Boolean   @default(false)
  early_bird_purchased_at   DateTime?
  early_bird_price_paid_usd Float?    // e.g., 18.0
}
```

### Step 3: Create Migration

```bash
cd poca-exchange
npx prisma migrate dev --name add_onboarding_fields
npx prisma generate
```

### Step 4: Create Stripe Checkout API Route

**File**: `app/api/stripe/early-bird/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { priceUSD } = await request.json();

    // Verify price matches early-bird pricing
    const EARLY_BIRD_PRICE = 18;
    if (priceUSD !== EARLY_BIRD_PRICE) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '평생 소장권 - Early Bird Special 50% OFF',
              description: 'AI 분류 + 무제한 바인더 + SNS 자랑',
              images: ['https://stanpc.com/og/early-bird.png'],
            },
            unit_amount: priceUSD * 100, // cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/vault?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/vault?payment=cancelled`,
      metadata: {
        user_id: session.user.id,
        type: 'early_bird',
      },
    });

    return NextResponse.json({ sessionId: checkout.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Step 5: Create Webhook Handler for Payment Confirmation

**File**: `app/api/webhooks/stripe/early-bird/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;

      if (!userId) {
        return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
      }

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          has_purchased_early_bird: true,
          early_bird_purchased_at: new Date(),
          early_bird_price_paid_usd: session.amount_total / 100,
          has_completed_onboarding: true, // Mark onboarding complete after payment
        },
      });

      // TODO: Award lifetime credits to user account
      console.log(`Early bird purchase completed for user ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

### Step 6: Update EarlyBirdPaymentModal to Call Stripe

**File**: `components/pricing/EarlyBirdPaymentModal.tsx` (Update onPurchase handler)

```tsx
const handlePurchase = async () => {
  if (!onPurchase) return;

  setIsLoading(true);
  try {
    const earlyBirdPrice = 18;
    
    // Call Stripe API
    const response = await fetch('/api/stripe/early-bird', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceUSD: earlyBirdPrice }),
    });

    if (!response.ok) throw new Error('Failed to create checkout');

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    await stripe?.redirectToCheckout({ sessionId });

    // Call onPurchase callback
    await onPurchase(earlyBirdPrice);
    setShowSuccess(true);
  } catch (error) {
    console.error('Purchase failed:', error);
    setIsLoading(false);
  }
};
```

---

## Stripe Payment Setup

### Prerequisites

1. **Stripe Account**: https://dashboard.stripe.com
2. **API Keys**: Add to `.env.local`

### Environment Variables

```env
# .env.local (DO NOT COMMIT!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Or for development:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Webhook Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://stanpc.com/api/webhooks/stripe/early-bird`
3. Events: `checkout.session.completed`
4. Copy webhook secret to `.env.local`

### Test Payment

Use Stripe test card:
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

---

## Testing & Verification

### Test URLs

```
/test/onboarding         # OnboardingFlow demo
/test/binder             # NinePocketBinder + PhotocardSlot demo
```

### Local Testing Steps

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test Onboarding Flow**:
   - Navigate to `/test/onboarding`
   - Go through all 3 spotlight steps
   - Verify localStorage: `has_completed_onboarding = 'true'`

3. **Test Value Teasing Modal**:
   - Complete Step 3 (confetti)
   - Modal should auto-open with 3 carousel tabs
   - Test navigation (previous/next buttons)
   - Test skip button

4. **Test Payment Modal**:
   - Complete guide modal
   - Payment modal should appear with price anchoring
   - Stock bar should show 1,842 / 3,000
   - Test Stripe test card checkout

5. **Test Binder**:
   - Navigate to `/test/binder`
   - Verify 3 states display correctly:
     - Owned cards: 💎 soils badge, full color
     - Wish cards: 💖 heart badge, full color
     - No-wish cards: grayscale, "💖 위시 추가" button
   - Test wish toggle: click button, verify state change

### Build & Type Check

```bash
# Type checking
npx tsc --noEmit

# Build verification
npm run build

# Expected: 0 errors
```

---

## Deployment Checklist

### Before Shipping

- [ ] All TypeScript errors resolved (tsc --noEmit)
- [ ] npm run build completes successfully
- [ ] Stripe keys added to production `.env`
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] Prisma migration deployed (npx prisma migrate deploy)
- [ ] Early-bird launch date announced
- [ ] Asset files placed:
  - `/public/sounds/slot-in.mp3` (optional, graceful fallback if missing)
  - `/public/og/early-bird.png` (for Stripe checkout)
- [ ] Analytics tracking added (optional):
  - Segment event on onboarding completion
  - Stripe event forwarded to analytics
- [ ] Testing in production sandbox (if using Stripe test keys initially)
- [ ] Customer support documentation prepared
- [ ] Monitoring & alerting set up for payment failures

### Post-Deployment Monitoring

**Metrics to Track**:
- Onboarding completion rate
- Payment conversion rate
- Average time to complete flow
- Stripe payment error rate
- Confetti animation performance (check CPU usage)

**Useful Queries**:
```sql
-- Users who completed onboarding
SELECT COUNT(*) FROM "User" WHERE has_completed_onboarding = true;

-- Users who purchased early bird
SELECT COUNT(*) FROM "User" WHERE has_purchased_early_bird = true;

-- Average early bird price (should be $18)
SELECT AVG(early_bird_price_paid_usd) FROM "User" WHERE has_purchased_early_bird = true;
```

---

## 🔧 Configuration & Customization

### Change Early-Bird Price

1. **Update component**:
   ```tsx
   // In EarlyBirdPaymentModal.tsx
   const EARLY_BIRD_PRICE_FINAL = 18; // $18
   const REGULAR_PRICE_ANNUAL = 24;   // $24/year
   ```

2. **Update API route**:
   ```typescript
   // In app/api/stripe/early-bird/route.ts
   const EARLY_BIRD_PRICE = 18;
   ```

3. **Update test data**:
   ```typescript
   // In components/pricing/EarlyBirdPaymentModal.tsx
   const earlyBirdPrice = PRICING_CONFIG.ORIGINAL_PRICE_USD * (1 - PRICING_CONFIG.DISCOUNT_RATE);
   ```

### Adjust Stock Count

Update in `EarlyBirdPaymentModal` props:

```tsx
<EarlyBirdPaymentModal
  currentSales={1842}  // Current sold count
  totalSlots={3000}    // Total slots
/>
```

### Customize Copy

All UI text is in Korean by default. To change:
1. Edit component JSX strings
2. For i18n support, migrate to `next-intl` or similar

---

## 🐛 Troubleshooting

### Issue: Confetti not showing
- **Cause**: `canvas-confetti` not installed or blocked by browser
- **Fix**: Check console for errors, add error boundary

### Issue: Payment modal not opening
- **Cause**: State flow not progressing
- **Fix**: Check browser console for errors in handleGuideNext()

### Issue: Stripe checkout fails
- **Cause**: Invalid API keys or webhook not configured
- **Fix**: Verify .env keys, check Stripe logs at dashboard.stripe.com

### Issue: Build fails with TypeScript errors
- **Cause**: Missing type definitions or incorrect imports
- **Fix**: Run `npx tsc --noEmit` to see detailed errors

---

## 📚 Additional Resources

- **Stripe Docs**: https://stripe.com/docs/payments/checkout
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Framer Motion**: https://www.framer.com/motion/animation
- **Canvas Confetti**: https://github.com/catdad/canvas-confetti

---

## 💬 Support & Questions

For questions or issues:
1. Check the component README: `/components/onboarding/README.md`
2. Review test pages: `/app/test/onboarding` and `/app/test/binder`
3. Check CLAUDE.md for project conventions
4. Reach out to the team

---

**Last Updated**: 2026-08-17
**Status**: ✅ Ready for deployment
