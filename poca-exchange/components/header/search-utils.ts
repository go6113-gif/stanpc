import type { SearchResult, SearchArtist, SearchAlbum, SearchPhotocard } from "./search-types";

export function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim();
}

export function matchesSearchQuery(
  query: string,
  texts: (string | undefined)[]
): boolean {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return false;

  return texts.some((text) => {
    if (!text) return false;
    return text.toLowerCase().includes(normalized);
  });
}

export function searchArtists(
  query: string,
  artists: SearchArtist[]
): SearchArtist[] {
  if (!query.trim()) return [];

  return artists.filter((artist) =>
    matchesSearchQuery(query, [
      artist.nameKo,
      artist.nameEn,
      ...(artist.aliases || []),
    ])
  );
}

export function searchAlbums(
  query: string,
  albums: SearchAlbum[]
): SearchAlbum[] {
  if (!query.trim()) return [];

  return albums.filter((album) =>
    matchesSearchQuery(query, [album.title, album.groupName])
  );
}

export function searchPhotocards(
  query: string,
  photocards: SearchPhotocard[]
): SearchPhotocard[] {
  if (!query.trim()) return [];

  return photocards.filter((card) =>
    matchesSearchQuery(query, [
      card.cardName,
      card.groupName,
      card.memberName,
      card.source,
    ])
  );
}

export function combineSearchResults(
  query: string,
  artists: SearchArtist[],
  albums: SearchAlbum[],
  photocards: SearchPhotocard[]
): SearchResult[] {
  const results: SearchResult[] = [];

  results.push(...searchArtists(query, artists));
  results.push(...searchAlbums(query, albums));
  results.push(...searchPhotocards(query, photocards));

  return results;
}

export function getRecentSearches(maxCount: number = 5): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("stanpc_recent_searches");
  if (!stored) return [];

  try {
    const parsed: string[] = JSON.parse(stored);
    return parsed.slice(0, maxCount);
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const normalized = query.trim();
  if (!normalized) return;

  const stored = localStorage.getItem("stanpc_recent_searches");
  const searches: string[] = stored ? JSON.parse(stored) : [];

  const filtered = searches.filter((s) => s !== normalized);
  filtered.unshift(normalized);

  localStorage.setItem("stanpc_recent_searches", JSON.stringify(filtered.slice(0, 10)));
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("stanpc_recent_searches");
}
