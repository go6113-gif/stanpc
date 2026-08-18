import { Suspense } from 'react';
import { LandingPageClient } from '@/components/landing/landing-page-client';
import { getTopPhotoCards } from '@/lib/queries';

export const metadata = {
  title: '덕후 Wiki | StanPC',
  description: '전 세계 포토카드 글로벌 도감 아카이브. 포토카드 검색, 상세 정보, 수집가 커뮤니티',
};

export const revalidate = 3600;

export default async function WikiPage() {
  let cards: Awaited<ReturnType<typeof getTopPhotoCards>> = [];
  try {
    cards = await getTopPhotoCards(500);
  } catch (err) {
    console.warn('Failed to fetch wiki cards:', err instanceof Error ? err.message : err);
  }

  // Fallback groups for empty state
  const FALLBACK_GROUPS = [
    { slug: 'seventeen', name: '세븐틴', member: '민규' },
    { slug: 'stray-kids', name: '스트레이 키즈', member: '필릭스' },
    { slug: 'bts', name: '방탄소년단', member: '정국' },
    { slug: 'aespa', name: '에스파', member: '카리나' },
    { slug: 'newjeans', name: '뉴진스', member: '해린' },
  ];

  const FALLBACK_CARDS = Array.from({ length: 12 }, (_, i) => {
    const g = FALLBACK_GROUPS[i % FALLBACK_GROUPS.length];
    return {
      rank: i + 1,
      slug: `wiki-${g.slug}-${i + 1}`,
      cardName: `${g.member} 포토카드`,
      imageUrl: null,
      thumbImagePath: null,
      version: null,
      groupSlug: g.slug,
      groupName: g.name,
      memberSlug: g.member,
      memberName: g.member,
      albumTitle: null,
      estimatedPrice: null,
      ownedCount: 0,
      wishedCount: 0,
      viewCount: 0,
      badge: null,
      group: { slug: g.slug, nameEn: g.slug, nameKr: g.name },
      member: { slug: g.member, nameEn: g.member, nameKr: g.member },
      album: null,
    };
  }) as unknown as Awaited<ReturnType<typeof getTopPhotoCards>>;

  const cardsToRender = cards.length > 0 ? cards : FALLBACK_CARDS;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F12]" />}>
      <WikiPageContent cards={cardsToRender} />
    </Suspense>
  );
}

function WikiPageContent({
  cards,
}: {
  cards: Awaited<ReturnType<typeof getTopPhotoCards>>;
}) {
  return (
    <main className="min-h-screen bg-[#0F0F12]">
      {/* Wiki Header */}
      <section className="border-b border-white/10 bg-[#0F0F12]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">덕후 Wiki</h1>
          <p className="text-white/60 text-sm md:text-base">
            전 세계 포토카드를 한 곳에서 검색하고 수집하세요
          </p>
        </div>
      </section>

      {/* Content */}
      <LandingPageClient cards={cards} />
    </main>
  );
}
