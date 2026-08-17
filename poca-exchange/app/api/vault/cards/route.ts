'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, action } = await req.json();
    const userId = session.user.id;

    if (action === 'own') {
      // 소장 카드 토글
      const existing = await prisma.userBinderCard.findUnique({
        where: { userId_cardId: { userId, cardId } },
      });

      if (existing) {
        await prisma.userBinderCard.delete({
          where: { userId_cardId: { userId, cardId } },
        });
      } else {
        await prisma.userBinderCard.create({
          data: { userId, cardId },
        });
      }
    } else if (action === 'wishlist') {
      // 위시리스트 토글 (간단한 구현)
      const existing = await prisma.userBinderCard.findUnique({
        where: { userId_cardId: { userId, cardId } },
      });

      if (!existing) {
        await prisma.userBinderCard.create({
          data: { userId, cardId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Card action failed:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const cards = await prisma.userBinderCard.findMany({
      where: { userId },
      include: {
        card: {
          select: { id: true, cardName: true, imageUrl: true, slug: true },
        },
      },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Fetch cards failed:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
