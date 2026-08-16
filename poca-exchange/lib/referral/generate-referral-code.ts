import { customAlphabet } from 'nanoid';

/**
 * 추천 코드 생성기
 * 사용자마다 고유한 추천 코드를 생성합니다.
 * 형식: 대문자 + 숫자 6-8자 (예: "ABC123XY")
 */
const nanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export function generateReferralCode(): string {
  return nanoId();
}

/**
 * 추천 링크 URL 생성
 * 추천 코드를 포함한 완전한 가입 링크를 생성합니다.
 */
export function generateReferralUrl(referralCode: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://stanpc.com';
  return `${url}/auth/signup?ref=${referralCode}`;
}

/**
 * 추천 코드에서 Short URL 생성 (선택사항, 향후 bit.ly 등 통합 가능)
 */
export function generateReferralShortUrl(referralCode: string): string {
  return `stanpc.com/ref/${referralCode}`;
}
