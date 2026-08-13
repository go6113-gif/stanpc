"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hasActiveDrawerFilters,
  parseFilterState,
  serializeFilterState,
  type FilterState,
} from "@/lib/filter-query";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { GalleryFacets } from "@/lib/queries";

interface ActiveFiltersProps {
  facets: Pick<GalleryFacets, "groups" | "albums">;
}

function groupLabel(facets: ActiveFiltersProps["facets"], slug: string): string {
  const group = facets.groups.find((g) => g.slug === slug);
  return group ? group.nameKr ?? group.nameEn : slug;
}

function memberLabel(facets: ActiveFiltersProps["facets"], key: string): string {
  const [groupSlug, memberSlug] = key.split(":");
  const group = facets.groups.find((g) => g.slug === groupSlug);
  const member = group?.members.find((m) => m.slug === memberSlug);
  return member ? member.nameKr ?? member.nameEn : memberSlug;
}

function albumLabel(facets: ActiveFiltersProps["facets"], id: string): string {
  return facets.albums.find((a) => a.id === id)?.title ?? id;
}

/** Grid-top badges for every applied drawer filter, each removable individually. */
export function ActiveFilters({ facets }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilterState(searchParams);

  if (!hasActiveDrawerFilters(filters)) return null;

  const push = (next: FilterState) => {
    const query = serializeFilterState(next);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const removeGroup = (slug: string) => push({ ...filters, groups: filters.groups.filter((g) => g !== slug) });
  const removeMember = (key: string) => push({ ...filters, members: filters.members.filter((m) => m !== key) });
  const removeAlbum = (id: string) => push({ ...filters, albums: filters.albums.filter((a) => a !== id) });
  const removeVersion = (v: string) => push({ ...filters, versions: filters.versions.filter((x) => x !== v) });
  const removePrice = () => push({ ...filters, priceMin: null, priceMax: null });
  const clearAll = () => push({ ...filters, groups: [], members: [], albums: [], versions: [], priceMin: null, priceMax: null });

  const chip = (key: string, label: string, onRemove: () => void) => (
    <span
      key={key}
      className="filter-pill active inline-flex cursor-default items-center gap-1"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={t("filter.active.remove", { label })}
        className="rounded-full p-0.5 hover:bg-white/20"
      >
        <X size={12} />
      </button>
    </span>
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.groups.map((slug) =>
        chip(`group-${slug}`, t("filter.active.group", { value: groupLabel(facets, slug) }), () => removeGroup(slug))
      )}
      {filters.members.map((key) =>
        chip(`member-${key}`, t("filter.active.member", { value: memberLabel(facets, key) }), () => removeMember(key))
      )}
      {filters.albums.map((id) =>
        chip(`album-${id}`, t("filter.active.album", { value: albumLabel(facets, id) }), () => removeAlbum(id))
      )}
      {filters.versions.map((v) =>
        chip(`version-${v}`, t("filter.active.version", { value: v }), () => removeVersion(v))
      )}
      {(filters.priceMin != null || filters.priceMax != null) &&
        chip(
          "price",
          t("filter.active.price", {
            min: filters.priceMin != null ? formatCurrency(filters.priceMin) : "$0",
            max: filters.priceMax != null ? formatCurrency(filters.priceMax) : "∞",
          }),
          removePrice
        )}

      <button
        onClick={clearAll}
        className="text-xs font-medium text-neutral-500 underline hover:text-nomad-red"
      >
        {t("filter.active.clearAll")}
      </button>
    </div>
  );
}
