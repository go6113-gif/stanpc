"use client";

import { ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ContactChannelModal, type UserProfile } from "./ContactChannelModal";

export interface MatchSuggestionCard {
  id: string;
  cardName: string;
  memberName: string;
  groupName: string;
  albumTitle: string;
  thumbnailUrl: string | null;
  isMine: boolean;
}

export interface MatchSuggestion {
  id: string;
  matchPercentage: number;
  myCard: MatchSuggestionCard;
  theirCard: MatchSuggestionCard;
  theirUsername: string;
  commonWishlistCount?: number;
  userProfile?: UserProfile;
}

export function MatchSuggestionBox({
  suggestion,
}: {
  suggestion: MatchSuggestion;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userProfile: UserProfile = suggestion.userProfile || {
    username: suggestion.theirUsername,
    trustBadges: [
      { label: "인증된 컬렉터", icon: "✓" },
      { label: "거래 성사 14회", icon: "⭐" },
    ],
    externalChannels: {
      twitter: "kpop_trader_92",
      instagram: "kpop_collector_92",
      kakaoOpenChatLink: "https://open.kakao.com/o/abc123def",
    },
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A1A1E] to-[#0F0F12] p-5 shadow-lg hover:border-white/20 transition-colors">
      {/* Header with match percentage and username */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 mb-1">교환 매칭 제안</p>
          <p className="text-sm font-semibold text-white">{suggestion.theirUsername}님</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#FF2A55]/10 px-3 py-1.5 border border-[#FF2A55]/30">
          <div className="w-2 h-2 rounded-full bg-[#FF2A55] animate-pulse" />
          <span className="text-sm font-bold text-[#FF2A55]">
            {suggestion.matchPercentage}% 성사율
          </span>
        </div>
      </div>

      {/* Card Exchange Visualization */}
      <div className="flex items-center gap-3 mb-4">
        {/* My Card (Give) */}
        <div className="flex-1">
          <div className="relative mb-2.5 aspect-[63/88] rounded-lg overflow-hidden bg-[#2A2A2E] border border-white/5 shadow-md">
            {suggestion.myCard.thumbnailUrl ? (
              <Image
                src={suggestion.myCard.thumbnailUrl}
                alt={suggestion.myCard.cardName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2A2A2E] to-[#1A1A1E]">
                <span className="text-xs text-white/30">No Image</span>
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-white truncate">
            {suggestion.myCard.memberName}
          </p>
          <p className="text-xs text-white/50 truncate">{suggestion.myCard.groupName}</p>
          <p className="text-xs text-white/40 truncate">{suggestion.myCard.albumTitle}</p>
        </div>

        {/* Exchange Arrow */}
        <div className="flex flex-col items-center gap-2 px-2">
          <div className="rounded-full bg-[#FF2A55]/20 p-2.5 border border-[#FF2A55]/40">
            <ArrowRightLeft size={18} className="text-[#FF2A55]" />
          </div>
          <span className="text-xs text-white/40">교환</span>
        </div>

        {/* Their Card (Take) */}
        <div className="flex-1">
          <div className="relative mb-2.5 aspect-[63/88] rounded-lg overflow-hidden bg-[#2A2A2E] border border-white/5 shadow-md">
            {suggestion.theirCard.thumbnailUrl ? (
              <Image
                src={suggestion.theirCard.thumbnailUrl}
                alt={suggestion.theirCard.cardName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2A2A2E] to-[#1A1A1E]">
                <span className="text-xs text-white/30">No Image</span>
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-white truncate">
            {suggestion.theirCard.memberName}
          </p>
          <p className="text-xs text-white/50 truncate">{suggestion.theirCard.groupName}</p>
          <p className="text-xs text-white/40 truncate">{suggestion.theirCard.albumTitle}</p>
        </div>
      </div>

      {/* Additional Info */}
      {suggestion.commonWishlistCount !== undefined && (
        <div className="mb-4 rounded-lg bg-white/5 p-2.5 border border-white/5">
          <p className="text-xs text-white/60">
            이 외에도{" "}
            <span className="font-semibold text-white">
              {suggestion.commonWishlistCount}개 카드
            </span>
            가 더 일치합니다
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 rounded-lg bg-[#FF2A55] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          연락하기
        </button>
        <button className="flex-1 rounded-lg bg-white/5 border border-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
          스킵
        </button>
      </div>

      {/* Contact Channel Modal */}
      <ContactChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
}
