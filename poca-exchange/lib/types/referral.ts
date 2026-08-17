/**
 * Referral & Credits System — 글로벌 추천인 및 크레딧 시스템 타입 정의
 */

export interface ReferralStats {
  totalReferrals: number;
  successfulConversions: number;
  totalCreditsAwarded: number;
}

export interface ReferralUser {
  id: string;
  refereeEmail: string;
  referrerCreditsAwarded: number;
  referrerCreditsStatus: 'PENDING' | 'AWARDED' | 'REVOKED';
  createdAt: string;
}

export interface GetBalanceResponse {
  isLoading: boolean;
  data: {
    referralCode: string;
    totalCredits: number;
    successfulInvitations: number;
    referralCodeStats: ReferralStats;
    recentReferrals: ReferralUser[];
  };
}

export interface ReferralDashboardProps {
  referralCode: string;
  totalCredits: number;
  successfulInvitations: number;
  referralCodeStats: ReferralStats;
  isLoading?: boolean;
}

export interface AmbassadorLeaderboardProps {
  isLoading?: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalCredits: number;
  successfulInvitations: number;
  rank: number;
}
