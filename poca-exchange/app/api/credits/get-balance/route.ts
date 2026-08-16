/**
 * GET /api/credits/get-balance
 *
 * 현재 사용자의 크레딧 잔액 및 추천 현황 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { calculateReferralBenefit, getRenewalCreditsRequired } from '@/lib/config/pricing.config';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        credits: true,
        referralCode: true,
        referralLogs: {
          where: {
            referrerCreditsStatus: 'AWARDED',
          },
          select: {
            id: true,
            referrerCreditsAwarded: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // 추천 통계
    const referralCount = user.referralLogs.length;
    const benefit = calculateReferralBenefit(referralCount);
    const renewalCreditsRequired = getRenewalCreditsRequired();

    return NextResponse.json({
      user: {
        id: user.id,
        referralCode: user.referralCode,
      },
      credits: {
        balance: user.credits,
        renewalRequiredCredits: renewalCreditsRequired,
        yearsOfRenewalCovered: Math.floor(user.credits / renewalCreditsRequired),
      },
      referrals: {
        totalReferrals: referralCount,
        totalCreditsEarned: benefit.totalCredits,
        totalUSDValue: benefit.totalUSDValue,
        benefit,
      },
    });
  } catch (error) {
    console.error('[/api/credits/get-balance]', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
