/**
 * POST /api/credits/refund-rollback
 *
 * 환불 시 크레딧 자동 회수 (악용 방지)
 *
 * 피추천인이 $24 결제를 취소/환불(Chargeback)할 경우,
 * 추천인에게 지급되었던 3,125P는 DB 트랜잭션으로 자동 회수
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG } from '@/lib/config/pricing.config';

interface RefundRollbackRequest {
  referralLogId: string;
  reason: 'chargeback' | 'cancellation' | 'fraud';
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRollbackRequest = await request.json();
    const { referralLogId, reason } = body;

    if (!referralLogId) {
      return NextResponse.json(
        { error: '추천 기록 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 원자성 보장
    const result = await prisma.$transaction(async (tx) => {
      // 1. 추천 기록 조회
      const referralLog = await tx.referralLog.findUnique({
        where: { id: referralLogId },
      });

      if (!referralLog) {
        throw new Error('추천 기록을 찾을 수 없습니다');
      }

      if (referralLog.referrerCreditsStatus !== 'AWARDED') {
        throw new Error('이미 회수되었거나 보류 중인 기록입니다');
      }

      // 2. 추천인의 크레딧 회수
      const creditsToReclaim = referralLog.referrerCreditsAwarded;
      const referrer = await tx.user.update({
        where: { id: referralLog.referrerId },
        data: {
          credits: {
            decrement: creditsToReclaim,
          },
        },
        select: { id: true, credits: true },
      });

      // 3. 추천 기록 상태 업데이트 (REVOKED)
      const updatedLog = await tx.referralLog.update({
        where: { id: referralLogId },
        data: {
          referrerCreditsStatus: 'REVOKED',
          paymentAmount: 0, // 환불됨
        },
      });

      return {
        referrer,
        updatedLog,
        reclaimedCredits: creditsToReclaim,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${result.reclaimedCredits}P 크레딧 회수 완료 (${reason})`,
      referrer: {
        id: result.referrer.id,
        remainingCredits: result.referrer.credits,
      },
      reclaimedCredits: result.reclaimedCredits,
    });
  } catch (error) {
    console.error('[/api/credits/refund-rollback]', error);

    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다';
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes('찾을 수 없습니다') ? 404 : 500 }
    );
  }
}
