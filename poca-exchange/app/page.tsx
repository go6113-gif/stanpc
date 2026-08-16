import { Suspense } from "react";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { getTopPhotoCards } from "@/lib/queries";

export const revalidate = 3600; // Cache for 1 hour

// Fallback data when database is unavailable (development without DB setup).
// Without this, an empty array meant the grid section silently disappeared —
// this keeps the landing page visually complete even with no DB connection.
const FALLBACK_GROUPS: Array<{ slug: string; name: string; member: string }> = [
  { slug: "seventeen", name: "세븐틴", member: "민규" },
  { slug: "stray-kids", name: "스트레이 키즈", member: "필릭스" },
  { slug: "bts", name: "방탄소년단", member: "정국" },
  { slug: "aespa", name: "에스파", member: "카리나" },
  { slug: "newjeans", name: "뉴진스", member: "해린" },
];

const FALLBACK_CARDS: Awaited<ReturnType<typeof getTopPhotoCards>> = Array.from(
  { length: 12 },
  (_, i) => {
    const g = FALLBACK_GROUPS[i % FALLBACK_GROUPS.length];
    return {
      rank: i + 1,
      slug: `demo-${g.slug}-${i + 1}`,
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
  }
// Demo placeholders only need the fields PhotoCardCard reads — the DB
// query's `group`/`member` are full Prisma models, which we don't need here.
) as unknown as Awaited<ReturnType<typeof getTopPhotoCards>>;

export default async function Home() {
  let cards: Awaited<ReturnType<typeof getTopPhotoCards>> = [];
  try {
    cards = await getTopPhotoCards(100);
  } catch (err) {
    console.warn("Failed to fetch cards (database unavailable):", err instanceof Error ? err.message : err);
    // Show fallback UI when database is not available
    // In production, real data will be fetched
    if (process.env.NODE_ENV === "development") {
      console.log("ℹ️  Using fallback cards. To show real data, set up DATABASE_URL in .env.local");
    }
  }

  // Ensure we always have cards to render (at minimum, show fallback)
  const cardsToRender = cards.length > 0 ? cards : FALLBACK_CARDS;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F12]" />}>
      <LandingPageClient cards={cardsToRender} />
    </Suspense>
  );
}
