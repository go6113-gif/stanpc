import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllGroupSlugs, getGroupBySlug } from "@/lib/queries";
import { PhotoCardGrid } from "@/components/photo-card-grid";
import { siteConfig } from "@/lib/site-config";
import { generateGroupMetadata } from "@/lib/seo-generator";

interface GroupPageParams {
  group: string;
}

// generateStaticParams 실패 시(빌드 타임 DB 미연결 등) 빈 배열을 반환해
// 빌드가 깨지지 않고 온디맨드 렌더링으로 폴백되도록 함
export async function generateStaticParams() {
  try {
    const groups = await getAllGroupSlugs();
    return groups.map((group) => ({ group: group.slug }));
  } catch (err) {
    console.warn("generateStaticParams failed for /[group]:", err);
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<GroupPageParams>
): Promise<Metadata> {
  const { group: groupSlug } = await props.params;
  let group;
  try {
    group = await getGroupBySlug(groupSlug);
  } catch (err) {
    console.error("getGroupBySlug failed:", err);
    group = null;
  }
  if (!group) return {};

  const cardCount = group.photoCards.length;
  const seoData = generateGroupMetadata(group.nameEn, cardCount);

  return {
    title: seoData.title,
    description: seoData.description,
    alternates: { canonical: `/${group.slug}` },
    openGraph: {
      ...siteConfig.ogDefaults,
      title: seoData.title,
      description: seoData.description,
      url: `/${group.slug}`,
      type: "website",
      images: group.imageUrl ? [{ url: group.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoData.title,
      description: seoData.description,
      images: group.imageUrl ? [group.imageUrl] : undefined,
    },
  };
}

export default async function GroupPage(props: PageProps<GroupPageParams>) {
  const { group: groupSlug } = await props.params;
  let group;
  try {
    group = await getGroupBySlug(groupSlug);
  } catch (err) {
    console.error("getGroupBySlug failed:", err);
    group = null;
  }
  if (!group) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{group.nameEn}</h1>
        {group.nameKr && (
          <p className="mt-1 text-sm text-neutral-500">{group.nameKr}</p>
        )}

        {group.members.length > 0 && (
          <nav className="mt-4 flex flex-wrap gap-2">
            {group.members.map((member) => (
              <Link
                key={member.id}
                href={`/${group.slug}/${member.slug}`}
                className="rounded-full border border-neutral-200 px-3 py-1 text-sm hover:border-neutral-400 dark:border-neutral-700"
              >
                {member.nameEn}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <PhotoCardGrid
        cards={group.photoCards.map((card) => ({
          slug: card.slug,
          cardName: card.cardName,
          imageUrl: card.imageUrl,
          thumbImagePath: card.thumbImagePath,
          groupName: group.nameEn,
          memberName: card.member?.nameEn ?? null,
          albumTitle: card.album?.title ?? null,
          estimatedPrice: card.estimatedPrice,
          wishedCount: card.wishedCount,
          ownedCount: card.ownedCount,
          viewCount: card.viewCount,
          badge: card.badge,
        }))}
      />
    </main>
  );
}
