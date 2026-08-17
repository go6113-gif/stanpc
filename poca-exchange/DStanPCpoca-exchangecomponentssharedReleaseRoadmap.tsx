'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

const ROADMAP_ITEMS = [
  {
    phase: 'Phase 1',
    title: '📖 10개 그룹 도감 오픈',
    description: 'BTS, NewJeans, aespa 등 인기 그룹의 완전한 포토카드 카탈로그',
    status: '✅ 출시됨',
    color: 'from-green-400 to-emerald-500',
  },
  {
    phase: 'Phase 2',
    title: '🪄 AI 스마트 스캔',
    description: '포토카드 사진을 촬영하면 자동으로 분류하고 보유 현황 업데이트',
    status: '🔄 개발 중',
    color: 'from-purple-400 to-pink-500',
  },
  {
    phase: 'Phase 3',
    title: '🤝 P2P 교환 마켓플레이스',
    description: '다른 덕후들과 안전하게 포토카드 교환하기',
    status: '📋 기획 중',
    color: 'from-blue-400 to-cyan-500',
  },
];

export function ReleaseRoadmap() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 dark:from-neutral-950 dark:to-neutral-900">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between hover:opacity-75 transition-opacity"
      >
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          🚀 StanPC 업데이트 로드맵
        </h3>
        <ChevronRight
          className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 space-y-4"
        >
          {ROADMAP_ITEMS.map((item, index) => (
            <motion.div
              key={item.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl bg-gradient-to-r ${item.color} p-0.5`}
            >
              <div className="rounded-[10px] bg-neutral-800 p-4 dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase">{item.phase}</p>
                    <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                    <p className="text-xs text-neutral-400 mt-2">{item.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold whitespace-nowrap">{item.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
