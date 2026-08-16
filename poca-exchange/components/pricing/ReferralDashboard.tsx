'use client';

import { useEffect, useState } from 'react';
import { Copy, Share2, TrendingUp, Gift } from 'lucide-react';
import { calculateReferralBenefit, getRenewalCreditsRequired, formatCurrency } from '@/lib/config/pricing.config';

interface ReferralStats {
  totalReferrals: number;
  totalCreditsEarned: number;
  totalUSDValue: number;
  referralCode?: string;
  balance?: number;
}

/**
 * 추천 현황 대시보드
 *
 * - 누적 추천 인원 수
 * - 획득한 크레딧
 * - 다음 디지털 특전
 * - 무료 연장 가능 기간
 */
export function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/credits/get-balance');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalReferrals: data.referrals.totalReferrals,
            totalCreditsEarned: data.referrals.benefit.totalCredits,
            totalUSDValue: data.referrals.benefit.totalUSDValue,
            referralCode: data.user.referralCode,
            balance: data.credits.balance,
          });
        }
      } catch (error) {
        console.error('Failed to fetch referral stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 animate-pulse">
        <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <p className="text-neutral-600 dark:text-neutral-400">통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  const benefit = calculateReferralBenefit(stats.totalReferrals);
  const renewalCreditsRequired = getRenewalCreditsRequired();
  const referralLink = stats.referralCode ? `https://stanpc.com?ref=${stats.referralCode}` : '';

  const handleCopyLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 메인 카드 */}
      <div className="bg-gradient-to-br from-pink-50 dark:from-pink-950/20 to-purple-50 dark:to-purple-950/20 border-2 border-pink-200 dark:border-pink-800 rounded-2xl p-8">
        <div className="space-y-6">
          {/* 제목 */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
              🎉 추천으로 무료 연장하기
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              친구 2명을 추천하면 다음 해 유지비($4.99)가 100% 무료!
            </p>
          </div>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 추천 인원 */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                추천 인원
              </div>
              <div className="text-3xl font-bold text-pink-600">{stats.totalReferrals}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                2명 추천 = 1년 무료
              </div>
            </div>

            {/* 획득 크레딧 */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                획득 크레딧
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {benefit.totalCredits.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                ({formatCurrency(benefit.totalUSDValue)})
              </div>
            </div>

            {/* 무료 연장 기간 */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                무료 기간
              </div>
              <div className="text-3xl font-bold text-green-600">
                {benefit.yearsOfRenewalCovered}년
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                {renewalCreditsRequired}P 필요
              </div>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-neutral-900 dark:text-white">
                다음 특전까지의 진행도
              </span>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {benefit.nextPerkUnlock
                  ? `${benefit.nextPerkUnlock.creditsRemaining}P 남음`
                  : '모든 특전 해금!'}
              </span>
            </div>
            {benefit.nextPerkUnlock && (
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all"
                  style={{
                    width: `${(benefit.totalCredits / benefit.nextPerkUnlock.creditsNeeded) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 추천 링크 카드 */}
      {referralLink && (
        <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">📤 추천 링크</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm dark:text-white font-mono text-neutral-600 dark:text-neutral-400"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors flex items-center gap-2 font-medium"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  복사
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 다음 특전 카드 */}
      {benefit.nextPerkUnlock && (
        <div className="bg-white dark:bg-neutral-950 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Gift className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                다음 특전 해금 예정
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                {benefit.nextPerkUnlock.name}
              </p>
              <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                {benefit.nextPerkUnlock.creditsRemaining}P 더 필요
                ({Math.ceil(benefit.nextPerkUnlock.creditsRemaining / 3125)}명 추가 추천)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 정보 박스 */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-300">
        <strong>💡 팁:</strong> 친구 추천 링크를 SNS에 공유하면 더 많은 친구들이 가입할 수 있어요!
      </div>
    </div>
  );
}
