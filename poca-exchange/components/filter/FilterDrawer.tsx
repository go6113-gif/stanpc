"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import {
  parseFilterState,
  serializeFilterState,
  type FilterState,
} from "@/lib/filter-query";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { GalleryFacets } from "@/lib/queries";

interface FilterDrawerProps {
  onClose: () => void;
  facets: GalleryFacets;
}

type SectionId = "groupMember" | "albumVersion" | "price";

function AccordionSection({
  id,
  title,
  openSections,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  openSections: Set<SectionId>;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const isOpen = openSections.has(id);
  return (
    <div className="border-b border-neutral-200 py-3 dark:border-neutral-800">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="filter-group-label">{title}</span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const percentMin = ((valueMin - min) / (max - min)) * 100;
  const percentMax = ((valueMax - min) / (max - min)) * 100;

  return (
    <div className="px-1">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-nomad-red"
          style={{ left: `${percentMin}%`, right: `${100 - percentMax}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax), valueMax)}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin))}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
        <span>{formatCurrency(valueMin)}</span>
        <span>{formatCurrency(valueMax)}</span>
      </div>
    </div>
  );
}

/**
 * PC: right slide-out panel (380px). Mobile: bottom sheet (80vh).
 * Sections: 그룹/멤버, 앨범/버전 (combined — the schema has no separate
 * "특전 출처" field, only PhotoCard.version, see getGalleryFacets), 가격대.
 */
export function FilterDrawer({ onClose, facets }: FilterDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lazy-initialized from the URL on mount. The parent only mounts this
  // component while the drawer is open (see GalleryFilters), so a fresh
  // mount on every open is exactly the "re-sync from URL" behavior wanted —
  // without a setState-in-effect to get there.
  const [draft, setDraft] = useState<FilterState>(() => parseFilterState(searchParams));
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(["groupMember"]));
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = serializeFilterState(draft);
      fetch(`/api/gallery/count${query ? `?${query}` : ""}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setLiveCount(data.count))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft]);

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const visibleGroups = useMemo(
    () => (draft.groups.length > 0 ? facets.groups.filter((g) => draft.groups.includes(g.slug)) : facets.groups),
    [draft.groups, facets.groups]
  );

  const toggleGroup = (slug: string) => {
    setDraft((d) => {
      const groups = d.groups.includes(slug) ? d.groups.filter((g) => g !== slug) : [...d.groups, slug];
      // Dropping a group also drops that group's member selections — a
      // member filter for a de-selected group would silently AND against
      // an empty set and always return zero results.
      const members = d.members.filter((m) => groups.length === 0 || groups.includes(m.split(":")[0]));
      return { ...d, groups, members };
    });
  };

  const toggleMember = (key: string) => {
    setDraft((d) => ({
      ...d,
      members: d.members.includes(key) ? d.members.filter((m) => m !== key) : [...d.members, key],
    }));
  };

  const toggleAlbum = (id: string) => {
    setDraft((d) => ({
      ...d,
      albums: d.albums.includes(id) ? d.albums.filter((a) => a !== id) : [...d.albums, id],
    }));
  };

  const toggleVersion = (v: string) => {
    setDraft((d) => ({
      ...d,
      versions: d.versions.includes(v) ? d.versions.filter((x) => x !== v) : [...d.versions, v],
    }));
  };

  const hasPriceRange = facets.priceMax > facets.priceMin;

  const handleApply = () => {
    const query = serializeFilterState(draft);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...draft, groups: [], members: [], albums: [], versions: [], priceMin: null, priceMax: null });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end sm:items-stretch">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("filter.drawer.title")}
        className="relative flex w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-neutral-950
                   max-h-[80vh] self-end
                   sm:max-h-none sm:w-[380px] sm:self-stretch sm:rounded-t-none"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-base font-bold">{t("filter.drawer.title")}</h2>
          <button onClick={onClose} aria-label={t("filter.drawer.close")} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <AccordionSection id="groupMember" title={t("filter.drawer.sectionGroupMember")} openSections={openSections} onToggle={toggleSection}>
            <div className="space-y-3">
              <div className="filter-group-items">
                {facets.groups.map((group) => (
                  <button
                    key={group.slug}
                    onClick={() => toggleGroup(group.slug)}
                    className={`filter-pill ${draft.groups.includes(group.slug) ? "active" : ""}`}
                  >
                    {group.nameKr ?? group.nameEn}
                  </button>
                ))}
              </div>

              {visibleGroups.map((group) => (
                <div key={group.slug}>
                  <p className="mb-1.5 text-[11px] font-semibold text-neutral-400">{group.nameKr ?? group.nameEn}</p>
                  <div className="filter-group-items">
                    {group.members.map((member) => {
                      const key = `${group.slug}:${member.slug}`;
                      return (
                        <button
                          key={key}
                          onClick={() => toggleMember(key)}
                          className={`filter-pill ${draft.members.includes(key) ? "active" : ""}`}
                        >
                          {member.nameKr ?? member.nameEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection id="albumVersion" title={t("filter.drawer.sectionAlbumVersion")} openSections={openSections} onToggle={toggleSection}>
            <div className="space-y-3">
              <div className="filter-group-items">
                {facets.albums
                  .filter((a) => draft.groups.length === 0 || draft.groups.includes(a.groupSlug))
                  .map((album) => (
                    <button
                      key={album.id}
                      onClick={() => toggleAlbum(album.id)}
                      className={`filter-pill ${draft.albums.includes(album.id) ? "active" : ""}`}
                    >
                      {album.title}
                    </button>
                  ))}
              </div>
              <div className="filter-group-items">
                {facets.versions.map((version) => (
                  <button
                    key={version}
                    onClick={() => toggleVersion(version)}
                    className={`filter-pill ${draft.versions.includes(version) ? "active" : ""}`}
                  >
                    <span className="filter-term-en">{version}</span>
                  </button>
                ))}
              </div>
            </div>
          </AccordionSection>

          {hasPriceRange && (
            <AccordionSection id="price" title={t("filter.drawer.sectionPrice")} openSections={openSections} onToggle={toggleSection}>
              <PriceRangeSlider
                min={facets.priceMin}
                max={facets.priceMax}
                valueMin={draft.priceMin ?? facets.priceMin}
                valueMax={draft.priceMax ?? facets.priceMax}
                onChange={(min, max) => setDraft((d) => ({ ...d, priceMin: min, priceMax: max }))}
              />
            </AccordionSection>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <button
            onClick={handleReset}
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {t("filter.drawer.reset")}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-lg bg-nomad-red px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-nomad-red-dark)]"
          >
            {t("filter.drawer.apply", { count: liveCount ?? "…" })}
          </button>
        </div>
      </div>
    </div>
  );
}
