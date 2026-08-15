"use client";

import { useMemo, useRef, useState } from "react";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingFilterBar } from "./landing-filter-bar";
import { FilterChips } from "./filter-chips";
import { HighDensityGrid } from "@/components/high-density/high-density-grid";
import { FloatingBinderBar } from "@/components/binder/FloatingBinderBar";
import { BinderViewModal } from "@/components/binder/BinderViewModal";
import { getTopPhotoCards } from "@/lib/queries";

interface LandingPageClientProps {
  cards: Awaited<ReturnType<typeof getTopPhotoCards>>;
}

// Infer card types from version field (matches lib/photocard-guide.ts logic)
function inferCardType(version: string | null): string | null {
  if (!version) return null;
  const lower = version.toLowerCase();
  const pobKeywords = ["pob", "weverse", "soundwave", "makestar", "공방", "특전", "럭키드로우"];
  if (pobKeywords.some((kw) => lower.includes(kw))) return "type-pob";
  if (lower.includes("hologram")) return "type-hologram";
  if (lower.includes("rare") || lower.includes("limited")) return "type-rare";
  return "type-standard";
}

export function LandingPageClient({ cards }: LandingPageClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [cardTypeFilters, setCardTypeFilters] = useState<Set<string>>(new Set());
  const [isBinderOpen, setIsBinderOpen] = useState(false);

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const card of cards) {
      if (card.groupSlug && !seen.has(card.groupSlug)) {
        seen.set(card.groupSlug, card.groupName);
      }
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [cards]);

  // Filter by group and card types
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Group filter
      if (groupFilter && card.groupSlug !== groupFilter) return false;

      // Card type filter
      if (cardTypeFilters.size > 0) {
        const cardType = inferCardType(card.version);
        if (!cardType || !cardTypeFilters.has(cardType)) return false;
      }

      return true;
    });
  }, [cards, groupFilter, cardTypeFilters]);

  const handleRemoveGroupFilter = () => {
    setGroupFilter(null);
  };

  const handleRemoveCardTypeFilter = (typeId: string) => {
    const updated = new Set(cardTypeFilters);
    updated.delete(typeId);
    setCardTypeFilters(updated);
  };

  const handleResetFilters = () => {
    setGroupFilter(null);
    setCardTypeFilters(new Set());
  };

  return (
    <>
      <main className="min-h-screen bg-[#0F0F12]">
        <LandingHeroSection gridRef={gridRef} />

        <LandingFilterBar
          groups={groups}
          selectedGroup={groupFilter}
          onSelectGroup={setGroupFilter}
          selectedCardTypes={cardTypeFilters}
          onSelectCardTypes={setCardTypeFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Active Filter Chips */}
        {(groupFilter || cardTypeFilters.size > 0) && (
          <FilterChips
            groupFilter={groupFilter}
            cardTypeFilters={cardTypeFilters}
            onRemoveGroup={handleRemoveGroupFilter}
            onRemoveCardType={handleRemoveCardTypeFilter}
            groups={groups}
          />
        )}

        <section ref={gridRef} className="w-full px-4 py-10 md:px-8">
          <HighDensityGrid cards={filteredCards} minCardWidth={180} gap={16} />
        </section>
      </main>

      {/* Floating Binder Bar & Modal */}
      <FloatingBinderBar onOpenModal={() => setIsBinderOpen(true)} />
      <BinderViewModal
        isOpen={isBinderOpen}
        onClose={() => setIsBinderOpen(false)}
      />
    </>
  );
}
