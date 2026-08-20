'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Sparkles } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  acquiredAt: string;
}

interface HallOfFameUser {
  rank: number;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  collectorIndex: number;
  badges: Badge[];
}

interface HallOfFameData {
  users: HallOfFameUser[];
  totalCount: number;
  generatedAt: string;
}

export function HallOfFameSection() {
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        const response = await fetch('/api/wiki/hall-of-fame');
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

  if (loading) {
    return (
      <div className="mb-12 rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-8 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-800">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-nomad-red" />
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            명예의 전당
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || data.users.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-8 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-800">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-nomad-red" />
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            명예의 전당
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            덕력 마스터 {data.totalCount}명
          </span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          가장 높은 덕력 포인트를 달성한 수집가들
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {data.users.map((user) => (
          <Link
            key={user.userId}
            href={`/profile/${user.userId}`}
            className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Rank Badge */}
            <div
              className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                user.rank === 1
                  ? 'bg-yellow-500'
                  : user.rank === 2
                    ? 'bg-gray-400'
                    : user.rank === 3
                      ? 'bg-orange-600'
                      : 'bg-neutral-500'
              }`}
            >
              {user.rank}
            </div>

            {/* Avatar */}
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="mb-3 h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-nomad-red to-pink-600" />
            )}

            {/* User Info */}
            <h3 className="truncate font-bold text-neutral-900 dark:text-white">
              {user.name}
            </h3>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {user.email?.split('@')[0]}
            </p>

            {/* Collector Index */}
            <div className="mt-3 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-nomad-red flex-shrink-0" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  {user.collectorIndex}
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                덕력 포인트
              </p>
            </div>

            {/* Badges */}
            {user.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {user.badges.slice(0, 3).map((badge) => (
                  <span
                    key={badge.id}
                    className="inline-block text-sm"
                    title={badge.name}
                  >
                    {badge.icon}
                  </span>
                ))}
                {user.badges.length > 3 && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    +{user.badges.length - 3}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <Link
          href="/wiki"
          className="inline-block rounded-full bg-nomad-red px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
        >
          덕후 Wiki 탐색하기
        </Link>
      </div>
    </div>
  );
}
