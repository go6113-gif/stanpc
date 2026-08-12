"use client";

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

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{siteConfig.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          {siteConfig.description} 원하는 그룹을 선택해서 포토카드를
          둘러보세요.
        </p>
      </header>

      {MOCK_GROUPS.length === 0 ? (
        <p className="text-sm text-neutral-500">
          아직 등록된 그룹이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {MOCK_GROUPS.map((group) => (
            <Link
              key={group.id}
              href="/gallery"
              className="rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800"
            >
              <p className="font-semibold">{group.nameEn}</p>
              {group.nameKr && (
                <p className="text-xs text-neutral-500">{group.nameKr}</p>
              )}
              <p className="mt-2 text-xs text-neutral-400">
                포토카드 {group.photoCardCount}장
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link
          href="/gallery"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          전체 갤러리 보기
        </Link>
      </div>
    </main>
  );
}
