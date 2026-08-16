"use client";

import { X, Upload, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export type TradeType = "WTT" | "WTS" | "WTB";
export type CardCondition = "mint" | "near_mint" | "played";
export type ShippingMethod = "registered" | "convenience" | "standard";

export interface CardItem {
  id: string;
  memberName: string;
  groupName: string;
  albumTitle: string;
  thumbnailUrl: string | null;
}

export interface TradePostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockCards: CardItem[];
}

const CONDITION_BADGES = {
  mint: { label: "Mint (미개봉/완벽)", color: "bg-green-500/20 border-green-500/40 text-green-400" },
  near_mint: { label: "Near Mint (미세하자)", color: "bg-blue-500/20 border-blue-500/40 text-blue-400" },
  played: { label: "Played (눈에 띄는 하자)", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
};

const SHIPPING_METHODS = [
  { id: "registered", label: "준등기", price: 1800, desc: "추적 가능, 안전 배송" },
  { id: "convenience", label: "GS25/CU 반값택배", price: 1800, desc: "편의점 수령/발송" },
  { id: "standard", label: "일반택배", price: 3500, desc: "빠른 배송" },
];

export function TradePostCreateModal({
  isOpen,
  onClose,
  mockCards,
}: TradePostCreateModalProps) {
  const [tradeType, setTradeType] = useState<TradeType>("WTT");
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(
    mockCards[0] || null
  );
  const [condition, setCondition] = useState<CardCondition>("mint");
  const [wishText, setWishText] = useState("");
  const [price, setPrice] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Currency conversion
  const priceKRW = parseInt(price) || 0;
  const priceUSD = Math.round(priceKRW / 1300);
  const priceJPY = Math.round(priceKRW / 10);

  const toggleShipping = (method: ShippingMethod) => {
    setSelectedShipping((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Mock submit - no DB operation
    console.log({
      tradeType,
      selectedCard,
      condition,
      wishText: tradeType === "WTT" ? wishText : undefined,
      price: tradeType === "WTS" ? price : undefined,
      selectedShipping,
      uploadedImage,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-4">
      {/* Modal Container */}
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1A1A1E] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#1A1A1E]/95 backdrop-blur">
          <h2 className="text-lg font-bold text-white">새 거래글 등록</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Trade Type Tabs */}
          <div className="flex gap-2">
            {(["WTT", "WTS", "WTB"] as TradeType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTradeType(type)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  tradeType === type
                    ? "bg-[#FF2A55] text-white"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                {type === "WTT" && "교환 (WTT)"}
                {type === "WTS" && "판매 (WTS)"}
                {type === "WTB" && "구매 (WTB)"}
              </button>
            ))}
          </div>

          {/* Card Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">
              거래 대상 카드 선택
            </label>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 max-h-48 overflow-y-auto p-3 rounded-lg bg-white/5 border border-white/10">
              {mockCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`rounded-lg overflow-hidden aspect-[63/88] relative border-2 transition-all ${
                    selectedCard?.id === card.id
                      ? "border-[#FF2A55]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {card.thumbnailUrl ? (
                    <Image
                      src={card.thumbnailUrl}
                      alt={card.memberName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2A2A2E] to-[#1A1A1E] flex items-center justify-center">
                      <span className="text-xs text-white/30">No Image</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedCard && (
              <p className="text-xs text-white/60">
                선택됨: <span className="text-white font-medium">{selectedCard.memberName}</span> ({selectedCard.groupName})
              </p>
            )}
          </div>

          {/* Card Condition */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">
              카드 상태(Condition)
            </label>
            <div className="flex flex-wrap gap-2">
              {(["mint", "near_mint", "played"] as CardCondition[]).map(
                (cond) => (
                  <button
                    key={cond}
                    onClick={() => setCondition(cond)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      condition === cond
                        ? `${CONDITION_BADGES[cond].color} border-opacity-100`
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {CONDITION_BADGES[cond].label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Conditional Content: WTT vs WTS */}
          {tradeType === "WTT" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">
                교환 희망 포카 (텍스트 입력 또는 위시 태그)
              </label>
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="예: 세븐틴 민규 포토카드 (모든 버전 환영)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                rows={3}
              />
            </div>
          )}

          {tradeType === "WTS" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">
                  희망 판매 가격 (KRW)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="예: 15000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                />
              </div>

              {/* Currency Preview */}
              {price && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                  <p className="text-xs text-white/60">환율 자동 환산 (참고용)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-white/50">KRW</p>
                      <p className="text-sm font-bold text-white">
                        ₩{priceKRW.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/50">USD</p>
                      <p className="text-sm font-bold text-white">
                        ${priceUSD.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/50">JPY</p>
                      <p className="text-sm font-bold text-white">
                        ¥{priceJPY.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Methods */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">
              배송 방식 선택 (중복 선택 가능)
            </label>
            <div className="space-y-2">
              {SHIPPING_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedShipping.includes(method.id as ShippingMethod)
                      ? "bg-[#FF2A55]/10 border-[#FF2A55]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/8"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedShipping.includes(
                      method.id as ShippingMethod
                    )}
                    onChange={() =>
                      toggleShipping(method.id as ShippingMethod)
                    }
                    className="mt-1 accent-[#FF2A55]"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-white">
                      {method.label}{" "}
                      <span className="text-[#FF2A55]">+{method.price.toLocaleString()}원</span>
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {method.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">
              실물 인증 샷 첨부
            </label>
            <div className="rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-6 text-center hover:border-[#FF2A55]/40 hover:bg-[#FF2A55]/5 transition-all">
              {uploadedImage ? (
                <div className="space-y-2">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-32 mx-auto rounded"
                  />
                  <label className="text-xs text-white/60 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    다른 사진 선택
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Upload className="mx-auto text-white/60" size={24} />
                    <p className="text-xs font-medium text-white">
                      사진을 드래그하거나 클릭
                    </p>
                    <p className="text-xs text-white/50">
                      포스트잇에 닉네임/날짜 작성 필수
                    </p>
                  </div>
                </label>
              )}
            </div>
            {/* Safety Tips */}
            <div className="flex gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300/80">
                포스트잇에 <span className="font-semibold">오늘 날짜</span>와{" "}
                <span className="font-semibold">닉네임</span>을 작성한 후, 카드와 함께 촬영해주세요.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-2 border-t border-white/10 px-5 py-4 bg-[#1A1A1E]/95 backdrop-blur">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors py-2.5 text-sm font-semibold text-white"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCard || (tradeType === "WTT" && !wishText) || (tradeType === "WTS" && !price)}
            className="flex-1 rounded-lg bg-[#FF2A55] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity py-2.5 text-sm font-semibold text-white"
          >
            거래글 등록
          </button>
        </div>
      </div>
    </div>
  );
}
