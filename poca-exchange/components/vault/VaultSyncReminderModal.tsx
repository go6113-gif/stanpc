'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { markVaultSyncChecked } from '@/hooks/useVaultSyncCheck';

interface VaultSyncReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  wttWtsCards: any[];
  lastSharedAt: Date | null;
  hoursElapsed: number;
}

export function VaultSyncReminderModal({
  isOpen,
  onClose,
  wttWtsCards,
  lastSharedAt,
  hoursElapsed,
}: VaultSyncReminderModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoToVault = () => {
    markVaultSyncChecked();
    onClose();
    // WTT/WTS 필터 적용하고 vault로 이동
    router.push('/vault?filter=wtt-wts');
  };

  const handleMarkComplete = async () => {
    if (!session?.user?.id) return;

    setIsProcessing(true);
    try {
      // 선택된 WTT/WTS 카드를 모두 OWNED로 변경
      const cardIds = wttWtsCards.map((card) => card.cardId);

      const response = await fetch('/api/vault/card', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          cardIds,
          status: 'OWNED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '상태 변경 실패');
      }

      markVaultSyncChecked();
      onClose();
    } catch (error) {
      console.error('Error marking cards as complete:', error);
      const message = error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    markVaultSyncChecked();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* 헤더 */}
              <div className="sticky top-0 bg-neutral-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">SNS 공유 바인더 점검</h2>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* 본문 */}
              <div className="p-6 space-y-6">
                {/* 설명 */}
                <div className="space-y-3">
                  <p className="text-white/80 leading-relaxed">
                    SNS에 공유했던 포토카드 중 거래가 완료된 카드가 있나요?
                  </p>
                  <p className="text-white/60 text-sm">
                    최신 상태로 바인더를 업데이트하면 링크에도 실시간 반영됩니다.
                  </p>
                  {lastSharedAt && (
                    <p className="text-white/50 text-xs mt-2">
                      마지막 공유: {hoursElapsed}시간 전
                    </p>
                  )}
                </div>

                {/* 카드 미리보기 */}
                {wttWtsCards.length > 0 && (
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      현재 거래 중인 카드 ({wttWtsCards.length}장)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {wttWtsCards.slice(0, 4).map((card, idx) => (
                        <div
                          key={`card-${idx}`}
                          className="flex items-center gap-2 bg-neutral-700/30 rounded-lg p-3 text-sm"
                        >
                          {card.imageUrl && (
                            <img
                              src={card.imageUrl}
                              alt={card.cardName}
                              className="w-10 h-14 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 truncate font-medium">
                              {card.cardName}
                            </p>
                            <p className="text-white/50 text-xs truncate">
                              {card.groupName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {wttWtsCards.length > 4 && (
                      <p className="text-white/40 text-xs mt-2">
                        + {wttWtsCards.length - 4}장 더
                      </p>
                    )}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  {/* 바인더 정리하기 */}
                  <button
                    onClick={handleGoToVault}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    📦 바인더 정리하기
                  </button>

                  {/* 일괄 완료 처리 */}
                  {wttWtsCards.length > 0 && (
                    <button
                      onClick={handleMarkComplete}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? '처리 중...' : '✅ 일괄 완료 처리'}
                    </button>
                  )}

                  {/* 다음에 하기 */}
                  <button
                    onClick={handleDismiss}
                    className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    다음에 하기
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
