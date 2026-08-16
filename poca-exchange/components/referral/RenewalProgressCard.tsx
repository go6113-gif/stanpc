'use client';

import { PRICING_CONFIG } from '@/lib/config/pricing.config';

interface ProgressCardProps {
  currentCredits: number;
  targetCredits?: number;
}

export function RenewalProgressCard({ currentCredits, targetCredits = 6250 }: ProgressCardProps) {
  const percentComplete = Math.min((currentCredits / targetCredits) * 100, 100);
  const creditsRemaining = Math.max(targetCredits - currentCredits, 0);
  const friendsNeeded = Math.ceil(creditsRemaining / PRICING_CONFIG.REFERRER_PER_USER_CREDITS);

  return (
    <div className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-emerald-50 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          🎯 다음 해 갱신비 무료화까지
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          친구 2명 추천 = 다음 해 $4.99 → $0
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-neutral-900 dark:text-white">
            {currentCredits.toLocaleString()}P / {targetCredits.toLocaleString()}P
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">
            {percentComplete.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {creditsRemaining > 0 && (
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {friendsNeeded}명 더 추천하면 무료 갱신 가능!
        </div>
      )}

      {creditsRemaining === 0 && (
        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
          ✅ 다음 해 갱신비가 완전 면제됩니다!
        </div>
      )}
    </div>
  );
}
