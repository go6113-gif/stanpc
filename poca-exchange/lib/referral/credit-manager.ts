import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG } from '@/config/pricing.config';

/**
 * 크레딧 관리자
 * 사용자의 크레딧 지급, 차감, 조회, 갱신을 담당합니다.
 */

// ─────────────────────────────────────────────────────────────
// 크레딧 조회
// ─────────────────────────────────────────────────────────────

/**
 * 사용자의 현재 크레딧 잔액 조회
 */
export async function getUserCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/**
 * 크레딧이 충분한지 확인
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits >= requiredCredits;
}

// ─────────────────────────────────────────────────────────────
// 크레딧 지급 (추천, 웰컴 보너스)
// ─────────────────────────────────────────────────────────────

/**
 * 추천 완료 시 크레딧 지급
 * 추천인: 3,125P ($2.50)
 * 피추천인: 500P ($0.40)
 */
export async function awardReferralCredits(
  referrerId: string,
  refereeId: string,
  referralLogId: string
): Promise<void> {
  // 추천인에게 3,125P 지급
  await prisma.$transaction(async (tx: any) => {
    // 추천인 크레딧 증가
    await tx.user.update({
      where: { id: referrerId },
      data: {
        credits: {
          increment: PRICING_CONFIG.REFERRER_PER_USER_CREDITS,
        },
      },
    });

    // 추천인 거래 기록
    await tx.creditTransaction.create({
      data: {
        userId: referrerId,
        type: 'REFERRAL_AWARDED',
        amount: PRICING_CONFIG.REFERRER_PER_USER_CREDITS,
        description: `친구 추천 완료 (ReferralLog: ${referralLogId})`,
        referralLogId,
      },
    });

    // 피추천인 크레딧 증가 (웰컴 보너스)
    await tx.user.update({
      where: { id: refereeId },
      data: {
        credits: {
          increment: PRICING_CONFIG.REFEREE_WELCOME_CREDITS,
        },
      },
    });

    // 피추천인 거래 기록
    await tx.creditTransaction.create({
      data: {
        userId: refereeId,
        type: 'WELCOME_BONUS',
        amount: PRICING_CONFIG.REFEREE_WELCOME_CREDITS,
        description: '신규 가입 웰컴 보너스',
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 크레딧 차감 (갱신, 특전 구입)
// ─────────────────────────────────────────────────────────────

/**
 * 년간 갱신비 차감
 * 연간 갱신일마다 6,250P 자동 차감
 */
export async function deductRenewalCredits(userId: string): Promise<boolean> {
  const hasEnough = await hasEnoughCredits(
    userId,
    PRICING_CONFIG.RENEWAL_REQUIRED_CREDITS
  );

  if (!hasEnough) {
    return false;
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: PRICING_CONFIG.ANNUAL_AUTO_DEDUCT_CREDITS,
        },
        membershipExpiresAt: {
          set: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 연장
        },
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'ANNUAL_RENEWAL_DEDUCT',
        amount: -PRICING_CONFIG.ANNUAL_AUTO_DEDUCT_CREDITS,
        description: '년간 갱신비 자동 차감',
      },
    });
  });

  return true;
}

/**
 * 디지털 특전 구입 시 크레딧 차감
 */
export async function redeemDigitalReward(
  userId: string,
  rewardKey: string,
  requiredCredits: number,
  rewardName: string
): Promise<{ success: boolean; message: string }> {
  const hasEnough = await hasEnoughCredits(userId, requiredCredits);

  if (!hasEnough) {
    return {
      success: false,
      message: `크레딧이 부족합니다. 필요: ${requiredCredits}P`,
    };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // 디지털 특전 기록 생성
      const reward = await tx.userDigitalReward.create({
        data: {
          userId,
          rewardKey,
          rewardName,
          requiredCredits,
        },
      });

      // 크레딧 차감
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: requiredCredits,
          },
        },
      });

      // 거래 기록
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'REWARD_REDEEMED',
          amount: -requiredCredits,
          description: `디지털 특전 해금: ${rewardName}`,
          rewardId: reward.id,
        },
      });
    });

    return {
      success: true,
      message: `${rewardName} 특전이 해금되었습니다!`,
    };
  } catch (error) {
    return {
      success: false,
      message: '특전 구입 중 오류가 발생했습니다.',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 크레딧 회수 (환불 시)
// ─────────────────────────────────────────────────────────────

/**
 * 환불 시 추천인 크레딧 자동 회수
 */
export async function revokeReferralCredits(
  referrerId: string,
  referralLogId: string
): Promise<void> {
  // 원래 지급된 크레딧 조회
  const referralLog = await prisma.referralLog.findUnique({
    where: { id: referralLogId },
  });

  if (!referralLog) {
    throw new Error('Referral log not found');
  }

  const creditsToRevoke = referralLog.referrerCreditsAwarded;

  await prisma.$transaction(async (tx: any) => {
    // 추천인 크레딧 회수
    await tx.user.update({
      where: { id: referrerId },
      data: {
        credits: {
          decrement: creditsToRevoke,
        },
      },
    });

    // 회수 기록
    await tx.creditTransaction.create({
      data: {
        userId: referrerId,
        type: 'REVOKED',
        amount: -creditsToRevoke,
        description: `환불로 인한 추천 크레딧 회수 (ReferralLog: ${referralLogId})`,
        referralLogId,
      },
    });

    // ReferralLog 상태 업데이트
    await tx.referralLog.update({
      where: { id: referralLogId },
      data: {
        referrerCreditsStatus: 'REVOKED',
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 크레딧 거래 히스토리
// ─────────────────────────────────────────────────────────────

/**
 * 사용자의 크레딧 거래 히스토리 조회
 */
export async function getCreditTransactionHistory(
  userId: string,
  limit: number = 50
) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      createdAt: true,
    },
  });
}

/**
 * 월별 크레딧 적립/소비 요약
 */
export async function getCreditMonthlyStats(userId: string) {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    select: {
      type: true,
      amount: true,
      createdAt: true,
    },
  });

  // 월별로 그룹화
  const monthlyStats = new Map<string, { awarded: number; spent: number }>();

  transactions.forEach((tx) => {
    const month = tx.createdAt.toISOString().substring(0, 7); // "2026-01"
    const current = monthlyStats.get(month) || { awarded: 0, spent: 0 };

    if (tx.amount > 0) {
      current.awarded += tx.amount;
    } else {
      current.spent += Math.abs(tx.amount);
    }

    monthlyStats.set(month, current);
  });

  return Array.from(monthlyStats.entries()).map(([month, stats]) => ({
    month,
    ...stats,
  }));
}
