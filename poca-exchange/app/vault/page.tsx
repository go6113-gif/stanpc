'use client';

import dynamic from 'next/dynamic';

const VaultPageClient = dynamic(() => import('./VaultPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">Vault 로드 중...</p>
      </div>
    </div>
  ),
});

export default function VaultPage() {
  return <VaultPageClient />;
}
