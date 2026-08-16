/**
 * Twitter WTT (Willing To Trade) 트윗 포맷터
 * 교환 정보를 280자 제한에 맞는 최적의 트윗으로 자동 생성
 */

export interface TwitterWttCard {
  cardName?: string;         // e.g., "HANNI 사웨1차"
  memberName?: string;       // e.g., "HANNI"
  groupName?: string;        // e.g., "NewJeans"
  version?: string | null;   // e.g., "사웨1차" or null
  imageUrl?: string | null;
}

export interface TwitterWttContent {
  haveCard: TwitterWttCard;
  wishCard: TwitterWttCard;
  tradeId?: string;
  username?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stanpc.com";

/**
 * 트윗 텍스트를 생성합니다 (280자 제한 최적화)
 *
 * 포맷:
 * [StanPC WTT]
 * 🖤 HAVE: #{GroupName} {MemberName} {Version}
 * 🤍 WISH: #{GroupName} {MemberName} {Version}
 *
 * 📍 1:1 안전 교환 링크: https://stanpc.com/t/{tradeId}
 *
 * #wtt #포카교환 #포카양도 #StanPC
 */
export function generateTwitterWttText(content: TwitterWttContent): string {
  const {
    haveCard,
    wishCard,
    tradeId = "share",
  } = content;

  const haveGroup = haveCard.groupName || "Unknown";
  const haveMember = haveCard.memberName || "Card";
  const haveVersion = haveCard.version || "포토카드";

  const wishGroup = wishCard.groupName || "Unknown";
  const wishMember = wishCard.memberName || "Card";
  const wishVersion = wishCard.version || "포토카드";

  // 동적 해시태그: 그룹명을 영문화하여 해시태그화
  const haveGroupTag = haveGroup.replace(/\s+/g, "");
  const wishGroupTag = wishGroup.replace(/\s+/g, "");

  const text = `[StanPC WTT]
🖤 HAVE: #${haveGroupTag} ${haveMember} ${haveVersion}
🤍 WISH: #${wishGroupTag} ${wishMember} ${wishVersion}

📍 1:1 안전 교환 링크: ${SITE_URL}/t/${tradeId}

#wtt #포카교환 #포카양도 #StanPC`;

  return text;
}

/**
 * 트윗 텍스트의 길이를 계산합니다 (280자 제한 체크용)
 */
export function getTwitterWttTextLength(text: string): number {
  // Twitter는 URL을 23자로 계산하므로, 그에 맞춰 조정
  const urlPattern = /https?:\/\/\S+/g;
  const withoutUrls = text.replace(urlPattern, "");
  const urlCount = (text.match(urlPattern) || []).length;
  return withoutUrls.length + urlCount * 23;
}

/**
 * 트윗을 X(Twitter)에서 발행할 수 있는 intent URL 생성
 */
export function getTwitterWttIntentUrl(content: TwitterWttContent): string {
  const text = generateTwitterWttText(content);
  const encodedText = encodeURIComponent(text);
  return `https://twitter.com/intent/tweet?text=${encodedText}`;
}

/**
 * 트윗이 280자 제한을 초과하는지 확인
 */
export function isTwitterWttTextValid(content: TwitterWttContent): boolean {
  const text = generateTwitterWttText(content);
  return getTwitterWttTextLength(text) <= 280;
}

/**
 * 초과하는 부분을 제거하여 유효한 트윗 텍스트로 축약
 */
export function truncateTwitterWttText(content: TwitterWttContent): string {
  let text = generateTwitterWttText(content);

  while (getTwitterWttTextLength(text) > 280) {
    // 마지막 라인부터 제거하기 (해시태그 먼저)
    const lines = text.split("\n");
    if (lines.length > 1) {
      lines.pop();
      text = lines.join("\n");
    } else {
      break;
    }
  }

  return text;
}
