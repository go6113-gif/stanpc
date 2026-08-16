"use client";

import { useState } from "react";
import { ShoppingCart, Send, Heart, BookmarkCheck, DollarSign, ArrowRightLeft, Target, Share2 } from "lucide-react";
import { TwitterWttCardModal } from "@/components/share/TwitterWttCardModal";

type TradeMode = "wts" | "wtb" | "wtt";

interface TradeActionSectionProps {
  cardName?: string;
  cardId?: string;
  onOwnedToggle?: (owned: boolean) => void;
  onWishToggle?: (wished: boolean) => void;
  initialOwned?: boolean;
  initialWished?: boolean;
}

/**
 * "이 포카 교환/판매 제안하기" 액션 섹션.
 * WTS(판매), WTB(구매 희망), WTT(교환) 3가지 모드 지원.
 * Mock 폼 필드 및 토글 버튼 UI.
 */
export function TradeActionSection({
  cardName = "Photocard",
  cardId,
  onOwnedToggle,
  onWishToggle,
  initialOwned = false,
  initialWished = false,
}: TradeActionSectionProps) {
  const [tradeMode, setTradeMode] = useState<TradeMode>("wts");
  const [isOwned, setIsOwned] = useState(initialOwned);
  const [isWished, setIsWished] = useState(initialWished);
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false);

  // WTS (Willing To Sell) — 판매 제안
  const [wtsPrice, setWtsPrice] = useState<string>("15000");
  const [wtsCondition, setWtsCondition] = useState<string>("mint");

  // WTB (Willing To Buy) — 구매 희망
  const [wtbPrice, setWtbPrice] = useState<string>("10000");

  // WTT (Willing To Trade) — 교환 희망
  const [wttMembers, setWttMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState<string>("");

  const handleOwnedToggle = () => {
    setIsOwned(!isOwned);
    onOwnedToggle?.(!isOwned);
  };

  const handleWishedToggle = () => {
    setIsWished(!isWished);
    onWishToggle?.(!isWished);
  };

  const handleAddMember = () => {
    if (newMember.trim() && wttMembers.length < 5) {
      setWttMembers([...wttMembers, newMember]);
      setNewMember("");
    }
  };

  const handleRemoveMember = (idx: number) => {
    setWttMembers(wttMembers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {/* 액션 헤더 */}
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 dark:border-neutral-700 dark:from-neutral-900/50 dark:to-neutral-900/30">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
          🔄 거래 제안하기
        </h3>
        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          "{cardName}" — 판매 / 구매 / 교환 제안 설정
        </p>
      </div>

      {/* 바인더 액션 토글 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleOwnedToggle}
          className={`rounded-lg px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            isOwned
              ? "bg-nomad-red/20 text-nomad-red border border-nomad-red/30"
              : "border border-neutral-200 text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          <BookmarkCheck size={16} />
          내 소장
        </button>

        <button
          type="button"
          onClick={handleWishedToggle}
          className={`rounded-lg px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            isWished
              ? "bg-red-500/20 text-red-500 border border-red-500/30"
              : "border border-neutral-200 text-neutral-700 hover:border-red-500 hover:text-red-500 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          <Heart size={16} />
          위시리스트
        </button>
      </div>

      {/* 거래 모드 탭 */}
      <div className="flex gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-900/30">
        {[
          { id: "wts", label: "판매 (WTS)", icon: "💰" },
          { id: "wtb", label: "구매 (WTB)", icon: "🛍️" },
          { id: "wtt", label: "교환 (WTT)", icon: "🔄" },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setTradeMode(mode.id as TradeMode)}
            className={`flex-1 rounded-md px-3 py-2.5 text-xs font-bold transition-all ${
              tradeMode === mode.id
                ? "bg-white text-nomad-red shadow-sm dark:bg-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300"
            }`}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* WTS (판매) 폼 */}
      {tradeMode === "wts" && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide dark:text-white mb-2">
              💰 판매가 설정
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₩</span>
                <input
                  type="number"
                  value={wtsPrice}
                  onChange={(e) => setWtsPrice(e.target.value)}
                  className="w-full pl-6 pr-3 py-2.5 text-sm rounded-lg border border-green-300 bg-white dark:bg-neutral-900 dark:border-green-800/50 dark:text-white"
                  placeholder="판매가"
                />
              </div>
            </div>
            <p className="text-xs text-green-700 mt-1 dark:text-green-300">
              제시가: ₩{parseInt(wtsPrice || "0").toLocaleString("ko-KR")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide dark:text-white mb-2">
              상태 선택
            </label>
            <select
              value={wtsCondition}
              onChange={(e) => setWtsCondition(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-green-300 bg-white dark:bg-neutral-900 dark:border-green-800/50 dark:text-white"
            >
              <option value="mint">민트 (미개봉)</option>
              <option value="near-mint">근민트 (개봉 후 미사용)</option>
              <option value="lightly-played">경사용</option>
              <option value="played">사용감</option>
              <option value="damaged">손상/결함</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <Send size={16} />
            판매 제안 발송
          </button>
        </div>
      )}

      {/* WTB (구매 희망) 폼 */}
      {tradeMode === "wtb" && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide dark:text-white mb-2">
              🛍️ 희망 구매가
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₩</span>
                <input
                  type="number"
                  value={wtbPrice}
                  onChange={(e) => setWtbPrice(e.target.value)}
                  className="w-full pl-6 pr-3 py-2.5 text-sm rounded-lg border border-blue-300 bg-white dark:bg-neutral-900 dark:border-blue-800/50 dark:text-white"
                  placeholder="구매 희망가"
                />
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-1 dark:text-blue-300">
              최대 희망가: ₩{parseInt(wtbPrice || "0").toLocaleString("ko-KR")}
            </p>
          </div>

          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="mt-0.5">💡</span>
            판매자가 당신의 희망가를 보고 판매 의향을 보일 수 있습니다
          </p>

          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Target size={16} />
            구매 희망가 등록
          </button>
        </div>
      )}

      {/* WTT (교환) 폼 */}
      {tradeMode === "wtt" && (
        <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide dark:text-white mb-2">
              🔄 교환 희망 멤버/포카
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="예: NewJeans (HANNI)"
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-purple-300 bg-white dark:bg-neutral-900 dark:border-purple-800/50 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={wttMembers.length >= 5}
                className="px-3 py-2.5 text-sm font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                추가
              </button>
            </div>
          </div>

          {/* 선택된 멤버/포카 리스트 */}
          {wttMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                선택됨 ({wttMembers.length}/5)
              </p>
              <div className="flex flex-wrap gap-2">
                {wttMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-purple-700 border border-purple-300 dark:bg-neutral-800 dark:border-purple-800/50 dark:text-purple-300"
                  >
                    {member}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="ml-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
            <span className="mt-0.5">💡</span>
            3장 이상의 중복된 희망 카드가 있는 사용자에게 교환 매칭 알림을 받습니다
          </p>

          <div className="space-y-2">
            <button
              type="button"
              disabled={wttMembers.length === 0}
              className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <ArrowRightLeft size={16} />
              교환 제안 등록
            </button>

            <button
              type="button"
              onClick={() => setIsTwitterModalOpen(true)}
              className="w-full rounded-lg border border-[#1D9BF0]/30 bg-[#1D9BF0]/10 px-4 py-2.5 text-sm font-bold text-[#1D9BF0] hover:bg-[#1D9BF0]/20 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              𝕏 포카교환 트윗 올리기
            </button>
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <p className="text-xs text-neutral-700 dark:text-neutral-400 flex items-start gap-2">
          <span className="shrink-0">ℹ️</span>
          <span>
            거래 제안은 공개되지 않으며, 매칭된 사용자에게만 알림이 전달됩니다. 안전 거래를 위해 판매자/구매자 평점을 확인하세요.
          </span>
        </p>
      </div>

      {/* Twitter WTT Modal */}
      <TwitterWttCardModal
        isOpen={isTwitterModalOpen}
        onClose={() => setIsTwitterModalOpen(false)}
        haveCard={{
          cardName,
          memberName: cardName?.split(" ")[0] || "Unknown",
          groupName: "StanPC",
        }}
        wishCard={{
          memberName: wttMembers[0] || "원하는 멤버",
          groupName: "StanPC",
        }}
        tradeId={cardId || "share"}
      />
    </div>
  );
}
