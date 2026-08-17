'use client';

import { PhotocardSlot } from './PhotocardSlot';
import { motion } from 'framer-motion';

interface Card {
  cardId: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  isOwned: boolean;
  isWish: boolean;
  albumName?: string;
  memberName?: string;
}

interface NinePocketBinderProps {
  cards: Card[];
  onWishToggle?: (cardId: string, newState: boolean) => Promise<void>;
  onCardClick?: (cardId: string) => void;
  title?: string;
  showText?: boolean;
  showBadges?: boolean;
}

/**
 * 9-포켓 바인더 그리드 렌더링
 * - 3x3 레이아웃 (9개 슬롯)
 * - 각 슬롯은 PhotocardSlot 컴포넌트로 상태별 렌더링
 * - 소유/위시/미소유 3가지 상태 지원
 */
export function NinePocketBinder({
  cards,
  onWishToggle,
  onCardClick,
  title,
  showText = true,
  showBadges = true,
}: NinePocketBinderProps) {
  // 항상 9개 슬롯을 유지 (부족하면 빈 슬롯)
  const slots = [...cards.slice(0, 9), ...Array(Math.max(0, 9 - cards.length)).fill(null)];

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          {title}
        </h2>
      )}

      <div className="inline-flex w-full">
        <div className="bg-gradient-to-b from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 rounded-2xl p-4 md:p-6 shadow-lg w-full">
          {/* 바인더 상단 (종이 질감) */}
          <div className="mb-4 text-center">
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              9-포켓 바인더
            </p>
          </div>

          {/* 3x3 그리드 */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {slots.map((card, idx) => (
              <motion.div
                key={`slot-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                {card ? (
                  <PhotocardSlot
                    cardId={card.cardId}
                    imageUrl={card.imageUrl}
                    fallbackImageUrl={card.fallbackImageUrl}
                    isOwned={card.isOwned}
                    isWish={card.isWish}
                    albumName={card.albumName}
                    memberName={card.memberName}
                    onWishToggle={onWishToggle}
                    onCardClick={onCardClick}
                    showText={showText}
                    showBadges={showBadges}
                  />
                ) : (
                  // 빈 슬롯
                  <div className="rounded-lg bg-white dark:bg-neutral-800 aspect-square border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                    <span className="text-2xl text-neutral-300 dark:text-neutral-700">+</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 바인더 하단 (지탱 부분) */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-1 flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full opacity-50" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">StanPC</span>
            <div className="h-1 flex-1 bg-gradient-to-l from-amber-600 to-yellow-600 rounded-full opacity-50" />
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: '소장', value: cards.filter((c) => c.isOwned).length },
          { label: '위시', value: cards.filter((c) => c.isWish && !c.isOwned).length },
          {
            label: '미소유',
            value: cards.filter((c) => !c.isOwned && !c.isWish).length,
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center"
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
