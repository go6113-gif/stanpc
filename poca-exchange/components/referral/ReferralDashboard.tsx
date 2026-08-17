'use client';

import { Copy, Share2 } from 'lucide-react';
import type { ReferralDashboardProps } from '@/lib/types/referral';

export function ReferralDashboard({
  referralCode,
  totalCredits,
  successfulInvitations,
  referralCodeStats,
  isLoading = false,
}: ReferralDashboardProps) {
  const referralUrl = `https://stanpc.com/ref/${referralCode}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    alert('추천 링크가 복사되었습니다!');
  };

  const handleShareLink = async () => {
    if (typeof navigator.share !== 'undefined') {
      try {
        await navigator.share({
          title: 'StanPC에 초대합니다!',
          text: '덕질 메이트 2명 모이면 평생 바인더 무료! 🎁',
          url: referralUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-neutral-900 dark:to-neutral-800 rounded-lg p-8 space-y-4">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-32" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-48" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-neutral-900 dark:to-neutral-800 rounded-lg border border-pink-200 dark:border-pink-900/30 p-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            추천 프로그램
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            덕질 메이트 2명 모이면 평생 바인더 무료! 🎁
          </p>
        </div>

        {/* 추천 링크 섹션 */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 space-y-3">
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            내 추천 링크
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm font-mono"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
              title="링크 복사"
            >
              <Copy className="w-4 h-4" />
              복사
            </button>
            <button
              onClick={handleShareLink}
              className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium transition-colors flex items-center gap-2"
              title="공유"
            >
              <Share2 className="w-4 h-4" />
              공유
            </button>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 총 크레딧 */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              💎 총 적립 크레딧
            </p>
            <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              {totalCredits.toLocaleString()}
            </p>
          </div>

          {/* 성공 초대 수 */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              🎯 성공 초대 수
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {successfulInvitations}명
            </p>
          </div>

          {/* 총 추천인 수 */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              👥 총 추천인 수
            </p>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {referralCodeStats.totalReferrals}명
            </p>
          </div>
        </div>

        {/* 진행 게이지 */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              평생 바인더 무료까지
            </p>
            <p className="text-sm font-bold text-pink-600 dark:text-pink-400">
              {successfulInvitations} / 2
            </p>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((successfulInvitations / 2) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
            {successfulInvitations >= 2
              ? '🎉 축하합니다! 평생 바인더 무료 자격을 얻었습니다!'
              : `${2 - successfulInvitations}명만 더 초대하면 평생 바인더 무료!`}
          </p>
        </div>
      </div>
    </div>
  );
}
