"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2, BookOpen, Smartphone, Share2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

// Icons only — labels are fetched at render time for i18n.
const VALUE_PROP_ICONS = [Globe2, BookOpen, Smartphone, Share2] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

export function LandingHero({ gridRef }: { gridRef?: React.RefObject<HTMLDivElement | null> }) {
  const router = useRouter();
  const { t } = useTranslations();

  const valuePropKeys = [
    { titleKey: "explore.card_01_title", descKey: "explore.card_01_subtitle" },
    { titleKey: "explore.card_02_title", descKey: "explore.card_02_subtitle" },
    { titleKey: "explore.card_03_title", descKey: "explore.card_03_subtitle" },
    { titleKey: "explore.card_04_title", descKey: "explore.card_04_subtitle" },
  ] as const;

  const actionRoutes = ["/gallery", "/wiki", "/vault", "/binder-export"];

  const handleQuickBinder = () => {
    // Route to guest binder — no login required
    router.push("/vault?mode=guest");
  };

  const handleBinderExport = () => {
    router.push("/binder-export");
  };

  return (
    <motion.div
      className="w-full px-4 pt-12 pb-14 sm:px-8 sm:pt-16 sm:pb-16 md:pt-20"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={item}
        className="max-w-2xl text-3xl leading-snug font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl"
      >
        {t("hero.headline")}
        <br />
        {t("hero.headline_secondary")}
      </motion.h1>
      <motion.p variants={item} className="mt-3 sm:mt-4 max-w-lg text-xs sm:text-sm md:text-base text-white/60">
        {t("hero.subheadline")}
      </motion.p>

      {/* Main CTA Button */}
      <motion.div variants={item} className="mt-8">
        <button
          onClick={handleQuickBinder}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF2A55] px-5 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-90 transition-opacity w-fit"
        >
          {t("hero.cta_button") || "도감 둘러보기"}
        </button>
      </motion.div>

      <motion.div
        variants={container}
        className="mt-10 sm:mt-12 md:mt-14 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {valuePropKeys.map(({ titleKey, descKey }, idx) => {
          const Icon = VALUE_PROP_ICONS[idx];
          const actionRoute = actionRoutes[idx];

          return (
            <motion.button
              key={titleKey}
              variants={item}
              onClick={() => router.push(actionRoute)}
              className="rounded-2xl border border-white/5 bg-[#1A1A1E] p-4 sm:p-5 text-left transition-all hover:border-[#FF2A55]/50 hover:bg-[#1A1A1E]/80 cursor-pointer group"
              type="button"
            >
              <Icon className="text-[#FF2A55] group-hover:scale-110 transition-transform" size={20} />
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-bold text-white">
                {t(titleKey as never)}
              </p>
              <p className="mt-1 sm:mt-1.5 text-xs leading-relaxed text-white/50">
                {t(descKey as never)}
              </p>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
