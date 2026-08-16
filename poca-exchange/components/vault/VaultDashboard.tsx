"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Package, Target, Zap } from "lucide-react";
import { useVaultStore } from "@/store/useVaultStore";

/**
 * Vault 상단 대시보드
 * 전체 자산 평가액, 총 도감 완성률 등 핵심 지표 표시
 */
export function VaultDashboard() {
  const binders = useVaultStore((state) => state.binders);
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");

  // 총 자산 가치 계산
  const totalValue = useMemo(() => {
    const krw = binders.reduce((sum, b) => sum + b.totalValue, 0);
    const usd = Math.round(krw / 1200);
    return { krw, usd };
  }, [binders]);

  // 전체 완성률 (평균)
  const averageCompletion = useMemo(() => {
    if (binders.length === 0) return 0;
    const sum = binders.reduce((acc, b) => acc + b.completionPercentage, 0);
    return sum / binders.length;
  }, [binders]);

  // 총 카드 수
  const totalCards = useMemo(() => {
    return binders.reduce((sum, b) => sum + b.cardCount, 0);
  }, [binders]);

  // 공개 바인더 수
  const publicBindersCount = useMemo(() => {
    return binders.filter((b) => b.isPublic).length;
  }, [binders]);

  const displayValue =
    currency === "KRW"
      ? `₩${totalValue.krw.toLocaleString("ko-KR")}`
      : `$${totalValue.usd.toLocaleString("en-US")}`;

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 mb-8"
    >
      {/* 메인 통계 카드 (2열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 총 자산 가치 */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
              <TrendingUp size={24} className="text-emerald-400" />
            </div>

            {/* 통화 토글 */}
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              {(["KRW", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    currency === c
                      ? "bg-emerald-500/70 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/70 mb-2">총 자산 가치</p>
          <p className="text-3xl md:text-4xl font-bold text-white mb-2">
            {displayValue}
          </p>
          <p className="text-xs text-white/50">
            {binders.length}개 바인더에 보관 중
          </p>
        </motion.div>

        {/* 전체 완성률 */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
              <Target size={24} className="text-blue-400" />
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
              averageCompletion >= 70
                ? "bg-green-500/20 text-green-400"
                : averageCompletion >= 40
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
            }`}>
              {averageCompletion.toFixed(0)}%
            </span>
          </div>

          <p className="text-sm text-white/70 mb-2">도감 완성률</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${averageCompletion}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full bg-gradient-to-r ${
                averageCompletion >= 70
                  ? "from-green-500 to-emerald-500"
                  : averageCompletion >= 40
                  ? "from-yellow-500 to-orange-500"
                  : "from-red-500 to-pink-500"
              }`}
            />
          </div>
          <p className="text-xs text-white/50">
            평균 {binders.length}개 바인더 완성도
          </p>
        </motion.div>
      </div>

      {/* 세부 통계 (4열) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 총 카드 수 */}
        <motion.div variants={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white/70 uppercase mb-2">총 카드 수</p>
          <p className="text-2xl font-bold text-white">{totalCards}</p>
          <p className="text-xs text-white/50 mt-1">전체 보관</p>
        </motion.div>

        {/* 공개 바인더 */}
        <motion.div variants={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white/70 uppercase mb-2">공개 바인더</p>
          <p className="text-2xl font-bold text-blue-400">{publicBindersCount}</p>
          <p className="text-xs text-white/50 mt-1">/{binders.length}</p>
        </motion.div>

        {/* 비공개 바인더 */}
        <motion.div variants={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white/70 uppercase mb-2">비공개 바인더</p>
          <p className="text-2xl font-bold text-purple-400">
            {binders.length - publicBindersCount}
          </p>
          <p className="text-xs text-white/50 mt-1">/{binders.length}</p>
        </motion.div>

        {/* 평균 카드/바인더 */}
        <motion.div variants={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white/70 uppercase mb-2">평균</p>
          <p className="text-2xl font-bold text-cyan-400">
            {Math.round(totalCards / binders.length)}
          </p>
          <p className="text-xs text-white/50 mt-1">카드/바인더</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
