"use client";

import { ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatMultiCurrency, formatDate } from "@/lib/format";
import { PriceTrendChart } from "@/components/price-trend-chart";
import { OutboundLink } from "@/components/outbound-link";
import { EbayLiveListings } from "@/components/ebay-live-listings";
import { GlobalPriceComparison } from "@/components/modal/GlobalPriceComparison";
import type { PhotocardPrice } from "@/types/photocard-price";

const MARKET_META: Record<string, { flag: string; label: string }> = {
  ebay: { flag: "🇺🇸", label: "eBay" },
  mercari: { flag: "🇯🇵", label: "Mercari" },
  buyee: { flag: "🇯🇵", label: "Buyee" },
  bunjang: { flag: "🇰🇷", label: "번개장터" },
  wts: { flag: "🌐", label: "WTS Community" },
};

interface Tab2_PriceProps {
  price: PhotocardPrice;
  cardId: string;
  cardSlug: string;
  searchQuery: string;
}

/** PhotocardDetailModal Tab 2 — global market summary + 30-day trend (from
 * stored PriceHistory, honest empty state when there isn't any — see
 * lib/photocard-price.ts), live eBay listings (always attempts a real
 * search regardless of stored data), and direct outbound search links. */
export function Tab2_Price({ price, cardId, cardSlug, searchQuery }: Tab2_PriceProps) {
  const encodedQuery = encodeURIComponent(searchQuery);

  return (
    <div className="space-y-6">
      {/* 신규: 글로벌 3개국 실시간 시세 비교 컴포넌트 (고도화된 UI) */}
      <GlobalPriceComparison cardName="Photocard" />

      {/* Section B — 최근 30일 시세 변동 */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.price.trendTitle")}
        </h3>
        {price.trend.length > 0 ? (
          <PriceTrendChart data={price.trend} />
        ) : (
          <p className="text-sm text-neutral-400">{t("cardDetail.price.trendEmpty")}</p>
        )}
      </section>

      {/* Section C — eBay 실시간 매물 (라이브 API, 저장된 데이터 유무와 무관하게 항상 시도) */}
      <EbayLiveListings cardId={cardId} cardSlug={cardSlug} />

      {/* Section D — 외부 사이트 직링크 */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.price.outboundTitle")}
        </h3>
        <div className="flex gap-2">
          <OutboundLink
            href={`https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}`}
            cardId={cardId}
            market="ebay"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-nomad-red px-3 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            {t("cardDetail.price.viewOnEbay")} <ExternalLink size={14} />
          </OutboundLink>
          <OutboundLink
            href={`https://buyee.jp/item/search/query/${encodedQuery}`}
            cardId={cardId}
            market="buyee"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-bold text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
          >
            {t("cardDetail.price.viewOnBuyee")} <ExternalLink size={14} />
          </OutboundLink>
        </div>
      </section>
    </div>
  );
}
