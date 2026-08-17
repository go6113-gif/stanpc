"use client";

import { Suspense, useState } from "react";
import { FilterBar } from "@/components/filter/FilterBar";
import { FilterDrawer } from "@/components/filter/FilterDrawer";
import { ActiveFilters } from "@/components/filter/ActiveFilters";
import type { GalleryFacets } from "@/lib/queries";

interface GalleryFiltersProps {
  resultCount: number;
  loggedIn: boolean;
  facets: GalleryFacets;
}

/** Wires FilterBar + FilterDrawer + ActiveFilters together with the shared
 * drawer-open/login-modal state the gallery page doesn't need to know about. */
export function GalleryFilters({ resultCount, loggedIn, facets }: GalleryFiltersProps) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  return (
    <Suspense fallback={null}>
      <FilterBar
        resultCount={resultCount}
        loggedIn={loggedIn}
        onOpenDrawer={() => setDrawerOpen(true)}
        onRequireLogin={() => setShowVaultModal(true)}
      />
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <ActiveFilters facets={facets} />
      </div>
      {isDrawerOpen && <FilterDrawer onClose={() => setDrawerOpen(false)} facets={facets} />}
    </Suspense>
  );
}
