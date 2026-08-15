"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";
import { buildPhotocardGuide, type PhotocardGuideSource } from "@/lib/photocard-guide";
import { buildPhotocardPrice } from "@/lib/photocard-price";
import { buildPhotocardSearchQuery } from "@/lib/search-query";
import { Tab1_Guide } from "@/components/modal/Tab1_Guide";
import { Tab2_Price } from "@/components/modal/Tab2_Price";

type TabId = "guide" | "price" | "versions" | "collectors";

const TABS: { id: TabId; labelKey: `cardDetail.tabs.${TabId}`; icon: string }[] = [
  { id: "guide", labelKey: "cardDetail.tabs.guide", icon: "📖" },
  { id: "price", labelKey: "cardDetail.tabs.price", icon: "📊" },
  { id: "versions", labelKey: "cardDetail.tabs.versions", icon: "⚡" },
  { id: "collectors", labelKey: "cardDetail.tabs.collectors", icon: "⭐" },
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
  const guide = buildPhotocardGuide(card);
  const price = buildPhotocardPrice(card);
  const searchQuery = buildPhotocardSearchQuery(card);
  const image = card.imageUrl ?? card.thumbImagePath;
  const memberName = card.member ? (card.member.nameKr ?? card.member.nameEn) : null;
  const groupName = card.group?.nameKr ?? card.group?.nameEn ?? "Unknown";

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
                  {card.cardName ?? `${groupName} 포토카드`}
                </p>
                <p className="text-stroke-strong truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {[groupName, memberName].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cardDetail.close")}
                className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
              <div className="shrink-0 border-b border-neutral-100 p-4 dark:border-neutral-800 sm:w-2/5 sm:overflow-y-auto sm:border-b-0 sm:border-r">
                <div className="aspect-[2.5/3.5] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
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
                        {t(tab.labelKey)}
                      </span>
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-nomad-red to-transparent rounded-t" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-4 sm:overflow-y-auto">
                  {activeTab === "guide" ? (
                    <Tab1_Guide guide={guide} estimatedPrice={card.estimatedPrice} />
                  ) : activeTab === "price" ? (
                    <Tab2_Price price={price} cardId={card.id} cardSlug={card.slug} searchQuery={searchQuery} />
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
