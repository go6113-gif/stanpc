import Link from "next/link";
import { CardThumbnail, type CardThumbnailItem } from "@/components/CardThumbnail";

export type PhotoCardGridItem = CardThumbnailItem & {
  haveCount: number;
  viewCount: number;
};

function popularityScore(card: PhotoCardGridItem) {
  return card.wantCount * 10 + card.haveCount * 5 + card.viewCount * 1;
}

/**
 * Mobile-first responsive grid for browsing photo cards, in the dense
 * card-tile style of Nomad List's directory pages: 2-up on phones,
 * scaling up to 6-up on wide desktops, image-led tiles with a
 * hover/tap overlay carrying the identifying metadata.
 */
export function PhotoCardGrid({ cards }: { cards: PhotoCardGridItem[] }) {
  if (cards.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        아직 등록된 포토카드가 없어요.
      </p>
    );
  }

  const sorted = [...cards].sort(
    (a, b) => popularityScore(b) - popularityScore(a)
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sorted.map((card) => (
        <Link
          key={card.slug}
          href={`/photocard/${card.slug}`}
          className="group relative block overflow-hidden rounded-xl bg-neutral-100 outline-none ring-blue-500 focus-visible:ring-2 dark:bg-neutral-900"
        >
          <CardThumbnail card={card} />
        </Link>
      ))}
    </div>
  );
}
