"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe2, MonitorSmartphone, Sparkles } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

// Icons only — labels are fetched at render time for i18n.
const VALUE_PROP_ICONS = [Globe2, MonitorSmartphone, Sparkles] as const;

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

export function LandingHero() {
  const { t } = useTranslations();

  const valuePropKeys = [
    { titleKey: "hero.value_prop_1_title", descKey: "hero.value_prop_1_desc" },
    { titleKey: "hero.value_prop_2_title", descKey: "hero.value_prop_2_desc" },
    { titleKey: "hero.value_prop_3_title", descKey: "hero.value_prop_3_desc" },
  ] as const;

  return (
    <motion.div
      className="w-full px-4 pt-14 pb-16 sm:pt-20 md:px-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={item}
        className="max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl"
      >
        {t("hero.headline")}
        <br />
        {t("hero.headline_secondary")}
      </motion.h1>
      <motion.p variants={item} className="mt-4 max-w-lg text-sm text-white/60 sm:text-base">
        {t("hero.subheadline")}
      </motion.p>
      <motion.div variants={item} className="mt-8">
        <Link
          href="/gallery"
          className="inline-block rounded-full bg-[#FF2A55] px-7 py-3.5 text-sm font-bold text-white hover:opacity-90 sm:text-base"
        >
          {t("hero.cta_button")}
        </Link>
      </motion.div>

      <motion.div
        variants={container}
        className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {valuePropKeys.map(({ titleKey, descKey }, idx) => {
          const Icon = VALUE_PROP_ICONS[idx];
          return (
            <motion.div
              key={titleKey}
              variants={item}
              className="rounded-2xl border border-white/5 bg-[#1A1A1E] p-5"
            >
              <Icon className="text-[#FF2A55]" size={22} />
              <p className="mt-3 text-sm font-bold text-white">
                {t(titleKey as never)}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                {t(descKey as never)}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
