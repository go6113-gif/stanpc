"use client";

import { useState } from "react";
import { BinderExport } from "./BinderExport";
import { Palette, Smartphone } from "lucide-react";

export type ThemeType =
  | "dark-neon"
  | "pastel-gradient"
  | "hologram-glitter"
  | "simple-matte";

export type CanvasRatio = "1:1" | "9:16" | "4:3";

interface ThemeOption {
  id: ThemeType;
  label: string;
  description: string;
  preview: string;
}

interface CanvasOption {
  id: CanvasRatio;
  label: string;
  description: string;
  aspectClass: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "dark-neon",
    label: "다크 네온",
    description: "검정색 배경 + 네온 핑크/블루 글로우",
    preview: "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900",
  },
  {
    id: "pastel-gradient",
    label: "파스텔 그라데이션",
    description: "부드러운 파스텔 톤 그래디언트",
    preview: "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200",
  },
  {
    id: "hologram-glitter",
    label: "홀로그램 글리터",
    description: "반짝이는 무지개 그래디언트",
    preview: "bg-gradient-to-br from-cyan-300 via-purple-300 to-pink-300",
  },
  {
    id: "simple-matte",
    label: "심플 매트",
    description: "순수한 검정색 배경",
    preview: "bg-black",
  },
];

const CANVAS_OPTIONS: CanvasOption[] = [
  {
    id: "1:1",
    label: "인스타그램 피드",
    description: "정사각형 피드용 (1:1)",
    aspectClass: "aspect-square",
  },
  {
    id: "9:16",
    label: "스토리/쇼츠",
    description: "세로형 스토리·쇼츠 (9:16)",
    aspectClass: "aspect-[9/16]",
  },
  {
    id: "4:3",
    label: "X/트위터",
    description: "X(트위터) 최적화 (4:3)",
    aspectClass: "aspect-[4/3]",
  },
];

const THEME_STYLES: Record<ThemeType, string> = {
  "dark-neon":
    "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900",
  "pastel-gradient":
    "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200",
  "hologram-glitter":
    "bg-gradient-to-br from-cyan-300 via-purple-300 to-pink-300",
  "simple-matte": "bg-black",
};

const THEME_OVERLAY_STYLES: Record<ThemeType, string> = {
  "dark-neon": `
    <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl" />
    <div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-blue-500/20 to-transparent blur-3xl" />
  `,
  "pastel-gradient": `
    <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-pink-400/30 to-transparent blur-3xl" />
    <div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-purple-400/30 to-transparent blur-3xl" />
  `,
  "hologram-glitter": `
    <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-b from-cyan-400/40 to-transparent blur-3xl" />
    <div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-t from-pink-400/40 to-transparent blur-3xl" />
  `,
  "simple-matte": "",
};

export function BinderExportCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("dark-neon");
  const [selectedRatio, setSelectedRatio] = useState<CanvasRatio>("1:1");
  const [username, setUsername] = useState("my_vault");
  const [title, setTitle] = useState("My Photocard Binder");

  const canvasOption = CANVAS_OPTIONS.find((opt) => opt.id === selectedRatio)!;

  return (
    <div className="space-y-8">
      {/* Customization Panel */}
      <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-xl p-6 space-y-6">
        {/* Theme Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">배경 테마</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`group relative rounded-lg border-2 transition-all overflow-hidden ${
                  selectedTheme === theme.id
                    ? "border-rose-400 bg-rose-400/10"
                    : "border-neutral-600 hover:border-neutral-500 bg-neutral-700/30"
                }`}
              >
                {/* Preview */}
                <div className={`h-24 w-full ${THEME_STYLES[theme.id]}`} />

                {/* Label */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-white">
                    {theme.label}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {theme.description}
                  </p>
                </div>

                {/* Check Mark */}
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2 rounded-full bg-rose-400 w-6 h-6 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Ratio Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={20} className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">캔버스 비율</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CANVAS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedRatio(option.id)}
                className={`group relative rounded-lg border-2 transition-all p-4 ${
                  selectedRatio === option.id
                    ? "border-rose-400 bg-rose-400/10"
                    : "border-neutral-600 hover:border-neutral-500 bg-neutral-700/30"
                }`}
              >
                {/* Preview Box */}
                <div className={`mx-auto mb-3 bg-neutral-600 rounded ${option.aspectClass} w-16`} />

                <p className="text-sm font-semibold text-white">
                  {option.label}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {option.description}
                </p>

                {/* Check Mark */}
                {selectedRatio === option.id && (
                  <div className="absolute top-2 right-2 rounded-full bg-rose-400 w-6 h-6 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Text Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              유저네임
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 30))}
              maxLength={30}
              placeholder="예: my_vault"
              className="w-full rounded-lg border border-neutral-600 bg-neutral-700/50 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-rose-400 focus:outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {username.length}/30
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              바인더 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              maxLength={50}
              placeholder="예: My Photocard Collection"
              className="w-full rounded-lg border border-neutral-600 bg-neutral-700/50 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-rose-400 focus:outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {title.length}/50
            </p>
          </div>
        </div>
      </div>

      {/* Preview & Download */}
      <div>
        <h3 className="text-lg font-bold text-white mb-6">미리보기</h3>
        <BinderExport
          theme={selectedTheme}
          canvasRatio={selectedRatio}
          username={username}
          title={title}
        />
      </div>
    </div>
  );
}
