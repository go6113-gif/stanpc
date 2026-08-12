'use client';

import { useState, useRef, useEffect } from 'react';
import CardEditor, { type CardData } from '@/components/card-generator/CardEditor';
import CardPreview from '@/components/card-generator/CardPreview';
import PreviewTabs from '@/components/card-generator/PreviewTabs';
import DownloadButton from '@/components/card-generator/DownloadButton';
import { type CardSize } from '@/lib/card-generator/cardSizes';
import { CardGeneratorUserData } from '@/lib/api-types';

const DEFAULT_CARD_DATA: CardData = {
  memberName: 'LE SSERAFIM',
  title: '100% 컬렉션 완성! 🎉',
  stats: {
    '보유': '50장',
    '원함': '0장',
  },
  hashtags: ['포토카드', '수집', 'K-pop', 'LE SSERAFIM'],
};

export default function CardGeneratorPage() {
  const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD_DATA);
  const [currentSize, setCurrentSize] = useState<CardSize>('vertical');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userData, setUserData] = useState<CardGeneratorUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/card-generator`;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // DB에서 사용자 데이터 로드
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/card-generator/user-data');
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data: CardGeneratorUserData = await response.json();
        setUserData(data);

        // 자동으로 통계 카드에 반영
        setCardData((prev) => ({
          ...prev,
          stats: {
            '보유': `${data.binderStats.totalCards}장`,
            '원함': `${data.binderStats.wishlistCount}장`,
            '완성': `${data.binderStats.completeSets}세트`,
          },
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('사용자 데이터를 불러올 수 없습니다', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-neutral-600">사용자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">카드 생성기</h1>
              <p className="text-sm text-neutral-600">SNS에서 자랑할 포토카드를 만들어보세요</p>
            </div>
            {userData && (
              <div className="text-right text-sm">
                <p className="font-semibold text-neutral-900">{userData.user.name}</p>
                <p className="text-neutral-600">덕력: {userData.user.collectorIndex}p</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Editor */}
          <div className="space-y-6">
            <CardEditor cardData={cardData} onCardDataChange={setCardData} />

            <DownloadButton
              size={currentSize}
              memberName={cardData.memberName}
              hashtags={cardData.hashtags}
              previewRef={previewRef}
              onCopySuccess={() => showToast('이미지 다운로드 완료! 해시태그도 복사되었습니다.', 'success')}
              onCopyError={() =>
                showToast('이미지는 다운로드되었지만 클립보드 복사에 실패했습니다.', 'error')
              }
            />

            {userData && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-900">
                  <strong>당신의 컬렉션:</strong> {userData.binderStats.totalCards}장 | 원함: {userData.binderStats.wishlistCount}장 | 완성: {userData.binderStats.completeSets}세트
                </p>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <div className="sticky top-20" ref={previewRef}>
              <PreviewTabs currentSize={currentSize} onSizeChange={setCurrentSize} />
              <CardPreview
                size={currentSize}
                memberName={cardData.memberName}
                title={cardData.title}
                stats={cardData.stats}
                shareUrl={shareUrl}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm font-medium text-white z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
