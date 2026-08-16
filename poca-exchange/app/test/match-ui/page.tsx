"use client";

import { useState } from "react";
import { TradePostCreateModal } from "@/components/modal/TradePostCreateModal";
import { MatchSuggestionBox } from "@/components/binder/MatchSuggestionBox";
import { useBinderStore } from "@/store/useBinderStore";
import { TradeMatchResult } from "@/lib/types/trade";

export default function TradeMatchTestPage() {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const addOwnedCard = useBinderStore((state) => state.addOwnedCard);
  const addWishCard = useBinderStore((state) => state.addWishCard);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">🔄 P2P 거래 UI 통합 테스트</h1>
        <button onClick={() => { addOwnedCard({ cardId: "card-aespa-001", cardName: "Karina", groupName: "aespa" }); addWishCard({ cardId: "card-bts-001", cardName: "RM", groupName: "BTS" }); }} className="px-6 py-3 bg-blue-500 text-white rounded">Mock 데이터 추가</button>
        <MatchSuggestionBox />
        <button onClick={() => setIsTradeModalOpen(true)} className="px-6 py-3 bg-nomad-red text-white rounded">새 거래글</button>
        <TradePostCreateModal isOpen={isTradeModalOpen} onClose={() => setIsTradeModalOpen(false)} />
      </div>
    </main>
  );
}
