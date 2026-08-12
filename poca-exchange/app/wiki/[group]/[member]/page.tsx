import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { seoFormulas } from '@/lib/seo-config';
import HeroInlineCTA from '@/components/wiki/HeroInlineCTA';
import AffiliateCardCell from '@/components/wiki/AffiliateCardCell';
import ExitIntentModal from '@/components/wiki/ExitIntentModal';
import StickyBottomBar from '@/components/wiki/StickyBottomBar';
import WikiPageWrapper from '@/components/wiki/WikiPageWrapper';

interface MemberWikiPageProps {
  params: Promise<{
    group: string;
    member: string;
  }>;
}

interface MemberStats {
  id: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  position: string | null;
  cardCount: number;
  avgPrice: number;
  totalHaveCount: number;
  totalWantCount: number;
}

interface PhotoCardData {
  id: string;
  slug: string;
  cardName: string | null;
  version: string | null;
  imageUrl: string | null;
  estimatedPrice: number | null;
  haveCount: number;
  wantCount: number;
  album?: { slug: string; title: string };
}

interface WikiResponse {
  member: MemberStats;
  cards: PhotoCardData[];
  stats: {
    totalCards: number;
    pricedCards: number;
    avgPrice: number;
    totalHaveCount: number;
    totalWantCount: number;
    collectorCount: number;
  };
}

async function fetchMemberWiki(groupSlug: string, memberSlug: string): Promise<WikiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/wiki/member?groupSlug=${groupSlug}&memberSlug=${memberSlug}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching wiki:', error);
    return null;
  }
}

export async function generateMetadata(
  props: MemberWikiPageProps
): Promise<Metadata> {
  const params = await props.params;
  const data = await fetchMemberWiki(params.group, params.member);
  if (!data) {
    return { title: 'Not Found' };
  }

  const memberName = data.member.nameKr || data.member.nameEn;
  const groupName = params.group.toUpperCase();

  const title = seoFormulas.memberTitle(memberName, groupName);
  const description = seoFormulas.memberDescription(memberName, groupName);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: data.member.imageUrl ? [{ url: data.member.imageUrl }] : [],
    },
  };
}

export default async function MemberWikiPage(props: MemberWikiPageProps) {
  const params = await props.params;
  const data = await fetchMemberWiki(params.group, params.member);

  if (!data) {
    notFound();
  }

  const { member, cards, stats } = data;

  return (
    <WikiPageWrapper>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {member.imageUrl && (
                <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={member.imageUrl}
                    alt={`${member.nameKr || member.nameEn} ${params.group.toUpperCase()} Photocard Template`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                  {member.nameKr || member.nameEn}
                </h1>
                {member.nameKr && (
                  <p className="mt-1 text-lg text-neutral-600 dark:text-neutral-400">
                    {member.nameEn}
                  </p>
                )}
                {member.position && (
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {member.position}
                  </p>
                )}
                <Link
                  href={`/wiki/${params.group}`}
                  className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
                >
                  ← {params.group.toUpperCase()} 목록으로
                </Link>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">총 카드</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.totalCards}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">평균 시세</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.avgPrice.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">보유</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalHaveCount}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">원함</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalWantCount}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">수집가</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.collectorCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Inline CTA */}
        <HeroInlineCTA
          memberName={member.nameKr || member.nameEn}
          cardCount={stats.totalCards}
          groupName={params.group}
        />

        {/* Cards Grid */}
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 pb-24">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              카드 도감
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {cards.length}개의 카드
            </p>
          </div>

          {cards.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">
                등재된 카드가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cards.map((card) => (
                <AffiliateCardCell
                  key={card.id}
                  id={card.id}
                  slug={card.slug}
                  imageUrl={card.imageUrl}
                  version={card.version}
                  estimatedPrice={card.estimatedPrice}
                  haveCount={card.haveCount}
                  wantCount={card.wantCount}
                  cardName={card.cardName}
                  memberName={member.nameKr || member.nameEn}
                  groupName={params.group.toUpperCase()}
                  albumTitle={card.album?.title}
                  albumSlug={card.album?.slug}
                />
              ))}
            </div>
          )}
        </main>

        {/* Exit Intent Modal */}
        <ExitIntentModal
          memberName={member.nameKr || member.nameEn}
          cardCount={stats.totalCards}
        />

        {/* Sticky Bottom Bar */}
        <StickyBottomBar
          memberName={member.nameKr || member.nameEn}
          groupName={params.group}
        />
      </div>
    </WikiPageWrapper>
  );
}
