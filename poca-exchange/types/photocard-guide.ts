// Tab 1 (Guide) data contract for PhotocardDetailModal. Fields not yet
// backed by a real data source (originStory, valuation, officialSources,
// userContributionsCount) are typed as nullable/empty rather than fake —
// see lib/photocard-guide.ts for what's actually populated today vs. left
// for a future Wiki/AI-content pipeline.

export type RarityGrade = "COMMON" | "RARE" | "POB" | "ULTRA_RARE";

export interface PhotocardDimensions {
  width: number; // mm
  height: number; // mm
}

export interface PhotocardGuideSpec {
  groupName: string;
  memberName: string | null;
  albumTitle: string | null;
  releaseDate: string | null; // ISO date string, or null if unknown
  version: string | null; // "Standard Ver.", "Weverse MD", "Photobook Ver." 등
  pobSource: string | null; // 특전 출처 — 현재 스키마엔 별도 필드가 없어 version에서 유추
  dimensions: PhotocardDimensions;
  recommendedSleeve: string; // e.g. "56×87mm 표준 슬리브"
  rarityGrade: RarityGrade;
}

export interface PhotocardOriginStory {
  summary: string;
  mediaLinks: { label: string; url: string }[];
}

export type ValuationTrend = "UP" | "DOWN" | "STABLE";

export interface PhotocardValuation {
  summaryKo: string;
  trend: ValuationTrend;
}

export interface PhotocardGuide {
  cardSlug: string;
  spec: PhotocardGuideSpec;
  // null until the Wiki/AI-content pipeline exists — Tab 1 renders an empty
  // state + 제보 CTA rather than inventing narrative copy.
  originStory: PhotocardOriginStory | null;
  // null until enough PriceHistory rows exist to summarize a trend.
  valuation: PhotocardValuation | null;
  officialSources: { label: string; url: string }[];
  userContributionsCount: number;
}
