'use client';

import { useState, useRef, useEffect } from 'react';
import { generateCardImage, downloadImage } from '@/lib/card-generator/imageGenerator';
import { copyToClipboard, generateHashtagText } from '@/lib/card-generator/clipboardHelper';
import { type CardSize } from '@/lib/card-generator/cardSizes';

interface DownloadButtonProps {
  size: CardSize;
  memberName: string;
  hashtags: string[];
  onCopySuccess?: () => void;
  onCopyError?: () => void;
  previewRef?: React.RefObject<HTMLDivElement>;
}

export default function DownloadButton({
  size,
  memberName,
  hashtags,
  onCopySuccess,
  onCopyError,
  previewRef,
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!previewRef?.current) {
      setError('미리보기를 찾을 수 없습니다');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // CardPreview 내의 CardTemplate 찾기
      const cardElement = previewRef.current.querySelector('[style*="width"]') as HTMLElement;

      if (!cardElement) {
        throw new Error('카드를 찾을 수 없습니다');
      }

      // 1. 이미지 생성
      const blob = await generateCardImage(cardElement, size, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      if (!blob) {
        throw new Error('이미지 생성 실패');
      }

      // 2. 파일명 생성
      const timestamp = new Date().getTime();
      const filename = `card-${memberName.replace(/\s+/g, '-')}-${timestamp}.png`;

      // 3. 다운로드 실행
      downloadImage(blob, filename);

      // 4. 해시태그 클립보드 복사
      const hashtagText = generateHashtagText(hashtags);
      const copySuccess = await copyToClipboard(hashtagText);

      if (copySuccess) {
        onCopySuccess?.();
      } else {
        onCopyError?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류 발생';
      setError(message);
      onCopyError?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        style={{
          width: '100%',
          borderRadius: '8px',
          backgroundColor: '#2563eb',
          padding: '12px 16px',
          fontWeight: '500',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
        }}
        onMouseLeave={(e) => {
          if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
        }}
      >
        {isLoading ? (
          <>
            <span>⏳</span>
            생성 중...
          </>
        ) : (
          <>
            <span>📥</span>
            이미지 다운로드
          </>
        )}
      </button>

      {error && <p style={{ fontSize: '14px', color: '#dc2626' }}>{error}</p>}
    </div>
  );
}
