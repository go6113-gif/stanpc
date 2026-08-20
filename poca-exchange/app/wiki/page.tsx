'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { HallOfFameSection } from '@/components/wiki/HallOfFameSection';

interface SearchResult {
  groups: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameKr: string | null;
    imageUrl: string | null;
    _count: { members: number; photoCards: number };
  }>;
  members: Array<{
    id: string;
    nameEn: string;
    nameKr: string | null;
    imageUrl: string | null;
    group: { slug: string; nameEn: string };
  }>;
  cards: Array<{
    id: string;
    slug: string;
    cardName: string | null;
    version: string | null;
    imageUrl: string | null;
    member: { nameEn: string } | null;
    group: { slug: string; nameEn: string };
  }>;
}

interface FeaturedCard {
  id: string;
  slug: string;
  cardName: string | null;
  version: string | null;
  imageUrl: string | null;
  estimatedPrice: number | null;
  viewCount: number;
  member: { nameEn: string; nameKr: string | null } | null;
  group: { slug: string; nameEn: string };
  album: { slug: string; title: string } | null;
}

interface FeaturedGroup {
  id: string;
  slug: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  _count: { members: number; photoCards: number };
}

const FILTERS = [
  { id: 'score', label: 'StanPC Score' },
  { id: 'price', label: 'Price (Low to High)' },
  { id: 'cards', label: 'Card Count' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

type CardCondition = 'all' | 'sealed' | 'nm' | 'lp' | 'mp-hp';

const CARD_CONDITIONS: { id: CardCondition; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'sealed', label: '미개봉 (Sealed)' },
  { id: 'nm', label: '근민트 (NM)' },
  { id: 'lp', label: '경미한 하자 (LP)' },
  { id: 'mp-hp', label: '중/심각한 하자 (MP/HP)' },
];

const VAULT_STATUS_OPTIONS = [
  { id: 'in-vault', label: '내 보유 카드 (In Vault)' },
  { id: 'iso', label: '구하는 카드 (ISO)' },
  { id: 'for-trade', label: '교환 가능 (For Trade)' },
  { id: 'wishlist', label: '위시리스트 (Wishlist)' },
];

function isValidImageUrl(url: string | null): url is string {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

export default function WikiPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [featuredGroups, setFeaturedGroups] = useState<FeaturedGroup[]>([]);
  const [featuredCards, setFeaturedCards] = useState<FeaturedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterId>('score');
  const [cardCondition, setCardCondition] = useState<CardCondition>('all');
  const [vaultStatus, setVaultStatus] = useState<string[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [groupsRes, cardsRes] = await Promise.all([
          fetch('/api/wiki/featured'),
          fetch('/api/wiki/featured-cards'),
        ]);

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          setFeaturedGroups(data.groups);
        }

        if (cardsRes.ok) {
          const data = await cardsRes.json();
          setFeaturedCards(data.cards);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/wiki/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sortedCards = useMemo(() => {
    const cards = [...featuredCards];
    if (activeFilter === 'price') {
      return cards.sort(
        (a, b) => (a.estimatedPrice ?? Infinity) - (b.estimatedPrice ?? Infinity)
      );
    }
    if (activeFilter === 'cards') {
      return cards.sort((a, b) => b.viewCount - a.viewCount);
    }
    // score: view-count led popularity, the default fetch order
    return cards;
  }, [featuredCards, activeFilter]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            덕후 <span className="text-nomad-red">Wiki</span>
          </h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            포토카드 도감과 멤버별 카드 컬렉션을 탐색하세요
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <input
              type="text"
              placeholder="그룹, 멤버, 카드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-neutral-300 px-5 py-3 text-base focus:ring-2 focus:ring-nomad-red focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Top Ticker — trending members */}
          {featuredCards.length > 0 && (
            <div className="no-scrollbar mt-6 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              <div className="flex gap-2 pb-1">
                {featuredCards.slice(0, 8).map((card) => (
                  <Link
                    key={card.id}
                    href={`/wiki/${card.group.slug}/${card.member?.nameEn.toLowerCase().replace(/\s+/g, '-') ?? ''}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold whitespace-nowrap dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <span className="text-nomad-red">●</span>
                    {card.member?.nameKr || card.member?.nameEn}
                    <span className="font-normal text-neutral-400">
                      {card.group.nameEn}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hall of Fame */}
      <HallOfFameSection />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {searchQuery && searchResults ? (
          <>
            {/* Search Results */}
            {searchResults.groups.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
                  그룹
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/wiki/${group.slug}`}
                      className="group overflow-hidden rounded-2xl border border-neutral-200 transition-shadow hover:shadow-lg dark:border-neutral-700"
                    >
                      {group.imageUrl && (
                        <div className="relative h-32 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                          <Image
                            src={group.imageUrl}
                            alt={group.nameKr || group.nameEn}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          {group.nameKr || group.nameEn}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {group.nameEn}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                          멤버 {group._count.members} · 카드 {group._count.photoCards}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.members.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
                  멤버
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.members.map((member) => (
                    <Link
                      key={member.id}
                      href={`/wiki/${member.group.slug}/${member.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group overflow-hidden rounded-2xl border border-neutral-200 transition-shadow hover:shadow-lg dark:border-neutral-700"
                    >
                      {member.imageUrl && (
                        <div className="relative h-32 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                          <Image
                            src={member.imageUrl}
                            alt={member.nameKr || member.nameEn}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          {member.nameKr || member.nameEn}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {member.group.nameEn}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.cards.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
                  카드
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {searchResults.cards.map((card) => (
                    <Link
                      key={card.id}
                      href={`/card/${card.slug}`}
                      className="group overflow-hidden rounded-2xl border border-neutral-200 transition-shadow hover:shadow-lg dark:border-neutral-700"
                    >
                      <div className="relative aspect-[56/87] overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                        {card.imageUrl && (
                          <Image
                            src={card.imageUrl}
                            alt={card.cardName || 'photocard'}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                          {card.member?.nameEn || card.group.nameEn}
                        </p>
                        {card.version && (
                          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {card.version}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.groups.length === 0 &&
              searchResults.members.length === 0 &&
              searchResults.cards.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    검색 결과가 없습니다.
                  </p>
                </div>
              )}
          </>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                    activeFilter === filter.id
                      ? 'border-nomad-red bg-nomad-red text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              <button className="rounded-full border-2 border-neutral-200 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300">
                Filters
              </button>
            </div>

            {/* Card Condition Filter */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">상태:</span>
              {CARD_CONDITIONS.map((condition) => (
                <button
                  key={condition.id}
                  onClick={() => setCardCondition(condition.id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors ${
                    cardCondition === condition.id
                      ? 'border-nomad-red bg-nomad-red text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300'
                  }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>

            {/* My Vault Filter */}
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">My Vault:</span>
              {VAULT_STATUS_OPTIONS.map((status) => (
                <button
                  key={status.id}
                  onClick={() => {
                    if (!session?.user?.id) {
                      setShowVaultModal(true);
                      return;
                    }
                    setVaultStatus((prev) =>
                      prev.includes(status.id) ? prev.filter((s) => s !== status.id) : [...prev, status.id]
                    );
                  }}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors ${
                    vaultStatus.includes(status.id)
                      ? 'border-nomad-red bg-nomad-red text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Featured Cards — Nomad ranked grid */}
            {sortedCards.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
                  🔥 인기 카드
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {sortedCards.map((card, index) => {
                    const memberLabel = card.member?.nameKr || card.member?.nameEn || card.group.nameEn;
                    return (
                      <Link
                        key={card.id}
                        href={`/card/${card.slug}`}
                        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800"
                      >
                        {isValidImageUrl(card.imageUrl) ? (
                          <Image
                            src={card.imageUrl}
                            alt={card.cardName || memberLabel}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        <span className="absolute top-2 left-2 text-xl font-extrabold text-white drop-shadow-md">
                          {index + 1}
                        </span>
                        {card.estimatedPrice != null && (
                          <span className="absolute top-2 right-2 rounded-full border border-white/40 bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                            ${card.estimatedPrice.toFixed(2)}
                          </span>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-2.5">
                          <p className="truncate text-sm font-extrabold text-white">
                            {memberLabel}
                          </p>
                          <p className="truncate text-[10px] font-medium text-white/70">
                            {card.group.nameEn}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Featured Groups — Nomad ranked grid */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
                🌟 인기 그룹
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {featuredGroups.length > 0 ? (
                  featuredGroups.map((group, index) => (
                    <Link
                      key={group.id}
                      href={`/wiki/${group.slug}`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800"
                    >
                      {isValidImageUrl(group.imageUrl) ? (
                        <Image
                          src={group.imageUrl}
                          alt={group.nameKr || group.nameEn}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      <span className="absolute top-3 left-3 text-2xl font-extrabold text-white drop-shadow-md">
                        {index + 1}
                      </span>
                      <span className="absolute top-3 right-3 rounded-full border border-white/40 bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                        {group._count.photoCards} Cards
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="truncate text-lg font-extrabold text-white">
                          {group.nameKr || group.nameEn}
                        </p>
                        <p className="truncate text-[11px] font-medium text-white/70">
                          {group.nameEn}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-white/90">
                          <span>멤버 {group._count.members}</span>
                          <span>카드 {group._count.photoCards}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400">로드 중...</p>
                  </div>
                )}
              </div>
            </section>

            <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
              <p className="text-neutral-600 dark:text-neutral-400">
                그룹, 멤버, 카드를 검색하여 도감을 탐색하세요
              </p>
            </div>
          </>
        )}
      </main>

      {/* Vault Auth Modal - Temporarily disabled */}
      {/* <VaultAuthModal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)} /> */}
    </div>
  );
}
