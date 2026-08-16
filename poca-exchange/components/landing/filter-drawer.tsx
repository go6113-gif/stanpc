"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { CARD_TAG_LIST, CARD_TAG_LABELS } from "@/lib/photocard-tags";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Array<{ slug: string; name: string }>;
  selectedGroup: string | null;
  onSelectGroup: (slug: string | null) => void;
  selectedCardTypes: Set<string>;
  onSelectCardTypes: (types: Set<string>) => void;
  selectedMembers: Set<string>;
  onSelectMembers: (members: Set<string>) => void;
  onResetFilters: () => void;
}

// Mock filter data
const MOCK_MEMBERS = [
  { id: "member-1", name: "카리나" },
  { id: "member-2", name: "지젤" },
  { id: "member-3", name: "닝닝" },
  { id: "member-4", name: "윈터" },
];

const CARD_TYPES = CARD_TAG_LIST.map((id) => ({ id, name: CARD_TAG_LABELS[id] }));

export function FilterDrawer({
  isOpen,
  onClose,
  groups,
  selectedGroup,
  onSelectGroup,
  selectedCardTypes,
  onSelectCardTypes,
  selectedMembers,
  onSelectMembers,
  onResetFilters,
}: FilterDrawerProps) {
  const { t } = useTranslations();
  const [localCardTypes, setLocalCardTypes] = useState<Set<string>>(new Set(selectedCardTypes));

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

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-[1000] h-full w-full max-w-sm overflow-y-auto bg-[#1A1A1E] border-l border-white/10"
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
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 px-4 py-6">
              {/* Groups Filter Section */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-white uppercase tracking-wide text-white/70">
                  {t("filter.drawer.groups") || "그룹"}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg p-2.5 hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedGroup === null}
                      onChange={() => onSelectGroup(null)}
                      className="h-4 w-4 rounded border border-white/30 bg-transparent checked:bg-[#FF2A55] checked:border-[#FF2A55] cursor-pointer"
                    />
                    <span className="text-sm text-white">전체</span>
                  </label>
                  {groups.map((group) => (
                    <label
                      key={group.slug}
                      className="flex items-center gap-3 cursor-pointer rounded-lg p-2.5 hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroup === group.slug}
                        onChange={() => onSelectGroup(group.slug)}
                        className="h-4 w-4 rounded border border-white/30 bg-transparent checked:bg-[#FF2A55] checked:border-[#FF2A55] cursor-pointer"
                      />
                      <span className="text-sm text-white">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Members Filter Section */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-white uppercase tracking-wide text-white/70">
                  {t("filter.drawer.members") || "멤버"}
                </h3>
                <div className="space-y-2">
                  {MOCK_MEMBERS.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 cursor-pointer rounded-lg p-2.5 hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => {
                          const updated = new Set(selectedMembers);
                          if (updated.has(member.id)) {
                            updated.delete(member.id);
                          } else {
                            updated.add(member.id);
                          }
                          onSelectMembers(updated);
                        }}
                        className="h-4 w-4 rounded border border-white/30 bg-transparent checked:bg-[#FF2A55] checked:border-[#FF2A55] cursor-pointer"
                      />
                      <span className="text-sm text-white">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card Type Filter Section */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-white uppercase tracking-wide text-white/70">
                  {t("filter.drawer.cardTypes") || "카드 종류"}
                </h3>
                <div className="space-y-2">
                  {CARD_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center gap-3 cursor-pointer rounded-lg p-2.5 hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={localCardTypes.has(type.id)}
                        onChange={() => handleCardTypeToggle(type.id)}
                        className="h-4 w-4 rounded border border-white/30 bg-transparent checked:bg-[#FF2A55] checked:border-[#FF2A55] cursor-pointer"
                      />
                      <span className="text-sm text-white">{type.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset & Apply Buttons */}
              <div className="sticky bottom-0 border-t border-white/10 bg-[#1A1A1E]/95 backdrop-blur-sm px-0 py-4 -mx-4">
                <div className="space-y-2 px-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    {t("filter.drawer.reset") || "초기화"}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="w-full rounded-lg bg-[#FF2A55] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    {t("filter.drawer.apply") || "적용"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
