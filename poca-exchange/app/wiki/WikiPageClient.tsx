'use client';

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { LandingFilterBar } from '@/components/landing/landing-filter-bar';
import { FilterChips } from '@/components/landing/filter-chips';
import { HighDensityGrid } from '@/components/high-density/high-density-grid';
import { FloatingBinderBar } from '@/components/binder/FloatingBinderBar';
import { BinderViewModal } from '@/components/binder/BinderViewModal';
import { useBinderStore } from '@/store/useBinderStore';
import { getTopPhotoCards } from '@/lib/queries';
import { inferCardTags, type CardTag } from '@/lib/photocard-tags';

interface WikiPageClientProps {
  initialCards?: Awaited<ReturnType<typeof getTopPhotoCards>>;
}

export function WikiPageClient({ initialCards }: WikiPageClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [cardTypeFilters, setCardTypeFilters] = useState<Set<string>>(new Set());
  const [memberFilters, setMemberFilters] = useState<Set<string>>(new Set());
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [cards, setCards] = useState<Awaited<ReturnType<typeof getTopPhotoCards>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await getTopPhotoCards(500);
        setCards(data);
      } catch (error) {
        console.error('Failed to fetch wiki cards:', error);
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialCards) {
      fetchCards();
    } else {
      setCards(initialCards);
      setIsLoading(false);
    }
  }, [initialCards]);

  const activeQuickFilter = useBinderStore((state) => state.activeQuickFilter);
  const searchQuery = useBinderStore((state) => state.searchQuery);
  const resetQuickFilter = useBinderStore((state) => state.resetQuickFilter);
  const wishCards = useBinderStore((state) => state.wishCards);
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wttCards = useBinderStore((state) => state.wttCards);
  const wtsCards = useBinderStore((state) => state.wtsCards);

  // Extract groups and members
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

      if (card.memberSlug && card.groupSlug && card.member) {
        const members = membersMap.get(card.groupSlug);
        if (members) {
          members.add({
            slug: card.memberSlug,
            name: card.memberName || card.member.nameKr || card.member.nameEn || '',
          });
        }
      }
    }

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
    activeQuickFilter === 'wishlist'
      ? wishCards
      : activeQuickFilter === 'owned'
        ? ownedCards
        : activeQuickFilter === 'wtt'
          ? wttCards
          : activeQuickFilter === 'wts'
            ? wtsCards
            : null;

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (groupFilter && card.groupSlug !== groupFilter) return false;

      if (cardTypeFilters.size > 0) {
        const tags = inferCardTags(card);
        if (!Array.from(cardTypeFilters).some((f) => tags.has(f as CardTag))) return false;
      }

      if (memberFilters.size > 0 && card.memberSlug) {
        if (!memberFilters.has(card.memberSlug)) return false;
      }

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
    searchQuery.trim() !== '';

  return (
    <>
      <main className="min-h-screen bg-[#0F0F12]">
        {/* Wiki Header */}
        <section className="border-b border-white/10 bg-[#0F0F12]/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">덕후 Wiki</h1>
            <p className="text-white/60 text-sm md:text-base">
              전 세계 포토카드를 한 곳에서 검색하고 수집하세요
            </p>
          </div>
        </section>

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

        {/* Grid */}
        <section ref={gridRef} className="w-full px-4 py-10 md:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2A55] mx-auto mb-4" />
                <p className="text-white/60">도감 로드 중...</p>
              </div>
            </div>
          ) : filteredCards.length > 0 ? (
            <HighDensityGrid cards={filteredCards} minCardWidth={180} gap={16} />
          ) : (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-white/60">검색 결과가 없습니다</p>
              </div>
            </div>
          )}
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
