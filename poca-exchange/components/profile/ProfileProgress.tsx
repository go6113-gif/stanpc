"use client";

import { motion } from "framer-motion";

interface CollectionItem {
  name: string;
  completion: number;
  owned: number;
  total: number;
}

interface ProfileProgressProps {
  collections: CollectionItem[];
}

export function ProfileProgress({ collections }: ProfileProgressProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
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

  // 완성도에 따른 색상 결정
  const getProgressColor = (completion: number) => {
    if (completion >= 80) return "from-emerald-500 to-green-500";
    if (completion >= 60) return "from-yellow-500 to-orange-500";
    if (completion >= 40) return "from-orange-500 to-rose-500";
    return "from-rose-500 to-pink-500";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">수집 진척도</h2>
        <p className="text-white/60">주요 그룹별 완성도</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {collections.map((collection, idx) => (
          <motion.div
            key={idx}
            variants={item}
            whileHover={{ y: -4 }}
            className="rounded-xl bg-gradient-to-br from-neutral-900/50 to-neutral-800/30 border border-white/10 p-5 hover:border-white/20 transition-colors"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-white truncate">
                  {collection.name}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  {collection.owned} / {collection.total}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {collection.completion}%
                </div>
              </div>
            </div>

            {/* 프로그레스 바 */}
            <div className="w-full h-3 rounded-full bg-neutral-700/50 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${collection.completion}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={`h-full bg-gradient-to-r ${getProgressColor(
                  collection.completion
                )}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
