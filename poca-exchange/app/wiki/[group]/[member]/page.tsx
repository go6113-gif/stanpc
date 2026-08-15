import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { generateMemberMetadata } from '@/lib/seo-generator';
import HeroInlineCTA from '@/components/wiki/HeroInlineCTA';
import AffiliateCardCell from '@/components/wiki/AffiliateCardCell';
import ExitIntentModal from '@/components/wiki/ExitIntentModal';
import StickyBottomBar from '@/components/wiki/StickyBottomBar';
import WikiPageWrapper from '@/components/wiki/WikiPageWrapper';
import MemberTabs from '@/components/wiki/MemberTabs';

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
  ownedCount: number;
  wishedCount: number;
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
  const normalizedParams = {
    group: params.group.toLowerCase(),
    member: params.member.toLowerCase(),
  };
  const data = await fetchMemberWiki(normalizedParams.group, normalizedParams.member);
  if (!data) {
    return { title: 'Not Found' };
  }

  const memberName = data.member.nameKr || data.member.nameEn;
  const groupName = normalizedParams.group.toUpperCase();

  const metadata = generateMemberMetadata({
    memberName,
    groupName,
    cardCount: data.stats.totalCards,
    imageUrl: data.member.imageUrl,
    groupSlug: normalizedParams.group,
    memberSlug: normalizedParams.member,
  });

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    robots: metadata.robots,
    alternates: {
      canonical: `https://www.stanpc.com${metadata.canonicalUrl}`,
    },
    openGraph: {
      title: metadata.openGraph.title,
      description: metadata.openGraph.description,
      url: metadata.openGraph.url,
      type: 'website',
      locale: 'en_US',
      images: metadata.openGraph.image
        ? [
            {
              url: metadata.openGraph.image,
              alt: metadata.openGraph.imageAlt || memberName,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.twitterCard.title,
      description: metadata.twitterCard.description,
      images: metadata.twitterCard.image
        ? [metadata.twitterCard.image]
        : [],
      creator: metadata.twitterCard.creator,
      site: metadata.twitterCard.site,
    },
  };
}

// Gamified, presentational-only scores — consistent with the Collector Index
// philosophy (points-based, no leveling/tiers). Not persisted anywhere.
function stanpcScore(stats: WikiResponse['stats']) {
  const raw =
    stats.totalCards * 8 +
    stats.collectorCount * 3 +
    Math.min(stats.totalHaveCount, 500) / 10;
  return Math.max(1, Math.min(100, Math.round(raw)));
}

function tradeVolumeLabel(stats: WikiResponse['stats']) {
  const activity = stats.totalHaveCount + stats.totalWantCount;
  if (activity >= 200) return 'High';
  if (activity >= 50) return 'Medium';
  return 'Low';
}

function safetyScore(stats: WikiResponse['stats']) {
  return Math.min(99, 80 + Math.min(stats.collectorCount, 19));
}

