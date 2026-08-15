import Image from "next/image";

export type CardThumbnailItem = {
  slug: string;
  cardName: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;
  groupName: string;
  memberName: string | null;
  albumTitle: string | null;
  estimatedPrice: number | null;
  ownedCount: number;
  wishedCount: number;
  badge: string | null;
  isoNumber?: string | null;
  pobCode?: string | null;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const wantFormatter = new Intl.NumberFormat("en-US");

export function CardThumbnail({ card }: { card: CardThumbnailItem }) {
  const src = card.thumbImagePath ?? card.imageUrl;
  const subtitle = [card.memberName, card.albumTitle]
    .filter(Boolean)
    .join(" · ");
  const priceLabel =
    card.estimatedPrice != null
      ? `Est. ${priceFormatter.format(card.estimatedPrice)}`
      : "TBA";

  return (
    <>
      <div className="relative aspect-[5/7] w-full overflow-hidden">
        {src ? (
          <Image
            src={src}
            alt={card.cardName ?? subtitle ?? card.groupName}
            fill
            className="photocard-image thumbnail absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105"
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No Image
          </div>
        )}

        {card.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
            {card.badge}
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2 pt-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <span className="block rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/90 w-fit">
          {card.groupName}
        </span>
        <p className="mt-1 truncate text-xs font-medium text-white sm:text-sm">
          {subtitle || card.groupName}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-white/80">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/60 uppercase">Price</span>
            <span className="font-semibold text-white">{priceLabel}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/60 uppercase">In Hand</span>
            <span className="font-semibold text-white">{wantFormatter.format(card.ownedCount)}</span>
          </div>
          {card.isoNumber && (
            <div className="flex flex-col gap-0.5">
              <span className="text-white/60 uppercase">ISO</span>
              <span className="font-semibold text-white">{card.isoNumber}</span>
            </div>
          )}
          {card.pobCode && (
            <div className="flex flex-col gap-0.5">
              <span className="text-white/60 uppercase">POB</span>
              <span className="font-semibold text-white">{card.pobCode}</span>
            </div>
          )}
          <div className="col-span-2 flex items-center justify-between text-white/80">
            <span>❤️ {wantFormatter.format(card.wishedCount)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
