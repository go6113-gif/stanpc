"use client";

import { useTranslations } from "@/lib/i18n";
import Link from "next/link";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    image: string | null;
    collectorIndex: number;
    mannerScore: number;
    badges: Array<{
      badge: {
        badgeName: string;
        badgeIcon: string | null;
      };
    }>;
  };
  stats: {
    ownedCount: number;
    wishedCount: number;
  };
  isOwn: boolean;
  onShowcaseClick: () => void;
}

export function ProfileHeader({
  user,
  stats,
  isOwn,
  onShowcaseClick,
}: ProfileHeaderProps) {
  const { t } = useTranslations("myVault");

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 dark:from-neutral-900 dark:to-neutral-800">
      {/* User Identity Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="h-24 w-24 rounded-full bg-neutral-200 object-cover dark:bg-neutral-700"
          />
        )}

        <div className="flex-1">
          {/* Name + Badges */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {user.name}
            </h1>
            {user.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {user.badges.map((ub, idx) => (
                  <span
                    key={idx}
                    title={ub.badge.badgeName}
                    className="text-xl"
                  >
                    {ub.badge.badgeIcon || "🏅"}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stats.ownedCount}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {t("stats.have")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stats.wishedCount}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {t("stats.want")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {user.collectorIndex}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {t("stats.collectorIndex")}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onShowcaseClick}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-colors dark:bg-red-600 dark:hover:bg-red-700"
            >
              {t("actions.showcase")}
            </button>
            {isOwn && (
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                {t("actions.editProfile")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
