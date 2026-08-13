"use client";

import { useEffect, useState } from "react";
import type { GalleryFacets } from "@/lib/queries";

// Server-passed facets via props; this hook is a stub for future
// client-side fetching if needed. For now, rely on parent passing facets.
export function useGalleryFacets(): GalleryFacets | null {
  // TODO: Implement client-side fetching if drawer opens without preloaded facets.
  // For now, return null — filter-drawer.tsx should accept facets as a prop.
  return null;
}
