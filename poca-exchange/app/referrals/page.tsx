import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/pricing/ReferralDashboard';
import { ReferralLinkCard } from '@/components/referral/ReferralLinkCard';
import { RenewalProgressCard } from '@/components/referral/RenewalProgressCard';
import { DigitalRewardTiers } from '@/components/referral/DigitalRewardTiers';
import { AmbassadorLeaderboard } from '@/components/referral/AmbassadorLeaderboard';

export const metadata = {
  title: 'StanPC 추천 & 특전 | 친구 추천으로 무료 연장',
  description: '친구를 추천하고 무제한 크레딧을 적립하세요. 홀로그램 테마, 커스텀 도메인 등 디지털 특전 해금.',
};

export default async function ReferralsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* 헤더 */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white">
            📣 친구 추천하고 무한 수익 얻기
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            친구 2명만 추천해도 다음 해 구독료 100% 무료! 무제한 누적 가능
          </p>
        </div>

        {/* 주요 대시보드 */}
        <ReferralDashboard />

        {/* 추천 링크 */}
        <ReferralLinkCard />

        {/* 갱신비 무료화 진행도 */}
        <RenewalProgressCard currentCredits={0} />

        {/* 디지털 특전 */}
        <DigitalRewardTiers currentCredits={0} />

        {/* 랭킹 */}
        <AmbassadorLeaderboard />

        {/* FAQ */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-900 dark:text-white text-lg">
            ❓ 자주 묻는 질문
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <strong className="text-neutral-900 dark:text-white">
                Q. 현금 환급이 가능한가요?
              </strong>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                아니요. 모든 크레딧은 플랫폼 내부 구독 연장 및 디지털 특전 전용이며, 현금 출금은 불가합니다.
              </p>
            </div>
            <div>
              <strong className="text-neutral-900 dark:text-white">
                Q. 추천인이 환불하면?
              </strong>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                추천인의 결제가 취소되면, 지급받았던 크레딧은 자동으로 회수됩니다.
              </p>
            </div>
            <div>
              <strong className="text-neutral-900 dark:text-white">
                Q. 크레딧 한도가 있나요?
              </strong>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                아니요. 무제한 추천으로 무제한 크레딧을 적립할 수 있습니다!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
