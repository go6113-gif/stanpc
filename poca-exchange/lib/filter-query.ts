// Shared URL <-> FilterState codec for the gallery explore grid. Used by the
// server page (app/gallery/page.tsx, reading the Next.js searchParams
// object) and by the client filter components (FilterBar/FilterDrawer/
// ActiveFilters, reading useSearchParams()) so both sides agree on the same
// query-param shape without duplicating parsing logic.

export type QuickFilterId = "all" | "popular" | "wishlist" | "owned" | "trade";

export const QUICK_FILTERS: QuickFilterId[] = ["all", "popular", "wishlist", "owned", "trade"];

// "wishlist"/"owned" read the signed-in user's own binder; "trade" browses
// the whole community's FOR_TRADE-flagged cards (WTT "소통 연결" browsing,
// not the disabled in-app trade room — see CLAUDE.md P3).
export const QUICK_FILTERS_REQUIRING_LOGIN: QuickFilterId[] = ["wishlist", "owned"];

export type SortId = "popular" | "price-asc" | "price-desc" | "newest";

export const SORT_OPTIONS: { id: SortId; labelKo: string }[] = [
  { id: "popular", labelKo: "인기순" },
  { id: "price-asc", labelKo: "낮은 가격순" },
  { id: "price-desc", labelKo: "높은 가격순" },
  { id: "newest", labelKo: "최신순" },
];

// "groupSlug:memberSlug" — Member.slug is only unique within its group
// (@@unique([groupId, slug])), so a bare member slug can't round-trip
// through the URL unambiguously on its own. Kept as plain `string` (not a
// `${string}:${string}` template type) since callers build these with
// ordinary template literals and don't need compile-time shape narrowing.
export type MemberFilterKey = string;

export interface FilterState {
  quick: QuickFilterId;
  groups: string[];
  members: MemberFilterKey[];
  albums: string[];
  versions: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: SortId;
}

export const EMPTY_FILTER_STATE: FilterState = {
  quick: "all",
  groups: [],
  members: [],
  albums: [],
  versions: [],
  priceMin: null,
  priceMax: null,
  sort: "popular",
};

type RawSearchParams = { [key: string]: string | string[] | undefined };

/** Adapts the Next.js server `searchParams` object into a URLSearchParams. */
export function toURLSearchParams(raw: RawSearchParams): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v) usp.append(key, v);
    }
  }
  return usp;
}

function splitCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseFilterState(usp: URLSearchParams): FilterState {
  const quickParam = usp.get("q");
  const quick: QuickFilterId = QUICK_FILTERS.includes(quickParam as QuickFilterId)
    ? (quickParam as QuickFilterId)
    : "all";

  const sortParam = usp.get("sort");
  const sort: SortId = SORT_OPTIONS.some((s) => s.id === sortParam) ? (sortParam as SortId) : "popular";

  const priceMinRaw = usp.get("priceMin");
  const priceMaxRaw = usp.get("priceMax");

  return {
    quick,
    groups: splitCsv(usp.get("group")),
    members: splitCsv(usp.get("member")).filter((m): m is MemberFilterKey => m.includes(":")),
    albums: splitCsv(usp.get("album")),
    versions: splitCsv(usp.get("version")),
    priceMin: priceMinRaw ? Number(priceMinRaw) : null,
    priceMax: priceMaxRaw ? Number(priceMaxRaw) : null,
    sort,
  };
}

/** Serializes a FilterState back into a query string (no leading "?"). */
export function serializeFilterState(state: FilterState): string {
  const usp = new URLSearchParams();
  if (state.quick !== "all") usp.set("q", state.quick);
  if (state.groups.length) usp.set("group", state.groups.join(","));
  if (state.members.length) usp.set("member", state.members.join(","));
  if (state.albums.length) usp.set("album", state.albums.join(","));
  if (state.versions.length) usp.set("version", state.versions.join(","));
  if (state.priceMin != null) usp.set("priceMin", String(state.priceMin));
  if (state.priceMax != null) usp.set("priceMax", String(state.priceMax));
  if (state.sort !== "popular") usp.set("sort", state.sort);
  return usp.toString();
}

export function hasActiveDrawerFilters(state: FilterState): boolean {
  return (
    state.groups.length > 0 ||
    state.members.length > 0 ||
    state.albums.length > 0 ||
    state.versions.length > 0 ||
    state.priceMin != null ||
    state.priceMax != null
  );
}

export function activeFilterCount(state: FilterState): number {
  return (
    state.groups.length +
    state.members.length +
    state.albums.length +
    state.versions.length +
    (state.priceMin != null || state.priceMax != null ? 1 : 0)
  );
}

export function memberKey(groupSlug: string, memberSlug: string): MemberFilterKey {
  return `${groupSlug}:${memberSlug}`;
}
