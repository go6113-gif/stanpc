"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useBinderStore } from "@/store/useBinderStore";

interface AlbumProgress {
  groupName: string;
  ownedCount: number;
  totalCount: number;
  percentage: number;
}

/**
 * 프로필 진척도 섹션
 * - 주요 그룹별 수집 완성도 프로그레스 바
 */
export function ProfileProgress() {
  const ownedCards = useBinderStore((state) => state.ownedCards);

  // 그룹별 진척도 계산
  const albumProgress = useMemo(() => {
    // 각 그룹별 소유 카드 집계
    const groupMap = new Map<string, number>();
    ownedCards.forEach((card) => {
      groupMap.set(
        card.groupName,
        (groupMap.get(card.groupName) || 0) + 1
      );
    });

    // 임의로 각 그룹의 "전체 카드 수" 설정 (실제로는 DB에서 조회)
    const groupTotals: Record<string, number> = {
      NewJeans: 15,
      IVE: 12,
      LESSERAFIM: 18,
      SEVENTEEN: 20,
      Stray_Kids: 16,
      TWICE: 18,
      BlackPink: 16,
      "Red Velvet": 14,
    };

    // 진척도 계산
    const progress: AlbumProgress[] = [];
    groupMap.forEach((ownedCount, groupName) => {
      const totalCount = groupTotals[groupName] || ownedCount + Math.floor(Math.random() * 10);
      const percentage = Math.round((ownedCount / totalCount) * 100);

      progress.push({
        groupName,
        ownedCount,
        totalCount,
        percentage,
      });
    });

    // 완성도순으로 정렬
    progress.sort((a, b) => b.percentage - a.percentage);

    return progress.slice(0, 6); // 상위 6개만 표시
  }, [ownedCards]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  } as const;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6">수집 진척도</h3>

        {albumProgress.length > 0 ? (
          <div className="space-y-6">
            {albumProgress.map((album) => (
              <motion.div
                key={album.groupName}
                variants={item}
                className="space-y-2"
              >
                {/* 앨범명 + 진척률 */}
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-white">
                      {album.groupName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs font-semibold text-white/70">
                      {album.ownedCount}/{album.totalCount}
                    </span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        album.percentage === 100
                          ? "bg-green-500/30 text-green-400"
                          : album.percentage >= 75
                          ? "bg-blue-500/30 text-blue-400"
                          : album.percentage >= 50
                          ? "bg-purple-500/30 text-purple-400"
                          : "bg-orange-500/30 text-orange-400"
                      }`}
                    >
                      {album.percentage}%
                    </motion.span>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <motion.div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${album.percentage}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full ${
                      album.percentage === 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                        : album.percentage >= 75
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                        : album.percentage >= 50
                        ? "bg-gradient-to-r from-purple-500 to-pink-400"
                        : "bg-gradient-to-r from-orange-500 to-yellow-400"
                    }`}
                  />
                </motion.div>

                {/* 완성도 뱃지 */}
                {album.percentage === 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-green-500/20 border border-green-500/30"
                  >
                    <span className="text-xs text-green-400 font-bold">
                      ✅ 완성!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/60 text-sm">
              아직 포토카드를 추가하지 않았습니다.
            </p>
            <p className="text-white/40 text-xs mt-2">
              바인더에서 카드를 추가하면 진척도가 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
