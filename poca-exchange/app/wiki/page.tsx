'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

interface SearchResult {
  groups: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameKr: string | null;
    imageUrl: string | null;
    _count: { members: number; photoCards: number };
  }>;
  members: Array<{
    id: string;
    nameEn: string;
    nameKr: string | null;
    imageUrl: string | null;
    group: { slug: string; nameEn: string };
  }>;
  cards: Array<{
    id: string;
    slug: string;
    cardName: string | null;
    version: string | null;
    imageUrl: string | null;
    member: { nameEn: string } | null;
    group: { slug: string; nameEn: string };
  }>;
}

export default function WikiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/wiki/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
            덕후 Wiki
          </h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            포토카드 도감과 멤버별 카드 컬렉션을 탐색하세요
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <input
              type="text"
              placeholder="그룹, 멤버, 카드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {searchQuery && searchResults ? (
          <>
            {/* Search Results */}
            {searchResults.groups.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                  그룹
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/wiki/${group.slug}`}
                      className="group rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {group.imageUrl && (
                        <div className="relative h-32 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                          <Image
                            src={group.imageUrl}
                            alt={group.nameKr || group.nameEn}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">
                          {group.nameKr || group.nameEn}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {group.nameEn}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                          멤버 {group._count.members} · 카드 {group._count.photoCards}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.members.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                  멤버
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.members.map((member) => (
                    <Link
                      key={member.id}
                      href={`/wiki/${member.group.slug}/${member.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {member.imageUrl && (
                        <div className="relative h-32 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                          <Image
                            src={member.imageUrl}
                            alt={member.nameKr || member.nameEn}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">
                          {member.nameKr || member.nameEn}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {member.group.nameEn}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.cards.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                  카드
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {searchResults.cards.map((card) => (
                    <Link
                      key={card.id}
                      href={`/card/${card.slug}`}
                      className="group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-[56/87] bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                        {card.imageUrl && (
                          <Image
                            src={card.imageUrl}
                            alt={card.cardName || 'photocard'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {card.member?.nameEn || card.group.nameEn}
                        </p>
                        {card.version && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {card.version}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.groups.length === 0 &&
              searchResults.members.length === 0 &&
              searchResults.cards.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    검색 결과가 없습니다.
                  </p>
                </div>
              )}
          </>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              그룹, 멤버, 카드를 검색하여 도감을 탐색하세요
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
