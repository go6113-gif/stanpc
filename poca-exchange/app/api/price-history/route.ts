import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/price-history?cardId=<id>&days=30&market=ebay,mercari
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const cardId = searchParams.get("cardId");
    if (!cardId) {
      return NextResponse.json(
        { error: "Missing cardId query parameter" },
        { status: 400 }
      );
    }

    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 30;
    const marketParam = searchParams.get("market");
    const markets = marketParam ? marketParam.split(",") : undefined;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch price history from database
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        cardId,
        createdAt: { gte: startDate },
        ...(markets && { market: { in: markets } }),
      },
      orderBy: { createdAt: "asc" },
      take: 500, // Limit to 500 entries
    });

    // Calculate statistics
    const prices = priceHistory.map((p) => p.price);
    const stats = {
      count: priceHistory.length,
      min: prices.length > 0 ? Math.min(...prices) : null,
      max: prices.length > 0 ? Math.max(...prices) : null,
      avg:
        prices.length > 0
          ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
          : null,
    };

    return NextResponse.json({
      success: true,
      cardId,
      days,
      markets: markets || "all",
      stats,
      data: priceHistory,
    });
  } catch (error) {
    console.error("[/api/price-history] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
