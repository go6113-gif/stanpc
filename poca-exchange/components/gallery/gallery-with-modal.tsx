"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HighDensityGrid } from "@/components/high-density/high-density-grid";
import { GalleryCardDetailModal } from "./gallery-card-detail-modal";
import type { PhotoCardData } from "@/components/high-density/photocard-card";

interface GalleryWithModalProps {
  cards: PhotoCardData[];
}

export function GalleryWithModal({ cards }: GalleryWithModalProps) {
  const [selectedCard, setSelectedCard] = useState<PhotoCardData | null>(null);

  const handleCardSelect = useCallback((card: PhotoCardData) => {
    setSelectedCard(card);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return (
    <>
      <HighDensityGrid cards={cards} onCardSelect={handleCardSelect} />
      <AnimatePresence>
        {selectedCard && (
          <GalleryCardDetailModal
            card={selectedCard}
            isOpen={true}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
