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
// - PERSONAL: 개인 소장용 (거래 불가)
// - FOR_TRADE: 교환 가능
// - FOR_SALE: 판매 가능
// - ISO: 구하는 중 (위시리스트)
//
// 상태 전이 규칙:
// 1. PERSONAL → 다른 상태는 언제든 가능 (소장에서 거래 의사 표현)
// 2. FOR_TRADE/FOR_SALE → 다른 상태는 언제든 가능 (거래 의사 철회)
// 3. ISO → 다른 상태는 언제든 가능 (위시리스트 해제)
// 4. 증명(proof)이 없는 상태에서 PERSONAL로의 복귀는 차단됨
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

  // PERSONAL로의 전이는 증명이 필요 (실물 인증 체크)
  if (nextStatus === UserBinderCardStatus.PERSONAL && !hasProof) {
    throw new InvalidStateTransitionError(
      currentStatus,
      nextStatus,
      "PERSONAL 상태로의 변경은 실물 증명(proof)이 필요합니다"
    );
  }

  // 나머지 모든 전이는 허용
  // - PERSONAL → (FOR_TRADE | FOR_SALE | ISO)
  // - FOR_TRADE → (PERSONAL | FOR_SALE | ISO)
  // - FOR_SALE → (PERSONAL | FOR_TRADE | ISO)
  // - ISO → (PERSONAL | FOR_TRADE | FOR_SALE)
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
  // PERSONAL에서 거래 가능 상태로 전환 시 알림
  if (
    previousStatus === UserBinderCardStatus.PERSONAL &&
    (newStatus === UserBinderCardStatus.FOR_TRADE ||
      newStatus === UserBinderCardStatus.FOR_SALE)
  ) {
    return {
      shouldNotifyUser: true,
      notificationMessage: `카드가 ${newStatus === UserBinderCardStatus.FOR_TRADE ? "교환" : "판매"} 가능으로 설정되었습니다.`,
      shouldLogEvent: true,
    };
  }

  // ISO 상태로의 전환 시 알림
  if (newStatus === UserBinderCardStatus.ISO) {
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
  [UserBinderCardStatus.PERSONAL]: "개인 소장",
  [UserBinderCardStatus.FOR_TRADE]: "교환 가능",
  [UserBinderCardStatus.FOR_SALE]: "판매 가능",
  [UserBinderCardStatus.ISO]: "위시리스트",
};

// 상태에 따른 배지 색상 (Tailwind)
export const statusColors: Record<
  UserBinderCardStatus,
  string
> = {
  [UserBinderCardStatus.PERSONAL]: "bg-blue-100 text-blue-800",
  [UserBinderCardStatus.FOR_TRADE]: "bg-purple-100 text-purple-800",
  [UserBinderCardStatus.FOR_SALE]: "bg-green-100 text-green-800",
  [UserBinderCardStatus.ISO]: "bg-yellow-100 text-yellow-800",
};
