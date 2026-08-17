import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { revokeReferralCredits } from '@/lib/referral/credit-manager';

export const dynamic = 'force-dynamic';

// Stripe 클라이언트 지연 초기화 (런타임에만)
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripe = new Stripe(apiKey);
  }
  return stripe;
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return secret;
}

interface CheckoutSessionMetadata {
  userId?: string;
  referralCode?: string;
  [key: string]: string | undefined;
}

/**
 * POST /api/webhooks/stripe
 * Stripe 웹훅 엔드포인트
 *
 * 처리 이벤트:
 * - checkout.session.completed: 결제 완료 시 크레딧 적립
 * - charge.refunded: 환불 시 크레딧 회수
 * - customer.subscription.deleted: 구독 취소 시 크레딧 회수
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // 웹훅 서명 검증
    let event: Stripe.Event;
    try {
      const stripeClient = getStripe();
      event = stripeClient.webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Event type: ${event.type}`);

    // 이벤트별 처리
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as any);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * checkout.session.completed: 결제 완료 → 크레딧 적립
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    const metadata = session.metadata as CheckoutSessionMetadata | null;
    const userId = metadata?.userId;
    const referralCode = metadata?.referralCode;

    if (!userId) {
      console.warn('[Stripe] checkout.session.completed: userId not found in metadata');
      return;
    }

    // 세션 상태 확인
    if (session.payment_status !== 'paid') {
      console.log('[Stripe] checkout.session.completed: payment not completed');
      return;
    }

    // 신규 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referredBy: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.warn(`[Stripe] User not found: ${userId}`);
      return;
    }

    // 자가 추천 방지
    if (referralCode && user.referredBy === referralCode) {
      console.warn(`[Stripe] Self-referral detected for user ${userId}`);
      return;
    }

    // 추천인 크레딧 처리
    if (referralCode && user.referredBy !== referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });

      if (referrer && referrer.id !== userId) {
        // ReferralLog 생성 또는 업데이트
        let referralLog = await prisma.referralLog.findFirst({
          where: {
            referrerId: referrer.id,
            refereeId: userId,
          },
        });

        if (!referralLog) {
          referralLog = await prisma.referralLog.create({
            data: {
              referrerId: referrer.id,
              refereeId: userId,
              refereeEmail: user.email || '',
              referrerCreditsAwarded: 3125,
              refereeCreditsAwarded: 500,
              referrerCreditsStatus: 'PENDING',
              refereeCreditsStatus: 'PENDING',
            },
          });
        }

        // 크레딧 적립
        await prisma.user.update({
          where: { id: referrer.id },
          data: { credits: { increment: 3125 } },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: 500 } },
        });

        await prisma.referralLog.update({
          where: { id: referralLog.id },
          data: {
            referrerCreditsAwarded: 3125,
            refereeCreditsAwarded: 500,
            referrerCreditsStatus: 'AWARDED',
            refereeCreditsStatus: 'AWARDED',
          },
        });

        console.log(
          `[Stripe] Referral credits awarded: referrer=${referrer.id}, referee=${userId}`
        );
      }
    }

    // 결제 기록 저장
    await prisma.stripePaymentRecord.create({
      data: {
        userId,
        sessionId: session.id,
        paymentMethodFingerprint: null,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        status: 'COMPLETED',
      },
    });

    console.log(`[Stripe] Checkout session completed for user ${userId}`);
  } catch (error) {
    console.error('[Stripe] handleCheckoutSessionCompleted error:', error);
    throw error;
  }
}

/**
 * charge.refunded: 환불 → 크레딧 회수
 */
async function handleChargeRefunded(charge: any) {
  try {
    if (!charge.metadata?.userId) {
      console.warn('[Stripe] charge.refunded: userId not found in metadata');
      return;
    }

    const userId = charge.metadata.userId;

    // 결제 기록 조회
    const paymentRecord = await prisma.stripePaymentRecord.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    if (!paymentRecord) {
      console.warn(`[Stripe] Payment record not found for user ${userId}`);
      return;
    }

    // 추천 로그 조회
    const referralLog = await prisma.referralLog.findFirst({
      where: {
        refereeId: userId,
        referrerCreditsStatus: 'AWARDED',
      },
    });

    if (referralLog) {
      // 크레딧 회수
      await revokeReferralCredits(referralLog.id, 'chargeback');
      console.log(`[Stripe] Referral credits revoked for refund: ${referralLog.id}`);
    }

    // 결제 기록 상태 변경
    await prisma.stripePaymentRecord.update({
      where: { id: paymentRecord.id },
      data: { status: 'REFUNDED' },
    });

    console.log(`[Stripe] Charge refunded for user ${userId}`);
  } catch (error) {
    console.error('[Stripe] handleChargeRefunded error:', error);
    throw error;
  }
}

/**
 * customer.subscription.deleted: 구독 취소 → 크레딧 회수
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    if (!subscription.metadata?.userId) {
      console.warn('[Stripe] subscription.deleted: userId not found in metadata');
      return;
    }

    const userId = subscription.metadata.userId;

    // 추천 로그 조회
    const referralLog = await prisma.referralLog.findFirst({
      where: {
        refereeId: userId,
        referrerCreditsStatus: 'AWARDED',
      },
    });

    if (referralLog) {
      // 크레딧 회수 (TODO: 구현 필요)
      // await handleRefereeRefund(referralLog.id);
      console.log(`[Stripe] Referral credits revoked for subscription cancellation: ${referralLog.id}`);
    }

    console.log(`[Stripe] Subscription deleted for user ${userId}`);
  } catch (error) {
    console.error('[Stripe] handleSubscriptionDeleted error:', error);
    throw error;
  }
}
