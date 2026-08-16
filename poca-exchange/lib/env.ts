/**
 * 환경 변수 검증 및 Fallback 처리
 * - 누락된 설정에 대한 안전한 기본값 제공
 * - 개발 환경에서 Demo/Guest 모드 지원
 */

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',

  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'demo-secret-key',

  // Site
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // OAuth (Optional)
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID || '',
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET || '',
  AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID || '',
  AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET || '',

  // Stripe (Optional)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

  // eBay (Optional)
  EBAY_CLIENT_ID: process.env.EBAY_CLIENT_ID || '',
  EBAY_CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET || '',

  // R2 (Optional)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || '',
};

/**
 * 필수 환경 변수 확인
 */
export const isConfigured = {
  database: Boolean(env.DATABASE_URL && env.DIRECT_URL),
  supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  oauth: Boolean(env.AUTH_GOOGLE_ID || env.AUTH_GITHUB_ID),
  stripe: Boolean(env.STRIPE_SECRET_KEY),
};

/**
 * 개발 모드인지 확인 (로컬/데모 환경)
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Supabase 설정 확인 (경고 필요 시)
 */
export const requiresSupabaseConfig = (): { required: boolean; message?: string } => {
  if (!isConfigured.database) {
    return {
      required: true,
      message: '데이터베이스 연결 설정이 필요합니다. .env.local 파일을 확인해주세요.',
    };
  }
  return { required: false };
};
