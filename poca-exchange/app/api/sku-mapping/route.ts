import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sku-mapping?cardId=<id>&market=ebay,mercari
// Returns all active SKU mappings for a photocard across different markets
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

    const marketParam = searchParams.get("market");
    const markets = marketParam ? marketParam.split(",") : undefined;

    // Fetch SKU mappings from database
    const skuMappings = await prisma.globalSKUMapping.findMany({
      where: {
        cardId,
        isActive: true,
        ...(markets && { market: { in: markets } }),
      },
      orderBy: [{ market: "asc" }, { createdAt: "desc" }],
    });

    // Group by market for easier consumption
    const groupedByMarket = skuMappings.reduce(
      (acc, mapping) => {
        if (!acc[mapping.market]) {
          acc[mapping.market] = [];
        }
        acc[mapping.market].push(mapping);
        return acc;
      },
      {} as Record<string, typeof skuMappings>
    );

    return NextResponse.json({
      success: true,
      cardId,
      markets: markets || "all",
      total: skuMappings.length,
      byMarket: groupedByMarket,
      data: skuMappings,
    });
  } catch (error) {
    console.error("[/api/sku-mapping] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch SKU mappings" },
      { status: 500 }
    );
  }
}

// POST /api/sku-mapping - Create or update SKU mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, market, sku, skuUrl } = body;

    if (!cardId || !market || !sku) {
      return NextResponse.json(
        { error: "Missing required fields: cardId, market, sku" },
        { status: 400 }
      );
    }

    // Upsert SKU mapping
    const skuMapping = await prisma.globalSKUMapping.upsert({
      where: {
        cardId_market_sku: {
          cardId,
          market,
          sku,
        },
      },
      update: {
        skuUrl: skuUrl || undefined,
        lastChecked: new Date(),
      },
      create: {
        cardId,
        market,
        sku,
        skuUrl: skuUrl || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: skuMapping,
    });
  } catch (error) {
    console.error("[/api/sku-mapping] POST Error:", error);

    return NextResponse.json(
      { error: "Failed to create/update SKU mapping" },
      { status: 500 }
    );
  }
}
