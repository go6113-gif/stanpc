"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Shield, MapPin, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAssetSelectionStore } from "@/store/useAssetSelectionStore";
import type { AssetCard as AssetCardType } from "@/lib/types/asset";

interface AssetCardProps {
  card: AssetCardType;
  onSelect?: () => void;
  onDetailClick?: () => void;
}

export function AssetCard({ card, onSelect, onDetailClick }: AssetCardProps) {
  const isSelected = useAssetSelectionStore((state) => state.isCardSelected(card.id));
  const toggleSelection = useAssetSelectionStore((state) => state.toggleCardSelection);
  const isSelectMode = useAssetSelectionStore((state) => state.isSelectMode);

  const handleCardClick = () => {
    if (isSelectMode) {
      toggleSelection(card.id);
      onSelect?.();
    } else {
      onDetailClick?.();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(card.id);
    onSelect?.();
  };

  // 상태별 색상 및 아이콘
  const getStatusStyle = () => {
    switch (card.status) {
      case "wtt":
        return {
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-300",
          label: "교환",
          icon: <ArrowUpRight size={12} />,
        };
      case "wts":
        return {
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          textColor: "text-orange-300",
          label: "판매",
          icon: <ArrowDownLeft size={12} />,
        };
      case "wishlist":
        return {
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          textColor: "text-yellow-300",
          label: "위시",
          icon: null,
        };
      case "owned":
      default:
        return {
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          textColor: "text-green-300",
          label: "소장",
          icon: null,
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      onClick={handleCardClick}
      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
        isSelected
          ? "border-[#FF2A55] bg-[#FF2A55]/10 shadow-lg shadow-[#FF2A55]/20"
          : `${statusStyle.borderColor} hover:border-white/30 hover:shadow-lg`
      }`}
    >
      {/* 이미지 */}
      <div className="relative aspect-[56/87] bg-gradient-to-br from-white/10 to-white/5 overflow-hidden">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.cardName}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            📸
          </div>
        )}

        {/* 선택 체크박스 */}
        {isSelectMode && (
          <button
            onClick={handleCheckboxClick}
            className="absolute top-2 left-2 z-10 p-1"
          >
            <CheckCircle2
              size={24}
              className={`transition-colors ${
                isSelected
                  ? "fill-[#FF2A55] text-[#FF2A55]"
                  : "text-white/40 hover:text-white/60"
              }`}
            />
          </button>
        )}

        {/* 상태 뱃지 */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusStyle.bgColor} ${statusStyle.borderColor} border ${statusStyle.textColor}`}
        >
          {statusStyle.icon && statusStyle.icon}
          {statusStyle.label}
        </div>

        {/* Verified 쉴드 마크 */}
        {card.authenticationStatus === "verified" && (
          <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-green-500/80 border border-green-400/50">
            <Shield size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* 정보 섹션 */}
      <div className="p-3 space-y-2 bg-white/5 backdrop-blur-sm">
        <div>
          <p className="text-xs font-bold text-white/70 uppercase tracking-wide">
            {card.memberName}
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {card.groupName}
          </p>
        </div>

        {/* 보관 위치 태그 */}
        {card.location && (
          <div className="flex items-center gap-1 text-xs text-white/60">
            <MapPin size={12} />
            <span className="truncate">#{card.location.label}</span>
          </div>
        )}

        {/* 인증 상태 표시 */}
        {card.authenticationStatus !== "unverified" && (
          <div className="text-xs font-semibold">
            {card.authenticationStatus === "verified" && (
              <span className="text-green-400">✓ 실물 인증</span>
            )}
            {card.authenticationStatus === "in-progress" && (
              <span className="text-yellow-400">⏳ 인증 진행 중</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
