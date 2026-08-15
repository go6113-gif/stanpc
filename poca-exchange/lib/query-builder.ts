/**
 * Query Builder — Generate search keywords for multiple marketplaces
 * Input: Artist (한/영), Member (한/영), Album, Version
 * Output: Korean keywords (Naver/Bunjang) + English keywords (eBay)
 */

export interface ArtistInput {
  nameKr?: string;
  nameEn: string;
}

export interface MemberInput {
  nameKr?: string;
  nameEn: string;
}

export interface AlbumInput {
  title: string;
  titleEn?: string;
}

export interface QueryBuilderInput {
  artist: ArtistInput;
  member: MemberInput;
  album: AlbumInput;
  version?: string;
}

export interface QueryBuilderOutput {
  /** Korean query for Naver/Bunjang (e.g., "스트레이키즈 리노 GO생 포토카드") */
  kr: string;
  /** English query for eBay (e.g., "Stray Kids Lino GO生 photocard") */
  en: string;
}

/**
 * Build search queries for different marketplaces.
 * Korean query prioritizes actual product titles to avoid noise filtering.
 * English query includes phonetic names and standard "photocard" format.
 */
export function buildQueries(input: QueryBuilderInput): QueryBuilderOutput {
  const { artist, member, album, version } = input;

  // Use Korean names if available; fall back to English
  const artistNameKr = artist.nameKr || artist.nameEn;
  const memberNameKr = member.nameKr || member.nameEn;
  const albumTitle = album.title || album.titleEn || '';

  // Korean query: [아티스트] [멤버] [앨범명] [버전] 포토카드
  // Order matches typical seller listings to avoid noise patterns
  const krParts = [artistNameKr, memberNameKr];
  if (albumTitle) {
    krParts.push(albumTitle);
  }
  if (version) {
    krParts.push(version);
  }
  krParts.push('포토카드');
  const kr = krParts.filter(p => p && p.trim()).join(' ');

  // English query: [Artist_EN] [Member_EN] [Album] photocard
  // Include version if present (e.g., "Photobook Ver.", "POB")
  const enParts = [artist.nameEn, member.nameEn];
  if (album.titleEn || album.title) {
    enParts.push(album.titleEn || album.title);
  }
  if (version) {
    enParts.push(version);
  }
  enParts.push('photocard');
  const en = enParts.filter(p => p && p.trim()).join(' ');

  return { kr, en };
}

/**
 * Batch build queries for multiple cards.
 * Useful for generating search manifests before pipeline execution.
 */
export function buildQueriesBatch(
  inputs: QueryBuilderInput[],
): QueryBuilderOutput[] {
  return inputs.map(buildQueries);
}
