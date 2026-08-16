import { prisma } from '@/lib/prisma';
import { generateReferralCode } from './generate-referral-code';

/**
 * 추천 시스템 관리자
 * 추천 코드 생성, 추천인-피추천인 매칭, 추천 통계를 담당합니다.
 */

// ─────────────────────────────────────────────────────────────
// 추천 코드 초기화 (신규 사용자)
// ─────────────────────────────────────────────────────────────

/**
 * 신규 사용자의 추천 코드 생성 및 저장
 * 회원가입 완료 시 호출됩니다.
 */
export async function initializeReferralCode(userId: string): Promise<string> {
  let referralCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  // 중복 방지: 생성된 코드가 이미 있는지 확인
  do {
    referralCode = generateReferralCode();
    attempts++;

    const existing = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!existing) {
      break;
    }
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique referral code');
  }

  // 사용자에게 추천 코드 할당
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode },
  });

  // 추천 코드 통계 레코드 생성
  await prisma.referralCodeStats.create({
    data: {
      userId,
      referralCode,
    },
  });

  return referralCode;
}

// ─────────────────────────────────────────────────────────────
// 추천 매칭 (회원가입 시)
// ─────────────────────────────────────────────────────────────

/**
 * 추천 링크로 가입한 사용자와 추천인 매칭
 * 회원가입 완료 후 호출됩니다.
 *
 * @param refereeId - 신규 사용자 ID
 * @param referralCode - 추천 코드 (쿼리 파라미터 ?ref=XXX)
 */
