'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Check, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export interface PhotocardItem {
  id: string;
  cardSlug: string;
  memberName: string;
  groupName: string;
  imageUrl: string | null;
  thumbImagePath: string | null;
  cardName: string;
  albumTitle: string | null;
  isOwned?: boolean;
}

interface AlbumGalleryClientProps {
  albumId: string;
  albumTitle: string;
  cards: PhotocardItem[];
}

export default function AlbumGalleryClient({
  albumId,
  albumTitle,
  cards,
}: AlbumGalleryClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(cards.map((c) => c.id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map((c) => c.id));
    }
  };

  const handleBulkAdd = async (status: 'OWNED' | 'WISH') => {
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/vault/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: selectedIds, targetStatus: status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '요청 실패');
      }

      const data = await res.json();

      // Success
      setTimeout(() => {
        router.push('/vault');
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '바인더에 추가하는 중 오류가 발생했습니다';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-neutral-100 min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/gallery"
              className="p-1 hover:bg-neutral-800 rounded transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-400" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">{albumTitle}</h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400">총 {cards.length}종 수록</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSelectAllToggle}
            disabled={isSubmitting}
            className="px-3 py-2 text-xs md:text-sm bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded border border-neutral-700 transition-colors"
          >
            {selectedIds.length === cards.length ? '전체 해제' : '전종 선택'}
          </button>
          <button
            disabled={isSubmitting || selectedIds.length === 0}
            onClick={() => handleBulkAdd('OWNED')}
            className="px-3 py-2 text-xs md:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center gap-1.5 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                <PlusCircle size={14} />
                보유({selectedIds.length}장) 추가
              </>
            )}
          </button>
          <button
            disabled={isSubmitting || selectedIds.length === 0}
            onClick={() => handleBulkAdd('WISH')}
            className="px-3 py-2 text-xs md:text-sm font-semibold bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center gap-1.5 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                <PlusCircle size={14} />
                위시({selectedIds.length}장) 추가
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {isSubmitting && (
        <div className="mb-6 p-4 bg-green-950 border border-green-800 rounded-lg text-green-300 text-sm">
          ✅ 바인더에 추가되었습니다. 바인더로 이동 중...
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id);
          const imageUrl = card.thumbImagePath || card.imageUrl;
          const isCardNotOwned = card.isOwned === false;

          return (
            <div
              key={card.id}
              onClick={() => !isSubmitting && handleToggle(card.id)}
              className={`group relative aspect-[55/85] rounded-lg overflow-hidden border cursor-pointer bg-neutral-900 transition-all ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/40 opacity-100'
                  : isCardNotOwned
                    ? 'border-neutral-700 opacity-30 hover:opacity-40 hover:border-neutral-600'
                    : 'border-neutral-800 opacity-75 hover:opacity-100 hover:border-neutral-600'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={card.memberName}
                    className={`w-full h-full object-cover transition-transform ${
                      !isCardNotOwned && 'group-hover:scale-105'
                    } ${isCardNotOwned ? 'grayscale' : ''}`}
                    loading="lazy"
                  />
                  {isCardNotOwned && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/trade?wishCardId=${card.id}`;
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors"
                      >
                        🔄 교환 탐색
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                  No Image
                </div>
              )}

              {/* Selection Checkbox */}
              {!isCardNotOwned && (
                <div className="absolute top-1.5 left-1.5 z-10">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shadow-md transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-black/60 border-neutral-500/80 backdrop-blur-sm'
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </div>
                </div>
              )}

              {/* Member Name Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[10px] text-center text-white/80 truncate">
                {card.memberName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <div className="flex h-96 items-center justify-center rounded-lg border border-white/5 bg-white/5">
          <p className="text-center text-neutral-400">이 앨범의 포토카드가 없습니다</p>
        </div>
      )}
    </div>
  );
}
