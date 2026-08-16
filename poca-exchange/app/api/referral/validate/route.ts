/**
 * POST /api/referral/validate
 *
 * 추천 코드 검증 및 유저 정보 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidReferralCode } from '@/lib/utils/referral';

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    // 요청 검증
    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: '유효하지 않은 추천 코드입니다' },
        { status: 400 }
      );
    }

    // 형식 검증
    if (!isValidReferralCode(referralCode)) {
      return NextResponse.json(
        { error: '추천 코드 형식이 유효하지 않습니다' },
        { status: 400 }
      );
    }

    // DB에서 사용자 조회
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: {
        id: true,
        name: true,
        image: true,
        referralCode: true,
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: '해당 추천인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        name: referrer.name,
        image: referrer.image,
        referralCode: referrer.referralCode,
      },
    });
  } catch (error) {
    console.error('[/api/referral/validate]', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
