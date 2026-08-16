'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface Leaderboard {
  rank: number;
  userId: string;
  userName: string;
  totalReferrals: number;
  totalCredits: number;
  badge?: string;
}

export function AmbassadorLeaderboard() {
  const [data, setData] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/referral/leaderboard');
        if (res.ok) {
          const result = await res.json();
          setData(result.leaderboard || []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 animate-pulse">
        <div className="h-96 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-pink-600" />
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          🏆 탑 앰버서더 랭킹
        </h3>
      </div>

      <div className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
            아직 랭킹 데이터가 없습니다
          </p>
        ) : (
          data.slice(0, 10).map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="text-lg font-bold text-pink-600 w-6 text-center">
                {entry.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900 dark:text-white truncate">
                  {entry.userName}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.totalReferrals} 명 · {entry.totalCredits.toLocaleString()}P
                </div>
              </div>
              {entry.badge && <span className="text-lg">{entry.badge}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
