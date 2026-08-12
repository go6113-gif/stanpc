import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const query = req.nextUrl.searchParams.get('q');
    const type = req.nextUrl.searchParams.get('type'); // 'group' | 'member' | 'card' | null (all)
    const groupSlug = req.nextUrl.searchParams.get('groupSlug');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { groups: [], members: [], cards: [] },
        { status: 200 }
      );
    }

    const q = query.toLowerCase().trim();
    const results: any = {};

    if (!type || type === 'group') {
      results.groups = await prisma.group.findMany({
        where: {
          OR: [
            { nameEn: { contains: q, mode: 'insensitive' } },
            { nameKr: { contains: q, mode: 'insensitive' } },
            { aliases: { hasSome: [q] } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameKr: true,
          imageUrl: true,
          _count: { select: { members: true, photoCards: true } },
        },
        take: 5,
      });
    }

    if (!type || type === 'member') {
      const memberWhere: any = {
        OR: [
          { nameEn: { contains: q, mode: 'insensitive' } },
          { nameKr: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (groupSlug) {
        memberWhere.group = { slug: groupSlug };
      }

      results.members = await prisma.member.findMany({
        where: memberWhere,
        include: {
          group: { select: { slug: true, nameEn: true } },
          photoCards: { select: { id: true }, take: 1 },
        },
        take: 10,
      });
    }

    if (!type || type === 'card') {
      const cardWhere: any = {
        OR: [
          { cardName: { contains: q, mode: 'insensitive' } },
          { version: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (groupSlug) {
        cardWhere.group = { slug: groupSlug };
      }

      results.cards = await prisma.photoCard.findMany({
        where: cardWhere,
        include: {
          member: { select: { nameEn: true } },
          group: { select: { slug: true, nameEn: true } },
          album: { select: { title: true } },
        },
        take: 10,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching wiki:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
