"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useBinderStore } from "@/store/useBinderStore";

interface HeatmapDay {
  date: Date;
  count: number;
  intensity: "empty" | "low" | "medium" | "high" | "max";
}

/**
 * 프로필 활동 히트맵 (Github 스타일)
 * - 지난 52주 활동 시각화
 * - 각 날짜의 카드 추가 수 기반 강도
 */
export function ProfileHeatmap() {
  const ownedCards = useBinderStore((state) => state.ownedCards);

  // 과거 52주 데이터 생성
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 365);

    const dayMap = new Map<string, number>();

    // 각 카드의 추가 날짜별로 집계
    ownedCards.forEach((card) => {
      const cardDate = new Date(card.addedAt);
      const dateStr = cardDate.toISOString().split("T")[0];
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
    });

    // 최대값 구하기
    const maxCount = Math.max(...Array.from(dayMap.values()), 5);

    // 52주 데이터 구성
    const data: HeatmapDay[] = [];
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dayMap.get(dateStr) || 0;

      let intensity: HeatmapDay["intensity"] = "empty";
      if (count > 0) {
        const ratio = count / maxCount;
        if (ratio >= 0.75) intensity = "max";
        else if (ratio >= 0.5) intensity = "high";
        else if (ratio >= 0.25) intensity = "medium";
        else intensity = "low";
      }

      data.push({ date, count, intensity });
    }

    return data;
  }, [ownedCards]);

  // 주 단위로 분할
  const weeks = useMemo(() => {
    const weeksArray: HeatmapDay[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeksArray.push(heatmapData.slice(i, i + 7));
    }
    return weeksArray;
  }, [heatmapData]);

  const getColorClass = (intensity: HeatmapDay["intensity"]) => {
    switch (intensity) {
      case "empty":
        return "bg-white/10 hover:bg-white/15";
      case "low":
        return "bg-emerald-900/40 hover:bg-emerald-800/50";
      case "medium":
        return "bg-emerald-700/60 hover:bg-emerald-600/70";
      case "high":
        return "bg-emerald-500/80 hover:bg-emerald-400/90";
      case "max":
        return "bg-emerald-400 hover:bg-emerald-300";
      default:
        return "bg-white/10";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-4">지난 1년 활동</h3>

        {/* 히트맵 그리드 */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    whileHover={{ scale: 1.2 }}
                    className={`w-3 h-3 rounded-sm border border-white/5 transition-all cursor-help ${getColorClass(day.intensity)}`}
                    title={`${day.date.toLocaleDateString("ko-KR")}: ${day.count}개 추가`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 mt-6 text-xs text-white/60">
          <span>활동:</span>
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-sm bg-white/10" />
            <span>없음</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-sm bg-emerald-900/40" />
            <span>적음</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-sm bg-emerald-700/60" />
            <span>중간</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-sm bg-emerald-500/80" />
            <span>많음</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-sm bg-emerald-400" />
            <span>아주 많음</span>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div>
            <p className="text-xs text-white/60 uppercase mb-1">활동한 날</p>
            <p className="text-xl font-bold text-emerald-400">
              {heatmapData.filter((d) => d.count > 0).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase mb-1">추가된 카드</p>
            <p className="text-xl font-bold text-white">
              {ownedCards.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase mb-1">최대 기록</p>
            <p className="text-xl font-bold text-orange-400">
              {Math.max(...heatmapData.map((d) => d.count), 0)}개/일
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
