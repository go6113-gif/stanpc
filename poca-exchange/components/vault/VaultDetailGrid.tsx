"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Move, Trash2, X } from "lucide-react";
import { useAssetSelectionStore } from "@/store/useAssetSelectionStore";
import { AssetCard } from "./AssetCard";
import { AssetDetailModal } from "./AssetDetailModal";
import type { AssetCard as AssetCardType } from "@/lib/types/asset";

interface VaultDetailGridProps {
  cards: AssetCardType[];
  onStatusChange?: (cardIds: string[], status: string) => void;
  onMove?: (cardIds: string[], location: string) => void;
}

export function VaultDetailGrid({
  cards,
  onStatusChange,
  onMove,
}: VaultDetailGridProps) {
  const [selectedDetailCard, setSelectedDetailCard] = useState<AssetCardType | null>(null);
  const selectedCardIds = useAssetSelectionStore((state) => state.selectedCardIds);
  const isSelectMode = useAssetSelectionStore((state) => state.isSelectMode);
  const getSelectedCount = useAssetSelectionStore((state) => state.getSelectedCount);
  const clearSelection = useAssetSelectionStore((state) => state.clearSelection);

  const selectedCards = cards.filter((card) => selectedCardIds.has(card.id));

  const handleBulkStatusChange = (newStatus: string) => {
    onStatusChange?.(Array.from(selectedCardIds), newStatus);
    clearSelection();
  };

  return (
    <>
      {/* 고밀도 그리드 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card) => (
            <AssetCard
              key={card.id}
              card={card}
              onDetailClick={() => setSelectedDetailCard(card)}
            />
          ))}
        </div>
      </div>

      {/* 플로팅 액션바 */}
      <AnimatePresence>
        {isSelectMode && getSelectedCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
          >
            <div className="rounded-xl bg-gradient-to-r from-[#1A1A1E] to-[#0F0F12] border border-white/20 backdrop-blur-xl shadow-2xl p-4">
              <div className="flex items-center justify-between">
                {/* 선택 정보 */}
                <div className="text-sm font-semibold text-white">
                  {getSelectedCount()}개 선택됨
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-2">
                  {/* 일괄 WTT 변경 */}
                  <button
                    onClick={() => handleBulkStatusChange("wtt")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-sm font-semibold transition-colors"
                  >
                    <ArrowUpRight size={16} />
                    일괄 WTT
                  </button>

                  {/* 다른 바인더로 이동 */}
                  <button
                    onClick={() => handleBulkStatusChange("owned")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 text-sm font-semibold transition-colors"
                  >
                    <Move size={16} />
                    이동
                  </button>

                  {/* 일괄 삭제 */}
                  <button
                    onClick={() => handleBulkStatusChange("wishlist")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-300 text-sm font-semibold transition-colors"
                  >
                    <Trash2 size={16} />
                    삭제
                  </button>

                  {/* 선택 취소 */}
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm font-semibold transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 선택된 카드 미리보기 */}
              {selectedCards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60 mb-2">선택된 카드:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCards.slice(0, 5).map((card) => (
                      <div
                        key={card.id}
                        className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white truncate max-w-xs"
                      >
                        {card.memberName} - {card.groupName}
                      </div>
                    ))}
                    {selectedCards.length > 5 && (
                      <div className="px-2 py-1 text-xs text-white/60">
                        +{selectedCards.length - 5}개
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상세 모달 */}
      <AssetDetailModal
        card={selectedDetailCard}
        isOpen={!!selectedDetailCard}
        onClose={() => setSelectedDetailCard(null)}
      />
    </>
  );
}
