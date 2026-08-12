import { NextRequest, NextResponse } from "next/server";

// Mock price history data for trend charts
const MOCK_PRICE_HISTORY: Record<string, any[]> = {
  "twice-tzuyu-Feel-Special": [
    { date: "2024-01-01", price: 38.99, market: "ebay" },
    { date: "2024-02-01", price: 40.50, market: "ebay" },
    { date: "2024-03-01", price: 42.99, market: "ebay" },
    { date: "2024-04-01", price: 44.99, market: "ebay" },
    { date: "2024-05-01", price: 43.50, market: "ebay" },
    { date: "2024-06-01", price: 45.99, market: "ebay" },
    { date: "2024-07-01", price: 47.99, market: "mercari" },
    { date: "2024-08-01", price: 46.50, market: "buyee" },
  ],
  "blackpink-jennie-aptober": [
    { date: "2024-01-01", price: 75.00, market: "ebay" },
    { date: "2024-02-01", price: 78.99, market: "ebay" },
    { date: "2024-03-01", price: 82.50, market: "ebay" },
    { date: "2024-04-01", price: 85.99, market: "ebay" },
    { date: "2024-05-01", price: 87.50, market: "ebay" },
    { date: "2024-06-01", price: 89.50, market: "ebay" },
    { date: "2024-07-01", price: 91.99, market: "mercari" },
    { date: "2024-08-01", price: 89.50, market: "buyee" },
  ],
};

// Mock SKU mapping data for market links
const MOCK_SKU_MAPPING: Record<string, any[]> = {
  "twice-tzuyu-Feel-Special": [
    {
      market: "ebay",
      sku: "293472946",
      skuUrl: "https://ebay.com/itm/293472946",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
    {
      market: "mercari",
      sku: "m12345678",
      skuUrl: "https://jp.mercari.com/item/m12345678",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
    {
      market: "buyee",
      sku: "b98765432",
      skuUrl: "https://buyee.jp/item/b98765432",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
    {
      market: "bunjang",
      sku: "bj55555555",
      skuUrl: "https://m.bunjang.co.kr/products/55555555",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
  ],
  "blackpink-jennie-aptober": [
    {
      market: "ebay",
      sku: "394729384",
      skuUrl: "https://ebay.com/itm/394729384",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
    {
      market: "mercari",
      sku: "m87654321",
      skuUrl: "https://jp.mercari.com/item/m87654321",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
    {
      market: "buyee",
      sku: "b11111111",
      skuUrl: "https://buyee.jp/item/b11111111",
      lastChecked: "2026-08-11T12:00:00Z",
      isActive: true,
    },
  ],
};

const MARKET_DISPLAY_NAMES: Record<string, string> = {
  ebay: "eBay",
  mercari: "Mercari (JP)",
  buyee: "Buyee",
  bunjang: "Bungle (번개장터)",
  wts: "WTS Community",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slug = params.id;

    // Get price history
    const priceHistory = MOCK_PRICE_HISTORY[slug] || [];

    // Get SKU mapping
    const skuMapping = MOCK_SKU_MAPPING[slug] || [];

    // Enrich SKU mapping with display names
    const enrichedSkuMapping = skuMapping.map((sku) => ({
      ...sku,
      marketDisplayName: MARKET_DISPLAY_NAMES[sku.market] || sku.market,
    }));

    return NextResponse.json({
      slug,
      priceHistory,
      skuMapping: enrichedSkuMapping,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching photocard details:", error);
    return NextResponse.json(
      { error: "Failed to fetch photocard details" },
      { status: 500 }
    );
  }
}
