"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import { Download, Loader2 } from "lucide-react";
import type { ThemeType, CanvasRatio } from "./BinderExportCustomizer";

// Mock photocard data for demonstration
const MOCK_CARDS = [
  {
    id: "1",
    slug: "aespa-karina-spicy",
    memberName: "KARINA",
    groupName: "aespa",
    imageUrl: "https://biasroomcdn.com/0c8a74ab-5d49-42d4-9e72-3d1e5c9f3b2a",
    thumbImagePath: "https://biasroomcdn.com/0c8a74ab-5d49-42d4-9e72-3d1e5c9f3b2a",
    badge: "Hologram",
    estimatedPrice: 55.0,
  },
  {
    id: "2",
    slug: "aespa-minjeong-official",
    memberName: "Kim Min-jeong",
    groupName: "aespa",
    imageUrl: "https://biasroomcdn.com/f847c3e1-2d5f-4a8b-b1e3-9c2f5d7a1b3c",
    thumbImagePath: "https://biasroomcdn.com/f847c3e1-2d5f-4a8b-b1e3-9c2f5d7a1b3c",
    badge: null,
    estimatedPrice: null,
  },
  {
    id: "3",
    slug: "aespa-aeri-official",
    memberName: "Uchinaga Aeri",
    groupName: "aespa",
    imageUrl: "https://biasroomcdn.com/1a3f5c9e-7b2d-4e1f-a3c5-b8d9e2f4c1a3",
    thumbImagePath: "https://biasroomcdn.com/1a3f5c9e-7b2d-4e1f-a3c5-b8d9e2f4c1a3",
    badge: null,
    estimatedPrice: 45.0,
  },
];

interface BinderCard {
  id: string;
  slug: string;
  memberName: string;
  groupName: string;
  imageUrl: string;
  thumbImagePath: string;
  badge: string | null;
  estimatedPrice: number | null;
}

interface BinderExportProps {
  cards?: BinderCard[];
  username?: string;
  title?: string;
  theme?: ThemeType;
  canvasRatio?: CanvasRatio;
}

const THEME_STYLES: Record<ThemeType, string> = {
  "dark-neon":
    "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900",
  "pastel-gradient":
    "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200",
  "hologram-glitter":
    "bg-gradient-to-br from-cyan-300 via-purple-300 to-pink-300",
  "simple-matte": "bg-black",
};

const CANVAS_RATIO_CLASSES: Record<CanvasRatio, string> = {
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
};

export function BinderExport({
  cards = MOCK_CARDS,
  username = "my_vault",
  title = "My Photocard Binder",
  theme = "dark-neon",
  canvasRatio = "1:1",
}: BinderExportProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

      // Create download link
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${username}_binder_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export binder:", error);
      alert("이미지 캡처에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  const getContainerMaxWidth = (ratio: CanvasRatio): string => {
    switch (ratio) {
      case "1:1":
        return "max-w-md";
      case "9:16":
        return "max-w-xs";
      case "4:3":
        return "max-w-lg";
    }
  };

  const getThemeOverlayElements = (theme: ThemeType) => {
    switch (theme) {
      case "dark-neon":
        return (
          <>
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-blue-500/20 to-transparent blur-3xl" />
          </>
        );
      case "pastel-gradient":
        return (
          <>
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-pink-400/30 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-purple-400/30 to-transparent blur-3xl" />
          </>
        );
      case "hologram-glitter":
        return (
          <>
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-cyan-400/40 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-pink-400/40 to-transparent blur-3xl" />
          </>
        );
      case "simple-matte":
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Preview */}
      <div className="flex flex-col items-center gap-4">
        <div
          ref={exportRef}
          className={`relative w-full ${getContainerMaxWidth(canvasRatio)} ${CANVAS_RATIO_CLASSES[canvasRatio]} overflow-hidden rounded-2xl ${THEME_STYLES[theme]} p-8`}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            {getThemeOverlayElements(theme)}
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="mt-1 text-sm text-white/60">stanpc.com/@{username}</p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              {cards.slice(0, 3).map((card) => (
                <div
                  key={card.id}
                  className="group relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-white/10 bg-neutral-800"
                >
                  {/* Card Image */}
                  {card.imageUrl || card.thumbImagePath ? (
                    <Image
                      src={card.thumbImagePath || card.imageUrl}
                      alt={`${card.memberName} - ${card.groupName}`}
                      fill
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 200px"
                      unoptimized // Allow cross-origin images
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900 text-xs text-neutral-500">
                      No Image
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Card Info Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2 text-white">
                    <div className="flex justify-between">
                      {card.badge && (
                        <span className="rounded bg-rose-500 px-2 py-1 text-[10px] font-semibold">
                          {card.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-white/70">
                        {card.estimatedPrice
                          ? `$${card.estimatedPrice}`
                          : "TBA"}
                      </span>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-bold leading-tight">
                        {card.memberName}
                      </p>
                      <p className="text-[10px] text-white/80">
                        {card.groupName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="border-t border-white/10 pt-4 text-center text-xs text-white/60">
              <p>포토카드 {cards.length}개 · stanpc.com</p>
            </div>
          </div>

          {/* Watermark - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white">StanPC</span>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg bg-rose-500 px-6 py-3 font-semibold text-white transition-all hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Download size={18} />
              이미지로 다운로드
            </>
          )}
        </button>

        {/* Info Text */}
        <p className="text-center text-sm text-neutral-500">
          바인더를 PNG 이미지로 다운로드해서 SNS에 공유하세요!
        </p>
      </div>
    </div>
  );
}
