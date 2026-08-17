import Link from "next/link";
import type { Metadata } from "next";
import { BinderExportCustomizer } from "@/components/binder/BinderExportCustomizer";
import { ArrowLeft, Sparkles, Zap, Share2 } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stanpc.com";

export const metadata: Metadata = {
  title: "SNS 바인더 익스포트 스튜디오 - StanPC",
  description: "내 디지털 바인더를 인스타그램 스토리, 피드, X(트위터) 규격에 맞춘 감성 이미지로 3초 만에 내보내세요.",
  openGraph: {
    title: "SNS 바인더 익스포트 스튜디오",
    description: "내 디지털 바인더를 인스타그램 스토리, 피드, X(트위터) 규격에 맞춘 감성 이미지로 3초 만에 내보내세요.",
    url: `${siteUrl}/binder-export`,
    type: "website",
    images: [
      {
        url: `${siteUrl}/api/og/binder?username=StanPC%20Collector&title=My%20Photocard%20Binder&ownedCount=0&wishCount=0&theme=neon`,
        width: 1200,
        height: 630,
        alt: "StanPC Binder Export Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SNS 바인더 익스포트 스튜디오",
    description: "내 디지털 바인더를 인스타그램 스토리, 피드, X(트위터) 규격에 맞춘 감성 이미지로 3초 만에 내보내세요.",
    images: [
      `${siteUrl}/api/og/binder?username=StanPC%20Collector&title=My%20Photocard%20Binder&ownedCount=0&wishCount=0&theme=neon`,
    ],
  },
};

export default function BinderExportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between gap-4">
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300">
                SNS 바인더 익스포트 스튜디오
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Binder Export Studio
              </h2>
            </div>
            <p className="text-base sm:text-lg text-neutral-300 font-medium max-w-3xl">
              내 디지털 바인더를 인스타그램 스토리, 피드, X(트위터) 규격에 맞춘 감성 이미지로 3초 만에 내보내세요.
            </p>
            {/* 3-Step Guide Bar */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm sm:text-base text-white/80 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="font-bold text-pink-400">Step 1.</span>
                  <span>포카 담기</span>
                </span>
                <span className="text-white/40">➔</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="font-bold text-pink-400">Step 2.</span>
                  <span>SNS 규격 & 감성 테마 선택</span>
                </span>
                <span className="text-white/40">➔</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="font-bold text-pink-400">Step 3.</span>
                  <span>이미지 저장 & 공유</span>
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Binder Export Customizer */}
        <BinderExportCustomizer />

        {/* Features Section - 1020 감성 */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 p-4 hover:border-pink-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <p className="font-bold text-white">네온 글리터</p>
            </div>
            <p className="text-xs text-neutral-300">
              다크 네온, 파스텔, 홀로그램 등 1020 감성 테마
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-4 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <p className="font-bold text-white">1초 공유</p>
            </div>
            <p className="text-xs text-neutral-300">
              Web Share API로 인스타 앱에 직행
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-4 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              <p className="font-bold text-white">추천 QR</p>
            </div>
            <p className="text-xs text-neutral-300">
              우측 하단에 개인 추천 코드 자동 삽입
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-10 rounded-xl bg-gradient-to-r from-pink-500/20 via-rose-500/10 to-pink-500/20 border border-pink-500/30 p-6">
          <p className="text-sm font-bold text-pink-300 flex items-center gap-2">
            ✨ 1020 팁
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-200">
            <li>• 9:16 스토리 비율이 기본값 (인스타 스토리에 딱맞음)</li>
            <li>• 테마/비율은 자유롭게 변경 가능 (다크 네온 추천!)</li>
            <li>• 생성된 이미지는 즉시 인스타 스토리로 공유 가능</li>
            <li>• 우측 하단 QR 코드로 친구들이 StanPC 가입 가능 🎉</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
