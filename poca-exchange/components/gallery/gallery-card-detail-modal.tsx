"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatMultiCurrency } from "@/lib/format";
import type { PhotoCardData } from "@/components/high-density/photocard-card";

interface GalleryCardDetailModalProps {
  card: PhotoCardData;
  isOpen: boolean;
  onClose: () => void;
}

export function GalleryCardDetailModal({
  card,
  isOpen,
  onClose,
}: GalleryCardDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "market" | "notes">(
    "specs"
  );

  if (!isOpen || !card) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] bg-[#1c1c1c] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* 좌측: 포토카드 이미지 */}
        <div className="w-full md:w-2/5 bg-black p-8 flex justify-center items-center border-r border-gray-800">
          <div className="relative w-full max-w-[280px] aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            {card.imageUrl || card.thumbImagePath ? (
              <Image
                src={card.thumbImagePath || card.imageUrl || ""}
                alt={card.cardName || "Photocard"}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                <span className="text-white/50">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 상세 정보 */}
        <div className="w-full md:w-3/5 text-white flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="p-6 md:p-8 pb-0 space-y-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {card.memberName || "Unknown Member"}
              </h2>
              <p className="text-gray-400">{card.groupName || "Unknown Group"}</p>
            </div>

            {/* 가격 정보 */}
            {card.estimatedPrice ? (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/60 mb-1">Estimated Price</p>
                <p className="text-2xl font-bold text-[#FF2A55]">
                  {formatMultiCurrency(card.estimatedPrice)}
                </p>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/60 mb-1">Estimated Price</p>
                <p className="text-xl text-white/40">TBA</p>
              </div>
            )}

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">
                  {card.ownedCount}
                </p>
                <p className="text-xs text-white/60 mt-1">Owned</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">
                  {card.wishedCount}
                </p>
                <p className="text-xs text-white/60 mt-1">Wished</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">
                  {card.viewCount}
                </p>
                <p className="text-xs text-white/60 mt-1">Views</p>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex border-b border-gray-800 mt-6 px-6 md:px-8">
            {["specs", "market", "notes"].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setActiveTab(tab as "specs" | "market" | "notes")
                }
                className={`px-4 py-3 font-semibold text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "text-white border-b-2 border-[#FF2A55]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "specs"
                  ? "Specs"
                  : tab === "market"
                    ? "Market"
                    : "Notes"}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-4">
            {activeTab === "specs" && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Card Name</span>
                  <span className="text-white">
                    {card.cardName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Version</span>
                  <span className="text-white">
                    {card.version || "Standard"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Album</span>
                  <span className="text-white">
                    {card.albumTitle || "—"}
                  </span>
                </div>
                {card.badge && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Type</span>
                    <span className="inline-block bg-[#FF2A55] text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      {card.badge}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-3">
                <p className="text-white/60 text-sm">
                  이 카드를 구매할 수 있는 마켓플레이스:
                </p>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg text-white font-medium transition-colors"
                  >
                    eBay
                  </a>
                  <a
                    href="#"
                    className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg text-white font-medium transition-colors"
                  >
                    Buyee
                  </a>
                  <a
                    href="#"
                    className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg text-white font-medium transition-colors"
                  >
                    Mercari
                  </a>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                <p className="text-white/60 text-sm">
                  상세 페이지에서 더 많은 정보를 확인하세요.
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/card/${card.slug}`}
                    className="inline-block bg-[#FF2A55] hover:bg-[#FF2A55]/90 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    자세히 보기 →
                  </Link>
                  {card.albumTitle && (
                    <div>
                      <p className="text-white/60 text-sm mb-2">또는 이 앨범 전체를 확인하세요:</p>
                      <Link
                        href={`/gallery/${encodeURIComponent(card.albumTitle)}`}
                        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        📚 {card.albumTitle} 도감
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
