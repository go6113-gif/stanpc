"use client";

import { motion } from "framer-motion";
import { Trophy, Award, Zap, TrendingUp } from "lucide-react";

interface ProfileStatsProps {
  ownedCount: number;
  wishedCount: number;
  wttCount: number;
  completionPercentage: number;
}

export function ProfileStats({
  ownedCount,
  wishedCount,
  wttCount,
  completionPercentage,
}: ProfileStatsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  } as const;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
    >
      {/* 소장 카드 */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.05 }}
        className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 p-4 text-center"
      >
        <div className="flex justify-center mb-2">
          <Trophy size={24} className="text-green-400" />
        </div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          소장 중
        </p>
        <p className="text-2xl font-bold text-green-400">{ownedCount}</p>
      </motion.div>

      {/* 위시리스트 */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.05 }}
        className="rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/30 p-4 text-center"
      >
        <div className="flex justify-center mb-2">
          <Award size={24} className="text-orange-400" />
        </div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          위시리스트
        </p>
        <p className="text-2xl font-bold text-orange-400">{wishedCount}</p>
      </motion.div>

      {/* 교환/판매 */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.05 }}
        className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 p-4 text-center"
      >
        <div className="flex justify-center mb-2">
          <Zap size={24} className="text-purple-400" />
        </div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          교환 가능
        </p>
        <p className="text-2xl font-bold text-purple-400">{wttCount}</p>
      </motion.div>

      {/* 완성도 */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.05 }}
        className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 p-4 text-center"
      >
        <div className="flex justify-center mb-2">
          <TrendingUp size={24} className="text-blue-400" />
        </div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          완성도
        </p>
        <p className="text-2xl font-bold text-blue-400">
          {completionPercentage.toFixed(1)}%
        </p>
      </motion.div>
    </motion.div>
  );
}
