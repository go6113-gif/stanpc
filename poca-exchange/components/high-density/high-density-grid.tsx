"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PhotoCardCard, type PhotoCardData } from "./photocard-card";

interface HighDensityGridProps {
  cards: PhotoCardData[];
  isLoading?: boolean;
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Auto-fill column min-width in px. Shared between /gallery (denser,
   * paginated browsing) and / (TOP 100 landing showcase), which want
   * different card sizes — each caller passes its own value explicitly
   * rather than relying on this default, since the two pages disagree on it. */
  minCardWidth?: number;
  /** Grid gap in px — same per-caller reasoning as minCardWidth. */
  gap?: number;
}

// Auto-fill responsive grid: card size fixed (280px min), expansion adds columns only
// Mobile (≤480px): 2 columns fixed via .gallery-grid media query
// Wider screens: columns expand automatically while maintaining 280px card minimum
const GRID_CLASSES = {
  container: "gallery-grid",
  item: "aspect-[2.5/3.5]",
};

export function HighDensityGrid({
  cards,
  isLoading = false,
  page = 1,
  total = 0,
  onPageChange,
  minCardWidth = 250,
  gap = 24,
}: HighDensityGridProps) {
  const [localCards, setLocalCards] = useState<Set<string>>(new Set());
  const [wantCards, setWantCards] = useState<Set<string>>(new Set());

  const handleHaveToggle = (slug: string, isHave: boolean) => {
    if (isHave) {
      setLocalCards((prev) => new Set([...prev, slug]));
    } else {
      setLocalCards((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  const handleWantToggle = (slug: string, isWant: boolean) => {
    if (isWant) {
      setWantCards((prev) => new Set([...prev, slug]));
    } else {
      setWantCards((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 } as any,
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="space-y-8">
      {/* Grid */}
      <motion.div
        className={GRID_CLASSES.container}
        style={{ gap: `${gap}px` }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <motion.div key={card.slug} variants={item} className={GRID_CLASSES.item}>
            <PhotoCardCard
              card={card}
              onHaveToggle={handleHaveToggle}
              onWantToggle={handleWantToggle}
              isHave={localCards.has(card.slug)}
              isWant={wantCards.has(card.slug)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-white/60">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= Math.ceil(total / 24)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
