import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const groupSlug = req.nextUrl.searchParams.get('groupSlug')?.toLowerCase();
    const memberSlug = req.nextUrl.searchParams.get('memberSlug')?.toLowerCase();
    const albumSlug = req.nextUrl.searchParams.get('albumSlug')?.toLowerCase();

    if (!groupSlug || !memberSlug || !albumSlug) {
      return NextResponse.json(
        { error: 'groupSlug, memberSlug, and albumSlug are required' },
        { status: 400 }
      );
    }

    // 그룹 조회
    const group = await prisma.group.findUnique({
      where: { slug: groupSlug },
      select: { id: true, nameEn: true, nameKr: true },
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
      select: {
        id: true,
        nameEn: true,
        nameKr: true,
        imageUrl: true,
        position: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // 앨범 조회
    const album = await prisma.album.findFirst({
      where: {
        slug: albumSlug,
        groupId: group.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImageUrl: true,
        releaseDate: true,
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // 앨범의 멤버 카드 조회
    const cards = await prisma.photoCard.findMany({
      where: {
        albumId: album.id,
        memberId: member.id,
      },
      select: {
        id: true,
        slug: true,
        cardName: true,
        version: true,
        imageUrl: true,
        estimatedPrice: true,
        ownedCount: true,
        wishedCount: true,
        viewCount: true,
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
      totalHaveCount: cards.reduce((sum, c) => sum + c.ownedCount, 0),
      totalWantCount: cards.reduce((sum, c) => sum + c.wishedCount, 0),
    };

    return NextResponse.json({
      member,
      album,
      cards,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching album wiki:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
