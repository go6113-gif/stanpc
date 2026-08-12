import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { seoFormulas } from '@/lib/seo-config';

interface AlbumWikiPageProps {
  params: Promise<{
    group: string;
    member: string;
    album: string;
  }>;
}

interface MemberStats {
  id: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  position: string | null;
}

interface AlbumData {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  releaseDate: string | null;
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
  viewCount: number;
}

interface WikiResponse {
  member: MemberStats;
  album: AlbumData;
  cards: PhotoCardData[];
  stats: {
    totalCards: number;
    pricedCards: number;
    avgPrice: number;
    totalHaveCount: number;
    totalWantCount: number;
  };
}

async function fetchAlbumWiki(
  groupSlug: string,
  memberSlug: string,
  albumSlug: string
): Promise<WikiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/wiki/album?groupSlug=${groupSlug}&memberSlug=${memberSlug}&albumSlug=${albumSlug}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching album wiki:', error);
    return null;
  }
}

export async function generateMetadata(
  props: AlbumWikiPageProps
): Promise<Metadata> {
  const params = await props.params;
  const data = await fetchAlbumWiki(
    params.group,
    params.member,
    params.album
  );
  if (!data) {
    return { title: 'Not Found' };
  }

  const memberName = data.member.nameKr || data.member.nameEn;
  const groupName = params.group.toUpperCase();
  const albumName = data.album.title;

  const title = seoFormulas.albumTitle(memberName, groupName, albumName);
  const description = seoFormulas.albumDescription(memberName, groupName);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: data.album.coverImageUrl ? [{ url: data.album.coverImageUrl }] : [],
    },
  };
}

export default async function AlbumWikiPage(props: AlbumWikiPageProps) {
  const params = await props.params;
  const data = await fetchAlbumWiki(
    params.group,
    params.member,
    params.album
  );

  if (!data) {
    notFound();
  }

  const { member, album, cards, stats } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {album.coverImageUrl && (
              <div className="relative h-48 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={album.coverImageUrl}
                  alt={`${member.nameKr || member.nameEn} ${params.group.toUpperCase()} ${album.title} Photocard Template`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {album.title}
              </h1>
              <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
                {member.nameKr || member.nameEn} · {params.group.toUpperCase()}
              </p>
              {album.releaseDate && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Released: {new Date(album.releaseDate).toLocaleDateString()}
                </p>
              )}
              <Link
                href={`/wiki/${params.group}/${params.member}`}
                className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
              >
                ← {member.nameKr || member.nameEn} 목록으로
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
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
              <Link
                key={card.id}
                href={`/card/${card.slug}`}
                className="group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[56/87] bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  {card.imageUrl && (
                    <Image
                      src={card.imageUrl}
                      alt={`${member.nameKr || member.nameEn} ${params.group.toUpperCase()} ${album.title} Photocard Template`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-2">
                  {card.version && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {card.version}
                    </p>
                  )}
                  {card.estimatedPrice && (
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      ${card.estimatedPrice.toFixed(2)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    보유: {card.haveCount} | 원함: {card.wantCount}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
