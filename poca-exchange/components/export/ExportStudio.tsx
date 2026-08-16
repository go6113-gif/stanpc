"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import { Share2, Download, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export type ExportMode = "wtt" | "wts" | "flex";
export type CardCondition = "mint" | "nm" | "ex" | "vg" | "g" | "f";

export interface PhotoCard {
  id: string;
  slug: string;
  memberName: string;
  groupName: string;
  imageUrl: string;
  thumbImagePath: string;
  badge?: string | null;
  estimatedPrice?: number | null;
}

interface ExportCard {
  card: PhotoCard;
  condition?: CardCondition;
  price?: number;
  currency?: "KRW" | "USD";
}

interface ExportStudioProps {
  mode: ExportMode;
  haveCards?: PhotoCard[];
  wantCards?: PhotoCard[];
  allCards?: ExportCard[];
  onClose?: () => void;
}

const CONDITION_BADGES: Record<CardCondition, string> = {
  mint: "Mint",
  nm: "NM",
  ex: "EX",
  vg: "VG",
  g: "Good",
  f: "Fair",
};

const CONDITION_COLORS: Record<CardCondition, string> = {
  mint: "bg-emerald-500",
  nm: "bg-cyan-500",
  ex: "bg-blue-500",
  vg: "bg-amber-500",
  g: "bg-orange-500",
  f: "bg-red-500",
};

/**
 * WTT 모드: 반반 캔버스 컴포넌트
 */
