'use client';

import { useRef } from 'react';
import CardTemplate, { type CardTemplateProps } from './CardTemplate';

interface CardPreviewProps extends Omit<CardTemplateProps, 'shareUrl'> {
  shareUrl: string;
}

export default function CardPreview({
  size,
  memberName,
  title,
  stats,
  shareUrl,
}: CardPreviewProps) {
  const templateRef = useRef<{ element: HTMLDivElement | null }>(null);

  return (
    <div className="flex items-center justify-center bg-neutral-100 p-4 rounded-lg overflow-auto max-h-96">
      <CardTemplate ref={templateRef} size={size} memberName={memberName} title={title} stats={stats} shareUrl={shareUrl} />
    </div>
  );
}
