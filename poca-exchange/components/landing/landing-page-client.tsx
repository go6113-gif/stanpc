"use client";

import { useRef } from "react";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingFilterBar } from "./landing-filter-bar";
import { HighDensityGrid } from "@/components/high-density/high-density-grid";
import { getTopPhotoCards } from "@/lib/queries";

interface LandingPageClientProps {
  cards: Awaited<ReturnType<typeof getTopPhotoCards>>;
}

export function LandingPageClient({ cards }: LandingPageClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-[#0F0F12]">
      <LandingHeroSection gridRef={gridRef} />

      <LandingFilterBar />

      <section ref={gridRef} className="w-full px-4 py-10 md:px-8">
        <HighDensityGrid cards={cards} minCardWidth={180} gap={16} />
      </section>
    </main>
  );
}
