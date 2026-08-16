/**
 * StanPC Explore Cards Data
 * 메인 랜딩의 인터랙티브 카드 데이터 정의
 */

import { Globe2, BookOpen, Smartphone, Share2 } from "lucide-react";

export type CardCategory = "value" | "guide";

export interface ExploreCard {
  id: string;
  category: CardCategory;
  icon: typeof Globe2;
  titleKey: string;        // i18n key
  subtitleKey: string;     // i18n key
  descriptionKey: string;  // i18n key (모달용)
  tipsKey: string;         // i18n key (모달용)
  actionButtonKey: string; // i18n key
  actionHref?: string;     // 액션 버튼 링크
  bgGradient: string;      // Tailwind gradient class
  accentColor: string;     // 강조 색상
}

export const EXPLORE_CARDS: ExploreCard[] = [
  {
    id: "global-pricing",
    category: "value",
    icon: Globe2,
    titleKey: "explore.card_01_title",
    subtitleKey: "explore.card_01_subtitle",
    descriptionKey: "explore.card_01_description",
    tipsKey: "explore.card_01_tips",
    actionButtonKey: "explore.card_01_action",
    actionHref: "/gallery",
    bgGradient: "from-blue-600/30 via-cyan-500/20 to-emerald-500/10",
    accentColor: "text-cyan-400",
  },
  {
    id: "wiki-database",
    category: "value",
    icon: BookOpen,
    titleKey: "explore.card_02_title",
    subtitleKey: "explore.card_02_subtitle",
    descriptionKey: "explore.card_02_description",
    tipsKey: "explore.card_02_tips",
    actionButtonKey: "explore.card_02_action",
    actionHref: "/wiki",
    bgGradient: "from-purple-600/30 via-pink-500/20 to-rose-500/10",
    accentColor: "text-pink-400",
  },
  {
    id: "live-binder",
    category: "guide",
    icon: Smartphone,
    titleKey: "explore.card_03_title",
    subtitleKey: "explore.card_03_subtitle",
    descriptionKey: "explore.card_03_description",
    tipsKey: "explore.card_03_tips",
    actionButtonKey: "explore.card_03_action",
    actionHref: "/vault",
    bgGradient: "from-emerald-600/30 via-teal-500/20 to-cyan-500/10",
    accentColor: "text-emerald-400",
  },
  {
    id: "sns-sharing",
    category: "guide",
    icon: Share2,
    titleKey: "explore.card_04_title",
    subtitleKey: "explore.card_04_subtitle",
    descriptionKey: "explore.card_04_description",
    tipsKey: "explore.card_04_tips",
    actionButtonKey: "explore.card_04_action",
    actionHref: "/binder-export",
    bgGradient: "from-orange-600/30 via-amber-500/20 to-yellow-500/10",
    accentColor: "text-amber-400",
  },
];
