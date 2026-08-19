"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { formatMultiCurrency } from "@/lib/format";
import { buildPhotocardGuide } from "@/lib/photocard-guide";

export interface PhotoCardData {
  slug: string;
  cardName: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;
  version?: string | null;
  groupSlug?: string;
  groupName: string;
  memberSlug?: string | null;
  memberName: string | null;
  albumTitle: string | null;
  estimatedPrice: number | null;
  ownedCount: number;
  wishedCount: number;
  viewCount: number;
  badge: string | null;
  /** Position in a ranked list (e.g. the landing page's TOP 100 grid).
   * Absent for unranked contexts like /gallery. */
  rank?: number;
  group?: { slug: string; nameEn: string; nameKr: string | null };
  member?: { slug: string; nameEn: string; nameKr: string | null } | null;
  album?: { title: string } | null;
}

interface PhotoCardCardProps {
  card: PhotoCardData;
  onHaveToggle?: (slug: string, isHave: boolean) => void;
  onWantToggle?: (slug: string, isWant: boolean) => void;
  isHave?: boolean;
  isWant?: boolean;
  onCardSelect?: (card: PhotoCardData) => void;
}

export function PhotoCardCard({
  card,
  onHaveToggle,
  onWantToggle,
  isHave = false,
  isWant = false,
  onCardSelect,
}: PhotoCardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // 싱글 클릭: 카드 뒤집기 토글
  const handleSingleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  // 더블 클릭: 상세 모달 오픈
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCardSelect?.(card);
  };

  // 싱글 클릭과 더블 클릭 구분 (debounce 방식)
  const handleCardClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    if (timeSinceLastClick < 300) {
      // 더블 클릭으로 감지
      handleDoubleClick(e);
      setLastClickTime(0); // 리셋
    } else {
      // 싱글 클릭
      setLastClickTime(now);
      handleSingleClick(e);
    }
  };

  const displayMemberName = card.memberName || "Unknown";
  const displayGroupName = card.groupName || "Unknown";

  return (
    <motion.div
      className="relative aspect-[2.5/3.5] w-full cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleCardClick}
    >
        <motion.div
          className="relative h-full w-full cursor-pointer preserve-3d"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
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
              <img
                src={
                  card.thumbImagePath
                    ? `/api/image?path=${encodeURIComponent(card.thumbImagePath)}`
                    : card.imageUrl
                    ? `/api/image?path=${encodeURIComponent(card.imageUrl)}`
                    : ""
                }
                alt={card.cardName || ""}
                className="photocard-image absolute inset-0 object-cover"
                loading="lazy"
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

              {/* Wish badge - Right (formerly Want) */}
              <div className="ml-auto flex flex-col items-center">
                <span className="text-base font-bold text-white">
                  ♡
                </span>
                <span className="text-xs font-semibold text-white/80 mt-0.5">
                  Wish
                </span>
                <span className="text-sm font-bold text-white">
                  {card.wishedCount}
                </span>
              </div>
            </div>

            {/* Middle: Member + Group names (center) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1">
              <p className="text-2xl font-bold text-white leading-tight text-stroke-strong">
                {displayMemberName}
              </p>
              <p className="text-sm font-medium text-white leading-tight text-stroke-strong">
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

              {/* Owned badge - Right (formerly Have) */}
              <div className="ml-auto flex flex-col items-center">
                <span className="text-base font-bold text-white">
                  ◆
                </span>
                <span className="text-xs font-semibold text-white/80 mt-0.5">
                  Owned
                </span>
                <span className="text-sm font-bold text-white">
                  {card.ownedCount}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Back (Spec) */}
          <motion.div
            className="absolute inset-0 rounded-lg border border-white/5 bg-gradient-to-br from-[#1A1A1E] to-[#0F0F12] p-4 flex flex-col justify-between overflow-y-auto"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              rotateY: 180,
            } as any}
          >
            {/* Spec Info */}
            <div className="space-y-3">
              {/* Group/Member */}
              <div>
                <p className="text-xs font-semibold text-white/40">그룹</p>
                <p className="text-sm font-bold text-white leading-tight">
                  {displayGroupName}
                </p>
              </div>
              {card.memberName && (
                <div>
                  <p className="text-xs font-semibold text-white/40">멤버</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {displayMemberName}
                  </p>
                </div>
              )}

              {/* Release Type & Album */}
              {card.album?.title && (
                <div>
                  <p className="text-xs font-semibold text-white/40">앨범</p>
                  <p className="text-sm font-bold text-white/80 leading-tight truncate">
                    {card.album.title}
                  </p>
                </div>
              )}

              {/* Version */}
              {card.version && (
                <div>
                  <p className="text-xs font-semibold text-white/40">버전</p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {card.version}
                  </p>
                </div>
              )}

              {/* Price */}
              {card.estimatedPrice ? (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/40">시세</p>
                  <p className="text-base font-bold text-[#FF2A55]">
                    {formatMultiCurrency(card.estimatedPrice)}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onWantToggle?.(card.slug, !isWant);
                }}
                className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  isWant
                    ? "bg-[#FF2A55] text-white"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <Heart
                  size={12}
                  className="mr-1 inline"
                  fill={isWant ? "currentColor" : "none"}
                />
                Wish
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHaveToggle?.(card.slug, !isHave);
                }}
                className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  isHave
                    ? "bg-green-600 text-white"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                ◆ Owned
              </button>
            </div>
          </motion.div>
        </motion.div>
    </motion.div>
  );
}
