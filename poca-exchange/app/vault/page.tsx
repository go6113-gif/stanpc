import { Suspense } from 'react';
import VaultPageClient from './VaultPageClient';

function VaultPageContent({ mode }: { mode?: string }) {
  // mode=guest 파라미터가 있으면 게스트 모드 활성화
  const isGuestMode = mode === 'guest';
  return <VaultPageClient isDemoMode={isGuestMode} />;
}

interface VaultPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const params = await searchParams;
  const mode = params.mode;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">바인더 로드 중...</p>
          </div>
        </div>
      }
    >
      <VaultPageContent mode={mode} />
    </Suspense>
  );
}
