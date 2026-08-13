"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  normalizeSearchQuery,
  getRecentSearches,
  addRecentSearch,
} from "./search-utils";

interface ApiResult {
  artists: Array<{
    id: string;
    slug: string;
    type: "artist";
    nameKo: string;
    nameEn: string;
    image?: string;
  }>;
  members: Array<{
    id: string;
    type: "member";
    nameKo: string;
    nameEn: string;
    groupSlug: string;
    groupName: string;
    image?: string;
  }>;
  albums: Array<{
    id: string;
    slug: string;
    type: "album";
    title: string;
    groupName: string;
    groupNameKo: string;
    releaseDate?: string;
  }>;
  photocards: Array<{
    id: string;
    slug: string;
    type: "photocard";
    cardName: string;
    groupName: string;
    groupNameKo: string;
    memberName?: string;
    memberNameKo?: string;
    version?: string;
    albumTitle?: string;
    image?: string;
  }>;
}

interface SearchResult {
  id: string;
  type: "artist" | "member" | "album" | "photocard";
  title: string;
  subtitle?: string;
  image?: string;
  slug?: string;
  groupSlug?: string;
}

export function InstantMultiSearch() {
  const { t } = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches(5));
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    const normalized = normalizeSearchQuery(q);
    if (!normalized || normalized.length < 1) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`);
      if (!res.ok) throw new Error("Search failed");

      const data: ApiResult = await res.json();
      const combined: SearchResult[] = [];

      // Add artists
      data.artists.forEach((artist) => {
        combined.push({
          id: artist.id,
          type: "artist",
          title: artist.nameKo,
          subtitle: artist.nameEn,
          image: artist.image,
          slug: artist.slug,
        });
      });

      // Add members
      data.members.forEach((member) => {
        combined.push({
          id: member.id,
          type: "member",
          title: member.nameKo,
          subtitle: `${member.groupName} • ${t("search.sections.artists_members")}`,
          image: member.image,
          groupSlug: member.groupSlug,
        });
      });

      // Add albums
      data.albums.forEach((album) => {
        combined.push({
          id: album.id,
          type: "album",
          title: album.title,
          subtitle: album.groupName,
          slug: album.slug,
        });
      });

      // Add photocards
      data.photocards.forEach((pc) => {
        combined.push({
          id: pc.id,
          type: "photocard",
          title: pc.cardName,
          subtitle: `${pc.groupNameKo}${pc.memberNameKo ? ` • ${pc.memberNameKo}` : ""}`,
          image: pc.image,
          slug: pc.slug,
        });
      });

      setResults(combined);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        } else if (query.trim()) {
          handleSearchSubmit();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    addRecentSearch(query);
    setQuery("");
    setIsOpen(false);
    setResults([]);

    // Route to appropriate detail page
    if (result.type === "artist" && result.slug) {
      router.push(`/wiki/${result.slug}`);
    } else if (result.type === "member" && result.groupSlug) {
      // Member slug structure: /wiki/[group]/[member]
      router.push(`/wiki/${result.groupSlug}/${result.id}`);
    } else if (result.type === "album" && result.slug) {
      // Album slug structure: /wiki/[group]/[member]/[album]
      // For now, route to the group page (can be enhanced later)
      router.push(`/wiki/${result.slug}`);
    } else if (result.type === "photocard" && result.slug) {
      router.push(`/card/${result.slug}`);
    }
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    addRecentSearch(query);
    setQuery("");
    setIsOpen(false);
    // Route to gallery with search query
    router.push(`/gallery?q=${encodeURIComponent(query.trim())}`);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const hasResults = query.trim() && results.length > 0;
  const showFocusDropdown = isOpen && !query.trim();
  const showSearchResults = isOpen && hasResults;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm md:max-w-md">
      <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-[#FF2A55]/30">
        <Search size={16} className="shrink-0 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="rounded-full p-1 hover:bg-neutral-100"
            aria-label={t("search.clear") || "검색어 삭제"}
          >
            <X size={14} className="text-neutral-400" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSearchSubmit}
          aria-label={t("search.submit")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF2A55] text-white hover:opacity-90"
        >
          <Plus size={16} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-white/10 bg-[#1A1A1E] backdrop-blur-sm shadow-lg max-h-[600px] overflow-hidden flex flex-col">
          {showFocusDropdown ? (
            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-white/60 uppercase">
                    {t("search.sections.recent")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.length > 0 ? (
                      recentSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => handleRecentSearch(search)}
                          className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20 transition"
                        >
                          {search}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-white/40">
                        {t("search.empty")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button className="rounded-full bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 transition font-medium">
                    {t("search.quickFilters.popular")}
                  </button>
                  <button className="rounded-full bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 transition font-medium">
                    {t("search.quickFilters.wishlist")}
                  </button>
                  <button className="rounded-full bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 transition font-medium">
                    {t("search.quickFilters.owned")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {isLoading && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-white/60">{t("search.loading")}</p>
            </div>
          )}

          {showSearchResults ? (
            <div className="overflow-y-auto flex-1">
              <div className="divide-y divide-white/5">
                {results.map((result, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full px-4 py-3 text-left transition ${
                        isSelected
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-white">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-white/50">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {results.length > 0 && (
                <div className="border-t border-white/5 px-4 py-2">
                  <p className="text-xs text-white/40">
                    {t("search.keyboard_hint")}
                  </p>
                </div>
              )}
            </div>
          ) : query.trim() && !hasResults && !isLoading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-white/40">{t("search.empty")}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
