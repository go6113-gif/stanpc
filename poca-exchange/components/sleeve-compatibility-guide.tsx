'use client';

import { useState } from 'react';
import { CardDimensionGuide, SleevSpecification } from '@/lib/api-types';

const STANDARD_SLEEVES: SleevSpecification[] = [
  {
    name: '표준 슬리브',
    width: 56,
    height: 87,
    typeKr: '기본 슬리브',
    commonBrands: ['KMC Standard', 'Ultimate Guard Standard'],
    notes: '일반적인 포토카드 표준 규격',
  },
  {
    name: '프리미엄 슬리브',
    width: 60,
    height: 90,
    typeKr: '프리미엄 슬리브',
    commonBrands: ['Dragon Shield Sealable', 'Premium 고급 슬리브'],
    notes: '더 여유있는 핏으로 카드 손상 최소화',
  },
  {
    name: '초장형 슬리브 (oversized)',
    width: 64,
    height: 99,
    typeKr: '초장형 슬리브',
    commonBrands: ['Oversized Sleeve'],
    notes: '매우 큰 카드용 (드물음)',
  },
];

interface SleeveCompatibilityGuideProps {
  cardDimensions?: { width: number; height: number };
  isOptional?: boolean; // 슬리브 권장 여부
}

export default function SleeveCompatibilityGuide({
  cardDimensions = { width: 56, height: 87 },
  isOptional = true,
}: SleeveCompatibilityGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCompatibility = (
    sleeve: SleevSpecification
  ): 'perfect' | 'loose' | 'incompatible' => {
    const tolerance = 1; // 1mm 오차 허용

    if (
      Math.abs(sleeve.width - cardDimensions.width) <= tolerance &&
      Math.abs(sleeve.height - cardDimensions.height) <= tolerance
    ) {
      return 'perfect';
    } else if (
      sleeve.width > cardDimensions.width + 1 &&
      sleeve.height > cardDimensions.height + 1
    ) {
      return 'loose';
    }
    return 'incompatible';
  };

  const compatibleSleeves = STANDARD_SLEEVES.filter(
    (s) => getCompatibility(s) !== 'incompatible'
  );

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            📏 규격 & 슬리브 호환성
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {cardDimensions.width}×{cardDimensions.height}mm
            {isOptional && ' (슬리브 선택사항)'}
          </p>
        </div>
        <span
          className={`transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
          {/* 카드 규격 정보 */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              포토카드 규격
            </p>
            <div className="bg-white dark:bg-neutral-900 rounded p-3 space-y-1 text-sm">
              <p className="text-neutral-700 dark:text-neutral-300">
                <strong>너비:</strong> {cardDimensions.width}mm
              </p>
              <p className="text-neutral-700 dark:text-neutral-300">
                <strong>높이:</strong> {cardDimensions.height}mm
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-2">
                국제 표준 포토카드 규격입니다.
              </p>
            </div>
          </div>

          {/* 슬리브 호환성 */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              권장 슬리브
            </p>
            <div className="space-y-2">
              {STANDARD_SLEEVES.map((sleeve, idx) => {
                const compat = getCompatibility(sleeve);
                if (compat === 'incompatible') return null;

                return (
                  <div
                    key={idx}
                    className={`rounded p-3 text-sm ${
                      compat === 'perfect'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-neutral-900 dark:text-white">
                        {sleeve.name}
                      </strong>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          compat === 'perfect'
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                      >
                        {compat === 'perfect' ? '추천' : '느슨함'}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs mb-2">
                      {sleeve.width}×{sleeve.height}mm
                    </p>
                    {sleeve.commonBrands.length > 0 && (
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs mb-1">
                        <strong>브랜드:</strong> {sleeve.commonBrands.join(', ')}
                      </p>
                    )}
                    {sleeve.notes && (
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs italic">
                        💡 {sleeve.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 보관 팁 */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              💾 보관 팁
            </p>
            <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1 list-disc list-inside">
              <li>슬리브 사용은 선택사항입니다 (카드 손상 방지에 도움)</li>
              <li>속지와 함께 바인더에 보관하면 더 안전합니다</li>
              <li>직사광선과 습기로부터 보호하세요</li>
              <li>카드를 다루기 전에 손을 깨끗이 하세요</li>
            </ul>
          </div>

          {isOptional && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 bg-blue-50 dark:bg-blue-900/20 rounded p-3">
              <p className="text-xs text-blue-900 dark:text-blue-200">
                <strong>ℹ️ 참고:</strong> 이 카드는 슬리브 없이도 충분히 보관 가능하며, 슬리브 사용은
                <span className="font-semibold"> 선택사항</span>입니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
