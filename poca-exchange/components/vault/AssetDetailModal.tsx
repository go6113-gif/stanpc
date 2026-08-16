"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, History, Shield, CheckCircle2, Clock } from "lucide-react";
import type { AssetCard, AssetActivityLog } from "@/lib/types/asset";

interface AssetDetailModalProps {
  card: AssetCard | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock Activity Log 데이터
const MOCK_ACTIVITY_LOG: AssetActivityLog[] = [
  {
    id: "1",
    assetCardId: "card-1",
    action: "added",
    description: "컬렉션에 추가됨",
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    assetCardId: "card-1",
    action: "authenticated",
    description: "실물 인증 완료",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    assetCardId: "card-1",
    action: "status-changed",
    description: "상태 변경: Owned → WTT",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    assetCardId: "card-1",
    action: "location-updated",
    description: "보관 위치 변경: 콜렉트북 1 → 슬리브 보관",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export function AssetDetailModal({
  card,
  isOpen,
  onClose,
}: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    card?.authenticationStatus === "verified"
  );

  if (!card) return null;

  const handleMockAuthenticate = () => {
    setIsAuthenticating(true);
    // 실제로는 워터마크가 찍힌 이미지 업로드 처리
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
    }, 1000);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
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
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#1A1A1E] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                {card.memberName} - {card.groupName}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/60 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 콘텐츠 */}
            <div className="overflow-y-auto max-h-[70vh]">
              {/* 탭 */}
              <div className="flex border-b border-white/10 bg-white/5">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "details"
                      ? "text-white border-b-2 border-[#FF2A55] bg-[#FF2A55]/10"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  상세 정보
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "history"
                      ? "text-white border-b-2 border-[#FF2A55] bg-[#FF2A55]/10"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  히스토리
                </button>
              </div>

              {/* 상세 정보 탭 */}
              {activeTab === "details" && (
                <div className="space-y-6 px-6 py-6">
                  {/* 카드 이미지 */}
                  <div className="relative aspect-[56/87] rounded-lg overflow-hidden bg-white/10 border border-white/10">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.cardName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📸
                      </div>
                    )}
                  </div>

                  {/* 정보 섹션 */}
                  <div className="space-y-4">
                    {/* 기본 정보 */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                        기본 정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/60 mb-1">멤버</p>
                          <p className="text-white font-semibold">
                            {card.memberName}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">그룹</p>
                          <p className="text-white font-semibold">
                            {card.groupName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 상태 및 인증 */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                        상태 & 인증
                      </h3>
                      <div className="space-y-2">
                        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-sm text-white">실물 인증</span>
                          {isAuthenticated ? (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-semibold">인증됨</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleMockAuthenticate}
                              disabled={isAuthenticating}
                              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <Upload size={14} />
                              {isAuthenticating ? "인증 중..." : "인증하기"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 보관 위치 */}
                    {card.location && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                          보관 위치
                        </h3>
                        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-white">#{card.location.label}</p>
                        </div>
                      </div>
                    )}

                    {/* 메모 */}
                    {card.notes && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                          메모
                        </h3>
                        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-white/80">{card.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 히스토리 탭 */}
              {activeTab === "history" && (
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/70 mb-4">
                      활동 기록
                    </h3>

                    <div className="relative">
                      {/* 타임라인 선 */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#FF2A55]/50 via-[#FF2A55]/30 to-transparent" />

                      {/* 활동 로그 항목들 */}
                      <div className="space-y-4">
                        {MOCK_ACTIVITY_LOG.map((log, index) => (
                          <div key={log.id} className="relative pl-10">
                            {/* 타임라인 도트 */}
                            <div className="absolute left-0 w-9 h-9 rounded-full bg-[#FF2A55]/20 border border-[#FF2A55]/50 flex items-center justify-center flex-shrink-0 top-1">
                              {log.action === "authenticated" ? (
                                <Shield size={14} className="text-green-400" />
                              ) : (
                                <Clock size={14} className="text-white/60" />
                              )}
                            </div>

                            {/* 활동 내용 */}
                            <div className="pt-2">
                              <p className="text-sm font-semibold text-white">
                                {log.description}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                {getTimeAgo(log.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
