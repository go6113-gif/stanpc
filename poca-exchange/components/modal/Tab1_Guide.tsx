"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { FakeDoorModal } from "@/components/fake-door-modal";
import type { PhotocardGuide, RarityGrade } from "@/types/photocard-guide";

const RARITY_STYLES: Record<RarityGrade, string> = {
  COMMON: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  RARE: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  POB: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  ULTRA_RARE: "bg-nomad-red/10 text-nomad-red",
};

function SpecRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={mono ? "filter-term-en text-neutral-800 dark:text-neutral-200" : "font-medium text-neutral-800 dark:text-neutral-200"}>
        {value}
      </dd>
    </div>
  );
}

/** PhotocardDetailModal Tab 1 — spec grid, origin story, rarity/valuation,
 * and the wiki-report CTA. Renders honest empty states for fields with no
 * backing data source yet (see lib/photocard-guide.ts). */
export function Tab1_Guide({ guide }: { guide: PhotocardGuide }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const { spec, originStory, valuation, officialSources, userContributionsCount } = guide;

  return (
    <div className="space-y-6">
      {/* Section A — 기본 스펙 & 실측 규격/추천 슬리브 */}
      <section>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.guide.specTitle")}
        </h3>
        <dl className="mt-1 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SpecRow label={t("cardDetail.guide.group")} value={spec.groupName} />
          {spec.memberName && <SpecRow label={t("cardDetail.guide.member")} value={spec.memberName} />}
          {spec.albumTitle && <SpecRow label={t("cardDetail.guide.album")} value={spec.albumTitle} />}
          <SpecRow
            label={t("cardDetail.guide.releaseDate")}
            value={spec.releaseDate ? formatDate(spec.releaseDate) : t("cardDetail.guide.releaseDateUnknown")}
          />
          {spec.version && <SpecRow label={t("cardDetail.guide.version")} value={spec.version} mono />}
          <SpecRow
            label={t("cardDetail.pob")}
            value={spec.pobSource ?? t("cardDetail.guide.pobUnknown")}
            mono={Boolean(spec.pobSource)}
          />
        </dl>

        <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          <span>📏 {t("cardDetail.guide.dimensions")} {spec.dimensions.width}×{spec.dimensions.height}mm</span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span>{t("cardDetail.sleeveRecommend")}: {spec.recommendedSleeve}</span>
        </div>
      </section>

      {/* Section C — 희소성 등급 & 가치 평가 요약 */}
      <section>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {t("cardDetail.guide.rarityTitle")}
        </h3>
        <span
          className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${RARITY_STYLES[spec.rarityGrade]}`}
        >
          {t(`cardDetail.guide.rarity.${spec.rarityGrade}`)}
        </span>

        <div className="mt-4">
          <h4 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            {t("cardDetail.guide.valuationTitle")}
          </h4>
          {valuation ? (
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              {valuation.summaryKo} · {t(`cardDetail.guide.valuationTrend.${valuation.trend}`)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">{t("cardDetail.guide.valuationEmpty")}</p>
          )}
        </div>
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
