"use server";

import { prisma } from "@/lib/prisma";
import {
  validateTransition,
  InvalidStateTransitionError,
  getPostTransitionActions,
} from "@/lib/state-machine/inventory";
import { UserBinderCardStatus } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export type InventoryActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 포토카드를 바인더에 추가
 */
export async function addCardToVault(
  userId: string,
  cardId: string,
  status: UserBinderCardStatus = UserBinderCardStatus.OWNED,
  note?: string
): Promise<InventoryActionResult<{ id: string; status: string }>> {
  try {
    // 이미 존재하는 항목 확인
    const existing = await prisma.userBinderCard.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "이미 바인더에 추가된 카드입니다",
      };
    }

    // 새 항목 생성
    const binderCard = await prisma.userBinderCard.create({
      data: {
        userId,
        cardId,
        status,
        note,
      },
      select: {
        id: true,
        status: true,
      },
    });

    revalidatePath("/inventory");

    return {
      success: true,
      data: {
        id: binderCard.id,
        status: binderCard.status,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 바인더 카드 상태 변경
 */
export async function updateCardStatus(
  binderCardId: string,
  newStatus: UserBinderCardStatus,
  hasProof: boolean = false
): Promise<InventoryActionResult<{ id: string; status: string }>> {
  try {
    // 현재 카드 조회
    const currentCard = await prisma.userBinderCard.findUnique({
      where: { id: binderCardId },
      select: {
        id: true,
        status: true,
        userId: true,
      },
    });

    if (!currentCard) {
      return {
        success: false,
        error: "카드를 찾을 수 없습니다",
      };
    }

    // 상태 전이 검증
    try {
      validateTransition(currentCard.status, newStatus, hasProof);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        return {
          success: false,
          error: error.message,
        };
      }
      throw error;
    }

    // 상태 업데이트
    const updated = await prisma.userBinderCard.update({
      where: { id: binderCardId },
      data: { status: newStatus },
      select: {
        id: true,
        status: true,
      },
    });

    // 상태 전이 후 액션 실행
    const postActions = getPostTransitionActions(currentCard.status, newStatus);
    if (postActions.shouldLogEvent) {
      // TODO: 향후 이벤트 로깅 시스템으로 확장
      console.log(
        `[InventoryEvent] User ${currentCard.userId} changed card ${binderCardId} from ${currentCard.status} to ${newStatus}`
      );
    }

    revalidatePath("/inventory");

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 바인더에서 카드 제거
 */
export async function removeCardFromVault(
  binderCardId: string
): Promise<InventoryActionResult<{ id: string }>> {
  try {
    const deleted = await prisma.userBinderCard.delete({
      where: { id: binderCardId },
      select: { id: true },
    });

    revalidatePath("/inventory");

    return {
      success: true,
      data: { id: deleted.id },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 바인더 카드 메모 업데이트
 */
export async function updateCardNote(
  binderCardId: string,
  note: string | null
): Promise<InventoryActionResult<{ id: string; note: string | null }>> {
  try {
    const updated = await prisma.userBinderCard.update({
      where: { id: binderCardId },
      data: { note },
      select: {
        id: true,
        note: true,
      },
    });

    revalidatePath("/inventory");

    return {
      success: true,
      data: {
        id: updated.id,
        note: updated.note,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 사용자의 모든 바인더 카드 조회 (상태별 필터링 가능)
 */
export async function getUserBinderCards(
  userId: string,
  filterStatus?: UserBinderCardStatus
): Promise<
  InventoryActionResult<
    Array<{
      id: string;
      status: UserBinderCardStatus;
      note: string | null;
      card: {
        id: string;
        slug: string;
        cardName: string | null;
        imageUrl: string | null;
        thumbImagePath: string | null;
      };
      createdAt: Date;
    }>
  >
> {
  try {
    const cards = await prisma.userBinderCard.findMany({
      where: {
        userId,
        ...(filterStatus && { status: filterStatus }),
      },
      select: {
        id: true,
        status: true,
        note: true,
        card: {
          select: {
            id: true,
            slug: true,
            cardName: true,
            imageUrl: true,
            thumbImagePath: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: cards,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 바인더 카드 통계 조회
 */
export async function getInventoryStats(userId: string): Promise<
  InventoryActionResult<{
    total: number;
    owned: number;
    wtt: number;
    wts: number;
    wtb: number;
  }>
> {
  try {
    const cards = await prisma.userBinderCard.findMany({
      where: { userId },
      select: { status: true },
    });

    const stats = {
      total: cards.length,
      owned: cards.filter((c) => c.status === UserBinderCardStatus.OWNED)
        .length,
      wtt: cards.filter((c) => c.status === UserBinderCardStatus.WTT)
        .length,
      wts: cards.filter((c) => c.status === UserBinderCardStatus.WTS)
        .length,
      wtb: cards.filter((c) => c.status === UserBinderCardStatus.WTB).length,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}
