import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { VaultResponse, VaultCardItem } from '@/lib/api-types';

// 카드 규격 정보 (mm)
const CARD_DIMENSIONS: Record<string, { width: number; height: number }> = {
  standard: { width: 56, height: 87 },
  premium: { width: 60, height: 90 },
};

export async function GET(req: NextRequest): Promise<NextResponse<VaultResponse | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const queryUserId = req.nextUrl.searchParams.get('userId');
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'recent';
    const filterTags = req.nextUrl.searchParams.getAll('filterTags');
    const filterGroups = req.nextUrl.searchParams.getAll('filterGroups');

    const userId = queryUserId || session.user.id;

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, collectorIndex: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 바인더 카드 조회
    let binderCards = await prisma.userBinderCard.findMany({
      where: {
        userId,
        ...(filterGroups.length > 0 && {
          card: { group: { slug: { in: filterGroups } } },
        }),
      },
      include: {
        card: {
          select: {
            id: true,
            slug: true,
            cardName: true,
            estimatedPrice: true,
            haveCount: true,
            wantCount: true,
            imageUrl: true,
            thumbImagePath: true,
            group: { select: { nameEn: true } },
            member: { select: { nameEn: true } },
            album: { select: { title: true } },
          },
        },
      },
      orderBy:
        sortBy === 'popular'
          ? { card: { haveCount: 'desc' } }
          : sortBy === 'price-high'
            ? { card: { estimatedPrice: 'desc' } }
            : sortBy === 'price-low'
              ? { card: { estimatedPrice: 'asc' } }
              : { updatedAt: 'desc' },
    });

    // 태그 필터링
    if (filterTags.length > 0) {
      binderCards = binderCards.filter((bc) =>
        filterTags.some((tag) => bc.tags.includes(tag))
      );
    }

    // VaultCardItem 변환
    const cards: VaultCardItem[] = binderCards.map((bc) => ({
      id: bc.id,
      cardId: bc.card.id,
      cardSlug: bc.card.slug,
      cardName: bc.card.cardName,
      groupName: bc.card.group.nameEn,
      memberName: bc.card.member?.nameEn || 'Various',
      albumTitle: bc.card.album?.title || null,
      imageUrl: bc.card.imageUrl,
      thumbImagePath: bc.card.thumbImagePath,
      tags: bc.tags,
      note: bc.note,
      dimensions: CARD_DIMENSIONS.standard,
      compatibleSleeves: ['Standard 56x87mm', 'Premium 60x90mm'],
      estimatedPrice: bc.card.estimatedPrice,
      haveCount: bc.card.haveCount,
      wantCount: bc.card.wantCount,
      addedAt: bc.createdAt.toISOString(),
      updatedAt: bc.updatedAt.toISOString(),
    }));

    // 통계 계산
    const inHandCount = cards.filter((c) => !c.tags.some((t) => t.includes('ISO') || t.includes('드볼'))).length;
    const wishlistCount = cards.filter((c) => c.tags.some((t) => t.includes('ISO') || t.includes('드볼'))).length;
    const tradeCount = cards.filter((c) => c.tags.includes('Trade Bait')).length;

    // 고유 태그와 그룹 수집
    const allTags = new Set<string>();
    const allGroups = new Set<string>();
    cards.forEach((c) => {
      c.tags.forEach((t) => allTags.add(t));
      allGroups.add(c.groupName);
    });

    const response: VaultResponse = {
      user: {
        id: user.id,
        name: user.name || 'Anonymous',
        image: user.image,
        collectorIndex: user.collectorIndex,
      },
      stats: {
        totalCards: cards.length,
        inHandCount,
        wishlistCount,
        tradeCount,
        completeSetCount: 0, // TODO: 구현
      },
      cards,
      filters: {
        tags: Array.from(allTags),
        groups: Array.from(allGroups),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching vault:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
