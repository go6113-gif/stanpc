"use client";

import { Filter } from "lucide-react";
import { InstantMultiSearch } from "@/components/header/InstantMultiSearch";
import { useTranslations } from "@/lib/i18n";

// Filters button + search input — previously part of the sticky SiteHeader
// on landing, moved here (between the hero and the grid) at the user's
// request for a top-to-bottom "hero → filter/search → grid" reading order.
// Markup/styling is unchanged from the header, just relocated.
export function LandingFilterBar() {
  const { t } = useTranslations();

  return (
    <div className="w-full border-y border-white/10 bg-[#0F0F12]">
      <div className="flex w-full items-center justify-center gap-3 px-4 py-3 md:px-8">
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#FF2A55] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity md:text-sm"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">{t("filter.bar.openDrawer")}</span>
        </button>

        <div className="hidden sm:block">
          <InstantMultiSearch />
        </div>
      </div>

      {/* Mobile search - below the filters row */}
      <div className="border-t border-white/5 px-4 py-2 sm:hidden">
        <InstantMultiSearch />
      </div>
    </div>
  );
}
