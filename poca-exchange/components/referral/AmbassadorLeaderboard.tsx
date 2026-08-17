'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types/referral';

export interface AmbassadorLeaderboardProps {
  isLoading?: boolean;
}

export function AmbassadorLeaderboard({ isLoading = false }: AmbassadorLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(isLoading);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/leaderboard/ambassadors');
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setLeaderboard(data.data || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-neutral-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          아직 리더보드 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-bold text-white">
            명예의 전당 🌟
          </h2>
        </div>
        <p className="text-sm text-pink-100 mt-1">
          최고의 추천왕들을 만나보세요
        </p>
      </div>

      {/* 리더보드 */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {leaderboard.slice(0, 10).map((entry) => (
          <div
            key={entry.userId}
            className={`px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
              entry.rank === 1
                ? 'bg-yellow-50 dark:bg-neutral-800/50'
                : ''
            }`}
          >
            {/* 순위 */}
            <div className={`text-2xl font-bold ${getMedalColor(entry.rank)}`}>
              {getRankIcon(entry.rank)}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                {entry.username}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                💎 {entry.totalCredits.toLocaleString()} · 🎯 {entry.successfulInvitations}명
              </p>
            </div>

            {/* 뱃지 */}
            {entry.rank <= 3 && (
              <Medal className={`w-5 h-5 ${getMedalColor(entry.rank)}`} />
            )}
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-3 text-xs text-neutral-600 dark:text-neutral-400">
        {leaderboard.length}명의 앰버서더가 활동 중입니다
      </div>
    </div>
  );
}
