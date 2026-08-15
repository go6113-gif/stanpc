import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vault/profile/[username]
 * Public user profile with binder card stats and C2C contact info
 * Supports filtering: ?vaultStatus=owned|iso|trade|sale
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse> {
  try {
    const { username } = await params;
    const vaultStatus = req.nextUrl.searchParams.get('vaultStatus'); // 'owned' | 'iso' | 'trade' | 'sale'

    // Find user by username (email prefix for demo, or use a slug field if added later)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: username } },
          { name: { contains: username } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        collectorIndex: true,
        mannerScore: true,
        twitterHandle: true,
        openKakaoUrl: true,
        discordUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build vaultStatus filter for UserBinderCard
    let userBinderFilter: any = undefined;
    if (vaultStatus && vaultStatus !== 'all') {
      userBinderFilter = {};
      if (vaultStatus === 'owned') {
        userBinderFilter.OR = [
          { status: 'OWNED' },
          { status: 'WTT' },
          { status: 'WTS' },
        ];
      } else if (vaultStatus === 'iso') {
        userBinderFilter.status = 'WTB';
      } else if (vaultStatus === 'trade') {
        userBinderFilter.status = 'WTT';
      } else if (vaultStatus === 'sale') {
        userBinderFilter.status = 'WTS';
      }
    }

    // Fetch user's binder cards with filtering
    const binderCards = await prisma.userBinderCard.findMany({
      where: {
        userId: user.id,
        ...(userBinderFilter ? userBinderFilter : {}),
      },
      include: {
        card: {
          select: {
            id: true,
            slug: true,
            cardName: true,
            imageUrl: true,
            thumbImagePath: true,
            estimatedPrice: true,
            group: { select: { slug: true, nameEn: true } },
            member: { select: { nameEn: true } },
            album: { select: { slug: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate vault statistics
    const stats = {
      totalCards: binderCards.length,
      ownedCards: binderCards.filter(
        (bc) =>
          bc.status === 'OWNED' ||
          bc.status === 'WTT' ||
          bc.status === 'WTS'
      ).length,
      isoCards: binderCards.filter((bc) => bc.status === 'WTB').length,
      forTradeCards: binderCards.filter((bc) => bc.status === 'WTT')
        .length,
      forSaleCards: binderCards.filter((bc) => bc.status === 'WTS').length,
      estimatedVaultValue: binderCards.reduce(
        (sum, bc) => sum + (bc.card.estimatedPrice || 0),
        0
      ),
    };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        collectorIndex: user.collectorIndex,
        mannerScore: user.mannerScore,
        // C2C contact info (only exposed on public profile)
        twitterHandle: user.twitterHandle,
        openKakaoUrl: user.openKakaoUrl,
        discordUrl: user.discordUrl,
        joinedAt: user.createdAt,
      },
      cards: binderCards,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching vault profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
