import { LandingHeroSection } from "@/components/landing/landing-hero-section";
import { LandingFilterBar } from "@/components/landing/landing-filter-bar";
import { HighDensityGrid } from "@/components/high-density/high-density-grid";
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
    <main className="min-h-screen bg-[#0F0F12]">
      <LandingHeroSection />

      <LandingFilterBar />

      <section className="w-full px-4 py-10 md:px-8">
        <HighDensityGrid cards={cards} minCardWidth={180} gap={16} />
      </section>
    </main>
  );
}
