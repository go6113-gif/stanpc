import { prisma } from "@/lib/prisma";
import { DevModalPreviewClient } from "./client";

// Scratch route for manually verifying PhotocardDetailModal before it's
// wired into real routing. Not linked from anywhere; safe to delete.
export default async function DevModalPreviewPage() {
  const card = await prisma.photoCard.findFirst({
    where: { slug: "twice-tzuyu-Feel-Special" },
    include: { group: true, member: true, album: true, priceHistory: true },
  });

  if (!card) return <p className="p-8">Card not found.</p>;

  return <DevModalPreviewClient card={card} />;
}
