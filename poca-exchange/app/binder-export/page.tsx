import Link from "next/link";
import type { Metadata } from "next";
import { BinderExportCustomizer } from "@/components/binder/BinderExportCustomizer";
import { ArrowLeft, Sparkles, Zap, Share2 } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stanpc.com";

export const metadata: Metadata = {
  title: "내 포카 바인더 1초 박제 ✨ - StanPC",
  description: "터치 한 번으로 인스타 스토리에 내 바인더 자랑하기",
  openGraph: {
    title: "내 포카 바인더 1초 박제 ✨",
    description: "터치 한 번으로 인스타 스토리에 내 바인더 자랑하기",
    url: `${siteUrl}/binder-export`,
    type: "website",
    images: [
      {
        url: `${siteUrl}/api/og/binder?username=StanPC%20Collector&title=My%20Photocard%20Binder&ownedCount=0&wishCount=0&theme=neon`,
        width: 1200,
        height: 630,
        alt: "StanPC Binder Share",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "내 포카 바인더 1초 박제 ✨",
    description: "터치 한 번으로 인스타 스토리에 내 바인더 자랑하기",
    images: [
      `${siteUrl}/api/og/binder?username=StanPC%20Collector&title=My%20Photocard%20Binder&ownedCount=0&wishCount=0&theme=neon`,
    ],
  },
};

export default function BinderExportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300">
              내 포카 바인더 1초 박제 ✨
            </h1>
            <p className="text-lg text-neutral-300 font-medium">
              터치 한 번으로 인스타 스토리에 내 바인더 자랑하기
            </p>
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
