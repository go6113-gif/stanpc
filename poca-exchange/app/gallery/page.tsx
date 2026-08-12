"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PhotoCardGrid } from "@/components/photo-card-grid";
import { StickyFilterBar, type FilterOptions } from "@/components/sticky-filter-bar";
import { SkeletonPhotoCardGrid } from "@/components/skeleton-card";
import VaultAuthModal from "@/components/wiki/VaultAuthModal";
import type { PhotoCardGridItem } from "@/components/photo-card-grid";

const COUNTRIES = ["KR", "JP", "US", "TW", "AU", "CN"];

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

export default function GalleryPage() {
  const { data: session } = useSession();
  const [cards, setCards] = useState<PhotoCardGridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: "all",
    countries: [],
    sortBy: "popularity",
  });
  const [cardCondition, setCardCondition] = useState<CardCondition>('all');
  const [vaultStatus, setVaultStatus] = useState<string[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Fetch photocards from API
  useEffect(() => {
    const fetchPhotocards = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (filters.priceRange !== "all") {
          params.append("priceRange", filters.priceRange);
        }
        if (filters.countries.length > 0) {
          params.append("country", filters.countries[0]); // API supports single country for now
        }
        params.append("sortBy", filters.sortBy);

        const response = await fetch(`/api/photocards?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch photocards");
        }

        const data = await response.json();
        setCards(Array.isArray(data) ? data : data.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching photocards:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Fallback: still render something (gallery will show empty state)
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotocards();
  }, [filters]);

  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...cards];

    // Additional client-side filtering (in case server doesn't handle all filters)
    if (filters.priceRange !== "all") {
      filtered = filtered.filter((card) => {
        const price = card.estimatedPrice ?? 0;
        switch (filters.priceRange) {
          case "under10":
            return price < 10;
          case "10to50":
            return price >= 10 && price < 50;
          case "over50":
            return price >= 50;
          default:
            return true;
        }
      });
    }

    if (filters.countries.length > 0) {
      filtered = filtered.filter((card) =>
        filters.countries.includes(card.pobCode ?? "")
      );
    }

    return filtered;
  }, [cards, filters]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <StickyFilterBar countries={COUNTRIES} onFilterChange={setFilters} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">포토카드 갤러리</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {loading ? (
              <>데이터 로드 중...</>
            ) : error ? (
              <span className="text-red-500">오류: {error}</span>
            ) : (
              <>{filteredAndSortedCards.length}개의 포토카드를 찾았어요.</>
            )}
          </p>
        </header>

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
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">내 보관:</span>
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

        {loading ? (
          <>
            <SkeletonPhotoCardGrid count={24} />
            <div className="mt-8 flex justify-center">
              <p className="text-sm text-neutral-500">포토카드를 불러오는 중...</p>
            </div>
          </>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">데이터를 불러올 수 없습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredAndSortedCards.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">
              선택한 조건에 맞는 포토카드가 없습니다.
            </p>
          </div>
        ) : (
          <PhotoCardGrid cards={filteredAndSortedCards} />
        )}
      </main>

      {/* Vault Auth Modal */}
      <VaultAuthModal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)} />
    </div>
  );
}
