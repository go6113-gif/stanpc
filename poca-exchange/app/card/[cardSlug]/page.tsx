import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCardSlugs, getCardBySlug } from "@/lib/queries";
import { HaveWantToggle } from "@/components/have-want-toggle";
import { OutboundLink } from "@/components/outbound-link";
import { PriceReportButton } from "@/components/price-report-modal";
import { EbayLiveListings } from "@/components/ebay-live-listings";
import { siteConfig } from "@/lib/site-config";
import { buildPhotocardSearchQuery } from "@/lib/search-query";

export async function generateStaticParams() {
  const cards = await getAllCardSlugs();
  return cards.map((card) => ({ cardSlug: card.slug }));
}

function pseoTitle(card: NonNullable<Awaited<ReturnType<typeof getCardBySlug>>>) {
  const memberName = card.member?.nameEn ?? card.group.nameEn;
  const albumName = card.album?.title ?? card.cardName ?? "";
  const badgePart = card.badge ? ` [${card.badge}]` : "";
  return `${memberName}${albumName ? ` ${albumName}` : ""}${badgePart} Photocard Price & Buy - StanPC`;
}

export async function generateMetadata(
  props: PageProps<"/card/[cardSlug]">
): Promise<Metadata> {
  const { cardSlug } = await props.params;
  const card = await getCardBySlug(cardSlug);
  if (!card) return {};

  const title = pseoTitle(card);
  const description = [
    card.group.nameEn,
    card.member?.nameEn,
    card.album?.title,
    card.version,
    card.estimatedPrice != null
      ? `Est. $${card.estimatedPrice.toFixed(2)}`
      : "Price: TBA",
  ]
    .filter(Boolean)
    .join(" · ");
  // Community-share preview (Twitter/X, KakaoTalk, DC 등) uses the dynamic
  // OG route instead of the raw source image, so the price/badge/name are
  // baked into the shared thumbnail itself.
  const ogImageUrl = `/api/og/photocard?cardSlug=${encodeURIComponent(card.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: `/card/${card.slug}` },
    openGraph: {
      ...siteConfig.ogDefaults,
      title,
      description,
      url: `/card/${card.slug}`,
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CardPage(props: PageProps<"/card/[cardSlug]">) {
  const { cardSlug } = await props.params;
  const card = await getCardBySlug(cardSlug);
  if (!card) notFound();

  const image = card.imageUrl ?? card.thumbImagePath;
  const searchQuery = encodeURIComponent(buildPhotocardSearchQuery(card));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.cardName ?? `${card.group.nameEn} 포토카드`,
    image: image ? [image] : undefined,
    brand: { "@type": "Brand", name: card.group.nameEn },
    ...(card.member ? { category: card.member.nameEn } : {}),
    ...(card.estimatedPrice != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: card.estimatedPrice.toFixed(2),
            availability: "https://schema.org/LimitedAvailability",
            url: `https://www.stanpc.com/card/${card.slug}`,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 flex flex-wrap gap-x-2 text-sm text-neutral-500">
        <Link href={`/${card.group.slug}`} className="hover:underline">
          {card.group.nameEn}
        </Link>
        {card.member && (
          <>
            <span>/</span>
            <Link
              href={`/${card.group.slug}/${card.member.slug}`}
              className="hover:underline"
            >
              {card.member.nameEn}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="aspect-[5/7] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.cardName ?? `${card.group.nameEn} 포토카드`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
              No Image
            </div>
          )}
        </div>

        <div>
          {card.badge && (
            <span className="mb-2 inline-block rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
              {card.badge}
            </span>
          )}
          <h1 className="text-xl font-bold sm:text-2xl">
            {card.cardName ?? `${card.group.nameEn} 포토카드`}
          </h1>
          <p className="mt-1 text-lg font-semibold text-neutral-700 dark:text-neutral-300">
            {card.estimatedPrice != null
              ? `Est. $${card.estimatedPrice.toFixed(2)}`
              : "Price: TBA"}
          </p>
          <PriceReportButton cardId={card.id} />

          <dl className="mt-4 space-y-2 text-sm">
            <Row label="그룹" value={card.group.nameEn} />
            {card.member && <Row label="멤버" value={card.member.nameEn} />}
            {card.album && <Row label="앨범" value={card.album.title} />}
            {card.version && <Row label="버전" value={card.version} />}
          </dl>

          <div className="mt-5">
            <HaveWantToggle
              cardSlug={card.slug}
              initialHaveCount={card.haveCount}
              initialWantCount={card.wantCount}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <OutboundLink
              href={`https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`}
              cardId={card.id}
              market="ebay"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-center text-sm font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
            >
              View on eBay
            </OutboundLink>
            <OutboundLink
              href={`https://buyee.jp/item/search/query/${searchQuery}`}
              cardId={card.id}
              market="buyee"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-center text-sm font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
            >
              Search on Buyee
            </OutboundLink>
          </div>

          <EbayLiveListings cardId={card.id} cardSlug={card.slug} />
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
