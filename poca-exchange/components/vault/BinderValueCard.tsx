"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, Wallet } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";
import { calculateBinderStats, type BinderStats } from "@/lib/analytics/binder";

/**
 * 애니메이션 숫자 카운팅 컴포넌트
 */
function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let currentValue = 0;
    const increment = value / 20;  // 20 프레임에 걸쳐 애니메이션

    const animate = () => {
      currentValue += increment;
      if (currentValue < value) {
        setDisplayValue(Math.floor(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, decimals]);

  return (
    <>
      {displayValue.toFixed(decimals)}
      {suffix}
    </>
  );
}

/**
 * 바인더 가치 및 완성도 요약 카드
 */
export function BinderValueCard() {
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");
  const [stats, setStats] = useState<BinderStats | null>(null);

  // 통계 계산
  useEffect(() => {
    const calculated = calculateBinderStats(ownedCards);
    setStats(calculated);
  }, [ownedCards]);

  const displayValue = useMemo(() => {
    if (!stats) return 0;
    return currency === "KRW" ? stats.totalValueKRW : stats.totalValueUSD;
  }, [stats, currency]);

  const currencySymbol = currency === "KRW" ? "₩" : "$";

  if (!stats) return null;

  // 완성도 색상 결정 (0-30: 빨강, 30-60: 주황, 60-100: 초록)
  const getCompletionColor = () => {
    if (stats.completionPercentage < 30) return "from-red-500 to-orange-500";
    if (stats.completionPercentage < 60) return "from-yellow-500 to-orange-500";
    return "from-emerald-500 to-teal-500";
  };

  const getCompletionTextColor = () => {
    if (stats.completionPercentage < 30) return "text-red-600 dark:text-red-400";
    if (stats.completionPercentage < 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* 글래스모피즘 배경 */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* 배경 그래디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10" />

        {/* Backdrop blur 효과 */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/5 dark:bg-white/3 border border-white/20 dark:border-white/10" />

        {/* 콘텐츠 */}
        <div className="relative p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 왼쪽: 완성도 & 가치 */}
            <div className="space-y-6">
              {/* 컬렉션 완성도 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" />
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      컬렉션 완성도
                    </h3>
                  </div>
                  <span className={`text-lg font-bold ${getCompletionTextColor()}`}>
                    <AnimatedNumber value={stats.completionPercentage} suffix="%" decimals={1} />
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="relative w-full h-3 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${getCompletionColor()} shadow-lg`}
                  />
                </div>

                {/* 세부 정보 */}
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold">{stats.totalCardsOwned}</span>장 / {stats.totalCardsAvailable}장
                </p>
              </div>

              {/* 내 바인더 총자산 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      총자산 가치
                    </h3>
                  </div>

                  {/* 통화 토글 */}
                  <div className="flex gap-1 bg-white/10 dark:bg-white/5 rounded-lg p-1">
                    {(["KRW", "USD"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                          currency === c
                            ? "bg-pink-500/70 text-white"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 가격 표시 */}
                <div className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                  {currencySymbol}
                  <AnimatedNumber
                    value={displayValue}
                    suffix={currency === "KRW" ? "" : ""}
                    decimals={currency === "KRW" ? 0 : 2}
                  />
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {currency === "KRW"
                    ? `≈ $${(stats.totalValueUSD / 1000).toFixed(1)}K USD`
                    : `≈ ₩${(stats.totalValueKRW / 1_000_000).toFixed(1)}M KRW`}
                </p>
              </div>
            </div>

            {/* 오른쪽: 보유 현황 요약 */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* 보유 중 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 dark:border-green-500/20 p-4 text-center"
              >
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                  보유 중
                </p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  <AnimatedNumber value={stats.totalCardsOwned} />
                </p>
              </motion.div>

              {/* 위시 리스트 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 dark:border-orange-500/20 p-4 text-center"
              >
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                  위시리스트
                </p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  <AnimatedNumber value={wishCards.length} />
                </p>
              </motion.div>

              {/* 교환 중 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 dark:border-purple-500/20 p-4 text-center col-span-2"
              >
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                  교환 / 판매 가능
                </p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  <AnimatedNumber value={wttCards.length} />
                </p>
              </motion.div>
            </div>
          </div>

          {/* Top 멤버 (선택사항) */}
          {stats.topMembers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-indigo-500" />
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Top 멤버
                </h4>
              </div>
              <div className="space-y-2">
                {stats.topMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs rounded-lg bg-white/5 dark:bg-white/3 p-2"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                      {idx + 1}. {member.memberName}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {member.ownedCount}장
                      <span className="text-neutral-500 dark:text-neutral-400 ml-1">
                        ({member.percentage.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
