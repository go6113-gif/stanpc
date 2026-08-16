'use client';

interface RewardTier {
  threshold: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface RewardTiersProps {
  currentCredits: number;
}

export function DigitalRewardTiers({ currentCredits }: RewardTiersProps) {
  const tiers: RewardTier[] = [
    {
      threshold: 12500,
      name: '홀로그램 테마',
      description: '카드 디스플레이에 반짝이는 홀로그램 효과 추가',
      icon: '✨',
      unlocked: currentCredits >= 12500,
    },
    {
      threshold: 25000,
      name: '커스텀 도메인',
      description: 'stanpc.com/yourname 커스텀 URL 설정',
      icon: '🌐',
      unlocked: currentCredits >= 25000,
    },
    {
      threshold: 50000,
      name: '앰버서더 뱃지',
      description: '프로필에 "Top Ambassador" 마크 획득',
      icon: '👑',
      unlocked: currentCredits >= 50000,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900 dark:text-white">
        💎 디지털 특전 해금
      </h3>
      <div className="grid gap-3">
        {tiers.map((tier) => (
          <div
            key={tier.threshold}
            className={`rounded-lg p-4 border-2 transition-all ${
              tier.unlocked
                ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tier.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {tier.name}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {tier.description}
                </p>
                <div className="text-xs font-mono text-neutral-500">
                  {tier.unlocked ? (
                    <span className="text-green-600 dark:text-green-400">✓ 해금됨</span>
                  ) : (
                    `${tier.threshold.toLocaleString()}P 필요 (${tier.threshold - currentCredits} 남음)`
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
