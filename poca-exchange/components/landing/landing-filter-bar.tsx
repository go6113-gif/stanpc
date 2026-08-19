"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { InstantMultiSearch } from "@/components/header/InstantMultiSearch";
import { FilterDrawer } from "@/components/landing/filter-drawer";
import { useTranslations } from "@/lib/i18n";

interface LandingFilterBarProps {
  groups: Array<{ slug: string; name: string }>;
  groupMembers: Map<string, Array<{ slug: string; name: string }>>;
  selectedGroup: string | null;
  onSelectGroup: (slug: string | null) => void;
  selectedCardTypes: Set<string>;
  onSelectCardTypes: (types: Set<string>) => void;
  selectedMembers: Set<string>;
  onSelectMembers: (members: Set<string>) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function LandingFilterBar({
  groups,
  groupMembers,
  selectedGroup,
  onSelectGroup,
  selectedCardTypes,
  onSelectCardTypes,
  selectedMembers,
  onSelectMembers,
  onResetFilters,
  hasActiveFilters,
}: LandingFilterBarProps) {
  const { t } = useTranslations();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filterCount = (selectedGroup ? 1 : 0) + selectedCardTypes.size;

  return (
    <>
      <div className="w-full border-y border-white/10 bg-[#0F0F12]">
        <div className="flex w-full items-center justify-center gap-3 px-4 py-3 md:px-8">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#FF2A55] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity md:text-sm"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">{t("filter.bar.openDrawer")}</span>
            {filterCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#FF2A55]">
                {filterCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <InstantMultiSearch onSelectCardType={(tag) => onSelectCardTypes(new Set([tag]))} />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-white/50 hover:text-white transition-colors"
            >
              <X size={14} />
              {t("filter.active.clearAll")}
            </button>
          )}
        </div>

        {/* Mobile search - below the filters row */}
        <div className="border-t border-white/5 px-4 py-2 sm:hidden">
          <InstantMultiSearch onSelectCardType={(tag) => onSelectCardTypes(new Set([tag]))} />
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        groups={groups}
        groupMembers={groupMembers}
        selectedGroup={selectedGroup}
        onSelectGroup={onSelectGroup}
        selectedCardTypes={selectedCardTypes}
        onSelectCardTypes={onSelectCardTypes}
        selectedMembers={selectedMembers}
        onSelectMembers={onSelectMembers}
        onResetFilters={onResetFilters}
      />
    </>
  );
}
