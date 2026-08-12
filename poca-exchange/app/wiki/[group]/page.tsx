import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

interface GroupWikiPageProps {
  params: Promise<{
    group: string;
  }>;
}

interface MemberStat {
  id: string;
  slug: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  position: string | null;
  cardCount: number;
  avgPrice: number;
  totalHaveCount: number;
  totalWantCount: number;
}

interface GroupData {
  group: {
    id: string;
    slug: string;
    nameEn: string;
    nameKr: string | null;
    agency: string | null;
    debutDate: string | null;
    imageUrl: string | null;
  };
  memberStats: MemberStat[];
  groupStats: {
    totalCards: number;
    totalMembers: number;
    avgPrice: number;
    totalHaveCount: number;
    totalWantCount: number;
  };
}

async function fetchGroupWiki(groupSlug: string): Promise<GroupData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/wiki/group?groupSlug=${groupSlug}`,
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
  props: GroupWikiPageProps
): Promise<Metadata> {
  const params = await props.params;
  const data = await fetchGroupWiki(params.group);
  if (!data) {
    return { title: 'Not Found' };
  }

  const title = `${data.group.nameKr || data.group.nameEn} 포토카드 도감`;
  const description = `${title} · 멤버 ${data.groupStats.totalMembers}명 · 총 ${data.groupStats.totalCards}장`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: data.group.imageUrl ? [{ url: data.group.imageUrl }] : [],
    },
  };
}

export default async function GroupWikiPage(props: GroupWikiPageProps) {
  const params = await props.params;
  const data = await fetchGroupWiki(params.group);

  if (!data) {
    notFound();
  }

  const { group, memberStats, groupStats } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {group.imageUrl && (
              <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={group.imageUrl}
                  alt={group.nameKr || group.nameEn}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                {group.nameKr || group.nameEn}
              </h1>
              {group.nameKr && (
                <p className="mt-1 text-lg text-neutral-600 dark:text-neutral-400">
                  {group.nameEn}
                </p>
              )}
              {group.agency && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {group.agency}
                </p>
              )}
              {group.debutDate && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  데뷔: {new Date(group.debutDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              <Link
                href="/wiki"
                className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
              >
                ← 전체 Wiki로
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">멤버</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {groupStats.totalMembers}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">총 카드</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {groupStats.totalCards}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">평균 시세</p>
              <p className="text-2xl font-bold text-green-600">
                ${groupStats.avgPrice.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">총 보유</p>
              <p className="text-2xl font-bold text-blue-600">
                {groupStats.totalHaveCount}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">총 원함</p>
              <p className="text-2xl font-bold text-orange-600">
                {groupStats.totalWantCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            멤버
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {memberStats.length}명의 멤버
          </p>
        </div>

        {memberStats.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              등재된 멤버가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memberStats.map((member) => (
              <Link
                key={member.id}
                href={`/wiki/${params.group}/${member.slug}`}
                className="group rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {member.imageUrl && (
                    <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={member.imageUrl}
                        alt={member.nameKr || member.nameEn}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {member.nameKr || member.nameEn}
                    </h3>
                    {member.nameKr && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {member.nameEn}
                      </p>
                    )}
                    {member.position && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {member.position}
                      </p>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <p>카드: {member.cardCount}</p>
                      <p>평균: ${member.avgPrice.toFixed(2)}</p>
                      <p>보유/원함: {member.totalHaveCount}/{member.totalWantCount}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
