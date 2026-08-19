import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const groupSlug = req.nextUrl.searchParams.get('groupSlug');

    if (!groupSlug) {
      return NextResponse.json(
        { error: 'groupSlug is required' },
        { status: 400 }
      );
    }

    // 그룹 조회
    const group = await prisma.group.findUnique({
      where: { slug: groupSlug },
      include: {
        members: {
          include: {
            photoCards: {
              select: {
                id: true,
                imageUrl: true,
                thumbImagePath: true,
                estimatedPrice: true,
                ownedCount: true,
                wishedCount: true,
              },
            },
          },
        },
        photoCards: {
          select: {
            id: true,
            imageUrl: true,
            thumbImagePath: true,
            estimatedPrice: true,
            ownedCount: true,
            wishedCount: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // 멤버별 통계
    const memberStats = group.members.map((member) => {
      const cards = member.photoCards;
      return {
        id: member.id,
        slug: member.slug,
        nameEn: member.nameEn,
        nameKr: member.nameKr,
        imageUrl: member.imageUrl,
        position: member.position,
        cardCount: cards.length,
        avgPrice:
          cards.reduce((sum, c) => sum + (c.estimatedPrice || 0), 0) /
          (cards.filter((c) => c.estimatedPrice).length || 1),
        totalOwnedCount: cards.reduce((sum, c) => sum + c.ownedCount, 0),
        totalWishedCount: cards.reduce((sum, c) => sum + c.wishedCount, 0),
      };
    });

    // 그룹 전체 통계
    const allCards = group.photoCards;
    const groupStats = {
      totalCards: allCards.length,
      totalMembers: group.members.length,
      avgPrice:
        allCards.reduce((sum, c) => sum + (c.estimatedPrice || 0), 0) /
        (allCards.filter((c) => c.estimatedPrice).length || 1),
      totalOwnedCount: allCards.reduce((sum, c) => sum + c.ownedCount, 0),
      totalWishedCount: allCards.reduce((sum, c) => sum + c.wishedCount, 0),
    };

    return NextResponse.json({
      group: {
        id: group.id,
        slug: group.slug,
        nameEn: group.nameEn,
        nameKr: group.nameKr,
        agency: group.agency,
        debutDate: group.debutDate,
        imageUrl: group.imageUrl,
      },
      memberStats,
      groupStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching group wiki:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
