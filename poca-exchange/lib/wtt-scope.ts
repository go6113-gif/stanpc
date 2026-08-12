// -----------------------------------------------------------------------------
// WTT (Want To Trade) scope guard.
//
// The bundle_matches / trade_rooms / trade_items tables ship with the Stage-1
// migration, but WTT is P3 and stays dark through the MVP (CLAUDE.md: "테이블만
// 만들고 UI·API는 노출하지 않습니다"). This module is the single switch: any
// future route or component gates on WTT_ENABLED so turning the feature on is
// one edit, not a hunt through the codebase.
// -----------------------------------------------------------------------------

/** Flip to true only when the WTT UI and API are ready to ship. */
export const WTT_ENABLED = false;

/**
 * A pair only becomes a BundleMatch when *each* side holds at least this many
 * cards the other has flagged as wanted. Three is the point where a swap is
 * worth one round of international shipping — shipping cost is the complaint
 * in 40.9% of the trade posts in data/global_photocard_final_report.md.
 */
export const MIN_BUNDLE_MATCH_CARDS = 3;

/** Cards pinned to the top strip of a trade room before the list scrolls. */
export const MAX_PINNED_TRADE_ITEMS = 9;

export function isBundleMatchEligible(
  aToBCount: number,
  bToACount: number,
): boolean {
  return (
    aToBCount >= MIN_BUNDLE_MATCH_CARDS && bToACount >= MIN_BUNDLE_MATCH_CARDS
  );
}

/**
 * BundleMatch rows store the pair ordered so `@@unique([user_a_id, user_b_id])`
 * cannot be defeated by inserting the same two users in the opposite order.
 */
export function orderUserPair(
  userIdA: string,
  userIdB: string,
): { user_a_id: string; user_b_id: string } {
  return userIdA < userIdB
    ? { user_a_id: userIdA, user_b_id: userIdB }
    : { user_a_id: userIdB, user_b_id: userIdA };
}
