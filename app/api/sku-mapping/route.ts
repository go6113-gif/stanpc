import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cardId = searchParams.get('cardId');
    const market = searchParams.get('market');
    const byMarket = searchParams.get('byMarket') === 'true';

    if (!cardId) {
      return NextResponse.json(
        { status: 'error', message: 'cardId is required' },
        { status: 400 }
      );
    }

    // Find the photocard by slug
    const card = await prisma.photoCard.findUnique({
      where: { slug: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { status: 'error', message: 'PhotoCard not found' },
        { status: 404 }
      );
    }

    // Fetch SKU mappings
    const skuMappings = await prisma.globalSKUMapping.findMany({
      where: {
        cardId: card.id,
        isActive: true,
        ...(market && { market }),
      },
      orderBy: { market: 'asc' },
    });

    let data: any = skuMappings.map((sku) => ({
      market: sku.market,
      sku: sku.sku,
      skuUrl: sku.skuUrl,
      lastChecked: sku.lastChecked.toISOString(),
    }));

    // Group by market if requested
    if (byMarket) {
      const grouped: any = {};
      for (const sku of data) {
        if (!grouped[sku.market]) {
          grouped[sku.market] = [];
        }
        grouped[sku.market].push(sku);
      }
      data = grouped;
    }

    return NextResponse.json(
      {
        status: 'success',
        source: 'database',
        cardId,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching SKU mappings:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, market, sku, skuUrl } = body;

    if (!cardId || !market || !sku) {
      return NextResponse.json(
        { status: 'error', message: 'cardId, market, and sku are required' },
        { status: 400 }
      );
    }

    // Find the photocard by slug
    const card = await prisma.photoCard.findUnique({
      where: { slug: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { status: 'error', message: 'PhotoCard not found' },
        { status: 404 }
      );
    }

    // Create or update SKU mapping
    const skuMapping = await prisma.globalSKUMapping.upsert({
      where: {
        cardId_market_sku: {
          cardId: card.id,
          market,
          sku,
        },
      },
      create: {
        cardId: card.id,
        market,
        sku,
        skuUrl,
        isActive: true,
      },
      update: {
        skuUrl,
        lastChecked: new Date(),
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        source: 'database',
        data: {
          market: skuMapping.market,
          sku: skuMapping.sku,
          skuUrl: skuMapping.skuUrl,
          lastChecked: skuMapping.lastChecked.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating/updating SKU mapping:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
