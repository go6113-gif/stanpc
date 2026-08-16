"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Award, Trophy, Zap } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";
import { calculateBinderStats } from "@/lib/analytics/binder";
import { BinderValueCard } from "@/components/vault/BinderValueCard";
import { StanpcExploreCards } from "@/components/landing/StanpcExploreCards";

/**
 * 프로필 상세 페이지
 * - 프로필 카드 (아바타, 닉네임, 등급 뱃지)
 * - 핵심 수집 지표 (BinderValueCard + 추가 지표)
 * - 가이드 아카이브 (StanpcExploreCards)
 */
export default function ProfilePage() {
  // Zustand store에서 바인더 데이터 읽기
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);

  // 닉네임 (현재는 기본값, 나중에 useAuthStore 연동)
  const nickname = "스탠픽컬렉터";
  const userBadge = "Verified Collector";
  const favoriteMembers = ["지젤", "카리나"];

  // 바인더 통계 계산
  const stats = useMemo(() => {
    return calculateBinderStats(ownedCards);
  }, [ownedCards]);

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
          {/* A. 프로필 카드 영역 */}
          <motion.section variants={item}>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* 아바타 */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-2 border-pink-500/50 flex items-center justify-center">
                    <User size={40} className="text-pink-400" />
                  </div>
                </div>

                {/* 프로필 정보 */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {nickname}
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-xs font-bold text-yellow-400">
                      {userBadge}
                    </span>
                  </div>

                  <p className="text-white/60 mb-4">
                    포토카드 컬렉션을 관리하고 전 세계 팬들과 거래하세요
                  </p>

                  {/* 최애 멤버 뱃지 */}
                  {favoriteMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {favoriteMembers.map((member: string) => (
                        <span
                          key={member}
                          className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300"
                        >
                          💜 {member}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* B. 바인더 가치 카드 (BinderValueCard 재사용) */}
          <motion.section variants={item}>
            <BinderValueCard />
          </motion.section>

          {/* B. 추가 수집 지표 */}
          <motion.section variants={item}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 소장 카드 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <Trophy size={24} className="text-green-400" />
                </div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  소장 중
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {ownedCards.length}
                </p>
              </motion.div>

              {/* 위시리스트 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/30 p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <Award size={24} className="text-orange-400" />
                </div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  위시리스트
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  {wishCards.length}
                </p>
              </motion.div>

              {/* 교환/판매 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <Zap size={24} className="text-purple-400" />
                </div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  교환 가능
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {wttCards.length}
                </p>
              </motion.div>

              {/* 완성도 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <Zap size={24} className="text-blue-400" />
                </div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  완성도
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.completionPercentage.toFixed(1)}%
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* 내 바인더 버튼 */}
          <motion.section variants={item}>
            <Link
              href="/vault"
              className="block w-full rounded-xl bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 px-6 py-4 text-center font-bold text-white transition-all hover:shadow-lg hover:shadow-pink-500/20"
            >
              📦 내 바인더 바로가기
            </Link>
          </motion.section>

          {/* C. 가이드 아카이브 섹션 */}
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
