/**
 * P2P 거래글 및 매칭 관련 타입 정의
 */

export type TradeType = "WTT" | "WTS" | "WTB";
export type ContactType = "twitter" | "instagram" | "openKakao" | "discord" | "kakaoTalk";

/**
 * 거래글 생성 요청 페이로드
 * TradePostCreateModal에서 전송하는 데이터
 */
export interface TradePostCreateRequest {
  type: TradeType; // WTT: 교환, WTS: 판매, WTB: 구매희망
  offeringCardIds: string[]; // 제공할 카드 ID 배열
  seekingCardIds: string[]; // 원하는 카드 ID 배열
  price?: number; // WTS/WTB의 경우 가격
  currency?: string; // 통화 (USD, KRW 등)
  shippingFee?: number; // 배송료
  contactType: ContactType; // 연락 수단
  contactValue: string; // 연락 값 (Twitter handle, Kakao URL 등)
  userId?: string; // 로그인한 경우
  guestToken?: string; // 비회원인 경우 토큰
}

/**
 * 거래글 데이터 (DB에 저장된 형태)
 */
export interface TradePost {
  id: string;
  type: TradeType;
  userId?: string;
  guestToken?: string;
  offeringCardIds: string[]; // JSON 배열로 저장
  seekingCardIds: string[]; // JSON 배열로 저장
  price?: number;
  currency?: string;
  shippingFee?: number;
  contactType: ContactType;
  contactValue: string;
  status: "ACTIVE" | "CLOSED" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 매칭 결과 응답
 */
export interface TradeMatchResult {
  tradePostId: string;
  type: TradeType;
  matchRate: number; // 0~100
  giveCards: string[]; // 상대방이 주는 카드
  getCards: string[]; // 내가 받는 카드
  contactChannel: {
    type: ContactType;
    value: string;
  };
  createdAt: Date;
}

/**
 * 거래글 목록 조회 응답
 */
export interface TradePostListResponse {
  posts: Array<TradePost & { ownerName?: string }>;
  total: number;
  page: number;
  limit: number;
}

/**
 * 매칭 조회 응답
 */
export interface TradeMatchListResponse {
  matches: TradeMatchResult[];
  total: number;
}
