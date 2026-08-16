"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";
import {
  generateTwitterWttText,
  getTwitterWttIntentUrl,
  getTwitterWttTextLength,
  type TwitterWttCard,
  type TwitterWttContent,
} from "@/lib/share/twitter-wtt";

interface TwitterWttCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  haveCard: TwitterWttCard;
  wishCard: TwitterWttCard;
  tradeId?: string;
  username?: string;
}

export function TwitterWttCardModal({
  isOpen,
  onClose,
  haveCard,
  wishCard,
  tradeId = "share",
  username = "user",
}: TwitterWttCardModalProps) {
  const [tweetText, setTweetText] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [tweetLength, setTweetLength] = useState(0);

  // 트윗 텍스트 초기화
  useEffect(() => {
    if (isOpen) {
      const content: TwitterWttContent = {
        haveCard,
        wishCard,
        tradeId,
        username,
      };
      const generated = generateTwitterWttText(content);
      setTweetText(generated);
      setTweetLength(getTwitterWttTextLength(generated));
      setIsCopied(false);
    }
  }, [isOpen, haveCard, wishCard, tradeId, username]);

  if (!isOpen) return null;

  const handleOpenTwitter = () => {
    const content: TwitterWttContent = {
      haveCard,
      wishCard,
      tradeId,
      username,
    };
    const intentUrl = getTwitterWttIntentUrl(content);
    window.open(intentUrl, "_blank", "width=600,height=600");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(tweetText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTextChange = (newText: string) => {
    setTweetText(newText);
    setTweetLength(getTwitterWttTextLength(newText));
  };

  const isValid = tweetLength <= 280;
  const isExceeded = tweetLength > 280;

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#1A1A1E] border border-white/10 shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D9BF0]/20">
              <svg
                className="h-5 w-5 text-[#1D9BF0]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 002.856-3.915c-1.042.463-2.158.873-3.337 1.068a5.824 5.824 0 002.552-3.21c-1.12.662-2.36 1.143-3.682 1.403a5.823 5.823 0 00-9.928 5.314c-4.84-.243-9.137-2.56-12.018-6.08a5.822 5.822 0 001.806 7.753c-.897-.03-1.74-.256-2.477-.643v.072c0 2.830 2.013 5.19 4.688 5.72-.491.133-1.01.206-1.548.206-.378 0-.745-.037-1.104-.107 1.745 5.431 6.81 9.38 12.802 9.49-2.00 1.566-4.52 2.5-7.26 2.5-.47 0-.934-.033-1.39-.1 2.04 1.31 4.46 2.07 7.066 2.07 8.48 0 13.11-7.02 13.11-13.11 0-.2-.004-.399-.012-.598a9.33 9.33 0 002.292-2.386z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">
              𝕏 포카교환 트윗 생성
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="space-y-4 px-6 py-6">
          {/* 포카 비교 뷰 */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              {/* HAVE 포카 */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide">
                  🖤 소장 중
                </div>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {haveCard.imageUrl ? (
                    <img
                      src={haveCard.imageUrl}
                      alt={haveCard.cardName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl mb-2">📷</div>
                      <div className="text-xs text-white/40">이미지 없음</div>
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {haveCard.memberName || "Unknown"}
                </div>
                <div className="text-xs text-white/50">
                  {haveCard.version || "포토카드"}
                </div>
              </div>

              {/* 교환 아이콘 */}
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-[#FF2A55]/20 border border-[#FF2A55]/40 p-3">
                  <svg
                    className="h-5 w-5 text-[#FF2A55]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                    />
                  </svg>
                </div>
              </div>

              {/* WISH 포카 */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide">
                  🤍 원함
                </div>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {wishCard.imageUrl ? (
                    <img
                      src={wishCard.imageUrl}
                      alt={wishCard.cardName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl mb-2">📷</div>
                      <div className="text-xs text-white/40">이미지 없음</div>
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {wishCard.memberName || "Unknown"}
                </div>
                <div className="text-xs text-white/50">
                  {wishCard.version || "포토카드"}
                </div>
              </div>
            </div>
          </div>

          {/* 트윗 미리보기 및 편집 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wide">
                트윗 미리보기
              </label>
              <div
                className={`text-xs font-semibold ${
                  isValid ? "text-white/50" : "text-red-400"
                }`}
              >
                {tweetLength}/280
              </div>
            </div>
            <textarea
              value={tweetText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`w-full rounded-lg bg-white/5 border px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 resize-none ${
                isExceeded
                  ? "border-red-500/50 focus:ring-red-500/50"
                  : "border-white/10 focus:ring-[#FF2A55]/50"
              }`}
              rows={6}
            />
            {isExceeded && (
              <p className="text-xs text-red-400">
                ⚠️ 트윗이 280자를 초과했습니다. {tweetLength - 280}자를 줄이세요.
              </p>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">💡</span>
              <span>
                텍스트를 수정할 수 있습니다. 아래 버튼을 클릭하면 X(Twitter)의 트윗 작성창이 새 탭에서 열립니다.
              </span>
            </p>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="border-t border-white/10 bg-white/5 px-6 py-4 flex gap-3">
          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            {isCopied ? (
              <>
                <Check size={16} />
                복사됨!
              </>
            ) : (
              <>
                <Copy size={16} />
                텍스트 복사
              </>
            )}
          </button>

          <button
            onClick={handleOpenTwitter}
            disabled={isExceeded}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1D9BF0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ExternalLink size={16} />
            𝕏에 올리기
          </button>
        </div>
      </div>
    </>
  );
}
