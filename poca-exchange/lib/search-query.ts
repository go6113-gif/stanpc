import type { getCardBySlug } from "@/lib/queries";

type CardWithRelations = NonNullable<Awaited<ReturnType<typeof getCardBySlug>>>;

// Shared by the static eBay/Buyee outbound search links and the live eBay
// Browse API search — both need the exact same "[group] [member] [album]
// photocard" query shape.
export function buildPhotocardSearchQuery(card: CardWithRelations) {
  return [
    card.group.nameEn,
    card.member?.nameEn,
    card.album?.title ?? card.cardName,
    "photocard",
  ]
    .filter(Boolean)
    .join(" ");
}
