"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { EXPLORE_CARDS } from "./explore-cards-data";

/**
 * 상세 설명 모달 컴포넌트
 */
function ExploreCardModal({
  isOpen,
  onClose,
  card,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  card: (typeof EXPLORE_CARDS)[0];
  t: (key: string) => string;
}) {
  const Icon = card.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 클릭하면 닫기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 팝업 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-1/2 z-50 max-w-2xl -translate-y-1/2 transform rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 backdrop-blur-xl p-6 sm:p-8 left-1/2 -translate-x-1/2"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-white/10 to-white/5">
                  <Icon size={28} className={card.accentColor} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {t(card.titleKey)}
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {t(card.subtitleKey)}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                aria-label="닫기"
              >
                <X size={24} />
              </button>
            </div>

            {/* 상세 설명 */}
            <div className="space-y-6 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">
                  상세 설명
                </h3>
                <p className="text-base text-white/70 leading-relaxed">
                  {t(card.descriptionKey)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">
                  💡 활용 팁
                </h3>
                <p className="text-base text-white/70 leading-relaxed">
                  {t(card.tipsKey)}
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors font-semibold"
              >
                닫기
              </button>
              {card.actionHref && (
                <a
                  href={card.actionHref}
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {t(card.actionButtonKey)}
                  <ArrowRight size={16} />
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 개별 카드 컴포넌트
 */
function ExploreCardItem({
  card,
  onOpen,
  t,
}: {
  card: (typeof EXPLORE_CARDS)[0];
  onOpen: () => void;
  t: (key: string) => string;
}) {
  const Icon = card.icon;

  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 text-left transition-all duration-300 h-full border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 focus:ring-offset-[#0F0F12]"
      type="button"
    >
      {/* 배경 그래디언트 */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} transition-opacity duration-300 group-hover:opacity-80`}
      />

      {/* 호버 효과용 추가 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 텍스트 콘텐츠 */}
      <div className="relative z-10 space-y-4">
        {/* 아이콘 */}
        <div className="inline-flex p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/15 group-hover:border-white/30 transition-colors">
          <Icon size={24} className={`${card.accentColor} transition-transform group-hover:scale-110`} />
        </div>

        {/* 타이틀과 서브타이틀 */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
            {t(card.titleKey)}
          </h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            {t(card.subtitleKey)}
          </p>
        </div>

        {/* 클릭 유도 텍스트 */}
        <div className="flex items-center gap-2 text-sm font-semibold text-white/50 group-hover:text-white/80 transition-colors pt-2">
          자세히 보기
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}

/**
 * StanPC Explore 카드 섹션
 * 메인 랜딩에 표시되는 4개의 인터랙티브 카드
 */
export function StanpcExploreCards() {
  const { t } = useTranslations();
  const [selectedCard, setSelectedCard] = useState<(typeof EXPLORE_CARDS)[0] | null>(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  };

  return (
    <section className="w-full px-4 py-16 sm:px-8 sm:py-20 bg-gradient-to-b from-transparent via-[#0F0F12]/50 to-[#0F0F12]">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              stanpc explore
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            stanpc만의 독특한 경험
          </h2>
          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            글로벌 포카 커뮤니티에서 완성도 높은 컬렉션을 만들고, 안전하게 거래하세요
          </p>
        </motion.div>

        {/* 카드 그리드 */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          {EXPLORE_CARDS.map((card) => (
            <motion.div key={card.id} variants={item}>
              <ExploreCardItem
                card={card}
                onOpen={() => setSelectedCard(card)}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 모달 */}
      {selectedCard && (
        <ExploreCardModal
          isOpen={true}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
          t={t}
        />
      )}
    </section>
  );
}
