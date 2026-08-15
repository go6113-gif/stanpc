"use client";

import { useState } from "react";
import { updateCardNote } from "@/app/actions/inventory";

interface CardNoteEditorProps {
  binderCardId: string;
  initialNote: string | null;
  onClose: () => void;
  onSave: (note: string | null) => void;
}

export function CardNoteEditor({
  binderCardId,
  initialNote,
  onClose,
  onSave,
}: CardNoteEditorProps) {
  const [note, setNote] = useState(initialNote || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateCardNote(
        binderCardId,
        note.trim() || null
      );
      if (result.success) {
        onSave(result.data.note);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-700 rounded-lg shadow-xl p-6 z-50 w-full max-w-md">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          메모 편집
        </h2>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="이 카드에 대한 메모를 입력하세요"
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </>
  );
}
