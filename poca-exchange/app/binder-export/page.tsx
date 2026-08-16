import Link from "next/link";
import type { Metadata } from "next";
import { BinderExportCustomizer } from "@/components/binder/BinderExportCustomizer";
import { ArrowLeft } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stanpc.com";

export const metadata: Metadata = {
  title: "바인더 이미지 다운로드 - StanPC",
  description: "내 포토카드 바인더를 SNS 공유용 이미지로 만드세요.",
  openGraph: {
    title: "My Photocard Binder - StanPC",
    description: "포토카드 바인더를 SNS에 공유하세요",
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
    title: "My Photocard Binder - StanPC",
    description: "포토카드 바인더를 SNS에 공유하세요",
    images: [
      `${siteUrl}/api/og/binder?username=StanPC%20Collector&title=My%20Photocard%20Binder&ownedCount=0&wishCount=0&theme=neon`,
    ],
  },
};

export default function BinderExportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              바인더 공유하기
            </h1>
            <p className="mt-2 text-neutral-400">
              내 포토카드 바인더를 예쁜 이미지로 만들어 SNS에 공유하세요
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={16} />
            돌아가기
          </Link>
        </div>

        {/* Binder Export Customizer */}
        <BinderExportCustomizer />

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-800/30 p-4 border border-neutral-700">
            <div className="text-sm font-semibold text-rose-400">🎨</div>
            <p className="mt-2 text-sm font-medium text-white">HD 품질</p>
            <p className="mt-1 text-xs text-neutral-400">
              고해상도(2배 배율) PNG 이미지로 다운로드
            </p>
          </div>
          <div className="rounded-lg bg-neutral-800/30 p-4 border border-neutral-700">
            <div className="text-sm font-semibold text-rose-400">🔗</div>
            <p className="mt-2 text-sm font-medium text-white">즉시 사용 가능</p>
            <p className="mt-1 text-xs text-neutral-400">
              이미지 다운로드 후 바로 SNS에 공유
            </p>
          </div>
          <div className="rounded-lg bg-neutral-800/30 p-4 border border-neutral-700">
            <div className="text-sm font-semibold text-rose-400">✨</div>
            <p className="mt-2 text-sm font-medium text-white">자동 워터마크</p>
            <p className="mt-1 text-xs text-neutral-400">
              StanPC 워터마크가 자동으로 추가됨
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 rounded-lg bg-blue-500/10 border border-blue-500/20 p-6">
          <p className="text-sm font-semibold text-blue-300">💡 팁</p>
          <ul className="mt-3 space-y-2 text-xs text-neutral-300">
            <li>• Instagram, Twitter, Pinterest 등 SNS에 최적화되었습니다</li>
            <li>• 다운로드된 이미지의 날짜가 파일명에 포함됩니다</li>
            <li>• 여러 번 다운로드하여 다양한 조합으로 공유할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