export async function matchReferral(
  refereeId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  // 추천인 조회
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (!referrer) {
    return {
      success: false,
      message: '유효하지 않은 추천 코드입니다.',
    };
  }

  // 자기 자신을 추천할 수는 없음
  if (referrer.id === refereeId) {
    return {
      success: false,
      message: '자신을 추천할 수 없습니다.',
    };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // ReferralLog 생성
      const referralLog = await tx.referralLog.create({
        data: {
          referrerId: referrer.id,
          refereeId,
          refereeEmail: '', // 피추천인 이메일은 User.email에서 조회
          referrerCreditsAwarded: 3125, // 친구 1명 = 3,125P
          refereeCreditsAwarded: 500, // 웰컴 보너스
          referrerCreditsStatus: 'PENDING',
          refereeCreditsStatus: 'PENDING',
        },
      });

      // 피추천인의 referredBy 필드 업데이트
      await tx.user.update({
        where: { id: refereeId },
        data: {
          referredBy: referralCode,
        },
      });

      // 크레딧 지급
      await tx.user.update({
        where: { id: referrer.id },
        data: { credits: { increment: 3125 } },
      });

      await tx.user.update({
        where: { id: refereeId },
        data: { credits: { increment: 500 } },
      });

      // ReferralLog 상태 업데이트
      await tx.referralLog.update({
        where: { id: referralLog.id },
        data: {
          referrerCreditsAwarded: 3125,
          refereeCreditsAwarded: 500,
          referrerCreditsStatus: 'AWARDED',
          refereeCreditsStatus: 'AWARDED',
        },
      });

      // 추천 코드 통계 업데이트
      await tx.referralCodeStats.update({
        where: { userId: referrer.id },
        data: {
          totalReferrals: { increment: 1 },
          successfulConversions: { increment: 1 },
          totalCreditsAwarded: { increment: 3125 + 500 },
        },
      });
    });

    return {
      success: true,
      message: '추천인 매칭이 완료되었습니다.',
    };
  } catch (error) {
    console.error('Failed to match referral:', error);
    return {
      success: false,
      message: '추천인 매칭 중 오류가 발생했습니다.',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 추천 통계 조회
// ─────────────────────────────────────────────────────────────

/**
 * 사용자의 추천 통계 조회
 */
export async function getReferralStats(userId: string) {
  const stats = await prisma.referralCodeStats.findUnique({
    where: { userId },
    select: {
      referralCode: true,
      totalReferrals: true,
      successfulConversions: true,
      totalCreditsAwarded: true,
      createdAt: true,
    },
  });

  if (!stats) {
    return null;
  }

  return {
    ...stats,
    // 현재 적립된 크레딧은 User.credits에서 조회
  };
}

/**
 * 사용자가 추천한 피추천인 목록
 */
export async function getReferees(userId: string) {
  const referrals = await prisma.referralLog.findMany({
    where: {
      referrerId: userId,
      refereeId: { not: null }, // 완료된 추천만
    },
    select: {
      id: true,
      refereeId: true,
      referrerCreditsAwarded: true,
      referrerCreditsStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 피추천인 정보 조회
  const refereeIds = referrals
    .map((r: any) => r.refereeId)
    .filter((id: any) => id !== null) as string[];

  if (refereeIds.length === 0) {
    return [];
  }

  const referees = await prisma.user.findMany({
    where: { id: { in: refereeIds } },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      membershipType: true,
      membershipExpiresAt: true,
    },
  });

  // 통합
  return referrals.map((r: any) => {
    const referee = referees.find((u: any) => u.id === r.refereeId);
    return {
      referralLogId: r.id,
      refereeId: r.refereeId,
      referee,
      creditsAwarded: r.referrerCreditsAwarded,
      status: r.referrerCreditsStatus,
      referredAt: r.createdAt,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// 환불 처리
// ─────────────────────────────────────────────────────────────

/**
 * 피추천인의 구매/구독이 환불되었을 때 호출
 * 추천인의 크레딧을 자동 회수합니다.
 */
export async function handleRefereeRefund(referralLogId: string): Promise<void> {
  const referralLog = await prisma.referralLog.findUnique({
    where: { id: referralLogId },
    select: {
      referrerId: true,
      refereeId: true,
      referrerCreditsAwarded: true,
      referrerCreditsStatus: true,
    },
  });

  if (!referralLog || referralLog.referrerCreditsStatus !== 'AWARDED') {
    throw new Error('Referral log not found or credits not awarded');
  }

  // 크레딧 회수
  await prisma.user.update({
    where: { id: referralLog.referrerId },
    data: {
      credits: {
        decrement: referralLog.referrerCreditsAwarded || 3125,
      },
    },
  });

  if (referralLog.refereeId) {
    await prisma.user.update({
      where: { id: referralLog.refereeId },
      data: {
        credits: {
          decrement: 500,
        },
      },
    });
  }

  await prisma.referralLog.update({
    where: { id: referralLogId },
    data: {
      referrerCreditsStatus: 'REVOKED',
      refereeCreditsStatus: 'REVOKED',
    },
  });

  // 통계 업데이트
  await prisma.referralCodeStats.update({
    where: { userId: referralLog.referrerId },
    data: {
      successfulConversions: { decrement: 1 },
      totalCreditsAwarded: {
        decrement: referralLog.referrerCreditsAwarded,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 리더보드 & 통계
// ─────────────────────────────────────────────────────────────

/**
 * 상위 추천인 리더보드 (Top Ambassadors)
 */
export async function getTopReferrers(limit: number = 10) {
  return prisma.referralCodeStats.findMany({
    orderBy: { successfulConversions: 'desc' },
    take: limit,
    select: {
      userId: true,
      totalReferrals: true,
      successfulConversions: true,
      totalCreditsAwarded: true,
      createdAt: true,
      // User 정보는 별도로 조회
    },
  });
}

/**
 * 전체 추천 시스템 통계
 */
export async function getGlobalReferralStats() {
  const stats = await prisma.referralLog.aggregate({
    _count: true,
    _sum: {
      referrerCreditsAwarded: true,
      refereeCreditsAwarded: true,
    },
  });

  return {
    totalReferrals: stats._count,
    totalCreditsAwarded: (stats._sum.referrerCreditsAwarded || 0) +
      (stats._sum.refereeCreditsAwarded || 0),
  };
}
