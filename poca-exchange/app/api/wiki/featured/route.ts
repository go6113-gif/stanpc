import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  try {
    // 멤버 수가 많은 그룹들을 인기 그룹으로 정의
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameKr: true,
        imageUrl: true,
        _count: {
          select: { members: true, photoCards: true },
        },
      },
      orderBy: {
        members: { _count: 'desc' },
      },
      take: 12,
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching featured groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
