"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Diamond, MoreVertical } from "lucide-react";
import { VaultCardItem } from "@/lib/api-types";
import { useBinderStore } from "@/store/useBinderStore";
import { MetaChips } from "@/components/binder/MetaChips";

interface BinderGridProps {
  cards: VaultCardItem[];
  minCardWidth?: number;
  gap?: number;
}

interface CardFlipState {
  [cardId: string]: boolean;
}

/**
 * 고밀도 바인더 그리드 컴포넌트
 * - 카드 앞/뒷면 플립 애니메이션
 * - 퀵토글: 하트(위시)/마름모(교환) 1초 내에 전환 가능
 * - MetaChips로 메타데이터 표시
 * - Optimistic UI 준비 (낙관적 업데이트)
 */
export function BinderGrid({ cards, minCardWidth = 180, gap = 16 }: BinderGridProps) {
  // Zustand 스토어
  const toggleOwnedCard = useBinderStore((state) => state.toggleOwnedCard);
  const toggleWishCard = useBinderStore((state) => state.toggleWishCard);
  const toggleWttCard = useBinderStore((state) => state.toggleWttCard);
  const isCardOwned = useBinderStore((state) => state.isCardOwned);
  const isCardWished = useBinderStore((state) => state.isCardWished);
  const isCardWtt = useBinderStore((state) => state.isCardWtt);

  // 플립 상태
  const [flipped, setFlipped] = useState<CardFlipState>({});
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [recentAction, setRecentAction] = useState<{ cardId: string; action: string } | null>(null);

  // 계산된 열 수
  const columns = useMemo(() => {
    if (typeof window === "undefined") return 4;
    const available = window.innerWidth - 32; // 좌우 패딩
    return Math.max(1, Math.floor(available / (minCardWidth + gap)));
  }, [minCardWidth, gap]);

  // 플립 토글
  const handleFlip = useCallback((cardId: string) => {
    setFlipped((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);

  // 퀵토글: Optimistic UI
  const handleQuickToggle = useCallback(
    (e: React.MouseEvent, cardId: string, toggleType: "wish" | "wtt") => {
      e.stopPropagation();

      const card = cards.find((c) => c.cardId === cardId);
      if (!card) return;

      // Optimistic update: 로컬 상태 먼저 변경
      if (toggleType === "wish") {
        const isCurrentlyWished = isCardWished(cardId);
        // 향후 API 호출 시 실패하면 롤백할 수 있도록 상태 저장
        setRecentAction({ cardId, action: isCurrentlyWished ? "removed_wish" : "added_wish" });
        toggleWishCard({
          cardId: card.cardId,
          cardName: card.cardName || "Unknown",
          groupName: card.groupName,
          memberName: (card.memberName || undefined) as string | undefined,
          imageUrl: card.imageUrl || undefined,
        });
      } else if (toggleType === "wtt") {
        const isCurrentlyWtt = isCardWtt(cardId);
        setRecentAction({ cardId, action: isCurrentlyWtt ? "removed_wtt" : "added_wtt" });
        toggleWttCard({
          cardId: card.cardId,
          cardName: card.cardName || "Unknown",
          groupName: card.groupName,
          memberName: (card.memberName || undefined) as string | undefined,
          imageUrl: card.imageUrl || undefined,
        });
      }

      // 피드백 표시 (1초 후 제거)
      setTimeout(() => setRecentAction(null), 1000);
    },
    [cards, isCardWished, isCardWtt, toggleWishCard, toggleWttCard]
  );

  return (
    <div>
      <div
        className="grid gap-4 w-full"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
          gap: `${gap}px`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card) => {
            const isFlipped = flipped[card.cardId];
            const isWished = isCardWished(card.cardId);
            const isWtt = isCardWtt(card.cardId);
            const isOwned = isCardOwned(card.cardId);

            return (
              <motion.div
                key={card.cardId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                {/* 카드 컨테이너 */}
                <Link
                  href={`/card/${card.cardSlug}`}
                  onClick={(e) => {
                    // 플립 상태이거나 메뉴 열려있으면 상세 페이지 방지
                    if (isFlipped || selectedMenu === card.cardId) {
                      e.preventDefault();
                    }
                  }}
                  className="block"
                >
                  {/* 3D Flip 애니메이션 */}
                  <motion.div
                    className="relative w-full aspect-[56/87] perspective cursor-pointer"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                    onClick={(e) => {
                      if (selectedMenu !== card.cardId) {
                        e.preventDefault();
                        handleFlip(card.cardId);
                      }
                    }}
                  >
                    {/* 앞면 (카드 이미지) */}
                    <motion.div
                      className="absolute inset-0 rounded-lg overflow-hidden border border-white/20 group-hover:border-white/40 transition-colors backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="relative w-full h-full bg-neutral-800">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={card.cardName || "카드"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800">
                            <div className="text-center">
                              <div className="text-3xl mb-2">📷</div>
                              <p className="text-xs text-neutral-500">No Image</p>
                            </div>
                          </div>
                        )}

                        {/* 상단 뱃지 레이어 */}
                        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                          <MetaChips tags={card.tags} compact />
                          {isWished && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-pink-500/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-white"
                            >
                              ♡ Wish
                            </motion.div>
                          )}
                        </div>

                        {/* 하단 그라데이션 + 정보 */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                          <p className="text-white text-xs font-semibold line-clamp-1">
                            {card.memberName}
                          </p>
                          <p className="text-white/60 text-xs line-clamp-1">
                            {card.groupName}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* 뒷면 (스펙) */}
                    <motion.div
                      className="absolute inset-0 rounded-lg overflow-hidden border border-white/20 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 backface-hidden flex flex-col"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="space-y-2 flex-grow text-sm">
                        <div>
                          <p className="text-white/60 text-xs">멤버</p>
                          <p className="text-white font-semibold line-clamp-1">
                            {card.memberName}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">그룹</p>
                          <p className="text-white font-semibold line-clamp-1">
                            {card.groupName}
                          </p>
                        </div>
                        {card.albumTitle && (
                          <div>
                            <p className="text-white/60 text-xs">앨범</p>
                            <p className="text-white line-clamp-1">{card.albumTitle}</p>
                          </div>
                        )}
                        {card.estimatedPrice && (
                          <div>
                            <p className="text-white/60 text-xs">시세</p>
                            <p className="text-green-400 font-bold">
                              ${card.estimatedPrice.toFixed(0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 뒷면 하단 상태 텍스트 */}
                      <div className="text-xs text-white/50 text-center pt-2 border-t border-white/10">
                        클릭해 돌리기
                      </div>
                    </motion.div>
                  </motion.div>
                </Link>

                {/* 퀵토글 버튼 레이어 (오버레이) */}
                <div className="absolute -bottom-14 left-0 right-0 flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  {/* 위시 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleQuickToggle(e, card.cardId, "wish")}
                    className={`
                      p-2 rounded-full transition-all
                      ${
                        isWished
                          ? "bg-pink-500/80 text-white"
                          : "bg-white/20 text-white/60 hover:bg-white/30"
                      }
                    `}
                    title="위시리스트 추가/제거"
                  >
                    <Heart size={18} fill={isWished ? "currentColor" : "none"} />
                  </motion.button>

                  {/* 교환 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleQuickToggle(e, card.cardId, "wtt")}
                    className={`
                      p-2 rounded-full transition-all
                      ${
                        isWtt
                          ? "bg-purple-500/80 text-white"
                          : "bg-white/20 text-white/60 hover:bg-white/30"
                      }
                    `}
                    title="교환 가능 표시"
                  >
                    <Diamond size={18} fill={isWtt ? "currentColor" : "none"} />
                  </motion.button>

                  {/* 메뉴 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMenu(
                        selectedMenu === card.cardId ? null : card.cardId
                      );
                    }}
                    className="p-2 rounded-full bg-white/20 text-white/60 hover:bg-white/30 transition-all"
                    title="추가 옵션"
                  >
                    <MoreVertical size={18} />
                  </motion.button>
                </div>

                {/* 메뉴 드롭다운 */}
                <AnimatePresence>
                  {selectedMenu === card.cardId && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-12 right-0 z-50 w-40 bg-neutral-900 border border-white/20 rounded-lg shadow-lg overflow-hidden"
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // 추후 구현: 상세 페이지 열기
                          setSelectedMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left"
                      >
                        상세 보기
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // 추후 구현: 공유
                          setSelectedMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left border-t border-white/10"
                      >
                        공유하기
                      </button>
                      {isOwned && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // 추후 구현: 제거
                            setSelectedMenu(null);
                          }}
                          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-white/10"
                        >
                          제거하기
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 스페이서 (호버 오버레이 공간) */}
                <div className="h-14" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-white/60 mb-2">선택한 조건에 맞는 카드가 없습니다</p>
          <p className="text-white/40 text-sm">필터를 초기화하거나 카드를 추가해보세요</p>
        </div>
      )}
    </div>
  );
}
