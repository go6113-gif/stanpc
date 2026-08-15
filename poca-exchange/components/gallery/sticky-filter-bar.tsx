"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { FilterState, QuickFilterId } from "@/lib/filter-query";
import { serializeFilterState, QUICK_FILTERS } from "@/lib/filter-query";
import { FilterDrawer } from "./filter-drawer";
import { RealtimeSearchBar } from "./realtime-search-bar";
import type { GalleryFacets } from "@/lib/queries";

const QUICK_FILTER_LABELS: Record<QuickFilterId, string> = {
  all: "전체",
  popular: "🔥 인기 TOP",
  wishlist: "❤️ 내 위시",
  owned: "📦 내 소장",
  trade: "🔄 교환가능",
};

interface StickyFilterBarProps {
  filterState: FilterState;
  loggedIn: boolean;
  facets: GalleryFacets;
}

export function StickyFilterBar({ filterState, loggedIn, facets }: StickyFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleQuickFilter = (quick: QuickFilterId) => {
    const newState = { ...filterState, quick };
    const qs = serializeFilterState(newState);
    router.push(`/gallery${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push("/gallery", { scroll: false });
  };

  const hasActiveFilters =
    filterState.groups.length > 0 ||
    filterState.members.length > 0 ||
    filterState.albums.length > 0 ||
    filterState.versions.length > 0 ||
    filterState.priceMin != null ||
    filterState.priceMax != null;

  return (
    <>
      <motion.div
        className="sticky top-[57px] z-40 border-b border-white/5 bg-[#0F0F12]/95 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full px-4 py-4 md:px-8 space-y-3">
          {/* Realtime Search Bar */}
          <RealtimeSearchBar />

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_FILTERS.map((id) => {
              const isDisabled =
                (id === "wishlist" || id === "owned") && !loggedIn;
              const isActive = filterState.quick === id;

              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => !isDisabled && handleQuickFilter(id)}
                  disabled={isDisabled}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#FF2A55] text-white"
                      : isDisabled
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {QUICK_FILTER_LABELS[id]}
                </motion.button>
              );
            })}
          </div>

          {/* Filter & Clear Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <Filter size={16} />
              {t("filter.bar.openDrawer")}
              {hasActiveFilters && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF2A55] text-xs font-bold text-white">
                  {
                    [
                      filterState.groups.length,
                      filterState.members.length,
                      filterState.albums.length,
                      filterState.versions.length,
                      filterState.priceMin != null || filterState.priceMax != null ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)
                  }
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <motion.button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs font-bold text-white/50 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <X size={14} />
                {t("filter.active.clearAll")}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter Drawer */}
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} facets={facets} />
    </>
  );
}
