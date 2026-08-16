"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileHeatmap } from "@/components/profile/ProfileHeatmap";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { StanpcExploreCards } from "@/components/landing/StanpcExploreCards";

/**
 * 프로필 상세 페이지 (Global Collector Portfolio Hub)
 * - ProfileHeader: 아바타, 닉네임, 유저 핸들, 신뢰도, 업적 뱃지
 * - ProfileStats: 소장수, 위시수, 거래 가능, 자산 평가액
 * - ProfileHeatmap: 지난 52주 활동 히트맵 (Github 스타일)
 * - ProfileProgress: 주요 앨범별 수집 진척도
 * - StanpcExploreCards: 가이드 아카이브
 */
export default function ProfilePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F12] to-[#1A1A1E]">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F0F12]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">내 프로필</h1>
            <Link
              href="/"
              className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* 1. 프로필 헤더 (아바타, 닉네임, 신뢰도, 업적) */}
          <motion.div variants={item}>
            <ProfileHeader />
          </motion.div>

          {/* 2. 프로필 통계 (소장수, 위시수, 거래, 자산 평가액) */}
          <motion.div variants={item}>
            <ProfileStats />
          </motion.div>

          {/* 3. 활동 히트맵 (Github 스타일 지난 52주) */}
          <motion.div variants={item}>
            <ProfileHeatmap />
          </motion.div>

          {/* 4. 수집 진척도 (주요 앨범별 완성도) */}
          <motion.div variants={item}>
            <ProfileProgress />
          </motion.div>

          {/* 5. 가이드 아카이브 */}
          <motion.section variants={item} className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                StanPC 완벽 가이드
              </h2>
              <p className="text-white/60">
                포토카드 수집, 거래, 자랑하기 — 모든 기능을 한눈에
              </p>
            </div>
            <StanpcExploreCards />
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