function isValidImageUrl(url: string | null): url is string {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

export default async function MemberWikiPage(props: MemberWikiPageProps) {
  const params = await props.params;
  const normalizedParams = {
    group: params.group.toLowerCase(),
    member: params.member.toLowerCase(),
  };
  const data = await fetchMemberWiki(normalizedParams.group, normalizedParams.member);

  if (!data) {
    notFound();
  }

  const { member, cards, stats } = data;
  const displayName = member.nameKr || member.nameEn;
  const groupLabel = normalizedParams.group.toUpperCase();
  const score = stanpcScore(stats);
  const pricedCards = cards.filter((card) => card.estimatedPrice != null);

  const photocardsPanel =
    cards.length === 0 ? (
      <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
        <p className="text-neutral-600 dark:text-neutral-400">등재된 카드가 없습니다.</p>
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
            ownedCount={card.ownedCount}
            wishedCount={card.wishedCount}
            cardName={card.cardName}
            memberName={displayName}
            groupName={groupLabel}
            albumTitle={card.album?.title}
            albumSlug={card.album?.slug}
          />
        ))}
      </div>
    );

  const overviewPanel = (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-500 uppercase dark:text-neutral-400">Group</p>
          <p className="mt-1 text-lg font-extrabold text-neutral-900 dark:text-white">{groupLabel}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-500 uppercase dark:text-neutral-400">Position</p>
          <p className="mt-1 text-lg font-extrabold text-neutral-900 dark:text-white">
            {member.position || 'TBA'}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-500 uppercase dark:text-neutral-400">Collectors</p>
          <p className="mt-1 text-lg font-extrabold text-neutral-900 dark:text-white">
            {stats.collectorCount}명
          </p>
        </div>
      </div>

      {cards.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-neutral-900 dark:text-white">
            하이라이트 카드
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {cards.slice(0, 6).map((card) => (
              <Link
                key={card.id}
                href={`/card/${card.slug}`}
                className="group relative block aspect-[56/87] overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800"
              >
                {isValidImageUrl(card.imageUrl) ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.cardName || displayName}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const priceHistoryPanel = (
    <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
      <p className="text-neutral-600 dark:text-neutral-400">
        가격 히스토리는 각 카드 상세 페이지에서 확인할 수 있어요.
      </p>
      {pricedCards.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {pricedCards.slice(0, 5).map((card) => (
            <Link
              key={card.id}
              href={`/card/${card.slug}`}
              className="rounded-full border-2 border-neutral-200 px-4 py-1.5 text-sm font-bold text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300"
            >
              {card.version || card.cardName || displayName} · ${card.estimatedPrice?.toFixed(2)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const marketplacePanel = (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {['eBay', 'Pocamarket', 'DK Shop'].map((platform) => (
          <span
            key={platform}
            className="rounded-full border-2 border-nomad-red px-3 py-1 text-xs font-bold text-nomad-red"
          >
            {platform}
          </span>
        ))}
      </div>
      {pricedCards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-neutral-600 dark:text-neutral-400">
            현재 구매 가능한 매물이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pricedCards.map((card) => (
            <AffiliateCardCell
              key={card.id}
              id={card.id}
              slug={card.slug}
              imageUrl={card.imageUrl}
              version={card.version}
              estimatedPrice={card.estimatedPrice}
              ownedCount={card.ownedCount}
              wishedCount={card.wishedCount}
              cardName={card.cardName}
              memberName={displayName}
              groupName={groupLabel}
              albumTitle={card.album?.title}
              albumSlug={card.album?.slug}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <WikiPageWrapper>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Hero Header */}
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          {isValidImageUrl(member.imageUrl) ? (
            <Image
              src={member.imageUrl}
              alt={`${displayName} ${groupLabel} Photocard Template`}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-700 dark:from-neutral-700 dark:to-neutral-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 sm:px-6">
            <Link
              href={`/wiki/${normalizedParams.group}`}
              className="mb-3 inline-block text-sm font-bold text-white/80 hover:text-white"
            >
              ← {groupLabel} 목록으로
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{displayName}</h1>
                {member.nameKr && (
                  <p className="mt-1 text-lg font-medium text-white/70">{member.nameEn}</p>
                )}
              </div>
              <span className="flex items-center gap-2 rounded-full border-2 border-nomad-red bg-black/40 px-4 py-2 text-sm font-extrabold text-white backdrop-blur-sm">
                🔥 StanPC Score: {score}/100
              </span>
            </div>
          </div>
        </div>

        {/* Top Metric Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="-mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-400">
                Avg. Price
              </p>
              <p className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-white">
                ${stats.avgPrice.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-400">
                Total Cards
              </p>
              <p className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-white">
                {stats.totalCards}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-400">
                Trade Volume
              </p>
              <p className="mt-1 text-2xl font-extrabold text-nomad-red">{tradeVolumeLabel(stats)}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-400">
                Safety Score
              </p>
              <p className="mt-1 text-2xl font-extrabold text-green-600">{safetyScore(stats)}%</p>
            </div>
          </div>
        </div>

        {/* Hero Inline CTA */}
        <HeroInlineCTA
          memberName={displayName}
          cardCount={stats.totalCards}
          groupName={normalizedParams.group}
        />

        {/* Tabs */}
        <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6">
          <MemberTabs
            tabs={[
              { id: 'overview', label: 'Overview', content: overviewPanel },
              { id: 'photocards', label: `Photocards (${cards.length})`, content: photocardsPanel },
              { id: 'price-history', label: 'Price History', content: priceHistoryPanel },
              { id: 'marketplace', label: 'Marketplace', content: marketplacePanel },
            ]}
          />
        </main>

        {/* Exit Intent Modal */}
        <ExitIntentModal memberName={displayName} cardCount={stats.totalCards} />

        {/* Sticky Bottom Bar */}
        <StickyBottomBar memberName={displayName} groupName={normalizedParams.group} />
      </div>
    </WikiPageWrapper>
  );
}
