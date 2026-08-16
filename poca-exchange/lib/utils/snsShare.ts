export type SharePurpose = "WTT" | "WTS" | "WTB" | "FLEX" | "TRUST";
export type ShareLanguage = "KO" | "EN" | "JA";
export type SocialPlatform =
  | "twitter"
  | "threads"
  | "line"
  | "whatsapp"
  | "instagram"
  | "kakao"
  | "email"
  | "reddit";

export interface ShareContent {
  title?: string;
  cardCount: number;
  groups?: string[];
  members?: string[];
  price?: number;
  tags?: string[];
  url?: string;
}

type ShareTemplates = Record<SharePurpose, Record<ShareLanguage, string>>;

const SHARE_TEMPLATES: ShareTemplates = {
  WTT: {
    KO: "【교환】 🖤 HAVE: {groups} / 🤍 WISH: {groups}",
    EN: "[TRADE] 🔄 HAVE: {groups} / WANT: {groups}",
    JA: "【交換】 🖤 譲: {groups} / 🤍 求: {groups}",
  },
  WTS: {
    KO: "【판매】 💰 {groups} {cardCount}개 세트 ${price}",
    EN: "[SELLING] 📸 {cardCount}pc {groups} Set ${price}",
    JA: "【販売】 💰 {groups} {cardCount}枚セット ${price}",
  },
  WTB: {
    KO: "【수배】 🔍 {groups} 찾습니다 ~${price}까지",
    EN: "[SEEKING] 🔍 Looking for {groups} up to ${price}",
    JA: "【購入希望】 🔍 {groups} 探してます ~${price}まで",
  },
  FLEX: {
    KO: "✨ 내 컬렉션을 자랑합니다! {cardCount}개의 포카 ✨",
    EN: "✨ Showing off my photocard collection! {cardCount} pcs ✨",
    JA: "✨ 私のコレクションを披露します! {cardCount}枚 ✨",
  },
  TRUST: {
    KO: "✅ 실물 인증됨 - {groups} {cardCount}개 소장 중",
    EN: "✅ Verified Owned - {groups} {cardCount}pcs",
    JA: "✅ 実物認証済 - {groups} {cardCount}枚保有中",
  },
};

export function generateShareText(
  purpose: SharePurpose,
  content: ShareContent,
  lang: ShareLanguage = "KO"
): string {
  const template = SHARE_TEMPLATES[purpose]?.[lang] || "";

  const groupsText = content.groups?.join(", ") || "PhotoCard";
  const membersText = content.members?.join(", ") || "";
  const tagsText = content.tags?.map((t) => `#${t}`).join(" ") || "";

  let text = template
    .replace("{groups}", groupsText)
    .replace("{members}", membersText)
    .replace("{cardCount}", content.cardCount.toString())
    .replace("{price}", content.price?.toString() || "");

  if (tagsText) {
    text += ` ${tagsText}`;
  }

  return text.trim();
}

export function generateSocialIntent(
  platform: SocialPlatform,
  shareText: string,
  url: string
): string | null {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

    case "threads":
      return null;

    case "line":
      return `https://line.me/R/msg/text/?${encodedText}%20${encodedUrl}`;

    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;

    case "instagram":
      return null;

    case "kakao":
      return null;

    case "email":
      return `mailto:?subject=${encodeURIComponent("StanPC Photocard Share")}&body=${encodedText}%0A%0A${encodedUrl}`;

    case "reddit":
      return null;

    default:
      return null;
  }
}

export function getClipboardText(
  platform: SocialPlatform,
  shareText: string,
  url: string
): string {
  switch (platform) {
    case "kakao":
      return `${shareText}\n\n${url}\n\n⏱️ StanPC에서 공유됨`;

    case "threads":
      return `${shareText}\n\n${url}`;

    case "instagram":
      return `${shareText}\n\n${url}\n\n#kpop #photocard #포토카드 #스탠픽`;

    case "reddit":
      return `${shareText}\n\n${url}\n\n---\n*Posted via StanPC*`;

    default:
      return `${shareText}\n${url}`;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}

export function getTwitterWttLength(text: string): number {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const withoutUrls = text.replace(urlPattern, "x".repeat(23));
  return withoutUrls.length;
}

export function truncateForTwitter(text: string): string {
  const maxLength = 280;
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlPattern) || [];
  const textWithoutUrls = text.replace(urlPattern, "").trim();

  let currentLength = urls.length * 23;
  let truncatedText = "";

  for (const char of textWithoutUrls) {
    if (currentLength + 1 <= maxLength) {
      truncatedText += char;
      currentLength++;
    } else {
      break;
    }
  }

  return truncatedText.trim() + "... " + urls.join(" ");
}

export const PLATFORM_CONFIGS = {
  twitter: { icon: "🐦", label: "X (Twitter)", color: "#1D9BF0" },
  threads: { icon: "🔗", label: "Threads", color: "#000000" },
  line: { icon: "💬", label: "LINE", color: "#00B900" },
  whatsapp: { icon: "💬", label: "WhatsApp", color: "#25D366" },
  instagram: { icon: "📷", label: "Instagram", color: "#E4405F" },
  kakao: { icon: "💬", label: "KakaoTalk", color: "#FFE812" },
  email: { icon: "✉️", label: "Email", color: "#EA4335" },
  reddit: { icon: "🤖", label: "Reddit", color: "#FF4500" },
} as const;
