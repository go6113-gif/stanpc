"use client";

import { useEffect, useState } from "react";
import { X, BookmarkCheck, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";
import { buildPhotocardGuide, type PhotocardGuideSource } from "@/lib/photocard-guide";
import { buildPhotocardPrice } from "@/lib/photocard-price";
import { buildPhotocardSearchQuery } from "@/lib/search-query";
import { Tab1_Guide } from "@/components/modal/Tab1_Guide";
import { Tab2_Price } from "@/components/modal/Tab2_Price";
import { AuthenticityCheckGuide } from "@/components/modal/AuthenticityCheckGuide";
import { TradeActionSection } from "@/components/modal/TradeActionSection";
import { CardTiltWrapper } from "@/components/card/CardTiltWrapper";
import { SleeveDecoOverlay, SLEEVE_PRESETS, type SleevePreset } from "@/components/card/SleeveDecoOverlay";
import { useBinderStore } from "@/store/useBinderStore";

type TabId = "guide" | "price" | "verify" | "trade";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "guide", label: "스펙", icon: "📖" },
  { id: "price", label: "시세", icon: "📊" },
  { id: "verify", label: "정품 인증", icon: "🔍" },
  { id: "trade", label: "거래 제안", icon: "🔄" },
];

interface PhotocardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PhotocardGuideSource | any;
}

/**
 * PC: large center modal (max-w-4xl). Mobile: full-screen bottom sheet.
 * Only the Guide tab has real content today — Price/Versions/Collectors are
 * scaffolded as placeholders and get built out in later passes, matching
 * the rest of PhotocardDetailModal (image tilt/flip FX, WANT/HAVE toggle,
 * share button, and the /card/[id] parallel-route URL wiring).
 */
export function PhotocardDetailModal({ isOpen, onClose, card }: PhotocardDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("guide");
  const [hydrated, setHydrated] = useState(false);
  const [sleevePreset, setSleevePreset] = useState<SleevePreset>("none");
  const isCardOwned = useBinderStore((state) => state.isCardOwned);
  const isCardWished = useBinderStore((state) => state.isCardWished);
  const toggleOwnedCard = useBinderStore((state) => state.toggleOwnedCard);
  const toggleWishCard = useBinderStore((state) => state.toggleWishCard);

  const guide = buildPhotocardGuide(card);
  const price = buildPhotocardPrice(card);
  const searchQuery = buildPhotocardSearchQuery(card);
  const image = card.imageUrl ?? card.thumbImagePath;
  const memberName = card.member ? (card.member.nameKr ?? card.member.nameEn) : null;
  const groupName = card.group?.nameKr ?? card.group?.nameEn ?? "Unknown";

  const cardId = card.slug ?? card.id ?? `${card.groupName}-${card.cardName}`;
  const cardInfo = {
    cardId,
    cardName: card.cardName ?? `${groupName} 포토카드`,
    groupName,
    memberName: memberName ?? undefined,
    imageUrl: image,
  };

  const isOwned = isCardOwned(cardId);
  const isWished = isCardWished(cardId);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-neutral-950 sm:max-h-[85vh] sm:w-full sm:max-w-4xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="min-w-0">
                <p className="text-stroke-strong truncate text-sm font-bold text-neutral-900 dark:text-white">
                  {cardInfo.cardName}
                </p>
                <p className="text-stroke-strong truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {[cardInfo.groupName, cardInfo.memberName].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Binder Action Buttons */}
              {hydrated && (
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => toggleOwnedCard(cardInfo)}
                    aria-label="내 소장에 추가"
                    className={`rounded-full p-1.5 transition-all ${
                      isOwned
                        ? "bg-nomad-red/20 text-nomad-red"
                        : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                    title={isOwned ? "내 소장에서 제거" : "내 소장에 추가"}
                  >
                    <BookmarkCheck size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishCard(cardInfo)}
                    aria-label="위시리스트에 추가"
                    className={`rounded-full p-1.5 transition-all ${
                      isWished
                        ? "bg-red-500/20 text-red-500"
                        : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                    title={isWished ? "위시리스트에서 제거" : "위시리스트에 추가"}
                  >
                    <Heart size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("cardDetail.close")}
                    className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
              <div className="shrink-0 border-b border-neutral-100 p-4 dark:border-neutral-800 sm:w-2/5 sm:overflow-y-auto sm:border-b-0 sm:border-r">
                <CardTiltWrapper intensity={10} scale={1.05} className="aspect-[2.5/3.5] w-full relative">
                  <div className="aspect-[2.5/3.5] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 relative">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={card.cardName ?? groupName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                        No Image
                      </div>
                    )}

                    {/* 슬리브 데코 오버레이 */}
                    <SleeveDecoOverlay preset={sleevePreset} />
                  </div>
                </CardTiltWrapper>

                {/* 슬리브 프리셋 선택 칩 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {SLEEVE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSleevePreset(preset.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
                        sleevePreset === preset.id
                          ? "bg-nomad-red text-white shadow-md ring-2 ring-nomad-red/30"
                          : "border border-neutral-200 text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-nomad-red dark:hover:text-nomad-red"
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col sm:overflow-hidden">
                <div className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-neutral-100 px-4 pt-2 dark:border-neutral-800">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-pressed={activeTab === tab.id}
                      className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        activeTab === tab.id
                          ? "text-nomad-red"
                          : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                      </span>
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-nomad-red to-transparent rounded-t" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-4 sm:overflow-y-auto">
                  {activeTab === "guide" ? (
                    <Tab1_Guide guide={guide} estimatedPrice={card.estimatedPrice} cardName={cardInfo.cardName} />
                  ) : activeTab === "price" ? (
                    <Tab2_Price price={price} cardId={card.id} cardSlug={card.slug} searchQuery={searchQuery} />
                  ) : activeTab === "verify" ? (
                    <AuthenticityCheckGuide />
                  ) : activeTab === "trade" ? (
                    <TradeActionSection
                      cardName={cardInfo.cardName}
                      cardId={cardInfo.cardId}
                      initialOwned={isOwned}
                      initialWished={isWished}
                      onOwnedToggle={(owned) => {
                        if (owned) toggleOwnedCard(cardInfo);
                      }}
                      onWishToggle={(wished) => {
                        if (wished) toggleWishCard(cardInfo);
                      }}
                    />
                  ) : (
                    <p className="py-8 text-center text-sm text-neutral-400">
                      {t("cardDetail.comingSoon")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PhotocardDetailModal;
