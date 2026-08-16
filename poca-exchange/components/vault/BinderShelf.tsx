"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, LockOpen, X } from "lucide-react";
// import { useVaultStore, type VaultBinder } from "@/store/useVaultStore";

interface VaultBinder {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  completionPercentage: number;
  cardCount: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 공개/비공개 설정 모달
 */
function BinderModalDialog({
  isOpen,
  onClose,
  onCreateBinder,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateBinder: (isPublic: boolean, name: string) => void;
}) {
  const [binderName, setBinderName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!binderName.trim()) return;

    setIsSubmitting(true);
    // 시뮬레이션 딜레이
    await new Promise((resolve) => setTimeout(resolve, 300));

    onCreateBinder(isPublic, binderName);
    setBinderName("");
    setIsPublic(true);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl p-6 sm:p-8"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">새 바인더 만들기</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* 폼 */}
            <div className="space-y-4 mb-6">
              {/* 바인더 이름 입력 */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  바인더 이름
                </label>
                <input
                  type="text"
                  value={binderName}
                  onChange={(e) => setBinderName(e.target.value)}
                  placeholder="예: NewJeans 도감"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-white/15 transition-colors"
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {/* 공개 범위 선택 */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-3">
                  공개 범위
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Public */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsPublic(true)}
                    className={`rounded-lg border-2 p-4 transition-all ${
                      isPublic
                        ? "border-green-500/50 bg-green-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <LockOpen size={24} className={isPublic ? "text-green-400" : "text-white/60"} />
                    </div>
                    <p className={`text-sm font-semibold ${
                      isPublic ? "text-green-400" : "text-white/70"
                    }`}>
                      공개
                    </p>
                    <p className="text-xs text-white/50 mt-1">모두 볼 수 있음</p>
                  </motion.button>

                  {/* Private */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsPublic(false)}
                    className={`rounded-lg border-2 p-4 transition-all ${
                      !isPublic
                        ? "border-purple-500/50 bg-purple-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Lock size={24} className={!isPublic ? "text-purple-400" : "text-white/60"} />
                    </div>
                    <p className={`text-sm font-semibold ${
                      !isPublic ? "text-purple-400" : "text-white/70"
                    }`}>
                      비공개
                    </p>
                    <p className="text-xs text-white/50 mt-1">나만 볼 수 있음</p>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!binderName.trim() || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                {isSubmitting ? "생성 중..." : "만들기"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 바인더 쉘프 UI
 * 실물 바인더가 꽂혀 있는 형태의 가로 스크롤 컴포넌트
 */
export function BinderShelf() {
  // useVaultStore 대체 - Mock 데이터 사용
  const binders: VaultBinder[] = [];
  const selectBinder = (id: string) => console.log("Select binder:", id);
  const toggleVisibility = (id: string) => console.log("Toggle visibility:", id);
  const addBinder = (binder: VaultBinder) => console.log("Add binder:", binder);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateBinder = (isPublic: boolean, name: string) => {
    const newBinder: VaultBinder = {
      id: `binder-${Date.now()}`,
      name,
      description: "",
      cardCount: 0,
      totalValue: 0,
      completionPercentage: 0,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addBinder(newBinder);
  };

  return (
    <>
      <div className="space-y-4">
        {/* 섹션 헤더 */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">내 바인더 쉘프</h2>
          <p className="text-sm text-white/60">포토카드를 정리하는 나만의 바인더</p>
        </div>

        {/* 바인더 쉘프 (가로 스크롤) */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-hide"
        >
          <div className="flex gap-4 pb-4 min-w-min">
            {/* "새 바인더 만들기" 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 w-40 h-56 rounded-lg border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-3 transition-all"
            >
              <Plus size={32} className="text-white/60" />
              <span className="text-sm font-semibold text-white/60 hover:text-white text-center px-2">
                새 바인더 만들기
              </span>
            </motion.button>

            {/* 바인더 목록 */}
            {binders.map((binder, idx) => (
              <motion.button
                key={binder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => selectBinder(binder.id)}
                className="flex-shrink-0 group relative"
              >
                {/* 바인더 쉘프 스타일 */}
                <div className="w-40 h-56 rounded-lg border border-white/10 bg-gradient-to-br from-white/8 to-white/3 overflow-hidden hover:border-white/30 transition-colors shadow-lg hover:shadow-pink-500/20">
                  {/* 배경 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* 썸네일 이미지 (플레이스홀더) */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/10 to-white/5">
                    <div className="text-3xl font-bold text-white/30">📚</div>
                  </div>

                  {/* 텍스트 정보 */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-3">
                    {/* 공개/비공개 아이콘 + 토글 */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(binder.id);
                        }}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {binder.isPublic ? (
                          <LockOpen size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-purple-400" />
                        )}
                      </button>
                    </div>

                    {/* 바인더 정보 */}
                    <div className="text-left">
                      <h3 className="font-bold text-white text-sm truncate">
                        {binder.name}
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        {binder.cardCount}장
                      </p>
                    </div>

                    {/* 완성도 게이지 */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${binder.completionPercentage}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                        />
                      </div>
                      <p className="text-xs text-white/60 text-right">
                        {binder.completionPercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 모달 */}
      <BinderModalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateBinder={handleCreateBinder}
      />
    </>
  );
}
