/**
 * Activity Logger - 사용자 활동 기록 유틸
 *
 * 카드 라이프사이클 이벤트를 /api/activity/heatmap으로 전송하여
 * 프로필 활동 히트맵을 실시간 업데이트합니다.
 */

export type ActivityEventType =
  | "CARD_ADDED"
  | "CARD_REMOVED"
  | "STATUS_CHANGED"
  | "TRADE_COMPLETED";

interface ActivityLogPayload {
  userId: string;
  type: ActivityEventType;
  cardId?: string;
  description?: string;
}

/**
 * 활동 로그를 서버로 전송
 *
 * @param payload - 활동 로그 데이터
 * @example
 * logActivity({
 *   userId: "user123",
 *   type: "CARD_ADDED",
 *   cardId: "card456",
 *   description: "NewJeans Hanni 포카 추가"
 * });
 */
export async function logActivity(payload: ActivityLogPayload): Promise<void> {
  try {
    const response = await fetch("/api/activity/heatmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`Activity logging failed: ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.debug("Activity logged:", result);
  } catch (error) {
    console.error("Error logging activity:", error);
    // 활동 로깅 실패는 사용자 경험을 방해하지 않도록 조용히 처리
  }
}

/**
 * 카드 추가 이벤트 로깅
 */
export async function logCardAdded(
  userId: string,
  cardId: string,
  cardName?: string
): Promise<void> {
  await logActivity({
    userId,
    type: "CARD_ADDED",
    cardId,
    description: cardName ? `카드 추가: ${cardName}` : "카드 추가",
  });
}

/**
 * 카드 제거 이벤트 로깅
 */
export async function logCardRemoved(
  userId: string,
  cardId: string,
  cardName?: string
): Promise<void> {
  await logActivity({
    userId,
    type: "CARD_REMOVED",
    cardId,
    description: cardName ? `카드 제거: ${cardName}` : "카드 제거",
  });
}

/**
 * 카드 상태 변경 이벤트 로깅
 */
export async function logStatusChanged(
  userId: string,
  cardId: string,
  newStatus: string
): Promise<void> {
  await logActivity({
    userId,
    type: "STATUS_CHANGED",
    cardId,
    description: `상태 변경: ${newStatus}`,
  });
}

/**
 * 거래 완료 이벤트 로깅
 */
export async function logTradeCompleted(
  userId: string,
  cardIds: string[]
): Promise<void> {
  await logActivity({
    userId,
    type: "TRADE_COMPLETED",
    description: `거래 완료: ${cardIds.length}장`,
  });
}
