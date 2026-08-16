"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Zap, BarChart3, DollarSign, Banknote } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";
import { calculateBinderStats } from "@/lib/analytics/binder";
import Link from "next/link";

/**
 * 프로필 통계 카드 섹션
 * - 소장 카드 수 / 위시 수 / 교환 가능 카드 / 완성도
 * - 자산 평가액 (KRW ↔ USD 스위칭)
 * - 바인더 바로가기 CTA
 */
export function ProfileStats() {
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);
  const wtsCards = useBinderStore((state) => state.wtsCards);

  const [showUSD, setShowUSD] = useState(false);

  // 바인더 통계 계산
  const stats = useMemo(() => {
    return calculateBinderStats(ownedCards);
  }, [ownedCards]);

  // 임의의 자산 평가액 (실제로는 각 카드의 가격 데이터가 필요)
  const estimatedValueKRW = useMemo(() => {
    return ownedCards.length * 8500; // 평균 포카 가격 ~8,500 KRW
  }, [ownedCards.length]);

  const estimatedValueUSD = Math.round(estimatedValueKRW / 1300);

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
  } as const;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* 주요 지표 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 소장 카드 */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.05 }}
          className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 p-4 text-center cursor-help"
          title="현재 소유 중인 포토카드"
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
          variants={item}
          whileHover={{ scale: 1.05 }}
          className="rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/30 p-4 text-center cursor-help"
          title="원하는 포토카드 목록"
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

        {/* 교환/판매 가능 */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.05 }}
          className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 p-4 text-center cursor-help"
          title="거래 가능한 카드 (WTT/WTS)"
        >
          <div className="flex justify-center mb-2">
            <Zap size={24} className="text-purple-400" />
          </div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
            거래 가능
          </p>
          <p className="text-2xl font-bold text-purple-400">
            {wttCards.length + wtsCards.length}
          </p>
        </motion.div>

        {/* 완성도 */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.05 }}
          className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 p-4 text-center cursor-help"
          title="보유한 카드 완성도 백분율"
        >
          <div className="flex justify-center mb-2">
            <BarChart3 size={24} className="text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
            완성도
          </p>
          <p className="text-2xl font-bold text-blue-400">
            {stats.completionPercentage.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* 자산 평가액 카드 */}
      <motion.div
        variants={item}
        className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showUSD ? (
              <DollarSign size={24} className="text-amber-400" />
            ) : (
              <Banknote size={24} className="text-amber-400" />
            )}
            <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              예상 자산 가치
            </p>
          </div>
          <motion.button
            onClick={() => setShowUSD(!showUSD)}
            whileHover={{ scale: 1.05 }}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-400 transition-colors"
          >
            {showUSD ? "KRW" : "USD"} 전환
          </motion.button>
        </div>
        <p className="text-4xl font-bold text-amber-400">
          {showUSD
            ? `$${estimatedValueUSD.toLocaleString()}`
            : `₩${estimatedValueKRW.toLocaleString("ko-KR")}`}
        </p>
        <p className="text-xs text-white/50 mt-2">
          소유 카드 기반 평균 가격 추정값
        </p>
      </motion.div>

      {/* 바인더 바로가기 CTA */}
      <motion.div
        variants={item}
        className="mt-6"
      >
        <Link
          href="/vault"
          className="block w-full rounded-xl bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 px-6 py-4 text-center font-bold text-white transition-all hover:shadow-lg hover:shadow-pink-500/20"
        >
          📦 내 바인더 자세히 보기
        </Link>
      </motion.div>
    </motion.section>
  );
}
