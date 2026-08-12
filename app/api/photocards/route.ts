import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const priceRange = searchParams.get('priceRange');
    const country = searchParams.get('country');
    const sortBy = searchParams.get('sortBy') || 'popular';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause for filtering
    const where: any = {};
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      where.estimatedPrice = { gte: minPrice, lte: maxPrice };
    }

    // Build order by for sorting
    const orderBy: any = {};
    switch (sortBy) {
      case 'price-asc':
        orderBy.estimatedPrice = 'asc';
        break;
      case 'price-desc':
        orderBy.estimatedPrice = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'popular':
      default:
        orderBy.viewCount = 'desc';
        break;
    }

    // Fetch photocards with relations
    const photocards = await prisma.photoCard.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        group: true,
        member: true,
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        skuMappings: {
          where: { isActive: true },
        },
      },
    });

    const total = await prisma.photoCard.count({ where });

    // Transform data to include calculated fields
    const transformedCards = photocards.map((card) => ({
      id: card.id,
      slug: card.slug,
      cardName: card.cardName,
      imageUrl: card.imageUrl,
      thumbImagePath: card.thumbImagePath,
      groupName: card.group?.name,
      groupSlug: card.group?.slug,
      memberName: card.member?.name,
      memberSlug: card.member?.slug,
      albumTitle: card.albumTitle,
      estimatedPrice: card.estimatedPrice,
      haveCount: card.haveCount,
      wantCount: card.wantCount,
      viewCount: card.viewCount,
      badge: card.badge,
      isoNumber: card.isoNumber,
      pobCode: card.pobCode,
      priceChangePercent: calculatePriceChange(card.priceHistory),
      priceHistory: card.priceHistory.map((ph) => ({
        date: ph.createdAt.toISOString().split('T')[0],
        price: ph.price,
        market: ph.market,
      })),
      skuMappings: card.skuMappings.map((sku) => ({
        market: sku.market,
        sku: sku.sku,
        skuUrl: sku.skuUrl,
      })),
    }));

    return NextResponse.json(
      {
        status: 'success',
        source: 'database',
        total,
        data: transformedCards,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching photocards:', error);

    // Fallback to mock data if database fails
    return NextResponse.json(
      {
        status: 'success',
        source: 'mock',
        total: 0,
        data: [],
        message: 'Database connection failed, returning empty mock data',
      },
      { status: 200 }
    );
  }
}

function calculatePriceChange(priceHistory: any[]): number {
  if (priceHistory.length < 2) return 0;
  const latest = priceHistory[0]?.price;
  const oldest = priceHistory[priceHistory.length - 1]?.price;
  if (!latest || !oldest) return 0;
  return Math.round(((latest - oldest) / oldest) * 100 * 100) / 100;
}
