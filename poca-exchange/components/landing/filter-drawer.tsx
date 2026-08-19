"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { CARD_TAG_LIST, CARD_TAG_LABELS } from "@/lib/photocard-tags";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Array<{ slug: string; name: string }>;
  groupMembers: Map<string, Array<{ slug: string; name: string }>>;
  selectedGroup: string | null;
  onSelectGroup: (slug: string | null) => void;
  selectedCardTypes: Set<string>;
  onSelectCardTypes: (types: Set<string>) => void;
  selectedMembers: Set<string>;
  onSelectMembers: (members: Set<string>) => void;
  onResetFilters: () => void;
}

const CARD_TYPES = CARD_TAG_LIST.map((id) => ({ id, name: CARD_TAG_LABELS[id] }));

// Reusable toggle chip component
function ToggleChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        isSelected
          ? "bg-[#FF2A55] text-white"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    />
  );
}

export function FilterDrawer({
  isOpen,
  onClose,
  groups,
  groupMembers,
  selectedGroup,
  onSelectGroup,
  selectedCardTypes,
  onSelectCardTypes,
  selectedMembers,
  onSelectMembers,
  onResetFilters,
}: FilterDrawerProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const [localCardTypes, setLocalCardTypes] = useState<Set<string>>(new Set(selectedCardTypes));

  // Get members for currently selected group
  const visibleMembers = selectedGroup ? (groupMembers.get(selectedGroup) || []) : [];

  // When group is deselected, automatically clear member selections
  useEffect(() => {
    if (!selectedGroup && selectedMembers.size > 0) {
      onSelectMembers(new Set());
    }
  }, [selectedGroup, selectedMembers, onSelectMembers]);

  // Sync local state with selected card types when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalCardTypes(new Set(selectedCardTypes));
    }
  }, [isOpen, selectedCardTypes]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCardTypeToggle = (typeId: string) => {
    const updated = new Set(localCardTypes);
    if (updated.has(typeId)) {
      updated.delete(typeId);
    } else {
      updated.add(typeId);
    }
    setLocalCardTypes(updated);
  };

  const handleApply = () => {
    onSelectCardTypes(localCardTypes);

    // Build URL for pSEO routing if any core filter is selected
    // Core filters: group, member, type (all required for /explore/[group]/[member]/[type])
    if (selectedGroup) {
      const memberSlug = selectedMembers.size > 0 ? Array.from(selectedMembers)[0] : "all";
      const typeSlug = localCardTypes.size > 0 ? Array.from(localCardTypes)[0] : "all";

      const url = `/explore/${selectedGroup}/${memberSlug}/${typeSlug}`;
      router.push(url);
    }

    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setLocalCardTypes(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer — use 100dvh for dynamic viewport height + safe-area padding for mobile */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] max-h-[100dvh] w-full bg-[#1A1A1E] border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col sm:bottom-auto sm:right-0 sm:top-0 sm:left-auto sm:max-h-none sm:max-w-sm sm:rounded-t-none sm:border-t-0 sm:border-l"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1A1A1E]/95 backdrop-blur-sm px-4 py-4">
              <h2 className="text-lg font-bold text-white">
                {t("filter.drawer.title") || "필터"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white hover:bg-white/10 transition-colors"
                aria-label={t("filter.drawer.close") || "닫기"}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {/* Groups Filter Section */}
                <div>
                  <h3 className="mb-3 text-xs font-bold text-white/50 uppercase tracking-widest">
                    {t("filter.drawer.groups") || "그룹"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip
                      label="전체"
                      isSelected={selectedGroup === null}
                      onClick={() => onSelectGroup(null)}
                    />
                    {groups.map((group) => (
                      <ToggleChip
                        key={group.slug}
                        label={group.name}
                        isSelected={selectedGroup === group.slug}
                        onClick={() => onSelectGroup(group.slug)}
                      />
                    ))}
                  </div>
                </div>

                {/* Members Filter Section — only show when a group is selected */}
                {selectedGroup && visibleMembers.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-bold text-white/50 uppercase tracking-widest">
                      {t("filter.drawer.members") || "멤버"}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {visibleMembers.map((member) => (
                        <ToggleChip
                          key={member.slug}
                          label={member.name}
                          isSelected={selectedMembers.has(member.slug)}
                          onClick={() => {
                            const updated = new Set(selectedMembers);
                            if (updated.has(member.slug)) {
                              updated.delete(member.slug);
                            } else {
                              updated.add(member.slug);
                            }
                            onSelectMembers(updated);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Type Filter Section */}
                <div>
                  <h3 className="mb-3 text-xs font-bold text-white/50 uppercase tracking-widest">
                    {t("filter.drawer.cardTypes") || "카드 종류"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CARD_TYPES.map((type) => (
                      <ToggleChip
                        key={type.id}
                        label={type.name}
                        isSelected={localCardTypes.has(type.id)}
                        onClick={() => handleCardTypeToggle(type.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Safe Area Inset */}
            <div
              className="border-t border-white/10 bg-[#1A1A1E]/95 backdrop-blur-sm px-4 py-4 space-y-2"
              style={{
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors active:bg-white/15"
              >
                {t("filter.drawer.reset") || "초기화"}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-lg bg-[#FF2A55] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:opacity-75 transition-opacity"
              >
                {t("filter.drawer.apply") || "필터 적용"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
