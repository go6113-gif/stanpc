import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getReferralStats, getReferees } from '@/lib/referral/referral-manager';
import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG } from '@/config/pricing.config';

/**
 * GET /api/referral/stats
 * 현재 사용자의 추천 통계 조회
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

    // 추천 통계
    const stats = await getReferralStats(session.user.id);

    if (!stats) {
      return NextResponse.json(
        { error: '추천 통계를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 크레딧 및 멤버십 정보
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        credits: true,
        membershipType: true,
        membershipExpiresAt: true,
      },
    });

    // 추천한 피추천인 목록
    const referees = await getReferees(session.user.id);

    // 디지털 특전 해금 현황
    const unlockedRewards = await prisma.userDigitalReward.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        rewardKey: true,
        rewardName: true,
        unlockedAt: true,
      },
    });

    // 다음 특전 계산
    const nextRewardThreshold = calculateNextReward(stats.successfulConversions);

    return NextResponse.json({
      stats,
      user,
      referees,
      unlockedRewards,
      nextRewardInfo: nextRewardThreshold,
      conversionProgress: {
        current: stats.successfulConversions,
        nextTarget: nextRewardThreshold?.referralsNeeded || 0,
        creditsNeeded: nextRewardThreshold?.creditsNeeded || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get referral stats:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 다음 해금될 디지털 특전 계산
 */
function calculateNextReward(successfulReferrals: number) {
  const referralsToCredits = (count: number) => count * 3125; // 친구당 3,125P
  const currentCredits = referralsToCredits(successfulReferrals);

  const rewards = [
    {
      name: '한정판 홀로그램 테마',
      creditsNeeded: PRICING_CONFIG.DIGITAL_REWARDS.HOLOGRAM_THEME.requiredCredits,
      referralsNeeded: 4,
    },
    {
      name: '커스텀 단축 도메인',
      creditsNeeded: PRICING_CONFIG.DIGITAL_REWARDS.CUSTOM_DOMAIN.requiredCredits,
      referralsNeeded: 8,
    },
    {
      name: 'Top Ambassador 골드 마크',
      creditsNeeded: PRICING_CONFIG.DIGITAL_REWARDS.AMBASSADOR_BADGE.requiredCredits,
      referralsNeeded: 16,
    },
  ];

  for (const reward of rewards) {
    if (currentCredits < reward.creditsNeeded) {
      return {
        ...reward,
        progressPercentage: Math.round((currentCredits / reward.creditsNeeded) * 100),
      };
    }
  }

  // 모든 특전을 해금한 경우
  return null;
}
