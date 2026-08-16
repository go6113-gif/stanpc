import { memo } from "react";

export interface MetaChipsProps {
  tags: string[];
  compact?: boolean;
}

const CHIP_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  // 카드 상태
  "Owned": { bg: "bg-emerald-500/20", text: "text-emerald-300", icon: "✓" },
  "Wish": { bg: "bg-orange-500/20", text: "text-orange-300", icon: "♡" },
  "WTT": { bg: "bg-purple-500/20", text: "text-purple-300", icon: "⇄" },
  "WTS": { bg: "bg-blue-500/20", text: "text-blue-300", icon: "₩" },

  // 특전/버전
  "POB": { bg: "bg-pink-500/20", text: "text-pink-300", icon: "📦" },
  "Lucky Draw": { bg: "bg-yellow-500/20", text: "text-yellow-300", icon: "🎰" },
  "Album": { bg: "bg-indigo-500/20", text: "text-indigo-300", icon: "📀" },
  "Photobook": { bg: "bg-violet-500/20", text: "text-violet-300", icon: "📕" },
  "Random": { bg: "bg-rose-500/20", text: "text-rose-300", icon: "🎲" },
  "Signed": { bg: "bg-red-500/20", text: "text-red-300", icon: "✍️" },
  "First Edition": { bg: "bg-cyan-500/20", text: "text-cyan-300", icon: "1️⃣" },

  // 기본값
  "default": { bg: "bg-white/10", text: "text-white/70", icon: "•" },
};

/**
 * 카드의 메타데이터를 뱃지로 렌더링
 * 예: POB, 럭드, 앨범, 서명 등
 *
 * @param tags - 메타데이터 배열 (예: ["POB", "Signed"])
 * @param compact - true면 간소화 표시 (최대 2개만, 아이콘만)
 */
export const MetaChips = memo(function MetaChips({ tags, compact = false }: MetaChipsProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = compact ? tags.slice(0, 2) : tags;
  const showMore = compact && tags.length > 2;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "items-center" : ""}`}>
      {displayTags.map((tag) => {
        const colors = CHIP_COLORS[tag] || CHIP_COLORS.default;
        return (
          <div
            key={tag}
            className={`
              inline-flex items-center gap-1
              ${colors.bg} ${colors.text}
              rounded-full px-2 py-0.5
              text-xs font-semibold
              whitespace-nowrap
              transition-all hover:opacity-80
            `}
          >
            <span>{colors.icon}</span>
            {!compact && <span>{tag}</span>}
          </div>
        );
      })}
      {showMore && (
        <div className="inline-flex items-center gap-1 text-xs text-white/50">
          +{tags.length - 2}
        </div>
      )}
    </div>
  );
});
