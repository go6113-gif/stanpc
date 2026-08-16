"use client";

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  copyKakaoOpenChatFormat,
  getLineShareUrl,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  getInstagramProfileUrl,
  TOAST_MESSAGES,
  type TradeShareData,
} from "@/lib/share/messenger";

interface ContactChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: TradeShareData;
  onToast?: (message: string) => void;
}

const CHANNELS = [
  {
    id: "kakao",
    name: "KakaoTalk",
    emoji: "💬",
    color: "bg-yellow-400",
    description: "오픈채팅으로 공유",
  },
  {
    id: "line",
    name: "LINE",
    emoji: "📱",
    color: "bg-green-500",
    description: "라인 메시지로 공유",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    emoji: "💚",
    color: "bg-green-600",
    description: "왓츠앱 공유",
  },
  {
    id: "twitter",
    name: "Twitter (X)",
    emoji: "𝕏",
    color: "bg-black",
    description: "트위터에 공유",
  },
  {
    id: "instagram",
    name: "Instagram",
    emoji: "📷",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "인스타그램 DM",
  },
];

export function ContactChannelModal({
  isOpen,
  onClose,
  tradeData,
  onToast,
}: ContactChannelModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChannelClick = (channelId: string) => {
    setIsLoading(true);

    try {
      switch (channelId) {
        case "kakao": {
          // KakaoTalk: 클립보드 복사
          const success = copyKakaoOpenChatFormat(tradeData);
          if (success) {
            onToast?.(TOAST_MESSAGES.kakao);
          }
          break;
        }

        case "line": {
          // LINE: 새 탭에서 오픈
          const url = getLineShareUrl(tradeData);
          window.open(url, "_blank", "width=600,height=600");
          onToast?.(TOAST_MESSAGES.line);
          break;
        }

        case "whatsapp": {
          // WhatsApp: 새 탭에서 오픈
          const url = getWhatsAppShareUrl(tradeData);
          window.open(url, "_blank", "width=600,height=600");
          onToast?.(TOAST_MESSAGES.whatsapp);
          break;
        }

        case "twitter": {
          // Twitter/X: 새 탭에서 오픈
          const url = getTwitterShareUrl(tradeData);
          window.open(url, "_blank", "width=550,height=420");
          onToast?.(TOAST_MESSAGES.twitter);
          break;
        }

        case "instagram": {
          // Instagram: 프로필 링크로 이동
          const url = getInstagramProfileUrl(tradeData.username);
          window.open(url, "_blank");
          onToast?.(TOAST_MESSAGES.instagram);
          break;
        }
      }

      // 약간의 딜레이 후 모달 닫기
      setTimeout(() => {
        onClose();
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error(`Share error (${channelId}):`, err);
      onToast?.("공유 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[1000] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} className="text-[#FF2A55]" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  교환 정보 공유
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3 px-6 py-6">
              {/* Trade Summary */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold">{tradeData.myCard || "포토카드"}</span>
                  {" ↔ "}
                  <span className="font-semibold">{tradeData.wishCard || "교환 희망"}</span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  거래 ID: <code className="text-[10px]">{tradeData.tradeId || "–"}</code>
                </p>
              </div>

              {/* Channel Buttons Grid */}
              <div className="space-y-2">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleChannelClick(channel.id)}
                    disabled={isLoading}
                    className={`w-full rounded-lg border-2 border-transparent px-4 py-3 text-left transition-all flex items-center gap-3 ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${channel.color}`}
                    >
                      {channel.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {channel.name}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {channel.description}
                      </p>
                    </div>
                    <span className="text-2xl">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-900/30">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                💡 선택한 채널로 교환 정보가 공유되며, 상대방이 쉽게 확인할 수 있습니다.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
