/**
 * GET /api/referral/my-referrals
 *
 * 현재 사용자의 추천 정보 및 통계 조회
 *
 * 인증된 요청만 허용
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // 세션 검증
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 현재 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        referralCode: true,
        credits: true,
        referralLogs: {
          select: {
            id: true,
            refereeEmail: true,
            refereeId: true,
            referrerCreditsAwarded: true,
            refereeCreditsAwarded: true,
            referrerCreditsStatus: true,
            refereeCreditsStatus: true,
            paymentAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 통계 계산
    const totalReferrals = user.referralLogs.length;
    const awardedReferrals = user.referralLogs.filter(
      (log) => log.referrerCreditsStatus === 'AWARDED'
    ).length;
    const totalCreditsEarned = user.referralLogs.reduce(
      (sum, log) => (log.referrerCreditsStatus === 'AWARDED' ? sum + log.referrerCreditsAwarded : sum),
      0
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        referralCode: user.referralCode,
        credits: user.credits,
      },
      statistics: {
        totalReferrals,
        awardedReferrals,
        totalCreditsEarned,
      },
      referrals: user.referralLogs,
    });
  } catch (error) {
    console.error('[/api/referral/my-referrals]', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
