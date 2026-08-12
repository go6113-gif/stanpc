import { ReactionType } from "@/app/generated/prisma/enums";

// -----------------------------------------------------------------------------
// The 6 emotion reactions.
//
// The DB enum stores the Korean label (see the `@map`s in schema.prisma); the
// generated TypeScript uses ASCII keys. This module is the only place that
// knows the display copy, so components import the ordered list instead of
// hardcoding Korean strings — which is also what makes an i18n pass a matter of
// swapping this one table.
// -----------------------------------------------------------------------------

/**
 * Display order is fixed by CLAUDE.md and must not be reordered — the reaction
 * bar's muscle memory depends on positions staying put.
 */
export const REACTION_ORDER = [
  ReactionType.ENVY,
  ReactionType.LEGEND,
  ReactionType.RADIANT,
  ReactionType.INSANE,
  ReactionType.RESPECT,
  ReactionType.WANT_TOO,
] as const;

export const REACTION_LABELS: Record<ReactionType, string> = {
  [ReactionType.ENVY]: "부럽다",
  [ReactionType.LEGEND]: "레전드",
  [ReactionType.RADIANT]: "영롱하다",
  [ReactionType.INSANE]: "미쳤다",
  [ReactionType.RESPECT]: "리스펙",
  [ReactionType.WANT_TOO]: "나도갖고싶다",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  [ReactionType.ENVY]: "😍",
  [ReactionType.LEGEND]: "🏆",
  [ReactionType.RADIANT]: "✨",
  [ReactionType.INSANE]: "🤯",
  [ReactionType.RESPECT]: "🙇",
  [ReactionType.WANT_TOO]: "🙋",
};

export function reactionLabel(type: ReactionType): string {
  return REACTION_LABELS[type];
}

/** Narrows an untrusted string (request body, query param) to a ReactionType. */
export function isReactionType(value: unknown): value is ReactionType {
  return (
    typeof value === "string" &&
    (REACTION_ORDER as readonly string[]).includes(value)
  );
}
