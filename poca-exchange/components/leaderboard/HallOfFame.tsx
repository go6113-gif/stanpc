'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Flame, Star, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  xp: number;
  contributorTier: string;
  contributionsCount: number;
}

interface HallOfFameProps {
  initialData?: LeaderboardEntry[];
  limit?: number;
}

// Tier badge styling
const TIER_COLORS: Record<string, { bg: string; text: string; icon: string }> =
  {
    ROOKIE: { bg: 'bg-slate-100', text: 'text-slate-800', icon: '🌱' },
    MEMBER: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👤' },
    EXPERT: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔥' },
    LEGEND: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '👑' },
  };

export function HallOfFame({
  initialData,
  limit = 10,
}: HallOfFameProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    initialData || []
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return; // Use SSR data if provided

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard', {
          cache: 'force-cache',
        });
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard.slice(0, limit));
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError('순위표를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [initialData, limit]);

  if (error) {
    return (
      <div className="text-center text-neutral-500 text-sm p-4">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center text-neutral-500 text-sm p-4">
        아직 참여자가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-white">명예의 전당</h3>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-1">
        {leaderboard.map((entry, idx) => {
          const tierStyle = TIER_COLORS[entry.contributorTier] || TIER_COLORS.ROOKIE;
          const medalIcon =
            idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

          return (
            <Link
              key={entry.userId}
              href={`/profile/${entry.userId}`}
              className="block"
            >
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                {/* Rank */}
                <div className="w-6 text-center">
                  {medalIcon ? (
                    <span className="text-lg">{medalIcon}</span>
                  ) : (
                    <span className="text-sm font-bold text-white/60">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.image && (
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={entry.image}
                          alt={entry.name || 'User'}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <span className="font-medium text-white truncate">
                      {entry.name || `User #${entry.userId.slice(0, 4)}`}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    기여 {entry.contributionsCount}건
                  </p>
                </div>

                {/* Tier Badge */}
                <div
                  className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${tierStyle.bg} ${tierStyle.text}`}
                >
                  <span>{tierStyle.icon}</span>
                  <span>{entry.contributorTier}</span>
                </div>

                {/* XP */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-indigo-400">
                    {entry.xp} XP
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer CTA */}
      <Link href="/gallery/contribute" className="block mt-4">
        <button className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          📸 도감에 참여하기
        </button>
      </Link>
    </div>
  );
}

export default HallOfFame;
