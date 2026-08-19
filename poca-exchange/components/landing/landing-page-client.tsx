"use client";

import { useMemo, useRef, useState } from "react";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingFilterBar } from "./landing-filter-bar";
import { FilterChips } from "./filter-chips";
import { HighDensityGrid } from "@/components/high-density/high-density-grid";
import { FloatingBinderBar } from "@/components/binder/FloatingBinderBar";
import { BinderViewModal } from "@/components/binder/BinderViewModal";
import { RoadmapWidget } from "@/components/navigation/RoadmapWidget";
import { getTopPhotoCards } from "@/lib/queries";
import { inferCardTags, type CardTag } from "@/lib/photocard-tags";
import { useBinderStore } from "@/store/useBinderStore";

interface LandingPageClientProps {
  cards: Awaited<ReturnType<typeof getTopPhotoCards>>;
}

export function LandingPageClient({ cards }: LandingPageClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [cardTypeFilters, setCardTypeFilters] = useState<Set<string>>(new Set());
  const [memberFilters, setMemberFilters] = useState<Set<string>>(new Set());
  const [isBinderOpen, setIsBinderOpen] = useState(false);

  // InstantMultiSearch's mega-dropdown collection column (wish/owned/wtt/wts)
  // writes here directly — see useBinderStore's activeQuickFilter comment.
  const activeQuickFilter = useBinderStore((state) => state.activeQuickFilter);
  const searchQuery = useBinderStore((state) => state.searchQuery);
  const resetQuickFilter = useBinderStore((state) => state.resetQuickFilter);
  const wishCards = useBinderStore((state) => state.wishCards);
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wttCards = useBinderStore((state) => state.wttCards);
  const wtsCards = useBinderStore((state) => state.wtsCards);

  // Extract groups and members with hierarchy: group -> members
  const { groups, groupMembers } = useMemo(() => {
    const groupsMap = new Map<string, { slug: string; name: string }>();
    const membersMap = new Map<string, Set<{ slug: string; name: string }>>();

    for (const card of cards) {
      if (card.groupSlug && !groupsMap.has(card.groupSlug)) {
        groupsMap.set(card.groupSlug, {
          slug: card.groupSlug,
          name: card.groupName,
        });
        membersMap.set(card.groupSlug, new Set());
      }

      // Add member to the group's member set (if available)
      if (card.memberSlug && card.groupSlug && card.member) {
        const members = membersMap.get(card.groupSlug);
        if (members) {
          members.add({
            slug: card.memberSlug,
            name: card.memberName || card.member.nameKr || card.member.nameEn || "",
          });
        }
      }
    }

    // Convert Sets to sorted arrays
    const membersByGroup = new Map<string, Array<{ slug: string; name: string }>>();
    for (const [groupSlug, members] of membersMap) {
      membersByGroup.set(
        groupSlug,
        Array.from(members).sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    return {
      groups: Array.from(groupsMap.values()),
      groupMembers: membersByGroup,
    };
  }, [cards]);

  const collectionSet =
    activeQuickFilter === "wishlist"
      ? wishCards
      : activeQuickFilter === "owned"
        ? ownedCards
        : activeQuickFilter === "wtt"
          ? wttCards
          : activeQuickFilter === "wts"
            ? wtsCards
            : null;

  // Filter by group, card type, members, and mega-dropdown quick filter
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Group filter
      if (groupFilter && card.groupSlug !== groupFilter) return false;

      // Card type filter
      if (cardTypeFilters.size > 0) {
        const tags = inferCardTags(card);
        if (!Array.from(cardTypeFilters).some((f) => tags.has(f as CardTag))) return false;
      }

      // Member filter (match by memberSlug)
      if (memberFilters.size > 0 && card.memberSlug) {
        if (!memberFilters.has(card.memberSlug)) return false;
      }

      // Collection/trade quick filter (wishlist/owned/wtt/wts)
      if (collectionSet && !collectionSet.some((c) => c.cardId === card.slug)) return false;

      return true;
    });
  }, [cards, groupFilter, cardTypeFilters, memberFilters, collectionSet]);

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
    setMemberFilters(new Set());
    resetQuickFilter();
  };

  const hasActiveFilters =
    !!groupFilter ||
    cardTypeFilters.size > 0 ||
    memberFilters.size > 0 ||
    !!activeQuickFilter ||
    searchQuery.trim() !== "";

  return (
    <>
      <main className="min-h-screen bg-[#0F0F12]">
        <LandingHeroSection gridRef={gridRef} />

        <LandingFilterBar
          groups={groups}
          groupMembers={groupMembers}
          selectedGroup={groupFilter}
          onSelectGroup={setGroupFilter}
          selectedCardTypes={cardTypeFilters}
          onSelectCardTypes={setCardTypeFilters}
          selectedMembers={memberFilters}
          onSelectMembers={setMemberFilters}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Active Filter Chips */}
        {(groupFilter || cardTypeFilters.size > 0 || memberFilters.size > 0) && (
          <FilterChips
            groupFilter={groupFilter}
            cardTypeFilters={cardTypeFilters}
            memberFilters={memberFilters}
            onRemoveGroup={handleRemoveGroupFilter}
            onRemoveCardType={handleRemoveCardTypeFilter}
            onRemoveMember={(memberId) => {
              const updated = new Set(memberFilters);
              updated.delete(memberId);
              setMemberFilters(updated);
            }}
            groups={groups}
          />
        )}

        <section ref={gridRef} className="w-full px-4 py-10 md:px-8">
          <HighDensityGrid cards={filteredCards} minCardWidth={180} gap={16} />
        </section>

        {/* Roadmap Widget */}
        <section className="w-full px-4 py-10 md:px-8">
          <div className="max-w-6xl mx-auto">
            <RoadmapWidget />
          </div>
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
