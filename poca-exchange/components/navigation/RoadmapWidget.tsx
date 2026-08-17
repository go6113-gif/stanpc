'use client';

import { useState } from 'react';
import { ChevronDown, Zap, Sparkles, Users } from 'lucide-react';

interface RoadmapPhase {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: string[];
  estimatedDate: string;
  status: 'completed' | 'in-progress' | 'planned';
}

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase-1',
    title: '10개 그룹 도감 오픈',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'BTS, Stray Kids, TWICE, SEVENTEEN 등 10개 그룹 포토카드 도감 공개',
    items: [
      '✅ 그룹 도감 시스템',
      '✅ 포토카드 카탈로그',
      '✅ 시세 정보 연동',
      '✅ 검색 & 필터링',
    ],
    estimatedDate: '2026년 8월',
    status: 'completed',
  },
  {
    id: 'phase-2',
    title: 'AI 스마트 스캔 기능',
    icon: <Zap className="w-5 h-5" />,
    description: '카메라로 촬영한 포토카드를 AI가 자동으로 인식 및 분류',
    items: [
      '📷 카드 인식 AI',
      '🏷️ 자동 태깅',
      '📊 수집 통계',
      '🎯 우선순위 추천',
    ],
    estimatedDate: '2026년 9월',
    status: 'in-progress',
  },
  {
    id: 'phase-3',
    title: 'P2P 1:1 교환 마켓',
    icon: <Users className="w-5 h-5" />,
    description: '유저끼리 직접 포토카드를 교환하고 거래할 수 있는 플랫폼',
    items: [
      '🤝 매칭 시스템',
      '💬 안전한 거래',
      '⭐ 평판 시스템',
      '🎁 교환 완료 기념',
    ],
    estimatedDate: '2026년 10월',
    status: 'planned',
  },
];

export function RoadmapWidget() {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-600 to-green-700';
      case 'in-progress':
        return 'from-blue-600 to-blue-700';
      case 'planned':
        return 'from-gray-600 to-gray-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료됨';
      case 'in-progress':
        return '진행중';
      case 'planned':
        return '예정됨';
      default:
        return '예정됨';
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-[#1a1a1f] to-[#0f0f12] border border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-white">🚀 StanPC 업데이트 로드맵</h3>
            <p className="text-xs text-gray-500 mt-0.5">다음 업데이트 일정을 확인하세요</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Phases List */}
      {expanded && (
        <div className="border-t border-gray-700 divide-y divide-gray-700">
          {ROADMAP_PHASES.map((phase, idx) => (
            <div key={phase.id} className="p-6 hover:bg-gray-900/30 transition-colors">
              {/* Phase Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`p-2 bg-gradient-to-br ${getStatusColor(
                    phase.status
                  )} rounded-lg flex-shrink-0`}
                >
                  {phase.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{phase.title}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                      {getStatusLabel(phase.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{phase.estimatedDate}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 mb-4">{phase.description}</p>

              {/* Feature List */}
              <div className="grid grid-cols-2 gap-2">
                {phase.items.map((item, i) => (
                  <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Timeline Connector */}
              {idx < ROADMAP_PHASES.length - 1 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-gray-500">
                      ↓
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
