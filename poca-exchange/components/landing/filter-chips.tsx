"use client";

import { X } from "lucide-react";
import { CARD_TAG_LABELS } from "@/lib/photocard-tags";

interface FilterChipsProps {
  groupFilter: string | null;
  cardTypeFilters: Set<string>;
  memberFilters?: Set<string>;
  groups: Array<{ slug: string; name: string }>;
  onRemoveGroup: () => void;
  onRemoveCardType: (typeId: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

const MOCK_MEMBERS: Record<string, string> = {
  "member-1": "카리나",
  "member-2": "지젤",
  "member-3": "닝닝",
  "member-4": "윈터",
};

export function FilterChips({
  groupFilter,
  cardTypeFilters,
  memberFilters = new Set(),
  groups,
  onRemoveGroup,
  onRemoveCardType,
  onRemoveMember,
}: FilterChipsProps) {
  if (!groupFilter && cardTypeFilters.size === 0 && memberFilters.size === 0) {
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
            <span>{CARD_TAG_LABELS[typeId as keyof typeof CARD_TAG_LABELS] || typeId}</span>
            <button
              type="button"
              onClick={() => onRemoveCardType(typeId)}
              className="ml-1 text-white/70 hover:text-white transition-colors"
              aria-label={`${CARD_TAG_LABELS[typeId as keyof typeof CARD_TAG_LABELS]} 필터 제거`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Member Filter Chips */}
        {Array.from(memberFilters).map((memberId) => (
          <div
            key={memberId}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF2A55]/20 border border-[#FF2A55]/30 px-3 py-1.5 text-sm text-white"
          >
            <span>{MOCK_MEMBERS[memberId] || memberId}</span>
            <button
              type="button"
              onClick={() => onRemoveMember?.(memberId)}
              className="ml-1 text-white/70 hover:text-white transition-colors"
              aria-label={`${MOCK_MEMBERS[memberId]} 필터 제거`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
