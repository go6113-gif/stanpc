/**
 * Binder Analytics & Valuation Engine
 * 바인더 컬렉션의 완성도, 자산 가치, 멤버 랭킹을 계산합니다.
 */

import { BinderCard } from "@/store/useBinderStore";

/**
 * 카드 타입별 기본 가격 (fallback)
 * 실제 marketPrice가 없을 때 사용
 */
const CARD_TYPE_PRICES: Record<string, number> = {
  "type-album": 5000,        // 앨범 (기본)
  "type-pob": 15000,          // POB
  "type-hologram": 25000,     // 럭드/홀로그램
  "type-rare": 35000,         // 희귀
  "type-standard": 3000,      // 스탠다드
};

export interface BinderStats {
  completionPercentage: number;  // 0-100
  totalCardsOwned: number;
  totalCardsAvailable: number;
  totalValueKRW: number;
  totalValueUSD: number;
  topMembers: Array<{
    memberName: string;
    ownedCount: number;
    percentage: number;
  }>;
}

/**
 * 카드 타입 추론 (버전/스펙 기반)
 * TODO: 실제 데이터가 들어오면 이 로직을 업데이트하세요
 */
function inferCardPrice(card: BinderCard): number {
  // 현재는 기본 가격 반환, 향후 marketPrice 필드 추가 시 사용
  const defaultPrice = CARD_TYPE_PRICES["type-standard"];
  return defaultPrice;
}

/**
 * 바인더 통계 계산
 * @param ownedCards 사용자 보유 카드 배열
 * @param allAvailableCards 전체 카탈로그 카드 배열 (선택사항)
 * @returns 바인더 통계
 */
export function calculateBinderStats(
  ownedCards: BinderCard[],
  allAvailableCards?: BinderCard[]
): BinderStats {
  // 보유 카드 수
  const totalCardsOwned = ownedCards.length;

  // 전체 사용 가능 카드 수 (제공된 경우) 또는 보유 카드 기반 추정
  const totalCardsAvailable = allAvailableCards?.length || Math.max(totalCardsOwned * 3, 1);

  // 완성도 계산
  const completionPercentage = Math.min(
    (totalCardsOwned / totalCardsAvailable) * 100,
    100
  );

  // 총자산 가치 계산 (KRW)
  const totalValueKRW = ownedCards.reduce((sum, card) => {
    const price = inferCardPrice(card);
    return sum + price;
  }, 0);

  // USD 변환 (1 USD = 1,200 KRW 가정, 실제로는 환율 API 사용)
  const totalValueUSD = Math.round(totalValueKRW / 1200);

  // 멤버별 분석
  const memberMap = new Map<string, number>();
  ownedCards.forEach((card) => {
    if (card.memberName) {
      memberMap.set(card.memberName, (memberMap.get(card.memberName) || 0) + 1);
    }
  });

  // Top 멤버 랭킹
  const topMembers = Array.from(memberMap.entries())
    .map(([memberName, count]) => ({
      memberName,
      ownedCount: count,
      percentage: (count / totalCardsOwned) * 100,
    }))
    .sort((a, b) => b.ownedCount - a.ownedCount)
    .slice(0, 5);  // Top 5

  return {
    completionPercentage: Math.round(completionPercentage * 10) / 10,
    totalCardsOwned,
    totalCardsAvailable,
    totalValueKRW,
    totalValueUSD,
    topMembers,
  };
}

/**
 * 그룹별 완성도 계산
 * @param ownedCards 보유 카드
 * @param groupName 그룹명
 * @param allCardsInGroup 해당 그룹의 전체 카드
 */
export function calculateGroupCompletion(
  ownedCards: BinderCard[],
  groupName: string,
  allCardsInGroup: BinderCard[]
): {
  completion: number;
  owned: number;
  total: number;
} {
  const owned = ownedCards.filter(c => c.groupName === groupName).length;
  const total = allCardsInGroup.length || 1;

  return {
    completion: Math.min((owned / total) * 100, 100),
    owned,
    total,
  };
}

/**
 * 멤버별 완성도 계산
 */
export function calculateMemberCompletion(
  ownedCards: BinderCard[],
  memberName: string,
  allCardsOfMember: BinderCard[]
): {
  completion: number;
  owned: number;
  total: number;
} {
  const owned = ownedCards.filter(c => c.memberName === memberName).length;
  const total = allCardsOfMember.length || 1;

  return {
    completion: Math.min((owned / total) * 100, 100),
    owned,
    total,
  };
}
