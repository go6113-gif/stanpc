'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VaultResponse, VaultCardItem } from '@/lib/api-types';
import { MOCK_VAULT_DATA } from '@/lib/mock-vault-data';

interface FilterState {
  tags: string[];
  groups: string[];
  searchQuery: string;
}

export default function VaultPage() {
  const [vaultData] = useState<VaultResponse>(MOCK_VAULT_DATA);
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    groups: [],
    searchQuery: '',
  });
  const [sortBy, setSortBy] = useState<'recent' | 'price-high' | 'price-low'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 필터링 및 정렬
  const filteredCards = useMemo(() => {
    let result = [...vaultData.cards];

    // 태그 필터
    if (filters.tags.length > 0) {
      result = result.filter((card) =>
        filters.tags.some((tag) => card.tags.includes(tag))
      );
    }

    // 그룹 필터
    if (filters.groups.length > 0) {
      result = result.filter((card) =>
        filters.groups.includes(card.groupName)
      );
    }

    // 검색어
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
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
  }, [vaultData.cards, filters, sortBy]);

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleGroupToggle = (group: string) => {
    setFilters((prev) => ({
      ...prev,
      groups: prev.groups.includes(group)
        ? prev.groups.filter((g) => g !== group)
        : [...prev.groups, group],
    }));
  };

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
            <Link
              href="/card-generator"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              📸 자랑 카드 만들기
            </Link>
          </div>

          {/* Stats Bar */}
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setSortBy(e.target.value as typeof sortBy)
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
              >
                <option value="recent">최근 추가순</option>
                <option value="price-high">가격 높은순</option>
                <option value="price-low">가격 낮은순</option>
              </select>
            </div>

            {/* Tags */}
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
                      checked={filters.tags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
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

            {/* Groups */}
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
                      checked={filters.groups.includes(group)}
                      onChange={() => handleGroupToggle(group)}
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
            {filteredCards.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
                <p className="text-neutral-600 dark:text-neutral-400">
                  선택한 조건에 맞는 카드가 없습니다
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                  {filteredCards.length}개의 카드
                </p>

                {viewMode === 'grid' ? (
                  <VaultGridView cards={filteredCards} />
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

// Grid View 컴포넌트
function VaultGridView({ cards }: { cards: VaultCardItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/card/${card.cardSlug}`}
          className="group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-[56/87] bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            {card.imageUrl && (
              <Image
                src={card.imageUrl}
                alt={card.cardName || '포토카드'}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            )}
            {card.tags.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1 flex-wrap">
                {card.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
              {card.memberName}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {card.groupName}
            </p>
            {card.estimatedPrice && (
              <p className="mt-1 text-sm font-semibold text-green-600">
                ${card.estimatedPrice.toFixed(2)}
              </p>
            )}
          </div>
        </Link>
      ))}
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
              보유: {card.haveCount} | 원함: {card.wantCount}
            </p>
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              규격: {card.dimensions.width}x{card.dimensions.height}mm
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
