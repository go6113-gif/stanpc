/**
 * P2P 교환 매칭 엔진
 * 두 유저/거래글 간의 Have/Wish 교차 일치율을 계산합니다.
 *
 * 계산 규칙:
 * - (User A의 Have ∩ User B의 Wish) AND (User B의 Have ∩ User A의 Wish)
 * - 양방향 교환 카드가 모두 존재할 경우 기본 85% 이상 부여
 * - 완벽 일치 시 100% 부여
 */

export interface MatchScoreInput {
  haveA: Set<string>;
  wishA: Set<string>;
  haveB: Set<string>;
  wishB: Set<string>;
}

/**
 * 두 유저 간 교환 가능성을 0~100% 점수로 계산합니다.
 *
 * @param input - 양방향 Have/Wish 집합
 * @returns 0~100 사이의 매칭 점수
 */
export function calculateMatchScore(input: MatchScoreInput): number {
  const { haveA, wishA, haveB, wishB } = input;

  // A가 가진 카드 중 B가 원하는 것
  const aToB = new Set(
    Array.from(haveA).filter((cardId) => wishB.has(cardId))
  );

  // B가 가진 카드 중 A가 원하는 것
  const bToA = new Set(
    Array.from(haveB).filter((cardId) => wishA.has(cardId))
  );

  const aToBCount = aToB.size;
  const bToACount = bToA.size;

  // 양방향 교환이 불가능한 경우
  if (aToBCount === 0 || bToACount === 0) {
    return 0;
  }

  // 양방향 교환이 가능한 경우
  // 최소 기본 점수: 85%
  const baseScore = 85;

  // 카드 수가 정확히 일치하면 10점 보너스
  const balanceBonus = aToBCount === bToACount ? 10 : 0;

  // 더 많은 카드가 매칭될수록 높은 점수 (최대 5점)
  const countBonus = Math.min(5, Math.floor((aToBCount + bToACount) / 4));

  const totalScore = Math.min(100, baseScore + balanceBonus + countBonus);

  return totalScore;
}

/**
 * 카드 ID 배열을 Set으로 변환합니다.
 * 중복 제거 및 null/undefined 필터링.
 */
export function cardArrayToSet(cardIds: (string | null | undefined)[]): Set<string> {
  return new Set(cardIds.filter((id): id is string => Boolean(id)));
}

/**
 * 두 집합 간의 교차 원소 개수를 반환합니다.
 */
export function getIntersectionCount(setA: Set<string>, setB: Set<string>): number {
  return Array.from(setA).filter((id) => setB.has(id)).length;
}

/**
 * 거래글 쌍의 매칭 정보를 계산합니다.
 */
export interface TradePostMatch {
  tradePostAId: string;
  tradePostBId: string;
  matchScore: number;
  giveCardsAToB: string[];
  giveCardsBToA: string[];
}

export function calculateTradePostMatch(
  postA: { offering: string[]; seeking: string[] },
  postB: { offering: string[]; seeking: string[] }
): TradePostMatch {
  const haveA = cardArrayToSet(postA.offering);
  const wishA = cardArrayToSet(postA.seeking);
  const haveB = cardArrayToSet(postB.offering);
  const wishB = cardArrayToSet(postB.seeking);

  const score = calculateMatchScore({ haveA, wishA, haveB, wishB });

  const giveCardsAToB = Array.from(haveA).filter((id) => wishB.has(id));
  const giveCardsBToA = Array.from(haveB).filter((id) => wishA.has(id));

  return {
    tradePostAId: "",
    tradePostBId: "",
    matchScore: score,
    giveCardsAToB,
    giveCardsBToA,
  };
}
