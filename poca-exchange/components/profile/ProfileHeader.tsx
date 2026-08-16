"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Shield, Award } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useBinderStore } from "@/store/useBinderStore";

/**
 * 프로필 헤더 컴포넌트
 * - 아바타, 닉네임, 유저 핸들(@handle)
 * - 신뢰도 지수 (Verified %)
 * - 업적 뱃지 (Achievement Badges)
 */
export function ProfileHeader() {
  const user = useAuthStore((state) => state.user);
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);

  // 신뢰도 지수 계산 (임의: owned 카드 수 기반)
  const verificationScore = useMemo(() => {
    const baseScore = 50;
    const ownedBonus = Math.min(ownedCards.length * 0.5, 30);
    const wttBonus = Math.min(wttCards.length * 0.2, 10);
    return Math.min(baseScore + ownedBonus + wttBonus, 99.9);
  }, [ownedCards.length, wttCards.length]);

  // 업적 뱃지 생성 로직
  const achievements = useMemo(() => {
    const badges = [];

    if (ownedCards.length >= 50) {
      badges.push({ name: "Collection Pioneer", icon: "🚀" });
    }
    if (ownedCards.length >= 100) {
      badges.push({ name: "Master Collector", icon: "👑" });
    }
    if (wttCards.length >= 20) {
      badges.push({ name: "Trade Expert", icon: "🔄" });
    }
    if (wishCards.length >= 30) {
      badges.push({ name: "Eager Collector", icon: "💝" });
    }
    // Early Adopter: 유저 가입 시간 기반 (현재는 임의로 설정)
    badges.push({ name: "Early Adopter", icon: "⭐" });

    return badges;
  }, [ownedCards.length, wishCards.length, wttCards.length]);

  const nickname = user?.nickname || "StanPC Collector";
  const userHandle = `@${nickname.replace(/\s+/g, "_").toLowerCase()}`;
  const bias = user?.bias || "N/A";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* 아바타 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0"
          >
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-2 border-pink-500/50 flex items-center justify-center">
              <User size={40} className="text-pink-400" />
              {/* 신뢰도 배지 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white/20 flex items-center justify-center"
              >
                <Shield size={14} className="text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* 프로필 정보 */}
          <div className="flex-grow">
            {/* 이름 + 신뢰도 뱃지 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {nickname}
              </h2>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-bold text-green-400 flex items-center gap-1"
              >
                <Shield size={12} />
                {verificationScore.toFixed(1)}% Verified
              </motion.span>
            </div>

            {/* 유저 핸들 */}
            <p className="text-white/60 text-sm mb-2 font-mono">
              {userHandle}
            </p>

            {/* 최애 멤버 */}
            {bias && bias !== "N/A" && (
              <p className="text-white/70 mb-4 text-sm">
                💜 <span className="font-semibold">최애: {bias}</span>
              </p>
            )}

            {/* 업적 뱃지 */}
            {achievements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {achievements.map((badge) => (
                  <motion.div
                    key={badge.name}
                    whileHover={{ scale: 1.05 }}
                    title={badge.name}
                    className="px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-xs font-semibold text-yellow-300 flex items-center gap-1 cursor-help"
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
