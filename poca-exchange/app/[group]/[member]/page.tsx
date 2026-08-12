import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllMemberSlugs, getMemberBySlug } from "@/lib/queries";
import { PhotoCardGrid } from "@/components/photo-card-grid";
import { siteConfig } from "@/lib/site-config";
import { generateMemberMetadata } from "@/lib/seo-generator";

export async function generateStaticParams() {
  const members = await getAllMemberSlugs();
  return members.map(({ group, member }) => ({ group, member }));
}

export async function generateMetadata(
  props: PageProps<"/[group]/[member]">
): Promise<Metadata> {
  const { group: groupSlug, member: memberSlug } = await props.params;
  const member = await getMemberBySlug(groupSlug, memberSlug);
  if (!member) return {};

  const cardCount = member.photoCards.length;
  const seoData = generateMemberMetadata(
    member.nameEn,
    member.group.nameEn,
    cardCount
  );

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
  props: PageProps<"/[group]/[member]">
) {
  const { group: groupSlug, member: memberSlug } = await props.params;
  const member = await getMemberBySlug(groupSlug, memberSlug);
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
          wantCount: card.wantCount,
          haveCount: card.haveCount,
          viewCount: card.viewCount,
          badge: card.badge,
        }))}
      />
    </main>
  );
}
