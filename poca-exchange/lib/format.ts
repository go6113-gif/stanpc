// Global formatting utilities for i18n and multi-currency display.

export type Currency = "USD" | "KRW" | "JPY";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string }> = {
  USD: { symbol: "$", locale: "en-US" },
  KRW: { symbol: "₩", locale: "ko-KR" },
  JPY: { symbol: "¥", locale: "ja-JP" },
};

// Format price with currency symbol and locale-aware number grouping.
// Example: formatPrice(32.80, "USD") => "$32.80"
//          formatPrice(45000, "KRW") => "₩45,000"
export function formatPrice(
  price: number | null | undefined,
  currency: Currency = "USD"
): string {
  if (price === null || price === undefined) return "—";

  const config = CURRENCY_CONFIG[currency];
  const formatter = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  });

  return formatter.format(price);
}

// Display multi-currency price: "$32.80 (₩45,000)"
// Assumes usdPrice is base; converts to other currencies using approximate rates.
export function formatMultiCurrency(usdPrice: number | null | undefined): string {
  if (usdPrice === null || usdPrice === undefined) return "—";

  // Approximate rates (update periodically in real app via API)
  const exchangeRates = {
    USD: 1,
    KRW: 1350, // 1 USD ~ 1,350 KRW
    JPY: 155,  // 1 USD ~ 155 JPY
  };

  const usdFormatted = formatPrice(usdPrice, "USD");
  const krwPrice = usdPrice * exchangeRates.KRW;
  const krwFormatted = formatPrice(krwPrice, "KRW");

  return `${usdFormatted} (${krwFormatted})`;
}

// Alias for backward compatibility (used by existing components)
export const formatCurrency = formatPrice;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  date: Date | string,
  locale = "ko-KR",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatters.set(key, formatter);
  }
  return formatter.format(typeof date === "string" ? new Date(date) : date);
}
