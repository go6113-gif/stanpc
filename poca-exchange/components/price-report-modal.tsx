"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PriceReportButton({ cardId }: { cardId: string }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // document.body is unavailable during SSR, so the portal only renders
  // once mounted on the client — the standard hydration-safe gate.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function resetForm() {
    setPrice("");
    setSourceUrl("");
    setComment("");
    setError(null);
  }

  function openModal() {
    resetForm();
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reportedPrice = Number(price);
    if (!Number.isInteger(reportedPrice) || reportedPrice <= 0) {
      setError("올바른 가격을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          reportedPrice,
          sourceUrl: sourceUrl.trim() || undefined,
          reporterComment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("submit failed");

      setIsOpen(false);
      setToast("제보 감사합니다! 검토 후 반영될 예정이에요.");
    } catch {
      setError("제보 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        시세 제보하기
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="price-report-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900"
            >
              <h2
                id="price-report-title"
                className="text-lg font-bold text-neutral-900 dark:text-neutral-100"
              >
                시세 제보하기
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                실제 거래된(또는 판매 중인) 가격을 알려주시면 검토 후
                반영할게요.
              </p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="reportedPrice"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    제보 가격 <span className="text-pink-600">*</span>
                  </label>
                  <input
                    id="reportedPrice"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    required
                    autoFocus
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="예: 45000"
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sourceUrl"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    거래 출처/링크
                  </label>
                  <input
                    id="sourceUrl"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="번개장터, 포카마켓, 트위터 거래글 URL 등"
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reporterComment"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    메모/설명
                  </label>
                  <textarea
                    id="reporterComment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="특이사항이 있다면 적어주세요"
                    rows={3}
                    maxLength={500}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                {error && <p className="text-sm text-pink-600">{error}</p>}

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? "제출 중..." : "제보하기"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {mounted &&
        toast &&
        createPortal(
          <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <div className="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
              {toast}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
