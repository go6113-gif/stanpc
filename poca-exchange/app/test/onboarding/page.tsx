'use client';

import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/**
 * 온보딩 플로우 테스트 페이지
 * /test/onboarding 에서 확인 가능
 */

const ARTISTS = [
  { id: 'bts', name: 'BTS' },
  { id: 'blackpink', name: 'BLACKPINK' },
  { id: 'stray-kids', name: 'Stray Kids' },
  { id: 'seventeen', name: 'SEVENTEEN' },
  { id: 'twice', name: 'TWICE' },
  { id: 'newjeans', name: 'NewJeans' },
];

export default function OnboardingTestPage() {
  return (
    <div className="min-h-screen">
      <OnboardingFlow
        artists={ARTISTS}
        onComplete={() => {
          console.log('Onboarding completed!');
          // 실제 환경에서는 /vault로 리디렉트
        }}
      />
    </div>
  );
}
