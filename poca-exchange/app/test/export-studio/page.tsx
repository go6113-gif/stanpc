"use client";

import { useState } from "react";
import { ExportStudio, type ExportMode } from "@/components/export/ExportStudio";

const MOCK_CARDS = [
  {
    id: "1",
    slug: "aespa-karina",
    memberName: "Karina",
    groupName: "aespa",
    imageUrl:
      "https://biasroomcdn.com/0c8a74ab-5d49-42d4-9e72-3d1e5c9f3b2a",
    thumbImagePath:
      "https://biasroomcdn.com/0c8a74ab-5d49-42d4-9e72-3d1e5c9f3b2a",
    badge: "Hologram",
    estimatedPrice: 55.0,
  },
  {
    id: "2",
    slug: "aespa-minjeong",
    memberName: "Minjeong",
    groupName: "aespa",
    imageUrl:
      "https://biasroomcdn.com/f847c3e1-2d5f-4a8b-b1e3-9c2f5d7a1b3c",
    thumbImagePath:
      "https://biasroomcdn.com/f847c3e1-2d5f-4a8b-b1e3-9c2f5d7a1b3c",
    badge: null,
    estimatedPrice: null,
  },
  {
    id: "3",
    slug: "aespa-aeri",
    memberName: "Aeri",
    groupName: "aespa",
    imageUrl:
      "https://biasroomcdn.com/1a3f5c9e-7b2d-4e1f-a3c5-b8d9e2f4c1a3",
    thumbImagePath:
      "https://biasroomcdn.com/1a3f5c9e-7b2d-4e1f-a3c5-b8d9e2f4c1a3",
    badge: null,
    estimatedPrice: 45.0,
  },
  {
    id: "4",
    slug: "bts-jk",
    memberName: "Jungkook",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/2b4e6d7f-8c9a-4b5e-c1d2-e3f4a5b6c7d8",
    thumbImagePath:
      "https://biasroomcdn.com/2b4e6d7f-8c9a-4b5e-c1d2-e3f4a5b6c7d8",
    badge: "Signed",
    estimatedPrice: 150.0,
  },
  {
    id: "5",
    slug: "bts-rm",
    memberName: "RM",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/3c5f7e8f-9d0b-5c6f-d2e3-f4a5b6c7d8e9",
    thumbImagePath:
      "https://biasroomcdn.com/3c5f7e8f-9d0b-5c6f-d2e3-f4a5b6c7d8e9",
    badge: null,
    estimatedPrice: 80.0,
  },
  {
    id: "6",
    slug: "bts-suga",
    memberName: "Suga",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/4d6g8f9g-0e1c-6d7g-e3f4-a5b6c7d8e9f0",
    thumbImagePath:
      "https://biasroomcdn.com/4d6g8f9g-0e1c-6d7g-e3f4-a5b6c7d8e9f0",
    badge: null,
    estimatedPrice: 70.0,
  },
  {
    id: "7",
    slug: "bts-jhope",
    memberName: "J-Hope",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/5e7h9g0h-1f2d-7e8h-f4g5-b6c7d8e9f0g1",
    thumbImagePath:
      "https://biasroomcdn.com/5e7h9g0h-1f2d-7e8h-f4g5-b6c7d8e9f0g1",
    badge: null,
    estimatedPrice: 65.0,
  },
  {
    id: "8",
    slug: "bts-jimin",
    memberName: "Jimin",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/6f8i0h1i-2g3e-8f9i-g5h6-c7d8e9f0g1h2",
    thumbImagePath:
      "https://biasroomcdn.com/6f8i0h1i-2g3e-8f9i-g5h6-c7d8e9f0g1h2",
    badge: "Hologram",
    estimatedPrice: 120.0,
  },
  {
    id: "9",
    slug: "bts-v",
    memberName: "V",
    groupName: "BTS",
    imageUrl:
      "https://biasroomcdn.com/7g9j1i2j-3h4f-9g0j-h6i7-d8e9f0g1h2i3",
    thumbImagePath:
      "https://biasroomcdn.com/7g9j1i2j-3h4f-9g0j-h6i7-d8e9f0g1h2i3",
    badge: null,
    estimatedPrice: 95.0,
  },
];

export default function ExportStudioTestPage() {
  const [mode, setMode] = useState<ExportMode>("wtt");
  const [selectedCards, setSelectedCards] = useState<string[]>([
    "1",
    "2",
    "3",
  ]);

  const handleToggleCard = (id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  // 현재 모드에 따라 데이터 전달
  const haveCards = mode === "wtt" ? MOCK_CARDS.slice(0, 3) : [];
  const wantCards = mode === "wtt" ? MOCK_CARDS.slice(3, 6) : [];

  type CardCondition = "mint" | "nm" | "ex" | "vg" | "g" | "f";
  const conditions: CardCondition[] = ["mint", "nm", "ex"];

  const allCards =
    mode === "wts"
      ? MOCK_CARDS.map((card) => ({
          card,
          condition: conditions[Math.floor(Math.random() * 3)] as CardCondition,
          price: Math.floor(Math.random() * 100) + 30,
          currency: "USD" as const,
        }))
      : mode === "flex"
        ? MOCK_CARDS.map((card) => ({
            card,
            condition: "mint" as CardCondition,
            price: 0,
            currency: "USD" as const,
          }))
        : [];

  return (
    <main className="min-h-screen bg-[#0F0F12] px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white">🎨 ExportStudio 테스트</h1>

        {/* 모드 선택 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">📌 모드 선택</h2>
          <div className="flex gap-3 flex-wrap">
            {["wtt", "wts", "flex"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as ExportMode)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  mode === m
                    ? "bg-[#FF2A55] text-white"
                    : "bg-neutral-800 text-white/60 hover:text-white"
                }`}
              >
                {m === "wtt"
                  ? "🔵🔴 WTT (교환)"
                  : m === "wts"
                    ? "💰 WTS (판매)"
                    : "✨ Flex (자랑)"}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 선택 (WTT 모드일 때만) */}
        {mode === "wtt" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">🎴 카드 선택</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MOCK_CARDS.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleToggleCard(card.id)}
                  className={`rounded-lg overflow-hidden border-2 transition-all ${
                    selectedCards.includes(card.id)
                      ? "border-[#FF2A55]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={card.thumbImagePath}
                    alt={card.memberName}
                    className="w-full aspect-[2.5/3.5] object-cover"
                  />
                  <div className="bg-neutral-800 px-2 py-1 text-xs text-white text-center truncate">
                    {card.memberName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ExportStudio */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">📤 내보내기</h2>
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8">
            <ExportStudio
              mode={mode}
              haveCards={haveCards}
              wantCards={wantCards}
              allCards={allCards}
            />
          </div>
        </div>

        {/* 정보 */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-white/80">ℹ️ 기능</h3>
          <ul className="text-sm text-white/60 space-y-1">
            <li>✅ WTT: Have/Want 자동 정렬</li>
            <li>✅ WTS: 가격표 오버레이</li>
            <li>✅ Flex: 9:16 비율 + 완성 배지</li>
            <li>✅ 워터마크: 닉네임 + 타임스탬프</li>
            <li>✅ SNS 공유: Web Share API + Twitter Intent</li>
            <li>✅ 클립보드 복사: 자동 생성 텍스트</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
