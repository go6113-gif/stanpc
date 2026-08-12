"use client";

import { useState } from "react";

export type FilterOptions = {
  priceRange: "all" | "under10" | "10to50" | "over50";
  countries: string[];
  sortBy: "popularity" | "price-asc" | "price-desc" | "newest";
};

interface StickyFilterBarProps {
  countries: string[];
  onFilterChange: (filters: FilterOptions) => void;
}

export function StickyFilterBar({
  countries,
  onFilterChange,
}: StickyFilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: "all",
    countries: [],
    sortBy: "popularity",
  });
  const [isOpen, setIsOpen] = useState(false);

  const handlePriceChange = (range: FilterOptions["priceRange"]) => {
    const newFilters = { ...filters, priceRange: range };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCountryToggle = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    const newFilters = { ...filters, countries: newCountries };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sort: FilterOptions["sortBy"]) => {
    const newFilters = { ...filters, sortBy: sort };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const activeFilterCount = [
    filters.priceRange !== "all" ? 1 : 0,
    filters.countries.length,
    filters.sortBy !== "popularity" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              필터
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">필터 옵션</span>
            <span className="sm:hidden">열기</span>
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            {/* Price Range Filter */}
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                가격대
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "전체" },
                  { value: "under10", label: "$0-$10" },
                  { value: "10to50", label: "$10-$50" },
                  { value: "over50", label: "$50+" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handlePriceChange(option.value as FilterOptions["priceRange"])
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.priceRange === option.value
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                출처 국가
              </p>
              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => handleCountryToggle(country)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.countries.includes(country)
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                정렬
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "popularity", label: "인기순" },
                  { value: "price-asc", label: "낮은 가격순" },
                  { value: "price-desc", label: "높은 가격순" },
                  { value: "newest", label: "최신순" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleSortChange(option.value as FilterOptions["sortBy"])
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.sortBy === option.value
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
