'use client';

import dynamic from 'next/dynamic';

const ExportPageClient = dynamic(() => import('./ExportPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
      <div className="text-white">로드 중...</div>
    </div>
  ),
});

export default function ExportPage() {
  return <ExportPageClient />;
}
