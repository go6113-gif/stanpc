import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CardGeneratorUserData } from '@/lib/api-types';

export async function GET(req: NextRequest): Promise<NextResponse<CardGeneratorUserData | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const queryUserId = req.nextUrl.searchParams.get('userId');
    const userId = queryUserId || session.user.id;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        collectorIndex: true,
        mannerScore: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 바인더 통계 계산
    const binderCards = await prisma.userBinderCard.findMany({
      where: { userId },
      include: {
        card: {
          select: {
            id: true,
            slug: true,
            cardName: true,
            imageUrl: true,
            estimatedPrice: true,
            groupId: true,
            group: { select: { nameEn: true } },
            member: { select: { nameEn: true } },
          },
        },
      },
    });

    const totalCards = binderCards.length;
    const wishlistCount = binderCards.filter((bc) =>
      bc.tags.includes('ISO') || bc.tags.includes('#드볼중')
    ).length;

    // 희귀 카드 판정 (임시: estimatedPrice > 50USD)
    const rareCardCount = binderCards.filter((bc) =>
      bc.card.estimatedPrice && bc.card.estimatedPrice > 50
    ).length;

    // 완성된 세트 개수 (임시: 그룹 내 모든 멤버 카드 보유 시 1세트)
    const groupCounts = new Map<string, { total: number; haveCount: number }>();
    for (const bc of binderCards) {
      const groupId = bc.card.groupId;
      if (!groupCounts.has(groupId)) {
        const groupCards = await prisma.photoCard.count({
          where: { groupId },
        });
        groupCounts.set(groupId, { total: groupCards, haveCount: 0 });
      }
      groupCounts.get(groupId)!.haveCount += 1;
    }

    const completeSets = Array.from(groupCounts.values()).filter(
      (g) => g.haveCount === g.total
    ).length;

    // 최근 추가된 카드 (1개만)
    const recentCard = binderCards.length > 0
      ? (() => {
          const card = binderCards[binderCards.length - 1]!.card;
          return {
            slug: card.slug,
            cardName: card.cardName,
            groupName: card.group.nameEn,
            memberName: card.member?.nameEn || 'Various',
            imageUrl: card.imageUrl,
          };
        })()
      : undefined;

    const response: CardGeneratorUserData = {
      user: {
        id: user.id,
        name: user.name || 'Anonymous',
        email: user.email,
        image: user.image,
        collectorIndex: user.collectorIndex,
        mannerScore: user.mannerScore,
      },
      binderStats: {
        totalCards,
        completeSets,
        wishlistCount,
        rareCardCount,
      },
      recentCard,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user data for card generator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
