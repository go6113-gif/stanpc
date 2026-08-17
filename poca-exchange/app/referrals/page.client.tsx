'use client';

import { useEffect, useState } from 'react';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { AmbassadorLeaderboard } from '@/components/referral/AmbassadorLeaderboard';
import type { GetBalanceResponse } from '@/lib/types/referral';

interface ReferralsPageClientProps {
  devMockMode?: boolean;
}

const MOCK_DATA: GetBalanceResponse = {
  isLoading: false,
  data: {
    referralCode: 'STANPC-DEV-MOCK-12345',
    totalCredits: 15625,
    successfulInvitations: 3,
    referralCodeStats: {
      totalReferrals: 5,
      successfulConversions: 3,
      totalCreditsAwarded: 12500,
    },
    recentReferrals: [
      {
        id: 'ref-1',
        refereeEmail: 'friend1@example.com',
        referrerCreditsAwarded: 3125,
        referrerCreditsStatus: 'AWARDED',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ref-2',
        refereeEmail: 'friend2@example.com',
        referrerCreditsAwarded: 3125,
        referrerCreditsStatus: 'AWARDED',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ref-3',
        refereeEmail: 'friend3@example.com',
        referrerCreditsAwarded: 3125,
        referrerCreditsStatus: 'AWARDED',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
};

export function ReferralsPageClient({ devMockMode = false }: ReferralsPageClientProps) {
  const [balanceData, setBalanceData] = useState<GetBalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (devMockMode) {
          setBalanceData(MOCK_DATA);
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/credits/get-balance');
        if (!res.ok) {
          throw new Error('Failed to fetch balance');
        }

        const data: GetBalanceResponse = await res.json();
        setBalanceData(data);
      } catch (err) {
        console.error('[ReferralsPageClient] Error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [devMockMode]);

  if (error && !devMockMode) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !balanceData) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <div className="h-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-96 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const { data } = balanceData;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* 추천 대시보드 */}
        <ReferralDashboard
          referralCode={data.referralCode}
          totalCredits={data.totalCredits}
          successfulInvitations={data.successfulInvitations}
          referralCodeStats={data.referralCodeStats}
          isLoading={isLoading}
        />

        {/* 명예의 전당 */}
        <AmbassadorLeaderboard isLoading={isLoading} />

        {/* 최근 초대 */}
        {data.recentReferrals.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              최근 초대 기록
            </h3>
            <div className="space-y-3">
              {data.recentReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded"
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {referral.refereeEmail}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(referral.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-pink-600 dark:text-pink-400">
                      +{referral.referrerCreditsAwarded}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        referral.referrerCreditsStatus === 'AWARDED'
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {referral.referrerCreditsStatus === 'AWARDED'
                        ? '완료'
                        : '대기 중'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
