import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// Collector Index ("덕력 포인트")
//
// index = (completed templates x weight)
//       + (physically verified cards x weight)
//       + (rare cards x weight)
//
// The result is cached on User.collector_index. Nothing here writes to the
// database — recompute, compare, then persist via `persistCollectorIndex` so a
// read path can never accidentally mutate a user's score.
// -----------------------------------------------------------------------------

/**
 * Weights are ordered by how much effort each signal represents, not by how
 * many rows it produces. Finishing a binder template is the rarest and most
 * deliberate act, so it dominates; owning a rare card is mostly luck/market
 * access, so it counts once.
 *
 * Tuned to keep a "serious collector" (2 finished templates, ~60 verified
 * cards, ~15 rares) around 415 — high enough to be worth chasing, low enough
 * that a single lucky pull does not leapfrog months of collecting.
 */
export const COLLECTOR_INDEX_WEIGHTS = {
  completedTemplate: 50,
  verifiedCard: 5,
  rareCard: 1,
} as const;

export interface CollectorIndexInput {
  /** Binder templates the user has filled every slot of. */
  completedTemplates: number;
  /** Cards held "In Hand" — i.e. the user has the physical copy. */
  verifiedCards: number;
  /** Cards carrying an editorial rarity badge. */
  rareCards: number;
}

export interface CollectorIndexBreakdown extends CollectorIndexInput {
  completedTemplatePoints: number;
  verifiedCardPoints: number;
  rareCardPoints: number;
  total: number;
}

/**
 * The binder tag that means "I physically own this card". Binder tags are a
 * free-form String[] on UserBinderCard, so this constant is the single place
 * that pins the spelling used for scoring.
 */
export const IN_HAND_TAG = "In Hand";

/** Negative or fractional counts are always a caller bug — clamp, don't throw. */
function normalize(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

/** Pure calculator. Takes counts, returns a score — no I/O, trivially testable. */
export function calculateCollectorIndex(input: CollectorIndexInput): number {
  return collectorIndexBreakdown(input).total;
}

/**
 * Same computation as `calculateCollectorIndex`, but keeps the per-signal
 * subtotals so the profile page can show *why* a score is what it is.
 */
export function collectorIndexBreakdown(
  input: CollectorIndexInput,
): CollectorIndexBreakdown {
  const completedTemplates = normalize(input.completedTemplates);
  const verifiedCards = normalize(input.verifiedCards);
  const rareCards = normalize(input.rareCards);

  const completedTemplatePoints =
    completedTemplates * COLLECTOR_INDEX_WEIGHTS.completedTemplate;
  const verifiedCardPoints = verifiedCards * COLLECTOR_INDEX_WEIGHTS.verifiedCard;
  const rareCardPoints = rareCards * COLLECTOR_INDEX_WEIGHTS.rareCard;

  return {
    completedTemplates,
    verifiedCards,
    rareCards,
    completedTemplatePoints,
    verifiedCardPoints,
    rareCardPoints,
    total: completedTemplatePoints + verifiedCardPoints + rareCardPoints,
  };
}

/**
 * Counts the scoring signals for one user out of the tables that exist today.
 *
 * `completedTemplates` is passed in rather than counted: binder templates are
 * part of P1 (My Vault) and have no table yet. Once BinderTemplate lands, this
 * function counts them and the parameter goes away — callers that already pass
 * 0 keep working.
 */
export async function collectCollectorIndexSignals(
  userId: string,
  completedTemplates = 0,
): Promise<CollectorIndexInput> {
  const [verifiedCards, rareCards] = await Promise.all([
    prisma.userBinderCard.count({
      where: { userId, tags: { has: IN_HAND_TAG } },
    }),
    // "Rare" is whatever the editors badged — `badge` is null for the vast
    // majority of cards, so a non-null badge is the rarity signal.
    prisma.userBinderCard.count({
      where: {
        userId,
        tags: { has: IN_HAND_TAG },
        card: { badge: { not: null } },
      },
    }),
  ]);

  return { completedTemplates, verifiedCards, rareCards };
}

/**
 * Recomputes a user's index from the database and writes the cached value.
 * Returns the breakdown so the caller can surface it without a second query.
 */
export async function persistCollectorIndex(
  userId: string,
  completedTemplates = 0,
): Promise<CollectorIndexBreakdown> {
  const signals = await collectCollectorIndexSignals(userId, completedTemplates);
  const breakdown = collectorIndexBreakdown(signals);

  await prisma.user.update({
    where: { id: userId },
    data: { collectorIndex: breakdown.total },
  });

  return breakdown;
}
