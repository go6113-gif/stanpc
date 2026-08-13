export interface SearchArtist {
  id: string;
  type: "artist";
  nameKo: string;
  nameEn: string;
  image?: string;
  aliases?: string[];
}

export interface SearchAlbum {
  id: string;
  type: "album";
  title: string;
  groupName: string;
  releaseDate?: string;
  image?: string;
}

export interface SearchPhotocard {
  id: string;
  type: "photocard";
  cardName: string;
  groupName: string;
  memberName?: string;
  source?: string; // "위버스", "사운드웨이브" 등
  image?: string;
}

export type SearchResult = SearchArtist | SearchAlbum | SearchPhotocard;

export interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: string[];
  selectedIndex: number;
}
