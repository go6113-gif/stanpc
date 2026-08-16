"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useBinderStore, type QuickCollectionFilter } from "@/store/useBinderStore";
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

interface InstantMultiSearchProps {
  /** Fired when a mega-dropdown "포카 종류" (column 3) item is clicked, with
   * the CardTag id (see lib/photocard-tags.ts) to filter the main grid by. */
  onSelectCardType?: (tag: string) => void;
}

export function InstantMultiSearch({ onSelectCardType }: InstantMultiSearchProps = {}) {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  // Shared with the landing grid (see useBinderStore's activeQuickFilter/
  // searchQuery comment) so mega-dropdown selections filter the grid without
  // prop drilling through LandingFilterBar.
  const query = useBinderStore((state) => state.searchQuery);
  const setQuery = useBinderStore((state) => state.setSearchQuery);
  const setActiveQuickFilter = useBinderStore((state) => state.setActiveQuickFilter);
  const activeQuickFilter = useBinderStore((state) => state.activeQuickFilter);
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

  // Column 1 (수집 & 거래): drives the main grid via useBinderStore's
  // activeQuickFilter — the grid filters by wish/owned/wtt/wts membership.
  const handleQuickFilterSelect = (filter: QuickCollectionFilter) => {
    setActiveQuickFilter(filter);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    if (pathname !== "/") router.push("/");
  };

  // Column 3 (포카 종류): drives the main grid via the existing
  // cardTypeFilters Set already wired up in LandingPageClient/FilterDrawer.
  const handleCategorySelect = (tag: string) => {
    onSelectCardType?.(tag);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    if (pathname !== "/") router.push("/");
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
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-full md:w-[640px] rounded-2xl border border-gray-700/60 bg-gray-900/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col z-[70]">
          {showFocusDropdown ? (
            <div className="overflow-y-auto">
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="border-b border-gray-700/40 px-4 py-3">
                  <h3 className="mb-2.5 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {t("search.sections.recent")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentSearch(search)}
                        className="rounded-lg bg-white/8 px-2.5 py-1 text-xs text-white/90 hover:bg-white/15 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mega Navigation Grid - 3 Columns */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Collection & Trade Status */}
                  <div className="space-y-1.5">
                    <div className="px-2 py-1.5">
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        {t("search.mega.collection")}
                      </h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setQuery("popular");
                            handleSearch("popular");
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🔥 {t("search.mega.popular")}</span>
                        </button>
                        <button
                          onClick={() => handleQuickFilterSelect("wishlist")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors group ${
                            activeQuickFilter === "wishlist" ? "bg-white/15" : "hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">💖 {t("search.mega.wish")}</span>
                        </button>
                        <button
                          onClick={() => handleQuickFilterSelect("owned")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors group ${
                            activeQuickFilter === "owned" ? "bg-white/15" : "hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">📦 {t("search.mega.owned")}</span>
                        </button>
                        <button
                          onClick={() => handleQuickFilterSelect("wtt")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors group ${
                            activeQuickFilter === "wtt" ? "bg-white/15" : "hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🔄 {t("search.mega.wtt")}</span>
                        </button>
                        <button
                          onClick={() => handleQuickFilterSelect("wts")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors group ${
                            activeQuickFilter === "wts" ? "bg-white/15" : "hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🏷️ {t("search.mega.wts")}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Popular Groups */}
                  <div className="space-y-1.5">
                    <div className="px-2 py-1.5">
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        {t("search.mega.groups")}
                      </h4>
                      <div className="space-y-1">
                        <button onClick={() => router.push("/aespa")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">🌟 aespa</span>
                        </button>
                        <button onClick={() => router.push("/newjeans")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">⚡ NewJeans</span>
                        </button>
                        <button onClick={() => router.push("/ive")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">🎀 IVE</span>
                        </button>
                        <button onClick={() => router.push("/seventeen")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">💎 SEVENTEEN</span>
                        </button>
                        <button onClick={() => router.push("/nct")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">🌌 NCT</span>
                        </button>
                        <button onClick={() => router.push("/le-sserafim")} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-white/90 group-hover:text-white">🌸 LE SSERAFIM</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Photocard Types */}
                  <div className="space-y-1.5">
                    <div className="px-2 py-1.5">
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        {t("search.mega.types")}
                      </h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleCategorySelect("tag-album")}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">💿 {t("search.mega.album")}</span>
                        </button>
                        <button
                          onClick={() => handleCategorySelect("type-pob")}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🎁 {t("search.mega.pob")}</span>
                        </button>
                        <button
                          onClick={() => handleCategorySelect("tag-lucky-draw")}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🎰 {t("search.mega.lucky_draw")}</span>
                        </button>
                        <button
                          onClick={() => handleCategorySelect("tag-fanmeet")}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">🎫 {t("search.mega.fanmeet")}</span>
                        </button>
                        <button
                          onClick={() => handleCategorySelect("tag-season-greeting")}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white/90 group-hover:text-white">📅 {t("search.mega.sg")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
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
