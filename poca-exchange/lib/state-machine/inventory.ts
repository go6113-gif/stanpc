// 이 모듈은 클라이언트 컴포넌트에서도 import되므로, 쿼리 엔진을 포함하는
// 무거운 "@/app/generated/prisma/client" 대신 순수 상수만 담은 enums.ts를
// 사용한다. client.ts에서 가져오면 Turbopack이 pg/node:module 등 서버 전용
// 의존성을 브라우저 청크에 포함하려다 패닉한다.
import { UserBinderCardStatus } from "@/app/generated/prisma/enums";

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly currentStatus: UserBinderCardStatus,
    public readonly nextStatus: UserBinderCardStatus,
    public readonly reason: string
  ) {
    super(
      `Cannot transition from ${currentStatus} to ${nextStatus}: ${reason}`
    );
    this.name = "InvalidStateTransitionError";
  }
}

// 4단계 상태 전이 규칙 검증
// - OWNED: 개인 소장용 (거래 불가)
// - WTT: 교환 가능 (Want To Trade)
// - WTS: 판매 가능 (Want To Sell)
// - WTB: 구매 중 (Want To Buy, 위시리스트)
//
// 상태 전이 규칙:
// 1. OWNED → 다른 상태는 언제든 가능 (소장에서 거래 의사 표현)
// 2. WTT/WTS → 다른 상태는 언제든 가능 (거래 의사 철회)
// 3. WTB → 다른 상태는 언제든 가능 (위시리스트 해제)
// 4. 증명(proof)이 없는 상태에서 OWNED로의 복귀는 차단됨
//    (실물 확보의 증거가 필요하므로, hasProof가 true여야 함)
export function validateTransition(
  currentStatus: UserBinderCardStatus,
  nextStatus: UserBinderCardStatus,
  hasProof: boolean = false
): void {
  // 같은 상태로의 전이는 허용 (no-op)
  if (currentStatus === nextStatus) {
    return;
  }

  // OWNED로의 전이는 증명이 필요 (실물 인증 체크)
  if (nextStatus === UserBinderCardStatus.OWNED && !hasProof) {
    throw new InvalidStateTransitionError(
      currentStatus,
      nextStatus,
      "OWNED 상태로의 변경은 실물 증명(proof)이 필요합니다"
    );
  }

  // 나머지 모든 전이는 허용
  // - OWNED → (WTT | WTS | WTB)
  // - WTT → (OWNED | WTS | WTB)
  // - WTS → (OWNED | WTT | WTB)
  // - WTB → (OWNED | WTT | WTS)
}

// 상태 전이 후 권장 액션 반환
export function getPostTransitionActions(
  previousStatus: UserBinderCardStatus,
  newStatus: UserBinderCardStatus
): {
  shouldNotifyUser: boolean;
  notificationMessage?: string;
  shouldLogEvent: boolean;
} {
  // OWNED에서 거래 가능 상태로 전환 시 알림
  if (
    previousStatus === UserBinderCardStatus.OWNED &&
    (newStatus === UserBinderCardStatus.WTT ||
      newStatus === UserBinderCardStatus.WTS)
  ) {
    return {
      shouldNotifyUser: true,
      notificationMessage: `카드가 ${newStatus === UserBinderCardStatus.WTT ? "교환" : "판매"} 가능으로 설정되었습니다.`,
      shouldLogEvent: true,
    };
  }

  // WTB 상태로의 전환 시 알림
  if (newStatus === UserBinderCardStatus.WTB) {
    return {
      shouldNotifyUser: true,
      notificationMessage: "카드가 위시리스트에 추가되었습니다.",
      shouldLogEvent: true,
    };
  }

  return {
    shouldNotifyUser: false,
    shouldLogEvent: true,
  };
}

// 상태에 따른 표시 텍스트
export const statusLabels: Record<UserBinderCardStatus, string> = {
  [UserBinderCardStatus.OWNED]: "소유 중",
  [UserBinderCardStatus.WTT]: "교환 중",
  [UserBinderCardStatus.WTS]: "판매 중",
  [UserBinderCardStatus.WTB]: "구매 중",
};

// 상태에 따른 배지 색상 (Tailwind)
export const statusColors: Record<
  UserBinderCardStatus,
  string
> = {
  [UserBinderCardStatus.OWNED]: "bg-blue-100 text-blue-800",
  [UserBinderCardStatus.WTT]: "bg-purple-100 text-purple-800",
  [UserBinderCardStatus.WTS]: "bg-green-100 text-green-800",
  [UserBinderCardStatus.WTB]: "bg-yellow-100 text-yellow-800",
};
