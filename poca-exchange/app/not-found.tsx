'use client';

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F12] to-[#1a1a1f] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* 404 Heading */}
        <div className="mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            404
          </h1>
          <p className="text-2xl font-bold text-white mb-2">페이지를 찾을 수 없습니다</p>
          <p className="text-gray-400 text-sm">
            찾으시는 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-10 opacity-60">
          <svg
            className="w-32 h-32 mx-auto text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>홈으로</span>
          </Link>
          <button
            onClick={() => router.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-200 rounded-lg font-medium hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-xs mb-4">인기 페이지</p>
          <div className="flex flex-col gap-2">
            <Link href="/groups/bts" className="text-blue-400 text-sm hover:underline">
              BTS 도감
            </Link>
            <Link href="/vault" className="text-blue-400 text-sm hover:underline">
              내 바인더
            </Link>
            <Link href="/gallery" className="text-blue-400 text-sm hover:underline">
              포토카드 갤러리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
