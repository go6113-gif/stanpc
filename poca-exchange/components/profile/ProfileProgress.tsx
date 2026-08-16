"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface GroupCompletion {
  groupName: string;
  groupSlug: string;
  owned: number;
  total: number;
  percentage: number;
}

interface CollectionItem {
  name: string;
  completion: number;
  owned: number;
  total: number;
}

interface ProfileProgressProps {
  userId?: string;
  collections?: CollectionItem[];
}

export function ProfileProgress({ userId, collections: initialCollections }: ProfileProgressProps) {
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 데이터가 있으면 로드하지 않음
    if (initialCollections && initialCollections.length > 0) {
      setLoading(false);
      return;
    }

    // userId가 없으면 로드 스킵
    if (!userId) {
      setLoading(false);
      return;
    }

    // API에서 실데이터 조회
    const fetchCompletion = async () => {
      try {
        const response = await fetch(`/api/profile/completion?userId=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch completion");
        const data = await response.json();

        // API 응답의 groups 배열을 CollectionItem 형식으로 변환
        const transformed: CollectionItem[] = (data.groups || []).map(
          (group: GroupCompletion) => ({
            name: group.groupName,
            completion: group.percentage,
            owned: group.owned,
            total: group.total,
          })
        );

        setCollections(transformed);
      } catch (error) {
        console.error("Error fetching completion:", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletion();
  }, [userId, initialCollections]);

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

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">수집 진척도</h2>
          <p className="text-white/60">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">수집 진척도</h2>
        <p className="text-white/60">주요 그룹별 완성도</p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          아직 수집한 카드가 없습니다. 바인더에서 카드를 추가해보세요!
        </div>
      ) : (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {collections.slice(0, 6).map((collection, idx) => (
          <motion.div
            key={`progress-${idx}`}
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
                  {collection.completion.toFixed(1)}%
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
      )}
    </div>
  );
}
