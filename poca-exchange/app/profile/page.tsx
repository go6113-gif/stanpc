"use client";

export const dynamic = 'force-dynamic';

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";
import { calculateBinderStats } from "@/lib/analytics/binder";
import { calculateTotalPortfolioCompletion, getAllGroupCompletions } from "@/lib/utils/completionEngine";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileHeatmap, generateMockHeatmap } from "@/components/profile/ProfileHeatmap";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { StanpcExploreCards } from "@/components/landing/StanpcExploreCards";

/**
 * 프로필 상세 페이지 (Global Collector Portfolio Hub)
 * - ProfileHeader: 아바타, 닉네임, 유저 핸들, 신뢰도, 업적 뱃지
 * - ProfileStats: 소장수, 위시수, 거래 가능, 자산 평가액
 * - ProfileHeatmap: 지난 52주 활동 히트맵 (Github 스타일)
 * - ProfileProgress: 주요 앨범별 수집 진척도
 * - StanpcExploreCards: 가이드 아카이브
 */
export default function ProfilePage() {
  const ownedCards = useBinderStore((state) => state.ownedCards);
  const wishCards = useBinderStore((state) => state.wishCards);
  const wttCards = useBinderStore((state) => state.wttCards);

  // Mock 데이터
  const nickname = "스탠픽컬렉터";
  const userBadge = "Verified Collector";
  const favoriteMembers = ["지젤", "카리나"];
  const collectorIndex = 385;
  const mannerScore = 38.2;
  const badges = [
    { badgeName: "Early Adopter", badgeIcon: "🚀" },
    { badgeName: "Top Trader", badgeIcon: "🏆" },
    { badgeName: "Hall of Fame", badgeIcon: "👑" },
  ];
  const twitterHandle = "stanpc_collector";
  const openKakaoUrl = "https://open.kakao.com/o/stanpc";
  const discordUrl = "https://discord.gg/stanpc";

  // 정밀 완성도 계산 (마스터 도감 기반)
  const portfolioCompletion = useMemo(() => {
    return calculateTotalPortfolioCompletion(ownedCards);
  }, [ownedCards]);

  // 그룹별 상세 완성도 조회
  const groupCompletions = useMemo(() => {
    return getAllGroupCompletions(ownedCards);
  }, [ownedCards]);

  // 수집 진척도 데이터 변환 (그룹별 완성도 → 프로그레스 컬렉션)
  const progressCollections = useMemo(() => {
    return groupCompletions.map((group: { groupName: string; percentage: number; owned: number; total: number }) => ({
      name: group.groupName,
      completion: group.percentage,
      owned: group.owned,
      total: group.total,
    }));
  }, [groupCompletions]);

  // 통계 계산
  const stats = useMemo(() => {
    return calculateBinderStats(ownedCards);
  }, [ownedCards]);

  // 활동 히트맵 Mock 데이터
  const heatmapData = useMemo(() => {
    return generateMockHeatmap();
  }, []);

  // Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname}'s Photocard Collection - StanPC`,
          text: `내 덕력: ${collectorIndex}pts | 소장: ${ownedCards.length}장 | 완성도: ${stats.completionPercentage.toFixed(1)}%`,
          url: `${typeof window !== "undefined" ? window.location.origin : "https://stanpc.com"}/profile`,
        });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${nickname}'s Collection: ${collectorIndex}pts | ${ownedCards.length} cards | ${stats.completionPercentage.toFixed(1)}%`;
      navigator.clipboard.writeText(text);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F12] to-[#1A1A1E]">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F0F12]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">내 프로필</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
                title="프로필 공유"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">공유</span>
              </button>
              <Link
                href="/"
                className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* 1. 프로필 헤더 (아바타, 닉네임, 신뢰도, 업적) */}
          <motion.div variants={item}>
            <ProfileHeader
              nickname={nickname}
              userBadge={userBadge}
              favoriteMembers={favoriteMembers}
              collectorIndex={collectorIndex}
              mannerScore={mannerScore}
              badges={badges}
              twitterHandle={twitterHandle}
              openKakaoUrl={openKakaoUrl}
              discordUrl={discordUrl}
            />
          </motion.div>

          {/* 2. 프로필 통계 (소장수, 위시수, 거래, 완성도 - 마스터 도감 기반) */}
          <motion.div variants={item}>
            <ProfileStats
              ownedCount={ownedCards.length}
              wishedCount={wishCards.length}
              wttCount={wttCards.length}
              completionPercentage={portfolioCompletion.percentage}
            />
          </motion.div>

          {/* 3. 활동 히트맵 (Github 스타일 지난 52주) */}
          <motion.div variants={item}>
            <ProfileHeatmap data={heatmapData} />
          </motion.div>

          {/* 4. 수집 진척도 (주요 앨범별 완성도) */}
          <motion.div variants={item}>
            <ProfileProgress collections={progressCollections} />
          </motion.div>

          {/* 5. [내 바인더] 버튼 */}
          <motion.div variants={item}>
            <Link
              href="/vault"
              className="block w-full rounded-xl bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 px-6 py-4 text-center font-bold text-white transition-all hover:shadow-lg hover:shadow-pink-500/20"
            >
              📦 내 바인더 바로가기
            </Link>
          </motion.div>

          {/* 6. 가이드 아카이브 */}
          <motion.section variants={item} className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                StanPC 완벽 가이드
              </h2>
              <p className="text-white/60">
                포토카드 수집, 거래, 자랑하기 — 모든 기능을 한눈에
              </p>
            </div>
            <StanpcExploreCards />
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
