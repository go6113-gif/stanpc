"use client";

import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import { motion } from "framer-motion";

interface CollectionGridProps {
  albums: Array<{
    albumId: string;
    albumName: string;
    groupName: string;
    total: number;
    have: number;
    want: number;
    cards: Array<{
      id: string;
      cardId: string;
      slug: string;
      imageUrl: string | null;
      thumbImagePath: string | null;
      cardName: string | null;
      member: {
        nameEn: string;
      } | null;
      album: string;
      status: string;
      isMissing: boolean;
    }>;
  }>;
}

export function CollectionGrid({ albums }: CollectionGridProps) {
  const { t } = useTranslations("myVault");

  if (!albums || albums.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("emptyState")}
        </p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {albums.map((album) => {
        const completion = album.total > 0
          ? Math.round((album.have / album.total) * 100)
          : 0;
        const isCompleted = album.have === album.total;
        const remaining = album.total - album.have;

        return (
          <motion.div key={album.albumId} variants={item} className="space-y-3">
            {/* Album Header with Progress */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {album.groupName} — {album.albumName}
                </h2>
                <div className="mt-1 flex items-center gap-4">
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t("collection.progress", {
                      albumName: album.albumName,
                      current: album.have,
                      total: album.total,
                    })}
                  </div>
                  {!isCompleted && (
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {t("collection.remaining", {
                        remaining: remaining,
                      })}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {t("collection.allCollected")}
                    </span>
                  )}
                </div>
              </div>

              {/* Completion Bar */}
              <div className="w-full sm:w-48">
                <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {completion}%
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {album.cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/card/${card.slug}`}
                  className="group"
                >
                  <div
                    className={`aspect-[5/7] w-full overflow-hidden rounded-lg transition-all ${
                      card.isMissing
                        ? "bg-neutral-300 dark:bg-neutral-700"
                        : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  >
                    {card.imageUrl || card.thumbImagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.imageUrl || card.thumbImagePath || ""}
                        alt={
                          card.cardName ||
                          `${card.member?.nameEn || "Unknown"} PC`
                        }
                        className={`h-full w-full object-cover transition-all ${
                          card.isMissing
                            ? "grayscale opacity-50 group-hover:opacity-70"
                            : "group-hover:opacity-90"
                        }`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-500">
                        {card.isMissing ? "?" : "No Image"}
                      </div>
                    )}

                    {/* Missing Card Overlay */}
                    {card.isMissing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="text-3xl">❓</div>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  {!card.isMissing && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold line-clamp-1 group-hover:underline text-neutral-900 dark:text-white">
                        {card.cardName ||
                          `${card.member?.nameEn || "Unknown"} PC`}
                      </p>
                      {card.member && (
                        <p className="text-neutral-500 dark:text-neutral-400">
                          {card.member.nameEn}
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
