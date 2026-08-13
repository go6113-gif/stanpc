"use client";

import { useTranslations } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userImage: string | null;
  userName: string;
  cards: Array<{
    imageUrl: string | null;
    thumbImagePath: string | null;
    isMissing: boolean;
  }>;
  completionPercentage: number;
  remainingCount: number;
}

type AspectRatio = "16:9" | "9:16" | "1:1";

export function ShowcaseModal({
  isOpen,
  onClose,
  username,
  userImage,
  userName,
  cards,
  completionPercentage,
  remainingCount,
}: ShowcaseModalProps) {
  const { t } = useTranslations("myVault.showcase");
  const [ratio, setRatio] = useState<AspectRatio>("9:16");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const dimensions: Record<AspectRatio, [number, number]> = {
    "16:9": [1920, 1080],
    "9:16": [1080, 1920],
    "1:1": [1080, 1080],
  };

  const [width, height] = dimensions[ratio];
  const cardWidth = width / 6;
  const cardHeight = (cardWidth * 7) / 5;

  const handleGenerate = async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("이미지 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `stanpc_vault_${username}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const file = new File([blob], `stanpc_vault_${username}.png`, {
        type: "image/png",
      });

      if (navigator.share) {
        await navigator.share({
          title: "내 포카 바인더",
          text: t("shareText", {
            remaining: remainingCount,
            username: username,
          }),
          files: [file],
        });
      } else {
        // Fallback: copy to clipboard or download
        handleDownload();
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  if (!isOpen) return null;

  const displayCards = cards.slice(0, 30).concat(
    Array(Math.max(0, 30 - cards.length))
      .fill(null)
      .map(() => ({ imageUrl: null, thumbImagePath: null, isMissing: true }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t("title")}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Subtitle */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("subtitle")}
          </p>

          {/* Ratio Selection */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t("selectRatio")}
            </label>
            <div className="flex gap-2">
              {(["16:9", "9:16", "1:1"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    ratio === r
                      ? "bg-red-500 text-white"
                      : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
                  }`}
                >
                  {r === "16:9" && t("ratio169")}
                  {r === "9:16" && t("ratio916")}
                  {r === "1:1" && t("ratio11")}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Canvas (hidden, for html2canvas) */}
          <div className="hidden">
            <div
              ref={canvasRef}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                position: "relative",
                overflow: "hidden",
              }}
              className="bg-white flex flex-col"
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
                style={{ zIndex: 0 }}
              />

              {/* Header section with user info */}
              <div
                style={{
                  zIndex: 10,
                  padding: `${width * 0.05}px`,
                  textAlign: "center",
                  color: "#111827",
                }}
              >
                <div
                  style={{
                    fontSize: `${width * 0.08}px`,
                    fontWeight: "bold",
                    marginBottom: `${width * 0.02}px`,
                  }}
                >
                  {userName}의 포카 바인더
                </div>
                <div
                  style={{
                    fontSize: `${width * 0.04}px`,
                    color: "#666",
                    marginBottom: `${width * 0.02}px`,
                  }}
                >
                  {completionPercentage}% 완성 · {remainingCount}장 남음
                </div>
              </div>

              {/* Grid container */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: `${width * 0.01}px`,
                  padding: `${width * 0.05}px`,
                  justifyContent: "center",
                  zIndex: 10,
                  flex: 1,
                }}
              >
                {displayCards.map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      backgroundColor: "#e5e7eb",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {card.imageUrl || card.thumbImagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          card.imageUrl || card.thumbImagePath || ""
                        }
                        alt="card"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: card.isMissing ? "grayscale(100%) opacity(0.4)" : "none",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: `${cardWidth * 0.3}px`,
                          color: "#999",
                        }}
                      >
                        ?
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer watermark */}
              <div
                style={{
                  textAlign: "center",
                  padding: `${width * 0.05}px`,
                  fontSize: `${width * 0.05}px`,
                  fontWeight: "bold",
                  color: "#666",
                  zIndex: 10,
                }}
              >
                StanPC.com/u/{username}
              </div>
            </div>
          </div>

          {/* Preview Display */}
          {imageUrl && (
            <div className="rounded-lg border border-neutral-200 overflow-hidden dark:border-neutral-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="showcase preview"
                className="w-full"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!imageUrl ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-red-600 dark:hover:bg-red-700"
              >
                {isGenerating ? t("generating") : t("generate")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="flex-1 rounded-lg bg-neutral-200 px-4 py-3 font-semibold text-neutral-900 hover:bg-neutral-300 transition-colors dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
                >
                  {t("download")}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {t("share")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
