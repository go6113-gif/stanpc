"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useBinderStore, type BinderCard } from "@/store/useBinderStore";

type TabId = "all" | "owned" | "wish";

interface BinderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BinderViewModal({ isOpen, onClose }: BinderViewModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const removeOwnedCard = useBinderStore((state) => state.removeOwnedCard);
  const removeWishCard = useBinderStore((state) => state.removeWishCard);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const allCards = [...ownedCards, ...wishCards];
  const displayCards =
    activeTab === "owned"
      ? ownedCards
      : activeTab === "wish"
        ? wishCards
        : allCards;

  const handleRemoveCard = (card: BinderCard) => {
    const isOwned = ownedCards.some((c) => c.cardId === card.cardId);
    const isWished = wishCards.some((c) => c.cardId === card.cardId);

    if (isOwned) removeOwnedCard(card.cardId);
    if (isWished) removeWishCard(card.cardId);
  };

  const handleExport = () => {
    router.push("/binder-export");
    onClose();
  };

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "전체", count: allCards.length },
    { id: "owned", label: "내 소장", count: ownedCards.length },
    { id: "wish", label: "위시", count: wishCards.length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="flex w-full flex-col rounded-t-3xl bg-white dark:bg-neutral-950 sm:max-h-[90vh] sm:w-full sm:max-w-4xl sm:rounded-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-4 dark:border-neutral-800 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  내 바인더
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  총 {allCards.length}장의 포토카드
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 gap-1 border-b border-neutral-100 px-4 dark:border-neutral-800 sm:px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border-b-2 border-nomad-red text-nomad-red"
                      : "border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs text-neutral-400">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {displayCards.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {displayCards.map((card) => (
                    <motion.div
                      key={card.cardId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
                    >
                      {/* Card Image */}
                      {card.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.imageUrl}
                          alt={card.cardName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
                          <p className="text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            {card.cardName}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                            {card.groupName}
                          </p>
                        </div>
                      )}

                      {/* Remove Button - Overlay on Hover */}
                      <motion.button
                        type="button"
                        onClick={() => handleRemoveCard(card)}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 text-white transition-all hover:bg-red-600"
                        title="제거"
                      >
                        <X size={16} />
                      </motion.button>

                      {/* Card Info - Bottom Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                        <p className="line-clamp-2 text-xs font-semibold">
                          {card.cardName}
                        </p>
                        <p className="text-xs text-white/70">{card.groupName}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {activeTab === "owned"
                      ? "아직 소장한 카드가 없어요"
                      : activeTab === "wish"
                        ? "아직 위시리스트가 없어요"
                        : "바인더가 비어있어요"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    포토카드에서 "담기" 버튼을 눌러 추가해보세요!
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Export Button */}
            {allCards.length > 0 && (
              <div className="shrink-0 border-t border-neutral-100 px-4 py-4 dark:border-neutral-800 sm:px-6">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-nomad-red px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Download size={18} />
                  SNS 이미지로 내보내기
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
