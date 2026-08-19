import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { getTopPhotoCards } from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";

type Props = {
  params: Promise<{ group: string; member: string; type: string }>;
  searchParams: Promise<{ vendor?: string; sort?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { group, member, type } = params;

  // Build human-readable title from slugs
  const title = `${group} - ${member} ${type} 포토카드 | StanPC`;
  const description = `${group} ${member}의 ${type} 포토카드 검색 결과 및 시세 비교`;

  return {
    title,
    description,
    alternates: { canonical: `/explore/${group}/${member}/${type}` },
    openGraph: {
      ...siteConfig.ogDefaults,
      title,
      description,
      url: `/explore/${group}/${member}/${type}`,
      type: "website",
    },
  };
}

export default async function ExploreFilteredPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { group, member, type } = params;
  const { vendor, sort } = searchParams;

  // Fetch cards - TODO: Filter by group/member/type using URL parameters
  let cards: Awaited<ReturnType<typeof getTopPhotoCards>> = [];
  try {
    cards = await getTopPhotoCards(100);
  } catch (err) {
    console.warn("Failed to fetch cards:", err);
  }

  if (cards.length === 0) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F12]" />}>
      <LandingPageClient cards={cards} />
    </Suspense>
  );
}
