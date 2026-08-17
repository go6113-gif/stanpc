'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Loader } from 'lucide-react';
import { generateFlexCard, downloadFlexCard, shareFlexCardToStory, type FlexCardConfig } from '@/lib/utils/generateFlexCard';

interface StoryFlexCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNickname: string;
  userReferralCode: string;
  collectionCompletion?: number;
  topGroup?: string;
  topMember?: string;
  cardImages: string[];
  badgeText?: string;
}

export function StoryFlexCardModal({
  isOpen,
  onClose,
  userNickname,
  userReferralCode,
  collectionCompletion = 42,
  topGroup,
  topMember,
  cardImages,
  badgeText,
}: StoryFlexCardModalProps) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');

  // 카드 이미지 정규화 (최대 9장)
  const normalizedImages = useMemo(() => cardImages.slice(0, 9), [cardImages]);

  // 미리보기 생성
  const handleGenerateCard = async () => {
    try {
      setGenerating(true);

      const config: FlexCardConfig = {
        userNickname,
        collectionCompletion,
        topGroup,
        topMember,
        cardImages: normalizedImages,
        referralCode: userReferralCode,
        theme: 'hologram',
        badgeText,
      };

      const blob = await generateFlexCard(config);
      setGenerated(blob);

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to generate flex card:', err);
      alert('카드 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  // 다운로드
  const handleDownload = async () => {
    if (!generated) return;
    await downloadFlexCard(generated, `${userNickname}-collection.png`);
  };

  // 인스타그램 공유
  const handleShareStory = async () => {
    if (!generated) return;
    await shareFlexCardToStory(generated, userNickname);
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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="border-b border-white/10 bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">✨ 인스타 스토리 카드</h2>
                  <p className="text-sm text-white/60 mt-1">9:16 비율의 멋진 카드를 만들어 공유하세요</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors text-white/60"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="px-6 py-6 space-y-4">
              {/* 탭 */}
              <div className="flex gap-2 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'border-b-2 border-pink-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  미리보기
                </button>
                <button
                  onClick={() => setActiveTab('options')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'options'
                      ? 'border-b-2 border-pink-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  옵션
                </button>
              </div>

              {/* 미리보기 탭 */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {!generated ? (
                    <div className="rounded-lg border-2 border-dashed border-white/20 p-8 text-center">
                      <p className="text-white/60 mb-4">아직 생성된 카드가 없습니다</p>
                      <button
                        onClick={handleGenerateCard}
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50"
                      >
                        {generating ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            ✨ 카드 생성하기
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-white/10 overflow-hidden">
                        <div className="aspect-video bg-black flex items-center justify-center">
                          {previewUrl && (
                            <img
                              src={previewUrl}
                              alt="Flex Card Preview"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleDownload}
                          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          다운로드
                        </button>
                        <button
                          onClick={handleShareStory}
                          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-bold text-white hover:shadow-lg transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          스토리 공유
                        </button>
                      </div>

                      {/* 팁 */}
                      <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                        <p className="text-xs text-white/60">
                          💡 팁: 생성된 이미지를 인스타그램 스토리에 올려서 친구들을 초대하면, 추천 링크가 자동으로 포함됩니다!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 옵션 탭 */}
              {activeTab === 'options' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      포함할 포카 (최대 9장)
                    </label>
                    <p className="text-xs text-white/60">
                      현재 {normalizedImages.length}장이 선택되었습니다. {normalizedImages.length <= 4 ? '2x2' : '3x3'} 그리드로 표시됩니다.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      컬렉션 완성도
                    </label>
                    <p className="text-sm text-white/80 font-bold">{collectionCompletion}%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      주요 정보
                    </label>
                    <div className="space-y-2 text-sm text-white/60">
                      {topGroup && <p>👥 {topGroup}</p>}
                      {topMember && <p>🌟 {topMember}</p>}
                      {badgeText && <p>🏆 {badgeText}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCard}
                    disabled={generating}
                    className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50"
                  >
                    {generating ? '생성 중...' : '다시 생성하기'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
