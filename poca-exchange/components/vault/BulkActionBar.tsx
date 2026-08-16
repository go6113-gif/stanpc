'use client';

import { useState } from 'react';
import { Share2, Trash2, Tag, X } from 'lucide-react';
import { SnsShareModal } from '@/components/export/SnsShareModal';

interface BulkActionBarProps {
  selectedCount: number;
  selectedCards?: { memberName: string; groupName: string }[];
  vaultUrl?: string;
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
  vaultUrl = '',
  onDelete,
  onAddTags,
  onClose,
}: BulkActionBarProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* 플로팅 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none pb-4">
        <div className="pointer-events-auto bg-white dark:bg-neutral-900 border-2 border-[#FF2A55] rounded-full shadow-2xl px-6 py-4 flex items-center gap-6">
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
        </div>
      </div>

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
