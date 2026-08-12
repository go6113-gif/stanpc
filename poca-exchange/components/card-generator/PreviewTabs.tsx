'use client';

import { type CardSize } from '@/lib/card-generator/cardSizes';

interface PreviewTabsProps {
  currentSize: CardSize;
  onSizeChange: (size: CardSize) => void;
}

const TAB_SIZES: { label: string; value: CardSize }[] = [
  { label: 'Vertical (9:16) - 스토리', value: 'vertical' },
  { label: 'Square (1:1) - 피드', value: 'square' },
];

export default function PreviewTabs({ currentSize, onSizeChange }: PreviewTabsProps) {
  return (
    <div className="flex gap-2 border-b border-neutral-200">
      {TAB_SIZES.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onSizeChange(tab.value)}
          className={`px-4 py-3 text-sm font-medium transition-all ${
            currentSize === tab.value
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'border-b-2 border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
