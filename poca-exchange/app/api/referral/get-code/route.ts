import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateReferralUrl } from '@/lib/referral/generate-referral-code';

/**
 * GET /api/referral/get-code
 * 현재 사용자의 추천 코드와 추천 링크 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        credits: true,
      },
    });

    if (!user || !user.referralCode) {
      return NextResponse.json(
        { error: '추천 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const referralUrl = generateReferralUrl(user.referralCode);

    return NextResponse.json({
      referralCode: user.referralCode,
      referralUrl,
      currentCredits: user.credits,
    });
  } catch (error) {
    console.error('Failed to get referral code:', error);
    return NextResponse.json(
      { error: '추천 코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
