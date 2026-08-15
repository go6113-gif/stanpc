// Tab 2 (Price) data contract. Real data today is sparse (see
// lib/photocard-price.ts) — the shape stays honest about that: empty
// arrays rather than fabricated market prices.

export interface MarketPricePoint {
  market: string; // "ebay" | "mercari" | "buyee" | ... (PriceHistory.market, freeform)
  price: number;
  currency: string;
  sourceUrl: string | null;
  checkedAt: string; // ISO datetime
}

export interface PriceTrendPoint {
  date: string; // ISO date (yyyy-mm-dd)
  price: number;
  market: string;
}

export interface PhotocardPrice {
  cardSlug: string;
  estimatedPrice: number | null; // editorial PhotoCard.estimatedPrice, USD
  marketSummary: MarketPricePoint[]; // latest snapshot per market
  trend: PriceTrendPoint[]; // PriceHistory rows from the last 30 days, chronological
}
