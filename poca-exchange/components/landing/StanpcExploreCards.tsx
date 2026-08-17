"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { EXPLORE_CARDS } from "./explore-cards-data";

/**
 * 개별 카드 컴포넌트
 */
function ExploreCardItem({
  card,
  t,
}: {
  card: (typeof EXPLORE_CARDS)[0];
  t: (key: string) => string;
}) {
  const Icon = card.icon;

  return (
    <Link href={card.actionHref || "#"}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 text-left transition-all duration-300 h-full border border-white/10 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F12]"
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
            탐색하기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/**
 * StanPC Explore 카드 섹션
 * 메인 랜딩에 표시되는 4개의 인터랙티브 카드
 */
export function StanpcExploreCards() {
  const { t } = useTranslations();

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
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
