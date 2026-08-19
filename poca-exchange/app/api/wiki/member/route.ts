import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const groupSlug = req.nextUrl.searchParams.get('groupSlug')?.toLowerCase();
    const memberSlug = req.nextUrl.searchParams.get('memberSlug')?.toLowerCase();
    const condition = req.nextUrl.searchParams.get('condition'); // 'sealed' | 'nm' | 'lp' | 'mp-hp'
    const vaultStatus = req.nextUrl.searchParams.get('vaultStatus'); // 'owned' | 'iso' | 'trade' | 'wishlist'

    if (!groupSlug || !memberSlug) {
      return NextResponse.json(
        { error: 'groupSlug and memberSlug are required' },
        { status: 400 }
      );
    }

    // 그룹 조회
    const group = await prisma.group.findUnique({
      where: { slug: groupSlug },
      select: { id: true, nameEn: true, nameKr: true, imageUrl: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // 멤버 조회
    const member = await prisma.member.findFirst({
      where: {
        slug: memberSlug,
        groupId: group.id,
      },
      include: {
        group: { select: { slug: true, nameEn: true } },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // 필터 조건 구성
    const whereCondition: any = {
      memberId: member.id,
    };

    // vaultStatus 필터 구현 — UserBinderCard의 status 필드로 필터링
    // 'owned': PERSONAL 또는 FOR_TRADE/FOR_SALE (거래 의도가 없는 소장용)
    // 'iso': ISO (구하는 중)
    // 'trade': FOR_TRADE (교환 가능)
    // 'sale': FOR_SALE (판매 가능)
    let userBinderFilter: any = undefined;
    if (vaultStatus && vaultStatus !== 'all') {
      userBinderFilter = {};
      if (vaultStatus === 'owned') {
        userBinderFilter.OR = [
          { status: 'PERSONAL' },
          { status: 'FOR_TRADE' },
          { status: 'FOR_SALE' },
        ];
      } else if (vaultStatus === 'iso') {
        userBinderFilter.status = 'ISO';
      } else if (vaultStatus === 'trade') {
        userBinderFilter.status = 'FOR_TRADE';
      } else if (vaultStatus === 'sale') {
        userBinderFilter.status = 'FOR_SALE';
      }
    }

    // 멤버의 카드 조회 — vaultStatus 필터 적용
    const cards = await prisma.photoCard.findMany({
      where: {
        ...whereCondition,
        ...(userBinderFilter
          ? { userBinders: { some: userBinderFilter } }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        cardName: true,
        version: true,
        imageUrl: true,
        thumbImagePath: true,
        estimatedPrice: true,
        ownedCount: true,
        wishedCount: true,
        viewCount: true,
        group: { select: { slug: true, nameEn: true } },
        member: { select: { nameEn: true } },
        album: { select: { slug: true, title: true } },
        userBinders: {
          where: userBinderFilter,
          select: {
            id: true,
            status: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 통계 계산
    const stats = {
      totalCards: cards.length,
      pricedCards: cards.filter((c) => c.estimatedPrice !== null).length,
      avgPrice:
        cards.reduce((sum, c) => sum + (c.estimatedPrice || 0), 0) /
        (cards.filter((c) => c.estimatedPrice).length || 1),
      totalOwnedCount: cards.reduce((sum, c) => sum + c.ownedCount, 0),
      totalWishedCount: cards.reduce((sum, c) => sum + c.wishedCount, 0),
      collectorCount: cards.reduce((sum, c) => sum + c.userBinders.length, 0),
    };

    return NextResponse.json({
      member: {
        id: member.id,
        nameEn: member.nameEn,
        nameKr: member.nameKr,
        imageUrl: member.imageUrl,
        position: member.position,
        group: member.group,
      },
      cards,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching member wiki:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
