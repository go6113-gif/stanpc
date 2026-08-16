/**
 * 글로벌 가격 및 리워드 설정 (완전 변수화)
 *
 * USD 기준 금액을 환경 변수에서 로드하고, 필요시 로컬 통화로 변환합니다.
 * 모든 금액은 향후 즉시 변경 가능하도록 분리했습니다.
 */

// 환경 변수에서 로드, 없으면 기본값 사용
export const PRICING_CONFIG = {
  // 원본 가격 (USD)
  ORIGINAL_PRICE_USD: Number(process.env.NEXT_PUBLIC_ORIGINAL_PRICE_USD) || 24,

  // 할인율 (0 = 할인 없음, 0.5 = 50% 할인, 등)
  DISCOUNT_RATE: Number(process.env.NEXT_PUBLIC_DISCOUNT_RATE) || 0,

  // 추천인 리워드 (크레딧)
  REFERRER_REWARD_CREDITS: Number(process.env.NEXT_PUBLIC_REFERRER_CREDITS) || 0,

  // 피추천인 웰컴 크레딧
  REFEREE_WELCOME_CREDITS: Number(process.env.NEXT_PUBLIC_REFEREE_CREDITS) || 0,

  // 환율 (기본값, API를 통해 갱신 가능)
  EXCHANGE_RATES: {
    KRW: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_KRW) || 1200,
    JPY: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_JPY) || 110,
    EUR: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_EUR) || 0.92,
    GBP: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_GBP) || 0.79,
  },
} as const;

/**
 * 계산된 판매가 (할인 적용)
 */
export function getFinalPriceUSD(): number {
  const discount = PRICING_CONFIG.ORIGINAL_PRICE_USD * PRICING_CONFIG.DISCOUNT_RATE;
  return PRICING_CONFIG.ORIGINAL_PRICE_USD - discount;
}

/**
 * 통화 포맷 (숫자 입력: USD 기준)
 */
type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR' | 'GBP';

export function formatCurrency(amountUSD: number, currency: Currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  });

  let convertedAmount = amountUSD;

  if (currency !== 'USD') {
    const exchangeRate = PRICING_CONFIG.EXCHANGE_RATES[currency];
    convertedAmount = amountUSD * exchangeRate;
  }

  return formatter.format(convertedAmount);
}

/**
 * 현지 통화로 변환 (환율 기반)
 */
export function convertUSDToLocal(amountUSD: number, currency: Currency = 'USD'): number {
  if (currency === 'USD') return amountUSD;
  return amountUSD * (PRICING_CONFIG.EXCHANGE_RATES[currency] || 1);
}

/**
 * 원본 가격과 최종 가격 정보 객체
 */
export interface PriceInfo {
  originalUSD: number;
  discountRate: number;
  discountAmountUSD: number;
  finalUSD: number;
  referrerCredits: number;
  refereeCredits: number;
}

export function getPriceInfo(): PriceInfo {
  const originalUSD = PRICING_CONFIG.ORIGINAL_PRICE_USD;
  const discountRate = PRICING_CONFIG.DISCOUNT_RATE;
  const discountAmountUSD = originalUSD * discountRate;
  const finalUSD = getFinalPriceUSD();

  return {
    originalUSD,
    discountRate,
    discountAmountUSD,
    finalUSD,
    referrerCredits: PRICING_CONFIG.REFERRER_REWARD_CREDITS,
    refereeCredits: PRICING_CONFIG.REFEREE_WELCOME_CREDITS,
  };
}

/**
 * 브라우저 로케일에 따른 권장 통화 감지
 */
export function getRecommendedCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD';

  const locale = navigator.language || 'en-US';

  if (locale.includes('ko')) return 'KRW';
  if (locale.includes('ja')) return 'JPY';
  if (locale.includes('de') || locale.includes('fr')) return 'EUR';
  if (locale.includes('en-GB') || locale.includes('en-IE')) return 'GBP';

  return 'USD';
}
