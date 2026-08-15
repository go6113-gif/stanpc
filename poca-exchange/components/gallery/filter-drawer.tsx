"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { GalleryFacets } from "@/lib/queries";
import type { FilterState } from "@/lib/filter-query";
import { serializeFilterState, parseFilterState, toURLSearchParams, memberKey } from "@/lib/filter-query";
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  facets: GalleryFacets;
}

export function FilterDrawer({ open, onClose, facets }: FilterDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  const currentState = parseFilterState(toURLSearchParams(Object.fromEntries(searchParams)));
  const [localState, setLocalState] = useState<FilterState>(currentState);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["group"]));

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    setExpandedSections(next);
  };

  const handleGroupToggle = (slug: string) => {
    const next = localState.groups.includes(slug)
      ? localState.groups.filter((g) => g !== slug)
      : [...localState.groups, slug];
    setLocalState({ ...localState, groups: next, members: [] });
  };

  const handleMemberToggle = (groupSlug: string, memberSlug: string) => {
    const key = memberKey(groupSlug, memberSlug);
    const next = localState.members.includes(key)
      ? localState.members.filter((m) => m !== key)
      : [...localState.members, key];
    setLocalState({ ...localState, members: next });
  };

  const handleAlbumToggle = (id: string) => {
    const next = localState.albums.includes(id)
      ? localState.albums.filter((a) => a !== id)
      : [...localState.albums, id];
    setLocalState({ ...localState, albums: next });
  };

  const handleVersionToggle = (version: string) => {
    const next = localState.versions.includes(version)
      ? localState.versions.filter((v) => v !== version)
      : [...localState.versions, version];
    setLocalState({ ...localState, versions: next });
  };

  const handleApplyFilters = () => {
    const qs = serializeFilterState(localState);
    router.push(`/gallery${qs ? `?${qs}` : ""}`, { scroll: false });
    onClose();
  };

  const handleReset = () => {
    setLocalState({
      quick: "all",
      groups: [],
      members: [],
      albums: [],
      versions: [],
      priceMin: null,
      priceMax: null,
      sort: "popular",
    });
  };

  if (!facets) {
    return null;
  }

  const selectedGroupSlugs = new Set(localState.groups);
  const visibleMembers = facets.groups
    .filter((g: any) => selectedGroupSlugs.has(g.slug))
    .flatMap((g: any) => g.members.map((m: any) => ({ ...m, groupSlug: g.slug })));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0F0F12] sm:bottom-auto sm:right-auto sm:top-0 sm:max-h-screen sm:min-w-[360px] sm:rounded-none sm:border-l sm:border-t-0"
            initial={{ y: "100%", x: 0 }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#0F0F12]/95 backdrop-blur px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-white">
                {t("filter.drawer.title")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-4 sm:p-6">
              {/* Group & Member Section */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("group")}
                  className="flex w-full items-center justify-between text-sm font-bold text-white hover:text-[#FF2A55] transition-colors"
                >
                  {t("filter.drawer.sectionGroupMember")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedSections.has("group") ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedSections.has("group") && (
                  <div className="mt-3 space-y-2">
                    {facets.groups.map((group: any) => (
                      <div key={group.slug}>
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF2A55] transition-colors">
                          <input
                            type="checkbox"
                            checked={localState.groups.includes(group.slug)}
                            onChange={() => handleGroupToggle(group.slug)}
                            className="h-4 w-4 rounded border-white/20 accent-[#FF2A55]"
                          />
                          {group.nameKr || group.nameEn}
                        </label>
                        {selectedGroupSlugs.has(group.slug) && group.members.length > 0 && (
                          <div className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-3">
                            {group.members.map((member: any) => (
                              <label
                                key={member.slug}
                                className="flex items-center gap-2 text-xs text-white/70 cursor-pointer hover:text-white transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={localState.members.includes(
                                    memberKey(group.slug, member.slug)
                                  )}
                                  onChange={() =>
                                    handleMemberToggle(group.slug, member.slug)
                                  }
                                  className="h-3 w-3 rounded border-white/20 accent-[#FF2A55]"
                                />
                                {member.nameKr || member.nameEn}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Album & Version Section */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("album")}
                  className="flex w-full items-center justify-between text-sm font-bold text-white hover:text-[#FF2A55] transition-colors"
                >
                  {t("filter.drawer.sectionAlbumVersion")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedSections.has("album") ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedSections.has("album") && (
                  <div className="mt-3 space-y-3">
                    {facets.albums.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-white/50 font-semibold">
                          앨범
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {facets.albums.map((album: any) => (
                            <label
                              key={album.id}
                              className="flex items-center gap-2 text-xs text-white cursor-pointer hover:text-[#FF2A55] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={localState.albums.includes(album.id)}
                                onChange={() => handleAlbumToggle(album.id)}
                                className="h-3 w-3 rounded border-white/20 accent-[#FF2A55]"
                              />
                              {album.title}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {facets.versions.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-white/50 font-semibold">
                          버전/특전
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {facets.versions.map((version: string) => (
                            <label
                              key={version}
                              className="flex items-center gap-2 text-xs text-white cursor-pointer hover:text-[#FF2A55] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={localState.versions.includes(version)}
                                onChange={() => handleVersionToggle(version)}
                                className="h-3 w-3 rounded border-white/20 accent-[#FF2A55]"
                              />
                              {version}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("price")}
                  className="flex w-full items-center justify-between text-sm font-bold text-white hover:text-[#FF2A55] transition-colors"
                >
                  {t("filter.drawer.sectionPrice")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedSections.has("price") ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedSections.has("price") && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={t("filter.drawer.priceMin")}
                        value={localState.priceMin ?? ""}
                        onChange={(e) =>
                          setLocalState({
                            ...localState,
                            priceMin: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF2A55] focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder={t("filter.drawer.priceMax")}
                        value={localState.priceMax ?? ""}
                        onChange={(e) =>
                          setLocalState({
                            ...localState,
                            priceMax: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF2A55] focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      {t("filter.drawer.priceUnit")} 기준
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 border-t border-white/5 bg-[#0F0F12]/95 backdrop-blur px-4 py-3 sm:px-6 space-y-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full rounded-lg bg-[#FF2A55] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                {t("filter.drawer.apply")}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                {t("filter.drawer.reset")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
