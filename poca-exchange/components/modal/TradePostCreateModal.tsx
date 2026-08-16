"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TradePostCreateRequest, ContactType } from "@/lib/types/trade";

interface TradePostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TradeType = "WTT" | "WTS" | "WTB";

interface FormState {
  type: TradeType;
  offeringCardIds: string[];
  seekingCardIds: string[];
  price?: number;
  currency: string;
  shippingFee?: number;
  contactType: ContactType;
  contactValue: string;
}

/**
 * P2P 거래글 작성 모달
 * - WTT (교환), WTS (판매), WTB (구매희망) 3가지 모드
 * - POST /api/trades 연동
 */
export function TradePostCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: TradePostCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    type: "WTT",
    offeringCardIds: [],
    seekingCardIds: [],
    currency: "KRW",
    contactType: "twitter",
    contactValue: "",
  });

  // 새 카드 ID 입력 필드
  const [newOfferingId, setNewOfferingId] = useState("");
  const [newSeekingId, setNewSeekingId] = useState("");

  const handleAddOfferingCard = () => {
    if (newOfferingId.trim()) {
      setForm((prev) => ({
        ...prev,
        offeringCardIds: [...prev.offeringCardIds, newOfferingId.trim()],
      }));
      setNewOfferingId("");
    }
  };

  const handleRemoveOfferingCard = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      offeringCardIds: prev.offeringCardIds.filter((_, i) => i !== idx),
    }));
  };

  const handleAddSeekingCard = () => {
    if (newSeekingId.trim()) {
      setForm((prev) => ({
        ...prev,
        seekingCardIds: [...prev.seekingCardIds, newSeekingId.trim()],
      }));
      setNewSeekingId("");
    }
  };

  const handleRemoveSeekingCard = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      seekingCardIds: prev.seekingCardIds.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 필수 필드 검증
    if (form.offeringCardIds.length === 0) {
      setError("제공할 카드를 최소 1개 이상 입력해주세요.");
      return;
    }

    if (!form.contactValue.trim()) {
      setError("연락 방법을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: TradePostCreateRequest = {
        type: form.type,
        offeringCardIds: form.offeringCardIds,
        seekingCardIds: form.seekingCardIds,
        contactType: form.contactType,
        contactValue: form.contactValue.trim(),
        price: form.price,
        currency: form.currency,
        shippingFee: form.shippingFee,
      };

      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "거래글 등록 실패");
      }

      const data = await response.json();
      setSuccessMessage(`✅ 거래글이 등록되었습니다 (ID: ${data.tradePostId})`);

      // 1.5초 후 자동 닫기
      setTimeout(() => {
        setForm({
          type: "WTT",
          offeringCardIds: [],
          seekingCardIds: [],
          currency: "KRW",
          contactType: "twitter",
          contactValue: "",
        });
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-neutral-950 sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  🔄 거래글 등록
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  판매 / 구매 / 교환 거래글을 작성하세요
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
                {/* 거래 유형 선택 */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-3 uppercase tracking-wide">
                    📋 거래 유형
                  </label>
                  <div className="flex gap-2">
                    {(["WTT", "WTS", "WTB"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, type }))}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                          form.type === type
                            ? "bg-nomad-red text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {type === "WTT"
                          ? "🔄 교환"
                          : type === "WTS"
                            ? "💰 판매"
                            : "🛍️ 구매희망"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 제공할 카드 */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                    📦 제공할 카드
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newOfferingId}
                      onChange={(e) => setNewOfferingId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOfferingCard();
                        }
                      }}
                      placeholder="카드 ID 입력 (예: card-aespa-001)"
                      className="flex-1 rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddOfferingCard}
                      className="rounded-lg px-4 py-2 text-sm font-bold bg-nomad-red text-white hover:bg-red-600"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.offeringCardIds.map((cardId, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-nomad-red/10 border border-nomad-red/30 px-3 py-1.5 text-sm text-nomad-red"
                      >
                        <span>{cardId}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOfferingCard(idx)}
                          className="text-nomad-red/60 hover:text-nomad-red"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 원하는 카드 */}
                {form.type === "WTT" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                      💝 원하는 카드
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSeekingId}
                        onChange={(e) => setNewSeekingId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSeekingCard();
                          }
                        }}
                        placeholder="카드 ID 입력"
                        className="flex-1 rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddSeekingCard}
                        className="rounded-lg px-4 py-2 text-sm font-bold bg-blue-500 text-white hover:bg-blue-600"
                      >
                        추가
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.seekingCardIds.map((cardId, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400"
                        >
                          <span>{cardId}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSeekingCard(idx)}
                            className="text-blue-600/60 hover:text-blue-600 dark:text-blue-400/60"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 가격 (WTS/WTB만) */}
                {(form.type === "WTS" || form.type === "WTB") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                        💵 가격
                      </label>
                      <input
                        type="number"
                        value={form.price || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            price: e.target.value ? parseInt(e.target.value) : undefined,
                          }))
                        }
                        placeholder="10000"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                        통화
                      </label>
                      <select
                        value={form.currency}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, currency: e.target.value }))
                        }
                        className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                      >
                        <option value="KRW">KRW (원)</option>
                        <option value="USD">USD ($)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 배송료 (WTS만) */}
                {form.type === "WTS" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                      📮 배송료 (선택사항)
                    </label>
                    <input
                      type="number"
                      value={form.shippingFee || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          shippingFee: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="3000"
                      className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                    />
                  </div>
                )}

                {/* 연락 수단 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                      📞 연락 수단
                    </label>
                    <select
                      value={form.contactType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contactType: e.target.value as ContactType,
                        }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                    >
                      <option value="twitter">X (Twitter)</option>
                      <option value="instagram">Instagram DM</option>
                      <option value="openKakao">오픈카톡</option>
                      <option value="discord">Discord</option>
                      <option value="kakaoTalk">카카오톡</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wide">
                      값
                    </label>
                    <input
                      type="text"
                      value={form.contactValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contactValue: e.target.value,
                        }))
                      }
                      placeholder="@username or URL"
                      className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/20 dark:border-red-900/30">
                    <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* 성공 메시지 */}
                {successMessage && (
                  <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-950/20 dark:border-green-900/30">
                    <CheckCircle className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
                  </div>
                )}
              </form>
            </div>

            {/* 푸터 */}
            <div className="flex gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-bold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-bold text-white bg-nomad-red hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={16} className="animate-spin" />}
                {isLoading ? "등록 중..." : "거래글 등록"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
