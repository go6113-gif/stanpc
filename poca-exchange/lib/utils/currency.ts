export type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR' | 'GBP';

// 환율 정보 (USD 기준)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  KRW: parseInt(process.env.NEXT_PUBLIC_EXCHANGE_RATE_KRW || '1300'),
  JPY: parseInt(process.env.NEXT_PUBLIC_EXCHANGE_RATE_JPY || '120'),
  EUR: parseFloat(process.env.NEXT_PUBLIC_EXCHANGE_RATE_EUR || '0.95'),
  GBP: parseFloat(process.env.NEXT_PUBLIC_EXCHANGE_RATE_GBP || '0.82'),
};

// 통화별 포맷 설정
const LOCALE_MAP: Record<Currency, string> = {
  USD: 'en-US',
  KRW: 'ko-KR',
  JPY: 'ja-JP',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  KRW: '₩',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
};

/**
 * USD에서 다른 통화로 변환
 */
export function convertCurrency(usdAmount: number, toCurrency: Currency): number {
  if (toCurrency === 'USD') return usdAmount;
  return usdAmount * EXCHANGE_RATES[toCurrency];
}

/**
 * 통화별 가격 포맷팅
 */
export function formatPrice(usdAmount: number, currency: Currency = 'USD'): string {
  const convertedAmount = convertCurrency(usdAmount, currency);
  const locale = LOCALE_MAP[currency];

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(convertedAmount);
  } catch {
    // Fallback for unsupported currencies
    return `${CURRENCY_SYMBOLS[currency]}${convertedAmount.toFixed(2)}`;
  }
}

/**
 * 단순 가격 포맷팅 (기호만)
 */
export function formatPriceSimple(usdAmount: number, currency: Currency = 'USD'): string {
  const convertedAmount = convertCurrency(usdAmount, currency);
  const isWon = currency === 'KRW';
  const isYen = currency === 'JPY';

  if (isWon || isYen) {
    return `${CURRENCY_SYMBOLS[currency]}${Math.round(convertedAmount).toLocaleString()}`;
  }

  return `${CURRENCY_SYMBOLS[currency]}${convertedAmount.toFixed(2)}`;
}

/**
 * 현재 환율 정보 반환
 */
export function getExchangeRates(): Record<Currency, number> {
  return { ...EXCHANGE_RATES };
}

/**
 * 특정 통화의 환율 반환
 */
export function getExchangeRate(currency: Currency): number {
  return EXCHANGE_RATES[currency];
}
