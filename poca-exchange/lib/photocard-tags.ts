// Card-type/category tagging shared by the landing page's card-type filter
// (FilterDrawer, FilterChips) and InstantMultiSearch's mega-dropdown
// "포카 종류" column. One taxonomy so a tag picked from either UI filters
// the same grid state and reads back consistently in the other UI.
export type CardTag =
  | "type-standard"
  | "type-pob"
  | "type-hologram"
  | "type-rare"
  | "tag-lucky-draw"
  | "tag-fanmeet"
  | "tag-season-greeting"
  | "tag-album";

export const CARD_TAG_LABELS: Record<CardTag, string> = {
  "type-standard": "스탠다드",
  "type-pob": "팬 회원 특전 (POB)",
  "type-hologram": "홀로그램",
  "type-rare": "레어",
  "tag-lucky-draw": "럭키드로우",
  "tag-fanmeet": "팬싸 / 공방 포카",
  "tag-season-greeting": "시즌그리팅",
  "tag-album": "앨범 포카",
};

export const CARD_TAG_LIST = Object.keys(CARD_TAG_LABELS) as CardTag[];

interface TaggableCard {
  version?: string | null;
  albumTitle?: string | null;
  badge?: string | null;
  cardName?: string | null;
}

// Best-effort client-side classification from already-fetched fields (no DB
// schema for this) — matches keywords against version/badge/cardName text.
export function inferCardTags(card: TaggableCard): Set<CardTag> {
  const tags = new Set<CardTag>();
  const haystack = [card.version, card.badge, card.cardName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const luckyDrawKeywords = ["lucky draw", "럭키드로우", "랜덤드로우"];
  const pobKeywords = ["pob", "weverse", "soundwave", "makestar", "공방", "특전"];
  const fanmeetKeywords = ["fanmeet", "팬싸", "팬사인회", "공방"];
  const seasonGreetingKeywords = ["season greeting", "시즌그리팅", "다이어리", "캘린더"];

  if (luckyDrawKeywords.some((kw) => haystack.includes(kw))) {
    tags.add("tag-lucky-draw");
  } else if (pobKeywords.some((kw) => haystack.includes(kw))) {
    tags.add("type-pob");
  }

  if (haystack.includes("hologram") || haystack.includes("홀로그램")) tags.add("type-hologram");
  if (haystack.includes("rare") || haystack.includes("limited") || haystack.includes("레어")) tags.add("type-rare");
  if (fanmeetKeywords.some((kw) => haystack.includes(kw))) tags.add("tag-fanmeet");
  if (seasonGreetingKeywords.some((kw) => haystack.includes(kw))) tags.add("tag-season-greeting");
  if (card.albumTitle) tags.add("tag-album");

  if (tags.size === 0) tags.add("type-standard");

  return tags;
}
