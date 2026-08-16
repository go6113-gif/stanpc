"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface HeatmapCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

interface ProfileHeatmapProps {
  data: HeatmapCell[];
}

// Mock 데이터 생성 함수
export function generateMockHeatmap(): HeatmapCell[] {
  const data: HeatmapCell[] = [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  for (let i = 0; i < 365; i++) {
    const date = new Date(oneYearAgo);
    date.setDate(date.getDate() + i);
    const count = Math.random() > 0.7 ? Math.floor(Math.random() * 12) : 0;
    const intensity = Math.min(
      4,
      Math.floor(count / 3)
    ) as 0 | 1 | 2 | 3 | 4;

    data.push({
      date: date.toISOString().split("T")[0],
      count,
      intensity,
    });
  }

  return data;
}

// 강도에 따른 배경색
function getIntensityColor(intensity: number): string {
  switch (intensity) {
    case 0:
      return "bg-neutral-800";
    case 1:
      return "bg-green-900/60";
    case 2:
      return "bg-green-700/80";
    case 3:
      return "bg-green-500";
    case 4:
      return "bg-green-300";
    default:
      return "bg-neutral-800";
  }
}

export function ProfileHeatmap({ data }: ProfileHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">활동 히스토리</h2>
        <p className="text-white/60">지난 1년간의 수집 활동</p>
      </div>

      {/* 히트맵 그리드 */}
      <div className="overflow-x-auto pb-4">
        <div
          className="inline-block"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(53, 1fr)",
            gap: "2px",
            minWidth: "fit-content",
          }}
        >
          {data.map((cell, idx) => (
            <div className="relative">
              <motion.div
                key={idx}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                onMouseEnter={() => setHoveredCell(cell.date)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`w-4 h-4 rounded-sm border border-white/10 cursor-help transition-all ${getIntensityColor(
                  cell.intensity
                )}`}
                title={`${cell.date}: ${cell.count}건의 활동`}
              />
              {/* Tooltip */}
              {hoveredCell === cell.date && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bg-neutral-900 border border-white/20 px-3 py-2 rounded text-xs text-white whitespace-nowrap pointer-events-none z-50"
                  style={{
                    left: "50%",
                    top: "-35px",
                    transform: "translateX(-50%)",
                  }}
                >
                  {cell.date}: {cell.count}건
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 mt-6 text-xs text-white/60">
        <span>최소</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-neutral-800 border border-white/10" />
          <div className="w-4 h-4 rounded-sm bg-green-900/60 border border-white/10" />
          <div className="w-4 h-4 rounded-sm bg-green-700/80 border border-white/10" />
          <div className="w-4 h-4 rounded-sm bg-green-500 border border-white/10" />
          <div className="w-4 h-4 rounded-sm bg-green-300 border border-white/10" />
        </div>
        <span>최대</span>
      </div>
    </div>
  );
}
