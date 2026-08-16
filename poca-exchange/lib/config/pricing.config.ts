/**
 * 글로벌 가격 정책 & 무제한 크레딧 추천 시스템 (v2)
 *
 * 단위 경제학:
 * - 초기 결제: $24 (Lifetime)
 * - 연간 유지비: $4.99 (2년차 이후)
 * - 친구 2명 추천 시 → 다음 해 유지비 100% 무료
 * - 크레딧 적립: 무제한 (1,250P = $1)
 * - 현금 환급: 불가 (플랫폼 내부 디지털 특전만)
 */

// 환경 변수에서 로드, 없으면 기본값 사용
export const PRICING_CONFIG = {
  // 진입 가격 (Lifetime 라이선스)
  ORIGINAL_PRICE_USD: Number(process.env.NEXT_PUBLIC_ORIGINAL_PRICE_USD) || 24,

  // 할인율 (0 = 할인 없음, 0.2 = 20% 할인)
  DISCOUNT_RATE: Number(process.env.NEXT_PUBLIC_DISCOUNT_RATE) || 0,

  // 연간 유지비 (2년차 이후)
  ANNUAL_RENEWAL_USD: Number(process.env.NEXT_PUBLIC_ANNUAL_RENEWAL_USD) || 4.99,

  // 크레딧 환산 기준 (1 USD = 1,250P)
  POINTS_PER_USD: 1250,

  // 추천 보상 정책 (1,250P = $1)
  REFERRER_PER_USER_CREDITS: 3125, // 친구 1명당 3,125P ($2.50)
  REFEREE_WELCOME_CREDITS: 500,     // 신규 가입자 웰컴 보너스 ($0.40)

  // 무제한 추천 허용
  MAX_REFERRAL_LIMIT: Infinity,

  // 환율 (기본값)
  EXCHANGE_RATES: {
    KRW: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_KRW) || 1200,
    JPY: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_JPY) || 110,
    EUR: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_EUR) || 0.92,
    GBP: Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_GBP) || 0.79,
  },

  // 디지털 특전 해금 임계값 (누적 크레딧)
  DIGITAL_PERKS: {
    HOLOGRAM_THEME: 12500, // 누적 4명 (12,500P)
    CUSTOM_DOMAIN: 25000,  // 누적 8명 (25,000P)
    AMBASSADOR_BADGE: 50000, // 누적 16명 (50,000P)
  },
} as const;

/**
 * 단위 경제학 검증
 */
export interface UnitEconomics {
  initialRevenue: number;      // $24
  annualRenewal: number;        // $4.99
  cac: number;                  // Customer Acquisition Cost
  cacPercentage: number;        // CAC as % of revenue
  marginPerReferral: number;    // Net margin per referral
  breakEvenReferrals: number;   // How many referrals to break even
}

export function calculateUnitEconomics(): UnitEconomics {
  const initialRevenue = PRICING_CONFIG.ORIGINAL_PRICE_USD;
  const annualRenewal = PRICING_CONFIG.ANNUAL_RENEWAL_USD;
  const referralsFor1YearFree = 2; // 2명 추천 = 1년 무료

  const cac = annualRenewal; // Customer Acquisition Cost = annual renewal cost
  const cacPercentage = (cac / initialRevenue) * 100;
  const marginPerReferral = initialRevenue - cac;

  return {
    initialRevenue,
    annualRenewal,
    cac,
    cacPercentage,
    marginPerReferral,
    breakEvenReferrals: referralsFor1YearFree,
  };
}

/**
 * 크레딧 계산
 */
export function creditsToUSD(credits: number): number {
  return credits / PRICING_CONFIG.POINTS_PER_USD;
}

export function usdToCredits(usd: number): number {
  return Math.floor(usd * PRICING_CONFIG.POINTS_PER_USD);
}

export function getRenewalCreditsRequired(): number {
  return usdToCredits(PRICING_CONFIG.ANNUAL_RENEWAL_USD);
}

/**
 * 추천으로 얻는 혜택 계산
 */
export interface ReferralBenefit {
  referralsCount: number;
  totalCredits: number;
  totalUSDValue: number;
  yearsOfRenewalCovered: number;
  nextPerkUnlock?: { name: string; creditsNeeded: number; creditsRemaining: number };
}

export function calculateReferralBenefit(referralCount: number): ReferralBenefit {
  const totalCredits = PRICING_CONFIG.REFERRER_PER_USER_CREDITS * referralCount;
  const totalUSDValue = creditsToUSD(totalCredits);
  const renewalCreditsRequired = getRenewalCreditsRequired();
  const yearsOfRenewalCovered = Math.floor(totalCredits / renewalCreditsRequired);

  // 다음 디지털 특전 계산
  let nextPerkUnlock: ReferralBenefit['nextPerkUnlock'] = undefined;
  const perks = PRICING_CONFIG.DIGITAL_PERKS;

  if (totalCredits < perks.HOLOGRAM_THEME) {
    nextPerkUnlock = {
      name: '한정판 홀로그램 바인더 테마 & 다크네온 UI 스킨',
      creditsNeeded: perks.HOLOGRAM_THEME,
      creditsRemaining: perks.HOLOGRAM_THEME - totalCredits,
    };
  } else if (totalCredits < perks.CUSTOM_DOMAIN) {
    nextPerkUnlock = {
      name: '커스텀 단축 도메인 연결권',
      creditsNeeded: perks.CUSTOM_DOMAIN,
      creditsRemaining: perks.CUSTOM_DOMAIN - totalCredits,
    };
  } else if (totalCredits < perks.AMBASSADOR_BADGE) {
    nextPerkUnlock = {
      name: "Top Ambassador 골드 인증 마크",
      creditsNeeded: perks.AMBASSADOR_BADGE,
      creditsRemaining: perks.AMBASSADOR_BADGE - totalCredits,
    };
  }

  return {
    referralsCount: referralCount,
    totalCredits,
    totalUSDValue,
    yearsOfRenewalCovered,
    nextPerkUnlock,
  };
}

/**
 * 통화 포맷
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
 * 브라우저 로케일 기반 통화 감지
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
