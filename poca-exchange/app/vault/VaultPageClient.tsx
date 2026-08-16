'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VaultResponse, VaultCardItem } from '@/lib/api-types';
import { Share2, Check } from 'lucide-react';
import VaultAuthModal from '@/components/wiki/VaultAuthModal';
import { BinderValueCard } from '@/components/vault/BinderValueCard';
import { BinderGrid } from '@/components/vault/BinderGrid';
import { VaultDashboard } from '@/components/vault/VaultDashboard';
import { BinderShelf } from '@/components/vault/BinderShelf';
import { useBinderStore as useCollectionBinderStore } from '@/store/useBinderStore';
import { useFilterStore, useVaultSync } from '@/store/useFilterStore';
import { useAssetSelectionStore } from '@/store/useAssetSelectionStore';

export default function VaultPageClient() {
  const router = useRouter();
  const [vaultData, setVaultData] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  // useFilterStore에서 필터 상태 읽기
  const tags = useFilterStore((state) => state.tags);
  const groups = useFilterStore((state) => state.groups);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const sortBy = useFilterStore((state) => state.sortBy);
  const viewMode = useFilterStore((state) => state.viewMode);

  // useAssetSelectionStore
  const selectedCardIds = useAssetSelectionStore((state) =>
    Array.from(state.selectedCardIds)
  );
  const toggleCardSelection = useAssetSelectionStore((state) => state.toggleCardSelection);
  const clearSelection = useAssetSelectionStore((state) => state.clearSelection);

  // useFilterStore 액션들
  const setTags = useFilterStore((state) => state.setTags);
  const setGroups = useFilterStore((state) => state.setGroups);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const setSortBy = useFilterStore((state) => state.setSortBy);
  const setViewMode = useFilterStore((state) => state.setViewMode);
  const toggleTag = useFilterStore((state) => state.toggleTag);
  const toggleGroup = useFilterStore((state) => state.toggleGroup);
  const resetFilters = useFilterStore((state) => state.reset);

  // URL Query Parameter와 동기화
  useVaultSync();

  // Zustand 로컬 바인더 (비회원 사용)
  const ownedCards = useCollectionBinderStore((state) => state.ownedCards);
  const wishCards = useCollectionBinderStore((state) => state.wishCards);

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        setLoading(true);

        // 로컬 바인더가 있으면 사용
        if (ownedCards.length > 0 || wishCards.length > 0) {
          const mockVaultData: VaultResponse = {
            user: {
              id: 'guest',
              name: '비회원',
              image: null,
              collectorIndex: 0,
            },
            cards: [
              ...ownedCards.map((card) => ({
                id: card.cardId,
                cardId: card.cardId,
                cardSlug: card.cardId,
                cardName: card.cardName,
                memberName: card.memberName || 'Unknown',
                groupName: card.groupName,
                albumTitle: null,
                imageUrl: card.imageUrl || null,
                thumbImagePath: null,
                tags: ['Owned'],
                note: null,
                estimatedPrice: null,
                ownedCount: 1,
                wishedCount: 0,
                addedAt: new Date(card.addedAt).toISOString(),
                updatedAt: new Date(card.addedAt).toISOString(),
                compatibleSleeves: [],
              })),
              ...wishCards.map((card) => ({
                id: card.cardId,
                cardId: card.cardId,
                cardSlug: card.cardId,
                cardName: card.cardName,
                memberName: card.memberName || 'Unknown',
                groupName: card.groupName,
                albumTitle: null,
                imageUrl: card.imageUrl || null,
                thumbImagePath: null,
                tags: ['Wish'],
                note: null,
                estimatedPrice: null,
                ownedCount: 0,
                wishedCount: 1,
                addedAt: new Date(card.addedAt).toISOString(),
                updatedAt: new Date(card.addedAt).toISOString(),
                compatibleSleeves: [],
              })),
            ],
            stats: {
              totalCards: ownedCards.length + wishCards.length,
              inHandCount: ownedCards.length,
              wishlistCount: wishCards.length,
              tradeCount: 0,
              completeSetCount: 0,
            },
            filters: {
              tags: ['Owned', 'Wish'],
              groups: Array.from(
                new Set([
                  ...ownedCards.map((c) => c.groupName),
                  ...wishCards.map((c) => c.groupName),
                ])
              ),
            },
            timestamp: new Date().toISOString(),
          };
          setVaultData(mockVaultData);
          setError(null);
          return;
        }

        // API 시도 (로그인된 경우)
        const params = new URLSearchParams();
        if (tags.length > 0) {
          tags.forEach((tag) => params.append('filterTags', tag));
        }
        if (groups.length > 0) {
          groups.forEach((group) => params.append('filterGroups', group));
        }
        params.set('sortBy', sortBy);

        const response = await fetch(`/api/vault?${params.toString()}`);
        if (!response.ok) {
          if (response.status === 401) {
            // API 실패 시 로컬 빈 상태로 표시
            setVaultData({
              user: {
                id: 'guest',
                name: '비회원',
                image: null,
                collectorIndex: 0,
              },
              cards: [],
              stats: {
                totalCards: 0,
                inHandCount: 0,
                wishlistCount: 0,
                tradeCount: 0,
                completeSetCount: 0,
              },
              filters: {
                tags: [],
                groups: [],
              },
              timestamp: new Date().toISOString(),
            });
            setError(null);
            return;
          }
          throw new Error(`Failed to fetch vault: ${response.status}`);
        }
        const data: VaultResponse = await response.json();
        setVaultData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vault data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vault');
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [tags, groups, sortBy, ownedCards, wishCards]);

  // 필터링 및 정렬
  const filteredCards = useMemo(() => {
    if (!vaultData) return [];
    let result = [...vaultData.cards];

    // 태그 필터
    if (tags.length > 0) {
      result = result.filter((card) =>
        tags.some((tag) => card.tags.includes(tag))
      );
    }

    // 그룹 필터
    if (groups.length > 0) {
      result = result.filter((card) =>
        groups.includes(card.groupName)
      );
    }

    // 검색어
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (card) =>
          card.cardName?.toLowerCase().includes(query) ||
          card.memberName?.toLowerCase().includes(query) ||
          card.groupName?.toLowerCase().includes(query)
      );
    }

    // 정렬
    switch (sortBy) {
      case 'price-high':
        result.sort((a, b) => (b.estimatedPrice ?? 0) - (a.estimatedPrice ?? 0));
        break;
      case 'price-low':
        result.sort((a, b) => (a.estimatedPrice ?? 0) - (b.estimatedPrice ?? 0));
        break;
      case 'recent':
      default:
        result.sort(
          (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    }

    return result;
  }, [vaultData, tags, groups, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                My Vault
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                당신의 포토카드 컬렉션을 관리하고 자랑하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectMode && selectedCardIds.length > 0 && (
                <button
                  onClick={() => router.push('/export')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FF2A55] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF2A55]/90 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  SNS 내보내기 ({selectedCardIds.length})
                </button>
              )}
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) clearSelection();
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectMode
                    ? 'bg-[#FF2A55] text-white hover:bg-[#FF2A55]/90'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {selectMode ? '✓ 선택 중' : '선택 모드'}
              </button>
              <Link
                href="/card-generator"
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                📸 자랑 카드 만들기
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-lg bg-neutral-200 dark:bg-neutral-700 p-3 h-16 animate-pulse" />
              ))}
            </div>
          ) : vaultData ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-6">
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  전체 카드
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {vaultData.stats.totalCards}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  보유 중
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {vaultData.stats.inHandCount}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  원함
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {vaultData.stats.wishlistCount}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  거래용
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {vaultData.stats.tradeCount}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  완성 세트
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {vaultData.stats.completeSetCount}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Binder Value Card - 상단 요약 */}
        <BinderValueCard />

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left: Filters */}
          <aside className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="카드 이름, 멤버 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                정렬
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
              >
                <option value="recent">최근 추가순</option>
                <option value="price-high">가격 높은순</option>
                <option value="price-low">가격 낮은순</option>
              </select>
            </div>

            {/* Tags */}
            {vaultData && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  상태
                </h3>
                <div className="space-y-2">
                  {vaultData.filters.tags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="rounded"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {tag}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
                        {
                          vaultData.cards.filter((c) =>
                            c.tags.includes(tag)
                          ).length
                        }
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {vaultData && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  그룹
                </h3>
                <div className="space-y-2">
                  {vaultData.filters.groups.map((group) => (
                    <label
                      key={group}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={groups.includes(group)}
                        onChange={() => toggleGroup(group)}
                        className="rounded"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {group}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
                        {
                          vaultData.cards.filter(
                            (c) => c.groupName === group
                          ).length
                        }
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                  }`}
                >
                  그리드
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                  }`}
                >
                  리스트
                </button>
              </div>
            </div>
          </aside>

          {/* Right: Cards */}
          <div className="lg:col-span-3">
            {error ? (
              <div className="rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 p-6">
                <p className="text-red-700 dark:text-red-300">
                  오류가 발생했습니다: {error}
                </p>
              </div>
            ) : loading || !vaultData ? (
              <div className="space-y-4">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[56/87] bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : vaultData && filteredCards.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
                <p className="text-neutral-600 dark:text-neutral-400">
                  {vaultData.cards.length === 0
                    ? '카드를 추가해보세요. 그리드에서 카드를 클릭해 저장할 수 있습니다.'
                    : '선택한 조건에 맞는 카드가 없습니다'}
                </p>
              </div>
            ) : vaultData && (
              <>
                <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                  {filteredCards.length}개의 카드
                </p>

                {selectMode ? (
                  <SelectableCardGrid
                    cards={filteredCards}
                    selectedCardIds={selectedCardIds}
                    onToggleCard={toggleCardSelection}
                  />
                ) : viewMode === 'grid' ? (
                  <BinderGrid cards={filteredCards} minCardWidth={180} gap={16} />
                ) : (
                  <VaultListView cards={filteredCards} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 선택 가능한 그리드
function SelectableCardGrid({
  cards,
  selectedCardIds,
  onToggleCard,
}: {
  cards: VaultCardItem[];
  selectedCardIds: string[];
  onToggleCard: (cardId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => {
        const isSelected = selectedCardIds.includes(card.id);
        return (
          <div key={card.id} className="relative group cursor-pointer">
            <div
              onClick={() => onToggleCard(card.id)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[56/87] ${
                isSelected
                  ? 'border-[#FF2A55] bg-[#FF2A55]/10 shadow-lg shadow-[#FF2A55]/20'
                  : 'border-transparent hover:border-neutral-400'
              }`}
            >
              {card.imageUrl && (
                <Image
                  src={card.imageUrl}
                  alt={card.cardName || '포토카드'}
                  fill
                  className="object-cover"
                />
              )}
              {isSelected && (
                <div className="absolute inset-0 bg-[#FF2A55]/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#FF2A55] flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-neutral-900 dark:text-white font-medium truncate">
              {card.memberName}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {card.groupName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List View 컴포넌트
function VaultListView({ cards }: { cards: VaultCardItem[] }) {
  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/card/${card.cardSlug}`}
          className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="relative w-16 h-24 flex-shrink-0 rounded bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            {card.imageUrl && (
              <Image
                src={card.imageUrl}
                alt={card.cardName || '포토카드'}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {card.cardName || card.memberName}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {card.groupName} {card.memberName && `• ${card.memberName}`}
            </p>
            {card.note && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 italic">
                "{card.note}"
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {card.estimatedPrice && (
              <p className="font-semibold text-green-600 mb-2">
                ${card.estimatedPrice.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              보유: {card.ownedCount} | 원함: {card.wishedCount}
            </p>
            {card.dimensions && (
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                규격: {card.dimensions.width}x{card.dimensions.height}mm
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
