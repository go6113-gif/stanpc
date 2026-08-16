"use client";

import { useMemo } from "react";

export type SleevePreset = "none" | "heart-glitter" | "star-sparkle" | "cute-deco";

interface SleeveDecoOverlayProps {
  preset: SleevePreset;
}

/**
 * 가상 슬리브/탑꾸 오버레이 컴포넌트.
 * 카드 이미지 위에 입혀지는 4가지 데코 프리셋.
 * pointer-events-none 및 mix-blend-mode로 자연스럽게 표시.
 */
export function SleeveDecoOverlay({ preset }: SleeveDecoOverlayProps) {
  if (preset === "none") {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
      {/* Heart Glitter 프리셋 */}
      {preset === "heart-glitter" && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          style={{
            mixBlendMode: "screen",
            opacity: 0.6,
          }}
        >
          <defs>
            <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#FFB6D9", stopOpacity: 0.8 }} />
              <stop offset="50%" style={{ stopColor: "#FF69B4", stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: "#FF1493", stopOpacity: 0.4 }} />
            </linearGradient>

            <filter id="heartGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 코너 하트들 */}
          <g filter="url(#heartGlow)" style={{ mixBlendMode: "screen" } as any}>
            {/* Top-left heart */}
            <path
              d="M 20 35 C 15 30, 10 35, 10 40 C 10 50, 20 60, 20 60 C 20 60, 30 50, 30 40 C 30 35, 25 30, 20 35 Z"
              fill="url(#heartGradient)"
            />

            {/* Top-right heart */}
            <path
              d="M 280 35 C 285 30, 290 35, 290 40 C 290 50, 280 60, 280 60 C 280 60, 270 50, 270 40 C 270 35, 275 30, 280 35 Z"
              fill="url(#heartGradient)"
            />

            {/* Bottom-left heart */}
            <path
              d="M 20 375 C 15 370, 10 375, 10 380 C 10 390, 20 400, 20 400 C 20 400, 30 390, 30 380 C 30 375, 25 370, 20 375 Z"
              fill="url(#heartGradient)"
            />

            {/* Bottom-right heart */}
            <path
              d="M 280 375 C 285 370, 290 375, 290 380 C 290 390, 280 400, 280 400 C 280 400, 270 390, 270 380 C 270 375, 275 370, 280 375 Z"
              fill="url(#heartGradient)"
            />

            {/* Center accent heart */}
            <path
              d="M 150 100 C 140 95, 130 100, 130 108 C 130 125, 150 145, 150 145 C 150 145, 170 125, 170 108 C 170 100, 160 95, 150 100 Z"
              fill="url(#heartGradient)"
              opacity="0.7"
            />
          </g>

          {/* 반짝이는 광선 */}
          <g opacity="0.5" style={{ mixBlendMode: "screen" } as any}>
            <circle cx="30" cy="50" r="2" fill="#FFE4E1" />
            <circle cx="270" cy="50" r="2" fill="#FFE4E1" />
            <circle cx="150" cy="120" r="3" fill="#FFB6D9" />
            <circle cx="50" cy="200" r="1.5" fill="#FFE4E1" />
            <circle cx="250" cy="200" r="1.5" fill="#FFE4E1" />
          </g>
        </svg>
      )}

      {/* Star Sparkle 프리셋 */}
      {preset === "star-sparkle" && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          style={{
            mixBlendMode: "screen",
            opacity: 0.7,
          }}
        >
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#FFD700", stopOpacity: 0.9 }} />
              <stop offset="50%" style={{ stopColor: "#FFA500", stopOpacity: 0.7 }} />
              <stop offset="100%" style={{ stopColor: "#FF8C00", stopOpacity: 0.5 }} />
            </linearGradient>

            <filter id="starGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 코너 별들 */}
          <g filter="url(#starGlow)" style={{ mixBlendMode: "screen" } as any}>
            {/* Top-left star */}
            <polygon
              points="20,15 23,25 34,25 26,32 29,42 20,35 11,42 14,32 6,25 17,25"
              fill="url(#starGradient)"
            />

            {/* Top-right star */}
            <polygon
              points="280,15 283,25 294,25 286,32 289,42 280,35 271,42 274,32 266,25 277,25"
              fill="url(#starGradient)"
            />

            {/* Bottom-left star */}
            <polygon
              points="20,385 23,395 34,395 26,402 29,412 20,405 11,412 14,402 6,395 17,395"
              fill="url(#starGradient)"
            />

            {/* Bottom-right star */}
            <polygon
              points="280,385 283,395 294,395 286,402 289,412 280,405 271,412 274,402 266,395 277,395"
              fill="url(#starGradient)"
            />

            {/* Center star accent */}
            <polygon
              points="150,80 155,95 172,95 160,105 165,120 150,110 135,120 140,105 128,95 145,95"
              fill="url(#starGradient)"
              opacity="0.8"
            />

            {/* Mini sparkles */}
            <polygon
              points="80,150 82,158 91,158 85,163 87,171 80,166 73,171 75,163 69,158 78,158"
              fill="#FFD700"
              opacity="0.6"
            />
            <polygon
              points="220,150 222,158 231,158 225,163 227,171 220,166 213,171 215,163 209,158 218,158"
              fill="#FFD700"
              opacity="0.6"
            />
            <polygon
              points="100,300 102,308 111,308 105,313 107,321 100,316 93,321 95,313 89,308 98,308"
              fill="#FFA500"
              opacity="0.5"
            />
            <polygon
              points="200,300 202,308 211,308 205,313 207,321 200,316 193,321 195,313 189,308 198,308"
              fill="#FFA500"
              opacity="0.5"
            />
          </g>

          {/* 반짝이 입자 */}
          <g opacity="0.6" style={{ mixBlendMode: "screen" } as any}>
            <circle cx="60" cy="100" r="1" fill="#FFFF99" />
            <circle cx="240" cy="100" r="1" fill="#FFFF99" />
            <circle cx="150" cy="200" r="1.5" fill="#FFD700" />
            <circle cx="80" cy="250" r="0.8" fill="#FFFF99" />
            <circle cx="220" cy="250" r="0.8" fill="#FFFF99" />
          </g>
        </svg>
      )}

      {/* Cute Deco Frame 프리셋 */}
      {preset === "cute-deco" && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, transparent 15px, #FF69B4 15px, #FF69B4 16px, transparent 16px),
              linear-gradient(225deg, transparent 15px, #FF69B4 15px, #FF69B4 16px, transparent 16px),
              linear-gradient(315deg, transparent 15px, #FF69B4 15px, #FF69B4 16px, transparent 16px),
              linear-gradient(45deg, transparent 15px, #FF69B4 15px, #FF69B4 16px, transparent 16px)
            `,
            backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%",
            backgroundPosition: "top left, top right, bottom right, bottom left",
            backgroundRepeat: "no-repeat",
            mixBlendMode: "multiply",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          {/* 내부 데코 라인 */}
          <div
            className="absolute inset-2 pointer-events-none"
            style={{
              border: "2px dashed rgba(255, 105, 180, 0.4)",
              borderRadius: "8px",
            }}
          />

          {/* 코너 스티커 원 */}
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 30%, #FFB6D9, #FF69B4)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 30%, #FFB6D9, #FF69B4)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
          <div
            className="absolute bottom-3 left-3 w-6 h-6 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 30%, #FFB6D9, #FF69B4)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
          <div
            className="absolute bottom-3 right-3 w-6 h-6 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 30%, #FFB6D9, #FF69B4)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)",
            }}
          />

          {/* 상단 중앙 데코 리본 */}
          <div
            className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-8 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 25%, #FF1493 25%, #FF1493 75%, transparent 75%)",
              mask: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, black 100%)",
              WebkitMask: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, black 100%)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export const SLEEVE_PRESETS = [
  { id: "none" as const, label: "순정", emoji: "✨" },
  { id: "heart-glitter" as const, label: "하트", emoji: "💕" },
  { id: "star-sparkle" as const, label: "별빛", emoji: "⭐" },
  { id: "cute-deco" as const, label: "탑꾸", emoji: "🎀" },
];
