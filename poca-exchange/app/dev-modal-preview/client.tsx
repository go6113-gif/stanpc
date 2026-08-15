"use client";

import { PhotocardDetailModal } from "@/components/modal/PhotocardDetailModal";
import type { PhotocardGuideSource } from "@/lib/photocard-guide";

export function DevModalPreviewClient({ card }: { card: PhotocardGuideSource }) {
  return <PhotocardDetailModal isOpen onClose={() => {}} card={card} />;
}
