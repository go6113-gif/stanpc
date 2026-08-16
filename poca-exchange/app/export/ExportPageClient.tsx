'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ExportStudio, type ExportMode, type PhotoCard } from '@/components/export/ExportStudio';
import { useBinderStore } from '@/store/useBinderStore';
import { useAssetSelectionStore } from '@/store/useAssetSelectionStore';

export default function ExportPageClient() {
  const router = useRouter();
  const [mode, setMode] = useState<ExportMode>('flex');
  const [hydrated, setHydrated] = useState(false);

  const selectedCardIdsSet = useAssetSelectionStore((state) => state.selectedCardIds);
  const selectedCardIds = useMemo(() => Array.from(selectedCardIdsSet), [selectedCardIdsSet]);

  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);
  const wtsCards = useBinderStore((state) => state.wtsCards);

  const clearSelection = useAssetSelectionStore((state) => state.clearSelection);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 선택된 카드를 모드별로 분류
  const exportData = useMemo(() => {
    const allCards = [...ownedCards, ...wishCards];
    const selectedCards = allCards.filter((c) => selectedCardIds.includes(c.cardId));

    const convertToPhotoCard = (card: any): PhotoCard => ({
      id: card.cardId,
      slug: card.cardId,
      memberName: card.memberName || 'Unknown',
      groupName: card.groupName,
      imageUrl: card.imageUrl || '',
      thumbImagePath: card.imageUrl || '',
      badge: null,
      estimatedPrice: null,
    });

    switch (mode) {
      case 'wtt': {
        const have = selectedCards.filter((c) => ownedCards.find((oc) => oc.cardId === c.cardId));
        const want = selectedCards.filter((c) => wishCards.find((wc) => wc.cardId === c.cardId));
        return {
          haveCards: have.map(convertToPhotoCard),
          wantCards: want.map(convertToPhotoCard),
          allCards: [],
        };
      }
      case 'wts': {
        return {
          haveCards: [],
          wantCards: [],
          allCards: wtsCards
            .filter((c) => selectedCardIds.includes(c.cardId))
            .map((c) => ({
              card: convertToPhotoCard(c),
              condition: 'nm' as const,
              price: 0,
              currency: 'USD' as const,
            })),
        };
      }
      case 'flex':
      default: {
        return {
          haveCards: [],
          wantCards: [],
          allCards: selectedCards.map((c) => ({
            card: convertToPhotoCard(c),
            condition: 'mint' as const,
            price: 0,
            currency: 'USD' as const,
          })),
        };
      }
    }
  }, [selectedCardIds, ownedCards, wishCards, wtsCards, mode]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
        <div className="text-white">로드 중...</div>
      </div>
    );
  }

  const totalCards =
    exportData.haveCards.length +
    exportData.wantCards.length +
    exportData.allCards.length;

  return (
    <main className="min-h-screen bg-[#0F0F12] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              clearSelection();
              router.back();
            }}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">🎨 SNS 내보내기</h1>
            <p className="text-sm text-neutral-400 mt-1">
              {totalCards === 0
                ? '카드를 선택하여 내보내기를 시작하세요'
                : `${totalCards}개의 카드 준비 완료`}
            </p>
          </div>
        </div>

        {totalCards === 0 ? (
          <div className="rounded-lg border border-white/10 bg-neutral-900 p-8 text-center">
            <p className="text-neutral-400 mb-4">선택된 카드가 없습니다.</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Vault로 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* Mode Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">📌 공유 방식 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    key: 'wtt',
                    label: '🔵🔴 교환 (WTT)',
                    description: '보유카드 ↔️ 원하는카드',
                  },
                  {
                    key: 'wts',
                    label: '💰 판매 (WTS)',
                    description: '가격 정보 포함',
                  },
                  {
                    key: 'flex',
                    label: '✨ 자랑 (Flex)',
                    description: '전체화면 갤러리',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMode(item.key as ExportMode)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      mode === item.key
                        ? 'border-[#FF2A55] bg-[#FF2A55]/10'
                        : 'border-white/10 bg-neutral-800 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-sm text-neutral-400">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Studio */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">📤 내보내기 미리보기</h2>
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8">
                <ExportStudio
                  mode={mode}
                  haveCards={exportData.haveCards}
                  wantCards={exportData.wantCards}
                  allCards={exportData.allCards}
                />
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-neutral-900/50 border border-white/10 p-4 space-y-2">
              <h3 className="text-sm font-bold text-white/80">ℹ️ 팁</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>✅ WTT: 보유 중인 카드와 원하는 카드를 한 이미지에 표시</li>
                <li>✅ WTS: 각 카드별 가격 정보 포함</li>
                <li>✅ Flex: 9:16 비율로 SNS 스토리 최적화</li>
                <li>✅ 클립보드 복사, 다운로드, SNS 공유 지원</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
