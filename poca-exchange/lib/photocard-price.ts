import type { PhotocardGuideSource } from "@/lib/photocard-guide";
import type { PhotocardPrice, MarketPricePoint } from "@/types/photocard-price";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Builds the Tab 2 (Price) view model from a PhotoCard row's PriceHistory.
 * Real coverage is thin today (8/3872 cards have any PriceHistory at all,
 * all USD) — marketSummary/trend come back empty rather than invented, and
 * the component falls back to the live eBay Browse API search
 * (components/ebay-live-listings.tsx) for cards with no stored history. */
export function buildPhotocardPrice(card: PhotocardGuideSource): PhotocardPrice {
  const history = [...card.priceHistory].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const latestByMarket = new Map<string, (typeof history)[number]>();
  for (const row of history) {
    if (!latestByMarket.has(row.market)) latestByMarket.set(row.market, row);
  }

  const marketSummary: MarketPricePoint[] = [...latestByMarket.values()].map((row) => ({
    market: row.market,
    price: row.price,
    currency: row.currency,
    sourceUrl: row.sourceUrl,
    checkedAt: row.createdAt.toISOString(),
  }));

  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const trend = history
    .filter((row) => row.createdAt.getTime() >= cutoff)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((row) => ({
      date: row.createdAt.toISOString().slice(0, 10),
      price: row.price,
      market: row.market,
    }));

  return {
    cardSlug: card.slug,
    estimatedPrice: card.estimatedPrice,
    marketSummary,
    trend,
  };
}
