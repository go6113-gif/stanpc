"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { formatMultiCurrency } from "@/lib/format";

export interface PhotoCardData {
  slug: string;
  cardName: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;
  version?: string | null;
  groupName: string;
  memberName: string | null;
  albumTitle: string | null;
  estimatedPrice: number | null;
  haveCount: number;
  wantCount: number;
  viewCount: number;
  badge: string | null;
  /** Position in a ranked list (e.g. the landing page's TOP 100 grid).
   * Absent for unranked contexts like /gallery. */
  rank?: number;
}

interface PhotoCardCardProps {
  card: PhotoCardData;
  onHaveToggle?: (slug: string, isHave: boolean) => void;
  onWantToggle?: (slug: string, isWant: boolean) => void;
  isHave?: boolean;
  isWant?: boolean;
}

export function PhotoCardCard({
  card,
  onHaveToggle,
  onWantToggle,
  isHave = false,
  isWant = false,
}: PhotoCardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTouchDevice] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches
  );

  const handleClick = (e: React.MouseEvent) => {
    if (isTouchDevice && !isFlipped) {
      e.preventDefault();
      setIsFlipped(true);
    }
  };

  const displayMemberName = card.memberName || "Unknown";
  const displayGroupName = card.groupName || "Unknown";

  return (
    <motion.div
      className="relative h-full w-full"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link href={`/card/${card.slug}`} className="block h-full w-full" onClick={handleClick}>
        <motion.div
          className="relative h-full w-full cursor-pointer preserve-3d"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          onMouseEnter={() => !isTouchDevice && setIsFlipped(true)}
          onMouseLeave={() => !isTouchDevice && setIsFlipped(false)}
          style={{
            transformStyle: "preserve-3d",
          } as any}
        >
          {/* Front */}
          <motion.div
            className="absolute inset-0 rounded-lg border border-white/5 bg-gradient-to-b from-neutral-800 to-neutral-900 p-4 flex flex-col justify-between overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            } as any}
          >
            {card.thumbImagePath || card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.thumbImagePath || card.imageUrl || ""}
                alt={card.cardName || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Top row: Rank (left) | Want badge (right) */}
            <div className="relative z-10 flex items-start justify-between gap-2">
              {/* Rank - Left */}
              {card.rank != null && (
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold text-white leading-none">
                    {card.rank}
                  </span>
                  <div className="w-6 h-px bg-white/40 mt-1" />
                </div>
              )}

              {/* Want badge - Right */}
              <div className="ml-auto flex flex-col items-center">
                <span className="text-base font-bold text-white">
                  ♡
                </span>
                <span className="text-xs font-semibold text-white/80 mt-0.5">
                  Want
                </span>
                <span className="text-sm font-bold text-white">
                  {card.wantCount}
                </span>
              </div>
            </div>

            {/* Middle: Member + Group names (center) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1">
              <p className="text-2xl font-bold text-white leading-tight">
                {displayMemberName}
              </p>
              <p className="text-sm font-medium text-white leading-tight">
                {displayGroupName}
              </p>
            </div>

            {/* Bottom row: Rare badge (left) | Have badge (right) */}
            <div className="relative z-10 flex items-end justify-between gap-2">
              {/* Rare/Hologram badge - Left */}
              {card.badge && (
                <span className="rounded-full bg-[#FF2A55] px-2.5 py-1 text-[10px] font-bold text-white">
                  {card.badge}
                </span>
              )}

              {/* Have badge - Right */}
              <div className="ml-auto flex flex-col items-center">
                <span className="text-base font-bold text-white">
                  ◆
                </span>
                <span className="text-xs font-semibold text-white/80 mt-0.5">
                  Have
                </span>
                <span className="text-sm font-bold text-white">
                  {card.haveCount}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Back (Flipped) */}
          <motion.div
            className="absolute inset-0 rounded-lg border border-white/5 bg-gradient-to-br from-[#1A1A1E] to-[#0F0F12] p-4 flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              rotateY: 180,
            } as any}
          >
            {/* Price section */}
            {card.estimatedPrice ? (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-white/50">
                  Est. Price
                </p>
                <p className="text-base font-bold text-[#FF2A55]">
                  {formatMultiCurrency(card.estimatedPrice)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white/50">
                  Est. Price
                </p>
                <p className="text-base text-white/30">TBA</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onWantToggle?.(card.slug, !isWant);
                }}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                  isWant
                    ? "bg-[#FF2A55] text-white"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <Heart
                  size={14}
                  className="mr-1.5 inline"
                  fill={isWant ? "currentColor" : "none"}
                />
                Want
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                🔍 AI Scan
              </button>
            </div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
