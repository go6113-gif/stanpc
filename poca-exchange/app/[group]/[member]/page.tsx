import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

import { getAllMemberSlugs, getMemberBySlug } from "@/lib/queries";
import { PhotoCardGrid } from "@/components/photo-card-grid";
import { siteConfig } from "@/lib/site-config";
import { generateMemberMetadata } from "@/lib/seo-generator";

interface MemberPageParams {
  group: string;
  member: string;
}

// 빌드 타임 DB 미연결 시 정적 params 없이 빌드가 통과하고
// 온디맨드 렌더링으로 폴백되도록 함
export async function generateStaticParams() {
  try {
    const members = await getAllMemberSlugs();
    return members.map(({ group, member }) => ({ group, member }));
  } catch (err) {
    console.warn("generateStaticParams failed for /[group]/[member]:", err);
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<MemberPageParams>
): Promise<Metadata> {
  const { group: groupSlug, member: memberSlug } = await props.params;
  let member;
  try {
    member = await getMemberBySlug(groupSlug, memberSlug);
  } catch (err) {
    console.error("getMemberBySlug failed:", err);
    member = null;
  }
  if (!member) return {};

  const cardCount = member.photoCards.length;
  const seoData = generateMemberMetadata({
    memberName: member.nameEn,
    groupName: member.group.nameEn,
    cardCount,
    groupSlug: groupSlug as string,
    memberSlug: memberSlug as string,
    imageUrl: member.imageUrl,
  });

  return {
    title: seoData.title,
    description: seoData.description,
    alternates: { canonical: `/${groupSlug}/${memberSlug}` },
    openGraph: {
      ...siteConfig.ogDefaults,
      title: seoData.title,
      description: seoData.description,
      url: `/${groupSlug}/${memberSlug}`,
      type: "profile",
      images: member.imageUrl ? [{ url: member.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoData.title,
      description: seoData.description,
      images: member.imageUrl ? [member.imageUrl] : undefined,
    },
  };
}

export default async function MemberPage(
  props: PageProps<MemberPageParams>
) {
  const { group: groupSlug, member: memberSlug } = await props.params;
  let member;
  try {
    member = await getMemberBySlug(groupSlug, memberSlug);
  } catch (err) {
    console.error("getMemberBySlug failed:", err);
    member = null;
  }
  if (!member) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link
          href={`/${member.group.slug}`}
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          &larr; {member.group.nameEn}
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {member.nameEn}
        </h1>
        {member.nameKr && (
          <p className="mt-1 text-sm text-neutral-500">{member.nameKr}</p>
        )}
      </header>

      <PhotoCardGrid
        cards={member.photoCards.map((card) => ({
          slug: card.slug,
          cardName: card.cardName,
          imageUrl: card.imageUrl,
          thumbImagePath: card.thumbImagePath,
          groupName: card.group.nameEn,
          memberName: member.nameEn,
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
