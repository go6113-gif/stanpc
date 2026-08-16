"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Check } from "lucide-react";
import {
  SharePurpose,
  ShareLanguage,
  SocialPlatform,
  generateShareText,
  generateSocialIntent,
  getClipboardText,
  copyToClipboard,
  PLATFORM_CONFIGS,
} from "@/lib/utils/snsShare";

export interface SnsShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardCount: number;
  groups?: string[];
  members?: string[];
  defaultPurpose?: SharePurpose;
  price?: number;
  shareUrl?: string;
}

export function SnsShareModal({
  isOpen,
  onClose,
  cardCount,
  groups = [],
  members = [],
  defaultPurpose = "FLEX",
  price = 0,
  shareUrl = typeof window !== "undefined" ? window.location.href : "",
}: SnsShareModalProps) {
  const [purpose, setPurpose] = useState<SharePurpose>(defaultPurpose);
  const [language, setLanguage] = useState<ShareLanguage>("KO");
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [copied, setCopied] = useState(false);

  const shareContent = {
    cardCount,
    groups,
    members,
    price,
    url: shareUrl,
  };

  const shareText = generateShareText(purpose, shareContent, language);
  const intentUrl = selectedPlatform
    ? generateSocialIntent(selectedPlatform, shareText, shareUrl)
    : null;

  const handleOpenPlatform = () => {
    if (!selectedPlatform) return;

    if (intentUrl) {
      window.open(intentUrl, "_blank", "width=600,height=700");
    } else {
      // Fallback: 클립보드 복사
      const clipboardText = getClipboardText(selectedPlatform, shareText, shareUrl);
      copyToClipboard(clipboardText).then((success) => {
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    }
  };

  const handleCopyToClipboard = async () => {
    const clipboardText = getClipboardText(
      selectedPlatform || "twitter",
      shareText,
      shareUrl
    );
    const success = await copyToClipboard(clipboardText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "StanPC Photocard Collection",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="border-b border-white/10 bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">SNS 다이렉트 공유</h2>
                  <p className="text-sm text-white/60 mt-1">{cardCount}개 포토카드</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors text-white/60"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 1단계: 목적 선택 */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">
                  1단계: 목적 선택
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(["WTT", "WTS", "WTB", "FLEX", "TRUST"] as SharePurpose[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurpose(p)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                        purpose === p
                          ? "border-pink-500 bg-pink-500/10 text-pink-300"
                          : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                      }`}
                    >
                      {p === "WTT" && "🔄 교환"}
                      {p === "WTS" && "💰 판매"}
                      {p === "WTB" && "🔍 수배"}
                      {p === "FLEX" && "✨ 자랑"}
                      {p === "TRUST" && "✅ 인증"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 언어 선택 (선택) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                  언어
                </h3>
                <div className="flex gap-2">
                  {(["KO", "EN", "JA"] as ShareLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        language === lang
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {lang === "KO" && "한국어"}
                      {lang === "EN" && "English"}
                      {lang === "JA" && "日本語"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2단계: 플랫폼 선택 */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">
                  2단계: 플랫폼 선택
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(
                    [
                      "twitter",
                      "threads",
                      "line",
                      "whatsapp",
                      "instagram",
                      "kakao",
                      "email",
                      "reddit",
                    ] as SocialPlatform[]
                  ).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                        selectedPlatform === platform
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                      }`}
                    >
                      <span className="text-base">
                        {PLATFORM_CONFIGS[platform as SocialPlatform]?.icon}
                      </span>
                      <span className="hidden sm:inline">
                        {PLATFORM_CONFIGS[platform as SocialPlatform]?.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                  생성된 텍스트
                </p>
                <p className="text-sm text-white break-words leading-relaxed font-mono">
                  {shareText}
                </p>
                <p className="text-xs text-blue-400/70 mt-3 break-all">{shareUrl}</p>
              </div>

              {/* 3단계: 액션 */}
              {selectedPlatform && (
                <div className="space-y-3 pt-2">
                  {intentUrl ? (
                    <>
                      <button
                        onClick={handleOpenPlatform}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        <Share2 size={16} />
                        {PLATFORM_CONFIGS[selectedPlatform]?.label}
                        {" "}에서 공유
                      </button>
                      <button
                        onClick={handleCopyToClipboard}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check size={16} className="text-green-400" />
                            복사됨!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            클립보드 복사
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={16} className="text-green-400" />
                          복사됨!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          클립보드에 복사
                        </>
                      )}
                    </button>
                  )}

                  {typeof navigator !== "undefined" &&
                    typeof navigator.share !== "undefined" && (
                      <button
                        onClick={handleWebShare}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition-colors"
                      >
                        <Share2 size={16} />
                        시스템 공유
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="border-t border-white/10 bg-white/5 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
