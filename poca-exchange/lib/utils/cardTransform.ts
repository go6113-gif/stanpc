/**
 * Prisma UserBinderCard → Zustand BinderCard 변환
 *
 * DB에서 조회한 UserBinderCard 데이터를 Zustand store 형식으로 변환합니다.
 */

import { BinderCard } from "@/store/useBinderStore";

/**
 * Prisma의 UserBinderCard 배열을 Zustand BinderCard 배열로 변환
 *
 * @param userBinderCards - DB에서 include를 통해 조회한 UserBinderCard 배열
 * @returns BinderCard 배열 (Zustand store에 저장 가능한 형식)
 */
export function transformUserBinderCardsToBinderCards(
  userBinderCards: any[]
): BinderCard[] {
  return userBinderCards
    .filter(ubc => ubc.card && ubc.card.group) // group이 있는 카드만
    .map((ubc) => ({
      cardId: ubc.card.id,
      cardName: ubc.card.cardName || ubc.card.slug,
      groupName: ubc.card.group?.nameEn || "Unknown",
      memberName: ubc.card.member?.nameEn,
      imageUrl: ubc.card.imageUrl || ubc.card.thumbImagePath || undefined,
      addedAt: ubc.createdAt.getTime(),
    }));
}
