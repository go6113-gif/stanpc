'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Trash2, Tag, X, Sparkles } from 'lucide-react';
import { SnsShareModal } from '@/components/export/SnsShareModal';
import { StoryFlexCardModal } from '@/components/export/StoryFlexCardModal';

interface BulkActionBarProps {
  selectedCount: number;
  selectedCards?: { memberName: string; groupName: string }[];
  cardImages?: string[];
  vaultUrl?: string;
  userNickname?: string;
  userReferralCode?: string;
  collectionCompletion?: number;
  onDelete?: () => void;
  onAddTags?: () => void;
  onClose?: () => void;
}

/**
 * 다중 선택 플로팅 액션 바
 *
 * Vault에서 카드를 선택했을 때 하단에 나타나는 액션 바
 */
export function BulkActionBar({
  selectedCount,
  selectedCards = [],
  cardImages = [],
  vaultUrl = '',
  userNickname = 'StanPC Collector',
  userReferralCode = '',
  collectionCompletion = 0,
  onDelete,
  onAddTags,
  onClose,
}: BulkActionBarProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFlexCardModal, setShowFlexCardModal] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* 플로팅 액션 바 */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none pb-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pointer-events-auto bg-white dark:bg-neutral-900 border-2 border-[#FF2A55] rounded-full shadow-2xl px-6 py-4 flex items-center gap-6"
        >
          {/* 선택 개수 표시 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF2A55] text-white flex items-center justify-center font-bold text-sm">
              {selectedCount}
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {selectedCount}개 선택됨
            </span>
          </div>

          {/* 구분선 */}
          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700" />

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-3">
            {/* 인스타 스토리 카드 */}
            <button
              onClick={() => setShowFlexCardModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-500/30 font-medium transition-all"
              title="인스타 스토리에 공유할 멋진 카드 만들기"
            >
              <Sparkles className="w-4 h-4" />
              스토리 카드
            </button>

            {/* SNS 공유 */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF2A55] text-white hover:bg-[#FF2A55]/90 font-medium transition-colors"
              title="SNS 공유"
            >
              <Share2 className="w-4 h-4" />
              SNS 공유
            </button>

            {/* 태그 추가 */}
            {onAddTags && (
              <button
                onClick={onAddTags}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-medium transition-colors"
                title="태그 추가"
              >
                <Tag className="w-4 h-4" />
                태그 추가
              </button>
            )}

            {/* 삭제 */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`${selectedCount}개의 카드를 삭제하시겠습니까?`)) {
                    onDelete();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 font-medium transition-colors"
                title="선택된 카드 삭제"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            )}

            {/* 닫기 */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 font-medium transition-colors"
              title="선택 해제"
            >
              <X className="w-4 h-4" />
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* 인스타 스토리 카드 모달 */}
      <StoryFlexCardModal
        isOpen={showFlexCardModal}
        onClose={() => setShowFlexCardModal(false)}
        userNickname={userNickname}
        userReferralCode={userReferralCode}
        collectionCompletion={collectionCompletion}
        cardImages={cardImages}
      />

      {/* SNS 공유 모달 */}
      <SnsShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cardCount={selectedCount}
        groups={selectedCards.map((c) => c.groupName)}
        members={selectedCards.map((c) => c.memberName)}
        shareUrl={vaultUrl}
      />
    </>
  );
}
