"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  QUICK_FILTERS,
  QUICK_FILTERS_REQUIRING_LOGIN,
  activeFilterCount,
  parseFilterState,
  serializeFilterState,
  type QuickFilterId,
} from "@/lib/filter-query";
import { t } from "@/lib/i18n";

interface FilterBarProps {
  resultCount: number;
  loggedIn: boolean;
  onOpenDrawer: () => void;
  onRequireLogin: () => void;
}

/** Sticky top quick-sort bar: [전체] [🔥 인기 TOP] [❤️ 내 위시] [📦 내 소장] [🔄 교환가능] + drawer trigger. */
export function FilterBar({ resultCount, loggedIn, onOpenDrawer, onRequireLogin }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseFilterState(searchParams);
  const drawerFilterCount = activeFilterCount(filters);

  const setQuick = useCallback(
    (quick: QuickFilterId) => {
      if (QUICK_FILTERS_REQUIRING_LOGIN.includes(quick) && !loggedIn) {
        onRequireLogin();
        return;
      }
      const query = serializeFilterState({ ...filters, quick: filters.quick === quick ? "all" : quick });
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [filters, loggedIn, onRequireLogin, pathname, router]
  );

  return (
    <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex flex-1 items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {QUICK_FILTERS.map((id) => (
              <button
                key={id}
                onClick={() => setQuick(id)}
                aria-pressed={filters.quick === id}
                className={`filter-pill shrink-0 whitespace-nowrap ${filters.quick === id ? "active" : ""}`}
              >
                {t(`filter.quick.${id}`)}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenDrawer}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">{t("filter.bar.openDrawer")}</span>
            <span className="sm:hidden">{t("filter.bar.openDrawerShort")}</span>
            {drawerFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-nomad-red px-1 text-[10px] font-bold text-white">
                {drawerFilterCount}
              </span>
            )}
          </button>
        </div>

        <p
          className={`mt-2 text-xs text-neutral-500 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
        >
          {t("filter.bar.resultCount", { count: resultCount })}
        </p>
      </div>
    </div>
  );
}