function WTTCanvas({
  haveCards = [],
  wantCards = [],
}: {
  haveCards: PhotoCard[];
  wantCards: PhotoCard[];
}) {
  // 자동 정렬: 카드 개수에 따라 최적의 그리드 배치 계산
  const getGridCols = (count: number): string => {
    if (count <= 2) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  const cardSize = haveCards.length + wantCards.length <= 4 ? 120 : 100;

  return (
    <div className="w-full aspect-square bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-white/10 p-6 space-y-4">
      {/* HAVE 영역 (파란색) */}
      <div className="flex-1 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-700/20 border border-blue-500/30 p-4 space-y-3">
        <div className="text-sm font-bold text-blue-300 uppercase tracking-wider">
          🔵 Have (내가 줄 카드)
        </div>
        <div className={`grid ${getGridCols(haveCards.length)} gap-2 auto-rows-max`}>
          {haveCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center gap-1">
              <img
                src={card.thumbImagePath || card.imageUrl || ""}
                alt={card.memberName}
                className="rounded-lg object-cover bg-neutral-700"
                style={{ width: `${cardSize}px`, height: `${cardSize * 1.4}px` }}
              />
              <div className="text-xs text-white/70 text-center truncate w-full px-1">
                {card.memberName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />

      {/* WANT 영역 (붉은색) */}
      <div className="flex-1 rounded-xl bg-gradient-to-br from-red-600/30 to-red-700/20 border border-red-500/30 p-4 space-y-3">
        <div className="text-sm font-bold text-red-300 uppercase tracking-wider">
          🔴 Want (내가 원할 카드)
        </div>
        <div className={`grid ${getGridCols(wantCards.length)} gap-2 auto-rows-max`}>
          {wantCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center gap-1">
              <img
                src={card.thumbImagePath || card.imageUrl || ""}
                alt={card.memberName}
                className="rounded-lg object-cover bg-neutral-700"
                style={{ width: `${cardSize}px`, height: `${cardSize * 1.4}px` }}
              />
              <div className="text-xs text-white/70 text-center truncate w-full px-1">
                {card.memberName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 워터마크 */}
      <div className="absolute bottom-2 right-3 text-[10px] text-white/40">
        stanpc.com
      </div>
    </div>
  );
}

/**
 * WTS 모드: 가격표 오버레이 컴포넌트
 */
function WTSCanvas({ cards = [] }: { cards: ExportCard[] }) {
  const displayCards = cards.slice(0, 9);
  const gridCols = displayCards.length <= 3 ? "grid-cols-3" : "grid-cols-3";

  return (
    <div className="w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-white/10 p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white">포토카드 판매</h3>
          <p className="text-sm text-white/60">stanpc.com</p>
        </div>

        <div className={`grid ${gridCols} gap-3`}>
          {displayCards.map((item, idx) => (
            <div key={idx} className="relative group">
              <img
                src={item.card.thumbImagePath || item.card.imageUrl || ""}
                alt={item.card.memberName}
                className="rounded-lg object-cover w-full aspect-[2.5/3.5] bg-neutral-700"
              />

              {/* 가격 칩 오버레이 */}
              <div className="absolute bottom-2 left-2 right-2 space-y-1">
                {item.condition && (
                  <div
                    className={`${CONDITION_COLORS[item.condition]} text-white text-[10px] font-bold px-2 py-1 rounded-full text-center`}
                  >
                    {CONDITION_BADGES[item.condition]}
                  </div>
                )}
                {item.price && (
                  <div className="bg-orange-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-lg text-center">
                    {item.currency === "KRW"
                      ? `₩${item.price.toLocaleString("ko-KR")}`
                      : `$${item.price.toFixed(2)}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 워터마크 */}
      <div className="absolute bottom-2 right-3 text-[10px] text-white/40">
        stanpc.com
      </div>
    </div>
  );
}

/**
 * Flex 모드: 드래곤볼 완성 컴포넌트
 */
function FlexCanvas({ cards = [] }: { cards: PhotoCard[] }) {
  const displayCards = cards.slice(0, 9);
  const isComplete = displayCards.length === 9;

  return (
    <div
      className={`w-full aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 p-4 relative`}
      style={{
        background: isComplete
          ? "linear-gradient(135deg, rgb(251, 146, 60) 0%, rgb(249, 115, 22) 50%, rgb(234, 88, 12) 100%)"
          : "linear-gradient(135deg, rgb(30, 30, 36) 0%, rgb(24, 24, 27) 100%)",
      }}
    >
      {/* 폭죽 효과 (Confetti 오버레이) */}
      {isComplete && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/20 via-transparent to-transparent" />
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-3 space-y-1">
        {isComplete && (
          <div className="text-sm font-bold text-white bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent animate-pulse">
            ✨ 완성! ✨
          </div>
        )}
        <h3 className="text-lg font-bold text-white">드래곤볼 컬렉션</h3>
      </div>

      {/* 카드 그리드 (3x3) */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, idx) => {
          const card = displayCards[idx];
          return (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden bg-neutral-700/50 aspect-[2.5/3.5] border border-white/10"
            >
              {card ? (
                <img
                  src={card.thumbImagePath || card.imageUrl || ""}
                  alt={card.memberName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 완성 배지 */}
      {isComplete && (
        <div className="absolute top-4 right-4 bg-yellow-400/90 backdrop-blur-sm text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
          100% 완성!
        </div>
      )}

      {/* 워터마크 */}
      <div className="absolute bottom-2 right-2 text-[9px] text-white/40">
        stanpc.com
      </div>
    </div>
  );
}

/**
 * 메인 ExportStudio 컴포넌트
 */
export function ExportStudio({
  mode,
  haveCards = [],
  wantCards = [],
  allCards = [],
  onClose,
}: ExportStudioProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { user } = useAuthStore();
  const username = user?.nickname || "anonymous";

  // 자동 생성된 공유 텍스트
  const generateShareText = (): string => {
    const timestamp = new Date().toLocaleTimeString("ko-KR");
    const userHandle = `@${username}`;

    switch (mode) {
      case "wtt":
        const haveNames = haveCards.map((c) => `#${c.memberName}`).slice(0, 3);
        const wantNames = wantCards.map((c) => `#${c.memberName}`).slice(0, 3);
        return `WTT 교환 모집! ${haveNames.join(" ")} ↔ ${wantNames.join(" ")} #포카교환 #stanpc ${userHandle}`;

      case "wts":
        const priceRange = allCards.length > 0 ? "판매중" : "문의";
        return `포토카드 ${priceRange} 🎴 #포카판매 #stanpc ${userHandle}`;

      case "flex":
        const isComplete = allCards.length === 9;
        return isComplete
          ? `드래곤볼 100% 완성! 🎉✨ #포카자랑 #stanpc ${userHandle}`
          : `드래곤볼 수집 중... 🎯 #포카수집 #stanpc ${userHandle}`;
    }
  };

  // 클립보드에 텍스트 복사
  const handleCopyToClipboard = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  // 이미지 캡처 및 SNS 공유
  const handleShareToSNS = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      // 1단계: DOM을 이미지로 캡처
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // 2단계: 텍스트 생성 및 클립보드 복사
      const shareText = generateShareText();
      await navigator.clipboard.writeText(shareText);

      // 3단계: Web Share API를 통한 SNS 공유
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      const file = new File([blob], `${username}_export.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        // Web Share API 지원 (모바일)
        await navigator.share({
          files: [file],
          title: "stanpc 포토카드",
          text: shareText,
        });
      } else {
        // Fallback: 이미지 다운로드 + Twitter Intent
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${username}_export_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Twitter Intent URL 열기
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(twitterUrl, "_blank");
      }

      // 폭죽 효과 (Flex 모드에서만)
      if (mode === "flex" && allCards.length === 9) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      alert("공유 준비가 완료되었습니다!");
    } catch (error) {
      console.error("Share failed:", error);
      alert("공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  // 단순 다운로드
  const handleDownload = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${username}_export_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("다운로드에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 캔버스 영역 */}
      <div className="flex justify-center">
        <div ref={exportRef}>
          {mode === "wtt" && (
            <WTTCanvas haveCards={haveCards} wantCards={wantCards} />
          )}
          {mode === "wts" && <WTSCanvas cards={allCards} />}
          {mode === "flex" && <FlexCanvas cards={allCards.map((c) => c.card)} />}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-3">
        {/* SNS 공유 버튼 */}
        <button
          onClick={handleShareToSNS}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white font-semibold py-3 transition-all"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Share2 size={18} />
              SNS로 즉시 공유하기
            </>
          )}
        </button>

        {/* 클립보드 복사 버튼 */}
        <button
          onClick={handleCopyToClipboard}
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/20 hover:border-white/40 text-white font-semibold py-2 transition-all"
        >
          {copySuccess ? (
            <>
              <CheckCircle2 size={18} className="text-emerald-400" />
              복사됨!
            </>
          ) : (
            <>
              <Copy size={18} />
              공유 텍스트 복사
            </>
          )}
        </button>

        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-semibold py-2 transition-all"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Download size={18} />
              이미지 다운로드
            </>
          )}
        </button>
      </div>

      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-white/10 text-white/60 hover:text-white font-semibold py-2 transition-all"
        >
          닫기
        </button>
      )}
    </div>
  );
}
