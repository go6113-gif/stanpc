import type { Prisma } from "@/app/generated/prisma/client";
import type { PhotocardGuide, RarityGrade } from "@/types/photocard-guide";

export type PhotocardGuideSource = Prisma.PhotoCardGetPayload<{
  include: { group: true; member: true; album: true; priceHistory: true };
}>;

// Every PhotoCard shares one physical spec today (no per-card override
// field exists yet) — matches CARD_DIMENSIONS.standard in
// app/api/vault/route.ts and SleeveCompatibilityGuide's default.
const STANDARD_DIMENSIONS = { width: 56, height: 87 } as const;

const POB_KEYWORDS = ["pob", "weverse", "soundwave", "makestar", "공방", "특전", "럭키드로우"];

// PhotoCard.version is freeform (e.g. "Weverse MD", "Standard Ver.",
// "POB") and doubles as the only signal for "특전 출처" — the schema has
// no separate structured source field. Surfaced as pobSource only when it
// actually looks like a source/POB descriptor, so the guide doesn't claim
// a source that isn't really there.
function inferPobSource(version: string | null): string | null {
  if (!version) return null;
  const lower = version.toLowerCase();
  return POB_KEYWORDS.some((kw) => lower.includes(kw)) ? version : null;
}

// badge is editorial freeform text (see lib/mock-photocards.ts for the
// values actually in use: "Hologram", "Signed", "Rare", "Limited").
function inferRarityGrade(badge: string | null, version: string | null): RarityGrade {
  const badgeLower = badge?.toLowerCase() ?? "";
  if (badgeLower.includes("hologram") || badgeLower.includes("signed")) return "ULTRA_RARE";
  if (inferPobSource(version)) return "POB";
  if (badgeLower.includes("rare") || badgeLower.includes("limited")) return "RARE";
  return "COMMON";
}

/** Builds the Tab 1 (Guide) view model from a PhotoCard row. Fields with no
 * backing data source today (originStory, valuation, officialSources,
 * userContributionsCount) are left null/empty rather than fabricated. */
export function buildPhotocardGuide(card: PhotocardGuideSource): PhotocardGuide {
  const dimensions = STANDARD_DIMENSIONS;

  return {
    cardSlug: card.slug,
    spec: {
      groupName: card.group.nameKr ?? card.group.nameEn,
      memberName: card.member ? (card.member.nameKr ?? card.member.nameEn) : null,
      albumTitle: card.album?.title ?? null,
      releaseDate: card.album?.releaseDate?.toISOString() ?? null,
      version: card.version,
      pobSource: inferPobSource(card.version),
      dimensions,
      recommendedSleeve: `${dimensions.width}×${dimensions.height}mm 표준 슬리브`,
      rarityGrade: inferRarityGrade(card.badge, card.version),
    },
    originStory: null,
    valuation: null,
    officialSources: [],
    userContributionsCount: 0,
  };
}
