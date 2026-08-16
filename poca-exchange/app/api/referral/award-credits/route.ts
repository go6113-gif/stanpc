/**
 * POST /api/referral/award-credits
 *
 * 추천인 및 피추천인에게 크레딧 지급
 *
 * 인증된 요청만 허용 (세션 검증 필요)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateReferrerReward, calculateRefereeWelcome } from '@/lib/utils/referral';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // 세션 검증 (인증된 사용자만 허용)
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { referralCode, refereeEmail, paymentAmount } = await request.json();

    // 요청 검증
    if (!referralCode || !refereeEmail) {
      return NextResponse.json(
        { error: '필수 정보가 없습니다' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 추천인 조회
      const referrer = await tx.user.findUnique({
        where: { referralCode },
      });

      if (!referrer) {
        throw new Error('추천인을 찾을 수 없습니다');
      }

      // 2. 피추천인 조회 (가입했다면)
      const referee = await tx.user.findUnique({
        where: { email: refereeEmail },
      });

      // 3. ReferralLog 생성
      const referralLog = await tx.referralLog.create({
        data: {
          referrerId: referrer.id,
          refereeEmail,
          refereeId: referee?.id || null,
          referrerCreditsAwarded: calculateReferrerReward(),
          refereeCreditsAwarded: calculateRefereeWelcome(),
          paymentAmount: paymentAmount ? Number(paymentAmount) : null,
          referrerCreditsStatus: 'AWARDED',
          refereeCreditsStatus: referee ? 'AWARDED' : 'PENDING',
        },
      });

      // 4. 추천인 크레딧 지급
      const updatedReferrer = await tx.user.update({
        where: { id: referrer.id },
        data: {
          credits: {
            increment: calculateReferrerReward(),
          },
        },
        select: { id: true, credits: true },
      });

      // 5. 피추천인 크레딧 지급 (가입했다면)
      let updatedReferee = null;
      if (referee) {
        updatedReferee = await tx.user.update({
          where: { id: referee.id },
          data: {
            credits: {
              increment: calculateRefereeWelcome(),
            },
            referredBy: referralCode,
          },
          select: { id: true, credits: true },
        });
      }

      return {
        referralLog,
        referrer: updatedReferrer,
        referee: updatedReferee,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[/api/referral/award-credits]', error);

    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다';

    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes('찾을 수 없습니다') ? 404 : 500 }
    );
  }
}
