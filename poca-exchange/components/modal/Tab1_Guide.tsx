"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatDate, formatMultiCurrency } from "@/lib/format";
import { FakeDoorModal } from "@/components/fake-door-modal";
import type { PhotocardGuide, RarityGrade } from "@/types/photocard-guide";

const RARITY_STYLES: Record<RarityGrade, string> = {
  COMMON: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  RARE: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  POB: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  ULTRA_RARE: "bg-nomad-red/10 text-nomad-red",
};

function SpecRow({ label, value, mono = false }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-3 text-sm dark:border-neutral-800">
      <dt className="text-neutral-500 font-medium dark:text-neutral-400">{label}</dt>
      <dd className={mono ? "filter-term-en font-semibold text-neutral-900 dark:text-neutral-100" : "font-semibold text-neutral-900 dark:text-neutral-100"}>
        {value}
      </dd>
    </div>
  );
}

/** PhotocardDetailModal Tab 1 — standard spec sheet (Card Code, Album, Type, Sleeve, Price)
 * followed by detailed guide sections (origin story, rarity/valuation, wiki contributions).
 * Renders honest empty states for fields with no backing data source. */
export function Tab1_Guide({ guide, estimatedPrice }: { guide: PhotocardGuide; estimatedPrice?: number | null }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const { spec, originStory, valuation, officialSources, userContributionsCount } = guide;

  return (
    <div className="space-y-6">
      {/* 표준 데이터 시트 — Card Code, Album/Event, Type/Spec, Sleeve Size, Est. Price */}
      <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-white">
          📋 Specifications
        </h3>

        <div className="space-y-0">
          <SpecRow
            label="Card Code"
            value={spec.groupName ? `${spec.groupName.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-001` : "TBA"}
            mono
          />
          <SpecRow
            label="Album / Event"
            value={spec.albumTitle || spec.version || "TBA"}
          />
          <SpecRow
            label="Type / Spec"
            value={spec.pobSource ? `${spec.pobSource} (Special)` : "Standard"}
          />
          <SpecRow
            label="Sleeve Size"
            value={`${spec.dimensions.width} × ${spec.dimensions.height} mm`}
            mono
          />
          <SpecRow
            label="Est. Price"
            value={estimatedPrice ? (
              <span className="text-nomad-red font-bold">{formatMultiCurrency(estimatedPrice)}</span>
            ) : (
              <span className="text-neutral-400">TBA</span>
            )}
          />
        </div>

        {/* Rarity badge in spec sheet */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide dark:text-neutral-400 mb-2">Rarity Grade</p>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${RARITY_STYLES[spec.rarityGrade]}`}>
            {t(`cardDetail.guide.rarity.${spec.rarityGrade}`)}
          </span>
        </div>
      </section>

      {/* Section A — 기본 스펙 상세 정보 */}
      <section>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.guide.specTitle")}
        </h3>
        <dl className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SpecRow label={t("cardDetail.guide.group")} value={spec.groupName} />
          {spec.memberName && <SpecRow label={t("cardDetail.guide.member")} value={spec.memberName} />}
          <SpecRow
            label={t("cardDetail.guide.releaseDate")}
            value={spec.releaseDate ? formatDate(spec.releaseDate) : t("cardDetail.guide.releaseDateUnknown") || "Unknown"}
          />
        </dl>

        <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          <span>📏 Dimensions: {spec.dimensions.width}×{spec.dimensions.height}mm</span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span>{spec.recommendedSleeve}</span>
        </div>
      </section>

      {/* Section C — 희소성 등급 & 가치 평가 요약 */}
      <section>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.guide.valuationTitle")}
        </h3>
        {valuation ? (
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            {valuation.summaryKo} · {t(`cardDetail.guide.valuationTrend.${valuation.trend}`)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-400">{t("cardDetail.guide.valuationEmpty")}</p>
        )}
      </section>

      {/* Section B — Origin Story & 미디어/공식 출처 링크 */}
      <section>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.guide.originStoryTitle")}
        </h3>
        {originStory ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {originStory.summary}
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-400">{t("cardDetail.guide.originStoryEmpty")}</p>
        )}

        {originStory && originStory.mediaLinks.length > 0 && (
          <LinkList titleKey="cardDetail.guide.mediaLinksTitle" links={originStory.mediaLinks} />
        )}
        {officialSources.length > 0 && (
          <LinkList titleKey="cardDetail.guide.officialSourcesTitle" links={officialSources} />
        )}
      </section>

      {/* Section D — 위키 수정 제보 */}
      <section className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
        {userContributionsCount > 0 && (
          <p className="mb-2 text-xs text-neutral-400">
            {t("cardDetail.guide.contributionsCount", { count: userContributionsCount })}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300"
        >
          {t("cardDetail.guide.reportButton")}
        </button>
      </section>

      <FakeDoorModal open={showReportModal} source="wiki_report" onClose={() => setShowReportModal(false)} />
    </div>
  );
}

function LinkList({ titleKey, links }: { titleKey: "cardDetail.guide.mediaLinksTitle" | "cardDetail.guide.officialSourcesTitle"; links: { label: string; url: string }[] }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">{t(titleKey)}</h4>
      <ul className="mt-1 space-y-1">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {link.label} <ExternalLink size={11} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
