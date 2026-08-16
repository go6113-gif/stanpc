/**
 * POST /api/credits/deduct-renewal
 *
 * 연간 연장비 자동 차감 (순차 차감 갱신)
 *
 * - 매년 갱신일마다 6,250P 자동 차감
 * - 충분한 크레딧이 없으면 실제 결제 요청
 * - 크레딧 충분하면 0원 처리 (무료)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getRenewalCreditsRequired, PRICING_CONFIG } from '@/lib/config/pricing.config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true, membershipExpiresAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const renewalCreditsRequired = getRenewalCreditsRequired();
    const hasEnoughCredits = user.credits >= renewalCreditsRequired;

    if (hasEnoughCredits) {
      // 크레딧 차감
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: renewalCreditsRequired,
          },
          membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        success: true,
        renewalStatus: 'FREE_WITH_CREDITS',
        deductedCredits: renewalCreditsRequired,
        remainingCredits: user.credits - renewalCreditsRequired,
        message: '크레딧으로 연장비 결제 완료 (무료)',
      });
    } else {
      // 실제 결제 필요
      return NextResponse.json({
        success: false,
        renewalStatus: 'PAYMENT_REQUIRED',
        availableCredits: user.credits,
        requiredCredits: renewalCreditsRequired,
        creditsShortfall: renewalCreditsRequired - user.credits,
        renewalPriceUSD: PRICING_CONFIG.ANNUAL_RENEWAL_USD,
        message: '크레딧 부족 - 실제 결제 필요',
      });
    }
  } catch (error) {
    console.error('[/api/credits/deduct-renewal]', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
