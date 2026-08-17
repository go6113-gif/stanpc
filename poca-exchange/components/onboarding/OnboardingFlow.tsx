'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { OnboardingSpotlight } from './OnboardingSpotlight';
import { OnboardingGuideModal } from './OnboardingGuideModal';
import { EarlyBirdPaymentModal } from './EarlyBirdPaymentModal';

type FlowStage = 'spotlight' | 'guide' | 'payment' | 'complete';

interface OnboardingFlowProps {
  onComplete?: () => void;
  artists?: Array<{ id: string; name: string; imageUrl?: string }>;
}

/**
 * 온보딩 전체 흐름 관리 컴포넌트
 * - Stage 1: 3-Step Spotlight (아티스트 선택 → 슬롯인 → 완성)
 * - Stage 2: AI 가치 제안 모달 (3-tab 캐러셀)
 * - Stage 3: $18 얼리버드 결제 모달
 * - Stage 4: 완료 & 리디렉트
 */
export function OnboardingFlow({ onComplete, artists }: OnboardingFlowProps) {
  const [stage, setStage] = useState<FlowStage>('spotlight');

  const handleSpotlightComplete = () => {
    setStage('guide');
  };

  const handleGuideNext = () => {
    setStage('payment');
  };

  const handleGuideSkip = () => {
    setStage('payment');
  };

  const handlePaymentClose = () => {
    setStage('complete');
    onComplete?.();
  };

  const handlePaymentPurchase = async (priceUSD: number) => {
    // TODO: 실제 결제 로직 구현
    // - Stripe API 호출
    // - DB에 결제 기록 저장
    // - 사용자 구독 상태 업데이트
    console.log(`Processing payment: $${priceUSD}`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 임시 지연
  };

  return (
    <AnimatePresence mode="wait">
      {stage === 'spotlight' && (
        <OnboardingSpotlight key="spotlight" isOpen onClose={handleSpotlightComplete} />
      )}

      {stage === 'guide' && (
        <OnboardingGuideModal
          key="guide"
          isOpen
          onClose={handleGuideNext}
        />
      )}

      {stage === 'payment' && (
        <EarlyBirdPaymentModal
          key="payment"
          isOpen
          onClose={handlePaymentClose}
          onPayment={() => handlePaymentPurchase(18)}
        />
      )}
    </AnimatePresence>
  );
}
