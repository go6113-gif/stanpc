import { create } from "zustand";
import { useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type ViewMode = "grid" | "list";
export type SortBy = "recent" | "price-high" | "price-low";

interface FilterState {
  tags: string[];
  groups: string[];
  searchQuery: string;
  sortBy: SortBy;
  viewMode: ViewMode;

  setTags: (tags: string[]) => void;
  setGroups: (groups: string[]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortBy) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleTag: (tag: string) => void;
  toggleGroup: (group: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  tags: [] as string[],
  groups: [] as string[],
  searchQuery: "",
  sortBy: "recent" as SortBy,
  viewMode: "grid" as ViewMode,
};

export const useFilterStore = create<FilterState>((set, get) => ({
  ...INITIAL_STATE,

  setTags: (tags) => set({ tags }),
  setGroups: (groups) => set({ groups }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),

  toggleTag: (tag) => {
    const { tags } = get();
    if (tags.includes(tag)) {
      set({ tags: tags.filter((t) => t !== tag) });
    } else {
      set({ tags: [...tags, tag] });
    }
  },

  toggleGroup: (group) => {
    const { groups } = get();
    if (groups.includes(group)) {
      set({ groups: groups.filter((g) => g !== group) });
    } else {
      set({ groups: [...groups, group] });
    }
  },

  reset: () => set(INITIAL_STATE),
}));

/**
 * URL Query Parameter와 필터 상태를 동기화하는 훅
 * useVaultSync()를 /vault/page.tsx에서 호출하면:
 * - URL에서 필터 읽기 (초기 로드 시)
 * - 필터 변경 시 URL 업데이트
 */
export function useVaultSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tags, groups, searchQuery, sortBy, viewMode, setTags, setGroups, setSearchQuery, setSortBy, setViewMode } = useFilterStore();

  // URL → Store (초기 로드)
  useEffect(() => {
    const urlTags = searchParams.getAll("tag") || [];
    const urlGroups = searchParams.getAll("group") || [];
    const urlQuery = searchParams.get("q") || "";
    const urlSort = (searchParams.get("sort") || "recent") as SortBy;
    const urlView = (searchParams.get("view") || "grid") as ViewMode;

    if (urlTags.length > 0) setTags(urlTags);
    if (urlGroups.length > 0) setGroups(urlGroups);
    if (urlQuery) setSearchQuery(urlQuery);
    if (urlSort !== "recent") setSortBy(urlSort);
    if (urlView !== "grid") setViewMode(urlView);
  }, []); // 마운트 시 한 번만 실행

  // Store → URL (상태 변경 시)
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams();

    tags.forEach((tag) => params.append("tag", tag));
    groups.forEach((group) => params.append("group", group));
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "recent") params.set("sort", sortBy);
    if (viewMode !== "grid") params.set("view", viewMode);

    const query = params.toString();
    router.push(query ? `/vault?${query}` : "/vault", { scroll: false });
  }, [tags, groups, searchQuery, sortBy, viewMode, router]);

  // 필터 변경할 때마다 URL 업데이트
  useEffect(() => {
    syncToUrl();
  }, [tags, groups, searchQuery, sortBy, viewMode, syncToUrl]);
}
