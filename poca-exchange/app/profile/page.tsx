'use client';

import dynamic from 'next/dynamic';

const ProfilePageClient = dynamic(() => import('./ProfilePageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F12] to-[#1A1A1E] flex items-center justify-center">
      <div className="text-white">로드 중...</div>
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfilePageClient />;
}
