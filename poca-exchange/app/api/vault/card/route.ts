import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cardId, action, tags = [] } = body;

    if (!cardId || !action) {
      return NextResponse.json(
        { error: 'Missing cardId or action' },
        { status: 400 }
      );
    }

    // Check if card already exists in user's binder
    const existingCard = await prisma.userBinderCard.findFirst({
      where: {
        userId: session.user.id,
        cardId,
      },
    });

    if (existingCard) {
      // Update existing card
      const updatedCard = await prisma.userBinderCard.update({
        where: { id: existingCard.id },
        data: {
          tags: Array.from(new Set([...existingCard.tags, ...tags])),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Card ${action === 'have' ? 'added to collection' : 'added to wishlist'}`,
        card: updatedCard,
      });
    }

    // Create new binder card entry
    const newCard = await prisma.userBinderCard.create({
      data: {
        userId: session.user.id,
        cardId,
        tags,
        note: action === 'have' ? 'In Hand' : 'ISO',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Card ${action === 'have' ? 'added to collection' : 'added to wishlist'}`,
      card: newCard,
    });
  } catch (error) {
    console.error('Error adding card to vault:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardId = req.nextUrl.searchParams.get('cardId');
    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing cardId parameter' },
        { status: 400 }
      );
    }

    // Check if card is in user's vault
    const binderCard = await prisma.userBinderCard.findFirst({
      where: {
        userId: session.user.id,
        cardId,
      },
      include: {
        card: {
          select: {
            id: true,
            slug: true,
            cardName: true,
            estimatedPrice: true,
          },
        },
      },
    });

    return NextResponse.json({
      inVault: !!binderCard,
      tags: binderCard?.tags ?? [],
      card: binderCard?.card ?? null,
    });
  } catch (error) {
    console.error('Error checking vault status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
