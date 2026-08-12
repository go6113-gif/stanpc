"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const MOCK_GROUPS = [
  { id: "1", slug: "twice", nameEn: "TWICE", nameKr: "트와이스", photoCardCount: 12 },
  { id: "2", slug: "blackpink", nameEn: "BLACKPINK", nameKr: "블랙핑크", photoCardCount: 8 },
  { id: "3", slug: "exo", nameEn: "EXO", nameKr: "엑소", photoCardCount: 15 },
  { id: "4", slug: "stray-kids", nameEn: "Stray Kids", nameKr: "스트레이 키즈", photoCardCount: 10 },
  { id: "5", slug: "seventeen", nameEn: "SEVENTEEN", nameKr: "세븐틴", photoCardCount: 11 },
  { id: "6", slug: "red-velvet", nameEn: "Red Velvet", nameKr: "레드벨벳", photoCardCount: 9 },
];

const FILTERS = [
  { id: "score", label: "StanPC Score" },
  { id: "cards", label: "Card Count" },
  { id: "trending", label: "Trending" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// Deterministic 0-100 "score" from card count — gamified/presentational only,
// mirrors the Collector Index philosophy (points-based, not a ranking tier).
function stanpcScore(cardCount: number) {
  return Math.min(99, 60 + cardCount * 2);
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("score");

  const groups =
    activeFilter === "cards"
      ? [...MOCK_GROUPS].sort((a, b) => b.photoCardCount - a.photoCardCount)
      : MOCK_GROUPS;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          {siteConfig.description} 원하는 그룹을 선택해서 포토카드를
          둘러보세요.
        </p>
      </header>

      {/* Top Ticker — horizontal scroll of trending groups */}
      <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-2 pb-1">
          {MOCK_GROUPS.map((group) => (
            <Link
              key={group.id}
              href={`/${group.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold whitespace-nowrap dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="text-nomad-red">●</span>
              {group.nameEn}
              <span className="font-normal text-neutral-400">
                {group.photoCardCount}장
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              activeFilter === filter.id
                ? "border-nomad-red bg-nomad-red text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button className="rounded-full border-2 border-neutral-200 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300">
          Filters
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">
          아직 등록된 그룹이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {groups.map((group, index) => (
            <Link
              key={group.id}
              href="/gallery"
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800"
            >
              {/* Placeholder background (no real image data yet) */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-500 transition-transform duration-300 group-hover:scale-105 dark:from-neutral-700 dark:to-neutral-900" />
              {/* Bottom gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Rank number */}
              <span className="absolute top-3 left-3 text-3xl font-extrabold text-white drop-shadow-md">
                {index + 1}
              </span>

              {/* Card count badge */}
              <span className="absolute top-3 right-3 rounded-full border border-white/40 bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {group.photoCardCount} Cards
              </span>

              {/* Bottom content */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-xl leading-tight font-extrabold text-white">
                  {group.nameEn}
                </p>
                {group.nameKr && (
                  <p className="text-xs font-medium text-white/70">
                    {group.nameKr}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-white/90">
                  <span>🔥 {stanpcScore(group.photoCardCount)} Score</span>
                  <span>{group.photoCardCount} pc</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link
          href="/gallery"
          className="inline-block rounded-full bg-nomad-red px-6 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          전체 갤러리 보기
        </Link>
      </div>
    </main>
  );
}
