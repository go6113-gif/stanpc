import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ReferralsPageClient } from './page.client';

export const metadata: Metadata = {
  title: '추천 프로그램 | StanPC',
  description: '친구를 초대하고 크레딧을 적립하세요.',
  openGraph: {
    title: '추천 프로그램 | StanPC',
    description: '친구를 초대하고 크레딧을 적립하세요.',
  },
};

interface ReferralsPageProps {
  searchParams: Promise<{ dev_mock?: string }>;
}

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const params = await searchParams;
  const session = await auth();
  const isDevMock = params.dev_mock === 'true' && process.env.NODE_ENV === 'development';

  if (!session?.user?.id && !isDevMock) {
    redirect('/login?callbackUrl=/referrals');
  }

  return <ReferralsPageClient devMockMode={isDevMock} />;
}
