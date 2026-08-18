"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { GUIDE_CARDS, TAG_LABELS, TAG_COLORS, type GuideCard } from "@/lib/catalog/guideContent";

interface GuideCardModalProps {
  card: GuideCard | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 상세 콘텐츠 모달
 */
function GuideCardModal({ card, isOpen, onClose }: GuideCardModalProps) {
  if (!card) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#1A1A1E] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div
              className={`${card.gradient.from} ${card.gradient.to} bg-gradient-to-br border-b border-white/10 px-6 py-8`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{card.icon}</span>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${TAG_COLORS[card.tag].bg} ${TAG_COLORS[card.tag].text}`}>
                      {TAG_LABELS[card.tag]}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {card.title}
                  </h2>
                  <p className="text-sm text-white/70">{card.subtitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-white/60 hover:bg-white/10 transition-colors shrink-0"
                  aria-label="닫기"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="px-6 py-8 space-y-6">
              {/* 설명 */}
              <div>
                <p className="text-sm leading-relaxed text-white/80">
                  {card.details.description}
                </p>
              </div>

              {/* 핵심 포인트 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                  핵심 기능
                </h3>
                <div className="space-y-2">
                  {card.details.keyPoints.map((point: string, idx: number) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#FF2A55] mt-0.5">
                        ✓
                      </div>
                      <p className="text-white/70">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    if (card.actionType === "navigate" && card.actionTarget) {
                      window.location.href = card.actionTarget;
                    } else if (card.actionType === "modal") {
                      // TODO: 각 모달 타입에 따라 처리
                      console.log("Modal action:", card.id);
                    } else if (card.actionType === "external") {
                      // TODO: 외부 링크 처리
                      console.log("External action:", card.id);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF2A55] px-4 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  {card.actionLabel}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 메인 가이드 카드 그리드
 * 4개 카드 중 임팩트 있는 3~4개를 다크 그라디언트 스타일로 표시
 */
export function StanpcGuideCards() {
  const [selectedCard, setSelectedCard] = useState<GuideCard | null>(null);

  // 메인 랜딩에 표시할 카드 (처음 3개)
  const mainCards = GUIDE_CARDS.slice(0, 3);

  return (
    <>
      {/* 카드 그리드 */}
      <div className="w-full px-4 py-12 md:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🎓 가이드 & 인사이트
          </h2>
          <p className="text-sm md:text-base text-white/60">
            StanPC를 100% 활용하는 핵심 가이드를 확인해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainCards.map((card: GuideCard) => (
            <motion.button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`${card.gradient.from} ${card.gradient.to} bg-gradient-to-br relative rounded-xl border border-white/10 p-6 text-left transition-all hover:border-white/20 overflow-hidden group`}
            >
              {/* 배경 그라디언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* 콘텐츠 */}
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{card.icon}</div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${TAG_COLORS[card.tag].bg} ${TAG_COLORS[card.tag].text}`}>
                    {TAG_LABELS[card.tag]}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-[#FF2A55] opacity-0 group-hover:opacity-100 transition-opacity">
                  자세히 보기
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 모든 가이드 보기 링크 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setSelectedCard(GUIDE_CARDS[3])}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF2A55] hover:text-[#FF2A55]/80 transition-colors"
          >
            <span>모든 가이드 보기 ({GUIDE_CARDS.length}개)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 모달 */}
      <GuideCardModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}
