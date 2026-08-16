"use client";

import { X, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

export interface UserProfile {
  username: string;
  trustBadges: {
    label: string;
    icon: string;
  }[];
  externalChannels: {
    twitter?: string;
    instagram?: string;
    kakaoOpenChatLink?: string;
  };
}

export interface ContactChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export function ContactChannelModal({
  isOpen,
  onClose,
  userProfile,
}: ContactChannelModalProps) {
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const handleCopy = (text: string, channel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channel);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      {/* Modal Container */}
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1A1A1E] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-center-1 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">거래 채널 선택</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {/* User Profile Section */}
          <div className="mb-6 rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-sm font-semibold text-white mb-2">
              {userProfile.username}님
            </p>
            <div className="flex flex-wrap gap-2">
              {userProfile.trustBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2A55]/10 px-2.5 py-1 border border-[#FF2A55]/30"
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-xs font-medium text-white">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Channels */}
          <div className="space-y-3 mb-6">
            {/* X (Twitter) DM */}
            {userProfile.externalChannels.twitter && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="rounded-full bg-black p-2 flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.868 6.75h-3.306l7.73-8.835L.424 2.25h6.7l4.67 6.174L17.77 2.25h.474zM17.2 20.452h1.828L6.75 3.975H4.804l12.396 16.477z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">
                        X (트위터) DM
                      </p>
                      <p className="text-xs text-white/60 break-all">
                        @{userProfile.externalChannels.twitter}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleCopy(
                          userProfile.externalChannels.twitter || "",
                          "twitter"
                        )
                      }
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
                      title="핸들 복사"
                    >
                      <Copy
                        size={16}
                        className={
                          copiedChannel === "twitter"
                            ? "text-[#FF2A55]"
                            : "text-white/60"
                        }
                      />
                    </button>
                    <button
                      onClick={() =>
                        openExternalLink(
                          `https://twitter.com/messages/compose?recipient_id=${userProfile.externalChannels.twitter}`
                        )
                      }
                      className="rounded-lg bg-[#FF2A55] px-3 py-2 hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span className="text-xs font-semibold text-white">
                        열기
                      </span>
                      <ExternalLink size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Instagram DM */}
            {userProfile.externalChannels.instagram && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#F77737] to-[#FEDA75] p-2 flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.645.069-4.849.069-3.203 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.265-.057 1.645-.069 4.849-.069zm0-2.163C8.756 0 8.331.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.33 0 8.757 0 12c0 3.243.014 3.669.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
                        <path d="M5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">
                        Instagram DM
                      </p>
                      <p className="text-xs text-white/60 break-all">
                        {userProfile.externalChannels.instagram}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleCopy(
                          userProfile.externalChannels.instagram || "",
                          "instagram"
                        )
                      }
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
                      title="아이디 복사"
                    >
                      <Copy
                        size={16}
                        className={
                          copiedChannel === "instagram"
                            ? "text-[#FF2A55]"
                            : "text-white/60"
                        }
                      />
                    </button>
                    <button
                      onClick={() =>
                        openExternalLink(
                          `https://instagram.com/${userProfile.externalChannels.instagram}`
                        )
                      }
                      className="rounded-lg bg-[#FF2A55] px-3 py-2 hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span className="text-xs font-semibold text-white">
                        열기
                      </span>
                      <ExternalLink size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 카카오톡 오픈채팅 */}
            {userProfile.externalChannels.kakaoOpenChatLink && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="rounded-full bg-[#FFE812] p-2 flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-[#000000]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.373 0 0 4.373 0 10.5c0 3.05 1.514 5.803 4.043 7.47L3.4 24l6.175-3.238C10.486 20.78 11.2 20.822 12 20.822c6.627 0 12-4.373 12-9.822S18.627 0 12 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">
                        카카오톡 오픈채팅
                      </p>
                      <p className="text-xs text-white/60">
                        오픈채팅방 링크로 이동
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleCopy(
                          userProfile.externalChannels.kakaoOpenChatLink || "",
                          "kakao"
                        )
                      }
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
                      title="링크 복사"
                    >
                      <Copy
                        size={16}
                        className={
                          copiedChannel === "kakao"
                            ? "text-[#FF2A55]"
                            : "text-white/60"
                        }
                      />
                    </button>
                    <button
                      onClick={() =>
                        openExternalLink(
                          userProfile.externalChannels.kakaoOpenChatLink || ""
                        )
                      }
                      className="rounded-lg bg-[#FF2A55] px-3 py-2 hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span className="text-xs font-semibold text-white">
                        열기
                      </span>
                      <ExternalLink size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Safety Tips */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs font-bold text-blue-400 mb-3">
              ✨ 안심 거래 3계명
            </p>
            <ul className="space-y-2 text-xs text-blue-300/80">
              <li className="flex gap-2">
                <span className="font-bold text-blue-400 flex-shrink-0">1)</span>
                <span>
                  포카 인증 샷 요청: 포스트잇에 오늘 날짜/닉네임 작성한 사진으로
                  실물 확인
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-400 flex-shrink-0">2)</span>
                <span>
                  준등기/반값택배 송장 번호 교환 필수: 배송 추적으로 분쟁 해결
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-400 flex-shrink-0">3)</span>
                <span>
                  슬리브 + 탑로더 + 뽁뽁이 3중 포장 권장: 카드 손상 방지
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-white/10 hover:bg-white/20 transition-colors py-2.5 text-sm font-semibold text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
