"use client";

import { X } from "lucide-react";

interface FilterChipsProps {
  groupFilter: string | null;
  cardTypeFilters: Set<string>;
  groups: Array<{ slug: string; name: string }>;
  onRemoveGroup: () => void;
  onRemoveCardType: (typeId: string) => void;
}

const CARD_TYPE_LABELS: Record<string, string> = {
  "type-standard": "스탠다드",
  "type-pob": "POB",
  "type-hologram": "홀로그램",
  "type-rare": "레어",
};

export function FilterChips({
  groupFilter,
  cardTypeFilters,
  groups,
  onRemoveGroup,
  onRemoveCardType,
}: FilterChipsProps) {
  if (!groupFilter && cardTypeFilters.size === 0) {
    return null;
  }

  const selectedGroup = groups.find((g) => g.slug === groupFilter);

  return (
    <div className="w-full border-b border-white/10 bg-[#0F0F12] px-4 py-3 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        {/* Group Filter Chip */}
        {groupFilter && selectedGroup && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF2A55]/20 border border-[#FF2A55]/30 px-3 py-1.5 text-sm text-white">
            <span>{selectedGroup.name}</span>
            <button
              type="button"
              onClick={onRemoveGroup}
              className="ml-1 text-white/70 hover:text-white transition-colors"
              aria-label={`${selectedGroup.name} 필터 제거`}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Card Type Filter Chips */}
        {Array.from(cardTypeFilters).map((typeId) => (
          <div
            key={typeId}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF2A55]/20 border border-[#FF2A55]/30 px-3 py-1.5 text-sm text-white"
          >
            <span>{CARD_TYPE_LABELS[typeId] || typeId}</span>
            <button
              type="button"
              onClick={() => onRemoveCardType(typeId)}
              className="ml-1 text-white/70 hover:text-white transition-colors"
              aria-label={`${CARD_TYPE_LABELS[typeId]} 필터 제거`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
