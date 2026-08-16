import Link from "next/link";
import { CardThumbnail, type CardThumbnailItem } from "@/components/CardThumbnail";
import { CardTiltWrapper } from "@/components/card/CardTiltWrapper";

export type PhotoCardGridItem = CardThumbnailItem & {
  ownedCount: number;
  viewCount: number;
};

function popularityScore(card: PhotoCardGridItem) {
  return card.wishedCount * 10 + card.ownedCount * 5 + card.viewCount * 1;
}

/**
 * Mobile-first responsive grid for browsing photo cards, in the dense
 * card-tile style of Nomad List's directory pages: 2-up on phones,
 * scaling up to 6-up on wide desktops, image-led tiles with a
 * hover/tap overlay carrying the identifying metadata.
 */
export function PhotoCardGrid({
  cards,
  preserveOrder = false,
  emptyMessage = "아직 등록된 포토카드가 없어요.",
}: {
  cards: PhotoCardGridItem[];
  /** Skip the default popularity re-sort — for callers (e.g. the gallery
   * filter page) that already sorted `cards` server-side by price/date. */
  preserveOrder?: boolean;
  emptyMessage?: string;
}) {
  if (cards.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        {emptyMessage}
      </p>
    );
  }

  const sorted = preserveOrder
    ? cards
    : [...cards].sort((a, b) => popularityScore(b) - popularityScore(a));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sorted.map((card) => (
        <CardTiltWrapper
          key={card.slug}
          intensity={8}
          scale={1.04}
          className="group relative block overflow-hidden rounded-xl bg-neutral-100 outline-none ring-blue-500 focus-visible:ring-2 dark:bg-neutral-900"
        >
          <Link
            href={`/photocard/${card.slug}`}
            className="block h-full w-full"
          >
            <CardThumbnail card={card} />
          </Link>
        </CardTiltWrapper>
      ))}
    </div>
  );
}
