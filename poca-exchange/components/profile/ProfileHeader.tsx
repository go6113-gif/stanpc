"use client";

import { motion } from "framer-motion";
import { User, MessageCircle } from "lucide-react";

interface Badge {
  badgeName: string;
  badgeIcon: string | null;
}

interface ProfileHeaderProps {
  nickname: string;
  userBadge: string;
  favoriteMembers: string[];
  collectorIndex: number;
  mannerScore: number;
  badges?: Badge[];
  twitterHandle?: string;
  openKakaoUrl?: string;
  discordUrl?: string;
}

export function ProfileHeader({
  nickname,
  userBadge,
  favoriteMembers,
  collectorIndex,
  mannerScore,
  badges = [],
  twitterHandle,
  openKakaoUrl,
  discordUrl,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl"
    >
      {/* 메인 프로필 정보 */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
        {/* 아바타 */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-2 border-pink-500/50 flex items-center justify-center">
            <User size={48} className="text-pink-400" />
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-grow">
          {/* 닉네임 + 뱃지 */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {nickname}
            </h1>
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-xs font-bold text-yellow-400">
              {userBadge}
            </span>
          </div>

          {/* 설명 */}
          <p className="text-white/60 mb-4">
            포토카드 컬렉션을 관리하고 전 세계 팬들과 거래하세요
          </p>

          {/* 최애 멤버 뱃지 */}
          {favoriteMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favoriteMembers.map((member: string) => (
                <span
                  key={member}
                  className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300"
                >
                  💜 {member}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 게이미피케이션 지표 (3-column) */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/10">
        {/* 덕력 포인트 */}
        <motion.div whileHover={{ scale: 1.05 }} className="text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {collectorIndex}
          </div>
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            덕력 포인트
          </div>
        </motion.div>

        {/* 매너 온도 */}
        <motion.div whileHover={{ scale: 1.05 }} className="text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1">
            {mannerScore.toFixed(1)}°C
          </div>
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            매너 온도
          </div>
        </motion.div>

        {/* 보유 뱃지 */}
        <motion.div whileHover={{ scale: 1.05 }} className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {badges.length}
          </div>
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            보유 뱃지
          </div>
        </motion.div>
      </div>

      {/* 배지 표시 */}
      {badges.length > 0 && (
        <div className="mb-6 pb-6 border-b border-white/10">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            획득 뱃지
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => (
              <motion.span
                key={idx}
                title={badge.badgeName}
                whileHover={{ scale: 1.2 }}
                className="text-2xl cursor-help"
              >
                {badge.badgeIcon || "🏅"}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* 외부 연락 채널 */}
      <div className="flex flex-wrap gap-3">
        {twitterHandle && (
          <a
            href={`https://twitter.com/${twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-colors text-sm font-semibold"
          >
            <MessageCircle size={16} />
            Twitter
          </a>
        )}
        {openKakaoUrl && (
          <a
            href={openKakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-semibold"
          >
            <MessageCircle size={16} />
            Kakao
          </a>
        )}
        {discordUrl && (
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-sm font-semibold"
          >
            <MessageCircle size={16} />
            Discord
          </a>
        )}
      </div>
    </motion.div>
  );
}
