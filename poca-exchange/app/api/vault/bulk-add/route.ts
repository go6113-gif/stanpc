import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { cardIds, targetStatus = 'OWNED' } = await req.json();

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: '유효한 카드 ID 배열이 필요합니다' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['OWNED', 'WISH'];
    if (!validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다' },
        { status: 400 }
      );
    }

    // Bulk create with skipDuplicates
    const result = await prisma.userBinderCard.createMany({
      data: cardIds.map((cardId: string) => ({
        userId,
        cardId,
        status: targetStatus,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count}개 카드가 바인더에 추가되었습니다`,
    });
  } catch (error) {
    console.error('[bulk-add] Error:', error);
    return NextResponse.json(
      { error: '바인더 일괄 추가 실패' },
      { status: 500 }
    );
  }
}
