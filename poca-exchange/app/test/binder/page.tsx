'use client';

import { useState } from 'react';
import { NinePocketBinder } from '@/components/vault/NinePocketBinder';

/**
 * 9-포켓 바인더 테스트 페이지
 * /test/binder 에서 확인 가능
 */

const SAMPLE_CARDS = [
  {
    cardId: 'card-1',
    imageUrl: 'https://via.placeholder.com/300x400/FF1493/FFFFFF?text=BTS+V',
    isOwned: true,
    isWish: false,
    memberName: 'V',
    albumName: 'BE',
  },
  {
    cardId: 'card-2',
    imageUrl: 'https://via.placeholder.com/300x400/FFB6C1/000000?text=BTS+Jimin',
    isOwned: false,
    isWish: true,
    memberName: 'Jimin',
    albumName: 'Proof',
  },
  {
    cardId: 'card-3',
    imageUrl: 'https://via.placeholder.com/300x400/FF69B4/FFFFFF?text=BTS+Jungkook',
    isOwned: false,
    isWish: false,
    memberName: 'Jungkook',
    albumName: 'Butter',
  },
  {
    cardId: 'card-4',
    imageUrl: 'https://via.placeholder.com/300x400/DB7093/FFFFFF?text=BTS+RM',
    isOwned: true,
    isWish: false,
    memberName: 'RM',
    albumName: 'Indigo',
  },
  {
    cardId: 'card-5',
    imageUrl: 'https://via.placeholder.com/300x400/FF1493/FFFFFF?text=BTS+Suga',
    isOwned: true,
    isWish: true,
    memberName: 'Suga',
    albumName: 'D-Day',
  },
];

export default function BinderTestPage() {
  const [cards, setCards] = useState(SAMPLE_CARDS);

  const handleWishToggle = async (cardId: string, newState: boolean) => {
    setCards((prev) =>
      prev.map((c) =>
        c.cardId === cardId ? { ...c, isWish: newState } : c
      )
    );
    console.log(`Card ${cardId} wish toggled to ${newState}`);
  };

  const handleCardClick = (cardId: string) => {
    console.log(`Card ${cardId} clicked`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-neutral-950 dark:to-neutral-900 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            9-포켓 바인더 테스트
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            3가지 상태(소유/위시/미보유)를 테스트해보세요.
          </p>
        </div>

        <NinePocketBinder
          cards={cards}
          title="내 바인더"
          onWishToggle={handleWishToggle}
          onCardClick={handleCardClick}
          showText={true}
          showBadges={true}
        />

        {/* Debug Info */}
        <div className="mt-12 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            디버그 정보
          </h2>
          <div className="space-y-2">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm"
              >
                <p>
                  <span className="font-semibold">{card.memberName}</span> (
                  {card.albumName}) - 소유:{' '}
                  <span className="text-blue-600">{String(card.isOwned)}</span>,
                  위시:
                  <span className="text-pink-600">{String(card.isWish)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
            테스트 방법:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              ✅ <strong>소유 카드 (💎 뱃지)</strong>: V, RM, Suga - 컬러, 소장 뱃지 표시
            </li>
            <li>
              💖 <strong>위시 카드 (💖 뱃지)</strong>: Jimin, Suga - 컬러, 핑크 하트 뱃지
            </li>
            <li>
              🤍 <strong>미보유 카드 (위시 추가 버튼)</strong>: Jungkook - 흑백, 50% 투명도,
              호버 시 "💖 위시 추가" 버튼
            </li>
            <li>
              ➕ <strong>빈 슬롯 (9-5=4개)</strong>: "+" 아이콘으로 표시, 탭/클릭 시 추가 가능
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
