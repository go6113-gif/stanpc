import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/vault/card
 * 다중 카드 상태 일괄 변경
 *
 * Request:
 * {
 *   userId: string,
 *   cardIds: string[],
 *   status: 'OWNED' | 'WISHED' | 'WTT' | 'WTS' | 'VAULTED'
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    const body = await request.json();
    const { userId, cardIds, status } = body;

    // 입력 검증
    if (!userId || !cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'userId, cardIds (array), and status are required' },
        { status: 400 }
      );
    }

    if (!['OWNED', 'WISHED', 'WTT', 'WTS', 'VAULTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: OWNED, WISHED, WTT, WTS, VAULTED' },
        { status: 400 }
      );
    }

    // 인증 검증: 세션 사용자가 요청한 사용자와 일치해야 함
    if (session?.user?.id && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: cannot modify another user\'s cards' },
        { status: 403 }
      );
    }

    // 카드 상태 일괄 변경
    const updatedCards = await prisma.userBinderCard.updateMany({
      where: {
        userId,
        cardId: {
          in: cardIds,
        },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        updatedCount: updatedCards.count,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/vault/card]', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
