/**
 * 추천인 유틸리티
 *
 * 추천 코드 생성, 검증, 링크 생성 등의 기능을 제공합니다.
 */

import { PRICING_CONFIG } from '@/lib/config/pricing.config';

/**
 * 사용자 이름/ID를 기반으로 고유한 추천 코드 생성
 *
 * @param userId - 사용자 ID (cuid)
 * @param userName - 사용자 이름 (선택사항)
 * @returns 추천 코드 (e.g., "karina-ref-abc123")
 */
export function generateReferralCode(userId: string, userName?: string | null): string {
  // 사용자 ID의 마지막 8자만 사용하여 짧은 코드 생성
  const shortId = userId.slice(-8).toUpperCase();

  if (userName) {
    // 사용자 이름이 있으면 "-ref-" + ID 형식
    const sanitizedName = userName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 15); // 최대 15자

    return `${sanitizedName}-ref-${shortId}`;
  }

  // 이름이 없으면 "ref-" + ID 형식
  return `ref-${shortId}`;
}

/**
 * 추천 링크 생성
 *
 * @param referralCode - 추천 코드
 * @param baseUrl - 기본 URL (기본값: NEXT_PUBLIC_SITE_URL 환경변수)
 * @returns 전체 추천 링크
 *
 * @example
 * ```ts
 * const link = generateReferralLink('karina-ref-abc123');
 * // https://stanpc.com?ref=karina-ref-abc123
 * ```
 */
export function generateReferralLink(referralCode: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://stanpc.com';
  const params = new URLSearchParams({ ref: referralCode });
  return `${url}?${params.toString()}`;
}

/**
 * URL 쿼리 파라미터에서 추천 코드 추출
 *
 * @param searchParams - URL 검색 파라미터
 * @returns 추천 코드 (없으면 null)
 */
export function extractReferralCode(searchParams: URLSearchParams | null): string | null {
  if (!searchParams) return null;
  return searchParams.get('ref');
}

/**
 * 추천 코드 검증
 *
 * @param code - 검증할 코드
 * @returns 유효 여부
 */
export function isValidReferralCode(code: string): boolean {
  // 추천 코드는 3자 이상 50자 이하
  if (code.length < 3 || code.length > 50) return false;

  // 알파벳, 숫자, 하이픈만 허용
  return /^[a-zA-Z0-9-]+$/.test(code);
}

/**
 * 크레딧 트랜잭션 정보
 */
export interface CreditTransaction {
  userId: string;
  creditAmount: number;
  reason: 'referral_reward' | 'referral_welcome' | 'payment' | 'admin_bonus';
  referralLogId?: string;
  description: string;
}

/**
 * 추천인 보상 크레딧 계산
 */
export function calculateReferrerReward(): number {
  return PRICING_CONFIG.REFERRER_PER_USER_CREDITS;
}

/**
 * 피추천인 웰컴 크레딧 계산
 */
export function calculateRefereeWelcome(): number {
  return PRICING_CONFIG.REFEREE_WELCOME_CREDITS;
}

/**
 * 추천 정보 요약
 */
export interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  referrerRewardUSD: number;
  refereeWelcomeCredits: number;
  totalReferralsCount?: number;
  totalCreditsEarned?: number;
}

export function getReferralSummary(
  referralCode: string,
  totalReferralsCount?: number,
  totalCreditsEarned?: number
): ReferralSummary {
  return {
    referralCode,
    referralLink: generateReferralLink(referralCode),
    referrerRewardUSD: PRICING_CONFIG.REFERRER_PER_USER_CREDITS,
    refereeWelcomeCredits: PRICING_CONFIG.REFEREE_WELCOME_CREDITS,
    totalReferralsCount,
    totalCreditsEarned,
  };
}
