"use client";

import Image from "next/image";
import { useState } from "react";
import { UserBinderCardStatus } from "@/app/generated/prisma/enums";
import { updateCardStatus, removeCardFromVault } from "@/app/actions/inventory";
import { statusLabels, statusColors } from "@/lib/state-machine/inventory";
import { CardStatusDropdown } from "./card-status-dropdown";
import { CardNoteEditor } from "./card-note-editor";

interface InventoryCardProps {
  card: {
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
  };
  userId: string;
}

export function InventoryCard({ card, userId }: InventoryCardProps) {
  const [status, setStatus] = useState<UserBinderCardStatus>(card.status);
  const [note, setNote] = useState<string | null>(card.note);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const handleStatusChange = async (newStatus: UserBinderCardStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateCardStatus(card.id, newStatus, false);
      if (result.success) {
        setStatus(newStatus);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 카드를 삭제하시겠습니까?")) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await removeCardFromVault(card.id);
      if (result.success) {
        // 페이지 새로고침으로 카드 제거 반영
        window.location.reload();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const imageUrl = card.card.thumbImagePath || card.card.imageUrl;

  return (
    <div className="group relative bg-white dark:bg-slate-700 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* 이미지 */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-600 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={card.card.cardName || "Photocard"}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* 상태 배지 (오버레이) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-3">
        {/* 카드명 */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-2">
          {card.card.cardName || "Untitled"}
        </h3>

        {/* 상태 버튼 */}
        <div className="mb-2">
          <CardStatusDropdown
            currentStatus={status}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </div>

        {/* 메모 표시/편집 */}
        <div className="mb-2">
          {note ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600/50 p-2 rounded line-clamp-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
              {note}
            </div>
          ) : (
            <button
              onClick={() => setShowNoteEditor(true)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              + 메모 추가
            </button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-1 text-xs">
          {note && (
            <button
              onClick={() => setShowNoteEditor(true)}
              className="flex-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              수정
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 메모 편집 모달 */}
      {showNoteEditor && (
        <CardNoteEditor
          binderCardId={card.id}
          initialNote={note}
          onClose={() => setShowNoteEditor(false)}
          onSave={(newNote) => {
            setNote(newNote);
            setShowNoteEditor(false);
          }}
        />
      )}
    </div>
  );
}
