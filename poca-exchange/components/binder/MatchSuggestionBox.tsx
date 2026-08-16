"use client";

import { useEffect, useState } from "react";
import { Zap, AlertCircle, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { TradeMatchResult } from "@/lib/types/trade";
import { useBinderStore } from "@/store/useBinderStore";
import { ContactChannelModal, UserProfile } from "@/components/trade/ContactChannelModal";

interface MatchSuggestionBoxProps {
  onContactClick?: (match: TradeMatchResult) => void;
}

/**
 * 내 바인더 카드를 기반으로 교환 가능한 거래글을 추천합니다.
 * - useBinderStore에서 ownedCards/wishCards 읽음
 * - GET /api/trades/match API 호출
 * - 매칭된 거래글 목록 동적 렌더링
 */
export function MatchSuggestionBox({ onContactClick }: MatchSuggestionBoxProps) {
  const [matches, setMatches] = useState<TradeMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TradeMatchResult | null>(null);

  // Zustand 스토어에서 바인더 카드 읽기
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const fetchMatches = async () => {
      // 내가 제공할 수 있는 카드 (소장 카드)
      const myHaveIds = ownedCards.map((card) => card.cardId);

      // 내가 원하는 카드 (위시 카드)
      const myWishIds = wishCards.map((card) => card.cardId);

      // 매칭할 카드가 없으면 요청 스킵
      if (myHaveIds.length === 0 && myWishIds.length === 0) {
        setMatches([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (myHaveIds.length > 0) {
          query.append("myHave", myHaveIds.join(","));
        }
        if (myWishIds.length > 0) {
          query.append("myWish", myWishIds.join(","));
        }
        query.append("limit", "10");

        const response = await fetch(`/api/trades/match?${query.toString()}`);

        if (!response.ok) {
          throw new Error("매칭 데이터 조회 실패");
        }

        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [hydrated, ownedCards, wishCards]);

  if (!hydrated) {
    return null;
  }

  // 바인더 카드가 없으면 표시 안함
  if (ownedCards.length === 0 && wishCards.length === 0) {
    return null;
  }

  // selectedMatch에서 UserProfile 생성
  const mockUserProfile: UserProfile | null = selectedMatch
    ? {
        username: "익명 거래자",
        trustBadges: [
          { label: "신규", icon: "🌟" },
          { label: "친절", icon: "😊" },
        ],
        externalChannels: {
          twitter:
            selectedMatch.contactChannel.type === "twitter"
              ? selectedMatch.contactChannel.value
              : undefined,
          instagram:
            selectedMatch.contactChannel.type === "instagram"
              ? selectedMatch.contactChannel.value
              : undefined,
          kakaoOpenChatLink:
            selectedMatch.contactChannel.type === "openKakao"
              ? selectedMatch.contactChannel.value
              : undefined,
        },
      }
    : null;

  return (
    <>
      {mockUserProfile && (
        <ContactChannelModal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedMatch(null);
          }}
          userProfile={mockUserProfile}
        />
      )}
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 overflow-hidden dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-900/30">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-white" />
          <div>
            <h3 className="font-bold text-white text-sm">⚡ 교환 추천</h3>
            <p className="text-xs text-white/80">내 카드로 교환 가능한 거래글</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 space-y-3">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader className="animate-spin text-amber-600" size={20} />
            <span className="ml-2 text-sm text-amber-700 dark:text-amber-400">
              매칭 중...
            </span>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/20 dark:border-red-900/30">
            <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* 매칭 결과 없음 */}
        {!isLoading && matches.length === 0 && !error && (
          <div className="text-center py-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              ✨ 현재 매칭되는 거래글이 없습니다
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">
              더 많은 거래글이 추가되면 알려드릴게요
            </p>
          </div>
        )}

        {/* 매칭 결과 목록 */}
        {!isLoading && matches.length > 0 && (
          <div className="space-y-2">
            {matches.map((match, idx) => (
              <motion.div
                key={match.tradePostId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-lg bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/30 p-3 hover:shadow-md transition-all"
              >
                {/* 매칭률 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {match.matchRate}%
                    </div>
                    <div className="flex-1 h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600"
                        style={{ width: `${match.matchRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                    {match.type}
                  </div>
                </div>

                {/* 카드 교환 정보 */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  {/* 내가 제공할 카드 */}
                  <div className="bg-nomad-red/5 dark:bg-nomad-red/10 rounded-lg p-2 border border-nomad-red/20">
                    <div className="font-bold text-nomad-red dark:text-red-400 mb-1">
                      내가 줌
                    </div>
                    <div className="space-y-0.5 text-neutral-600 dark:text-neutral-400">
                      {match.giveCards.length > 0 ? (
                        match.giveCards.map((cardId) => (
                          <div key={cardId} className="truncate">
                            • {cardId}
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-400 italic">없음</div>
                      )}
                    </div>
                  </div>

                  {/* 내가 받을 카드 */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2 border border-blue-200 dark:border-blue-900/30">
                    <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">
                      내가 받음
                    </div>
                    <div className="space-y-0.5 text-neutral-600 dark:text-neutral-400">
                      {match.getCards.length > 0 ? (
                        match.getCards.map((cardId) => (
                          <div key={cardId} className="truncate">
                            • {cardId}
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-400 italic">없음</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 연락 수단 및 액션 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      연락:
                    </span>
                    <span className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {match.contactChannel.type === "twitter"
                        ? "X"
                        : match.contactChannel.type === "instagram"
                          ? "Instagram"
                          : match.contactChannel.type === "openKakao"
                            ? "오픈카톡"
                            : match.contactChannel.type === "discord"
                              ? "Discord"
                              : "카카오톡"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMatch(match);
                      setIsContactModalOpen(true);
                      onContactClick?.(match);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-nomad-red text-white hover:bg-red-600 transition-all group-hover:shadow-md"
                  >
                    연락하기
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 하단 정보 */}
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200/50 dark:border-amber-900/30 mt-4">
          <div className="font-bold mb-1">💡 Tip</div>
          <div>
            더 많은 카드를 바인더에 추가할수록 더 많은 매칭 기회가 생겨요!
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
