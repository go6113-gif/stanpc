import { Suspense } from "react";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { getTopPhotoCards } from "@/lib/queries";

export const revalidate = 3600; // Cache for 1 hour

export default async function Home() {
  let cards: Awaited<ReturnType<typeof getTopPhotoCards>> = [];
  try {
    cards = await getTopPhotoCards(100);
  } catch (err) {
    // Fallback during build without database
    console.warn("Failed to fetch cards:", err);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F12]" />}>
      <LandingPageClient cards={cards} />
    </Suspense>
  );
}
