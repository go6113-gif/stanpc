/**
 * Messenger Share Engine — 글로벌 2-Track 바이럴 & 다이렉트 메신저 공유
 * 국가별/메신저별 최적화 포맷으로 거래 정보를 공유합니다.
 */

export interface TradeShareData {
  myCard?: string;        // 내 포카 (e.g., "HANNI 포토카드")
  wishCard?: string;      // 위시 포카 (e.g., "MINJI 포토카드")
  username?: string;      // 유저명
  tradeId?: string;       // 거래 ID
  memberName?: string;    // 아티스트 멤버명
  artistName?: string;    // 아티스트명
  wttMembers?: string[];  // WTT 희망 멤버 목록
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stanpc.com";

/**
 * KakaoTalk (한국 발원지 포맷)
 * 오픈채팅에 최적화된 텍스트 포맷
 */
export function copyKakaoOpenChatFormat(tradeData: TradeShareData): boolean {
  const {
    myCard = "포토카드",
    wishCard = "원하는 포카",
    username = "user",
    tradeId = "trade123",
  } = tradeData;

  const text = `[StanPC 교환] ${myCard} ↔ ${wishCard}
상세 바인더: ${SITE_URL}/vault/${username}?trade=${tradeId}

🔄 StanPC에서 안전하게 포카 교환하세요!`;

  // 클립보드에 복사
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback: textarea를 통한 복사
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  const result = document.execCommand("copy");
  document.body.removeChild(textarea);
  return result;
}

/**
 * LINE (일본/대만/동남아 포맷)
 * 일본 팬덤 교환 양식에 맞춘 URL
 */
export function getLineShareUrl(tradeData: TradeShareData): string {
  const {
    memberName = "Member",
    artistName = "Artist",
    wishCard = "Card",
    tradeId = "trade123",
  } = tradeData;

  // LINE 교환 양식: 【交換/譲渡】{Artist} {Member} ⇄ {WishMember}
  const text = `【交換/譲渡】${artistName} ${memberName} ⇄ ${wishCard}
🔗 ${SITE_URL}/t/${tradeId}`;

  const encodedText = encodeURIComponent(text);
  return `https://line.me/R/msg/text/?${encodedText}`;
}

/**
 * WhatsApp (글로벌 크로스보더 포맷)
 * 국제 거래 커뮤니티용 영문 포맷
 */
export function getWhatsAppShareUrl(tradeData: TradeShareData): string {
  const {
    myCard = "Photocard",
    wishCard = "Wish Card",
    tradeId = "trade123",
  } = tradeData;

  const text = `📸 WTT (Willing To Trade)
I have: ${myCard}
Looking for: ${wishCard}
🔗 ${SITE_URL}/t/${tradeId}

#photocard #wtt #trading`;

  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * X / Twitter (글로벌 트레이딩 허브)
 * 해시태그와 함께 글로벌 트레이딩 커뮤니티 노출
 */
export function getTwitterShareUrl(tradeData: TradeShareData): string {
  const {
    myCard = "Photocard",
    artistName = "Artist",
    memberName = "Member",
    tradeId = "trade123",
  } = tradeData;

  const text = `🔄 WTT: ${artistName} ${memberName}
Have: ${myCard}
📱 Check my binder: ${SITE_URL}/t/${tradeId}

#wtt #포카교환 #StanPC #photocard #trading`;

  const encodedText = encodeURIComponent(text);
  return `https://twitter.com/intent/tweet?text=${encodedText}`;
}

/**
 * Instagram DM (소셜 프라이버시 포맷)
 * Instagram DM은 URL intent를 지원하지 않으므로, 팔로우 링크 제공
 */
export function getInstagramProfileUrl(username?: string): string {
  return `https://instagram.com/${username || "stanpc_official"}`;
}

/**
 * URL 공유 (범용 바이럴 링크)
 * 모든 메신저에서 사용 가능한 단축 거래 링크
 */
export function getTradeShareUrl(tradeId?: string): string {
  return `${SITE_URL}/t/${tradeId || "share"}`;
}

/**
 * Toast 알림용 메시지 (각 메신저별)
 */
export const TOAST_MESSAGES = {
  kakao: "오픈채팅 교환 양식이 복사되었습니다! 👍",
  line: "LINE 교환 정보가 준비되었습니다! (새 탭에서 열립니다)",
  whatsapp: "WhatsApp 공유 링크가 준비되었습니다! (새 탭에서 열립니다)",
  twitter: "트위터 공유가 준비되었습니다! (새 탭에서 열립니다)",
  instagram: "Instagram 프로필로 이동합니다.",
};
