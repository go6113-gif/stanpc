"use client";

import { UserBinderCardStatus } from "@/app/generated/prisma/enums";
import { InventoryCard } from "./inventory-card";

interface CardData {
  id: string;
  status: UserBinderCardStatus;
  note: string | null;
  card: {
    id: string;
    slug: string;
    cardName: string | null;
    imageUrl: string | null;
    thumbImagePath: string | null;
  };
  createdAt: Date;
}

interface InventoryGridProps {
  cards: CardData[];
  userId: string;
}

export function InventoryGrid({ cards, userId }: InventoryGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            카드가 없습니다
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            마이 볼트에 포토카드를 추가하세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <InventoryCard key={card.id} card={card} userId={userId} />
      ))}
    </div>
  );
}
