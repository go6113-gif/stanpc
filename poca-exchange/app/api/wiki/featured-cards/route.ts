import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  try {
    // 조회수가 많거나 최근에 추가된 카드들을 인기 카드로 정의
    const cards = await prisma.photoCard.findMany({
      select: {
        id: true,
        slug: true,
        cardName: true,
        version: true,
        imageUrl: true,
        estimatedPrice: true,
        viewCount: true,
        createdAt: true,
        member: { select: { nameEn: true, nameKr: true } },
        group: { select: { slug: true, nameEn: true } },
        album: { select: { slug: true, title: true } },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 12,
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching featured cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
