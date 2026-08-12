import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cardId = searchParams.get('cardId');
    const days = parseInt(searchParams.get('days') || '90');
    const market = searchParams.get('market');

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

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch price history
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        cardId: card.id,
        createdAt: { gte: startDate },
        ...(market && { market }),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate statistics
    const prices = priceHistory.map((ph) => ph.price);
    const stats = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      avg: prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : 0,
      latest: prices.length > 0 ? prices[prices.length - 1] : 0,
    };

    return NextResponse.json(
      {
        status: 'success',
        source: 'database',
        cardId,
        days,
        stats: {
          min: Math.round(stats.min * 100) / 100,
          max: Math.round(stats.max * 100) / 100,
          avg: Math.round(stats.avg * 100) / 100,
          latest: Math.round(stats.latest * 100) / 100,
        },
        data: priceHistory.map((ph) => ({
          date: ph.createdAt.toISOString().split('T')[0],
          price: ph.price,
          market: ph.market,
          currency: ph.currency,
          sourceUrl: ph.sourceUrl,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
