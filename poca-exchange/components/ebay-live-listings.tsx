"use client";

import { useEffect, useState } from "react";
import { OutboundLink } from "@/components/outbound-link";
import type { EbayListing } from "@/lib/ebay";

export function EbayLiveListings({
  cardId,
  cardSlug,
}: {
  cardId: string;
  cardSlug: string;
}) {
  const [listings, setListings] = useState<EbayListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ebay/search?cardSlug=${encodeURIComponent(cardSlug)}`)
      .then((res) => (res.ok ? res.json() : { listings: [] }))
      .then((data: { listings: EbayListing[] }) => {
        if (!cancelled) setListings(data.listings);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [cardSlug]);

  if (listings === null) {
    return (
      <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          eBay 실시간 매물
        </h2>
        <p className="mt-2 text-sm text-neutral-400">불러오는 중...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          eBay 실시간 매물
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          관련 실시간 매물을 찾지 못했어요.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        eBay 실시간 매물
      </h2>
      <ul className="mt-2 space-y-2">
        {listings.map((listing) => (
          <li key={listing.id}>
            <OutboundLink
              href={listing.itemWebUrl}
              cardId={cardId}
              market="ebay"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 hover:border-neutral-400 dark:border-neutral-700"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-800 dark:text-neutral-200">
                  {listing.title}
                </p>
                {listing.price && (
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    ${listing.price.value} {listing.price.currency}
                  </p>
                )}
              </div>
            </OutboundLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
