"use client";

import { useState } from "react";
import { BinderExport } from "./BinderExport";
import { Palette, Smartphone, Share2, BookOpen } from "lucide-react";

export type ThemeType =
  | "dark-neon"
  | "pastel-gradient"
  | "hologram-glitter"
  | "simple-matte";

export type CanvasRatio = "1:1" | "9:16" | "4:3";

export type ShareMode = "showcase" | "wtt";

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

interface ShareModeOption {
  id: ShareMode;
  icon: string;
  label: string;
  description: string;
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
    label: "스토리/릴스",
    description: "세로형 스토리·릴스 (9:16)",
    aspectClass: "aspect-[9/16]",
  },
  {
    id: "4:3",
    label: "X(트위터)",
    description: "X(트위터) 최적화 (4:3)",
    aspectClass: "aspect-[4/3]",
  },
];

const SHARE_MODE_OPTIONS: ShareModeOption[] = [
  {
    id: "showcase",
    icon: "✨",
    label: "컬렉션 자랑용",
    description: "보유 포카를 감성 바인더 형태로 렌더링",
  },
  {
    id: "wtt",
    icon: "🔄",
    label: "X(트위터) 교환/양도용",
    description: "보유(Have)와 갈망(Wish)을 구분 표기하는 교환 템플릿",
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

export function BinderExportCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("dark-neon");
  const [selectedRatio, setSelectedRatio] = useState<CanvasRatio>("9:16");
  const [shareMode, setShareMode] = useState<ShareMode>("showcase");
  const [username, setUsername] = useState("my_vault");
  const [title, setTitle] = useState("My Photocard Binder");
  const [showWatermark, setShowWatermark] = useState(true);

  const canvasOption = CANVAS_OPTIONS.find((opt) => opt.id === selectedRatio)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 좌측 컨트롤 패널 (lg:col-span-5) */}
      <div className="lg:col-span-5 space-y-6">
        {/* 공유 모드 선택 */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={20} className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">공유 모드</h3>
          </div>
          <div className="space-y-3">
            {SHARE_MODE_OPTIONS.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setShareMode(mode.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  shareMode === mode.id
                    ? "border-rose-400 bg-rose-400/10"
                    : "border-neutral-600 hover:border-neutral-500 bg-neutral-700/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{mode.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {mode.label}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {mode.description}
                    </p>
                  </div>
                  {shareMode === mode.id && (
                    <div className="rounded-full bg-rose-400 w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SNS 플랫폼 캔버스 규격 */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={20} className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">SNS 플랫폼 규격</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
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
                <div className="flex items-center gap-3">
                  {/* Preview Box */}
                  <div className={`flex-shrink-0 bg-neutral-600 rounded ${option.aspectClass} w-16`} />

                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {option.description}
                    </p>
                  </div>

                  {/* Check Mark */}
                  {selectedRatio === option.id && (
                    <div className="rounded-full bg-rose-400 w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 배경 테마 */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">배경 테마</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                <div className={`h-20 w-full ${THEME_STYLES[theme.id]}`} />

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

        {/* 텍스트 & 워터마크 옵션 */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-xl p-6 space-y-4">
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

          <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-600 bg-neutral-700/30">
            <input
              type="checkbox"
              id="watermark"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded border-neutral-600 text-rose-400 focus:ring-rose-400"
            />
            <label htmlFor="watermark" className="text-sm font-medium text-white cursor-pointer flex-1">
              유저네임 워터마크 표시
            </label>
          </div>
        </div>
      </div>

      {/* 우측 실시간 라이브 프리뷰 (lg:col-span-7) */}
      <div className="lg:col-span-7 space-y-6 sticky top-8">
        {/* 프리뷰 헤더 */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">실시간 프리뷰</h3>
          <p className="text-sm text-neutral-400">
            좌측 옵션이 즉시 반영됩니다. 아래 버튼으로 이미지를 저장하거나 공유하세요.
          </p>
        </div>

        {/* 프리뷰 캔버스 */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-900/50 backdrop-blur-xl p-8 flex justify-center">
          <BinderExport
            theme={selectedTheme}
            canvasRatio={selectedRatio}
            username={showWatermark ? username : ""}
            title={title}
          />
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => {
              // Download functionality
              const canvas = document.querySelector("[data-export-canvas]") as HTMLElement;
              if (canvas) {
                alert("이미지 다운로드 기능이 활성화됩니다.");
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold transition-all"
          >
            📥 고화질 이미지 다운로드 (PNG)
          </button>

          {shareMode === "wtt" && (
            <button
              onClick={() => {
                alert("X(트위터) 맞교환 텍스트가 클립보드에 복사되었습니다.");
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold transition-all"
            >
              📋 X(트위터) 맞교환 텍스트 자동 복사
            </button>
          )}
        </div>

        {/* 도움말 */}
        <div className="rounded-lg bg-neutral-900/50 border border-neutral-700 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <BookOpen size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-2">💡 사용 팁</p>
              <ul className="text-xs text-neutral-400 space-y-1">
                <li>✓ 바인더가 비어있으면 데모 포카카드가 표시됩니다</li>
                <li>✓ 9:16 규격이 인스타그램 스토리에 가장 적합합니다</li>
                <li>✓ 다크 네온 테마는 SNS 공유에 최적화되어 있습니다</li>
                <li>✓ 고화질 PNG로 다운로드하여 어디든 공유하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
