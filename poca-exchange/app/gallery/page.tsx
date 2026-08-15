import { auth } from "@/auth";
import { StickyFilterBar } from "@/components/gallery/sticky-filter-bar";
import { GalleryWithModal } from "@/components/gallery/gallery-with-modal";
import { getFilteredPhotoCards, getGalleryFacets } from "@/lib/queries";
import { parseFilterState, toURLSearchParams } from "@/lib/filter-query";
import { t } from "@/lib/i18n";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const rawParams = await searchParams;
  const filters = parseFilterState(toURLSearchParams(rawParams));
  const searchQuery = rawParams.q ? (Array.isArray(rawParams.q) ? rawParams.q[0] : rawParams.q) : null;

  const [session, facets] = await Promise.all([auth(), getGalleryFacets()]);

  let cards = await getFilteredPhotoCards(filters, session?.user?.id);

  // Apply search query filter if provided
  if (searchQuery && searchQuery.trim()) {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    cards = cards.filter((card) => {
      const cardName = card.cardName?.toLowerCase() || "";
      const memberName = card.memberName?.toLowerCase() || "";
      const groupName = card.groupName?.toLowerCase() || "";
      const albumTitle = card.albumTitle?.toLowerCase() || "";

      return (
        cardName.includes(normalizedQuery) ||
        memberName.includes(normalizedQuery) ||
        groupName.includes(normalizedQuery) ||
        albumTitle.includes(normalizedQuery)
      );
    });
  }

  return (
    <div className="min-h-screen bg-[#0F0F12]">
      {/* Sticky Filter Bar */}
      <StickyFilterBar filterState={filters} loggedIn={Boolean(session?.user?.id)} facets={facets} />

      {/* Main Grid */}
      <main className="w-full px-4 py-8 md:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            {searchQuery ? `검색 결과: "${searchQuery}"` : "포토카드 탐색"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            총 {cards.length}개의 포토카드
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="flex h-96 items-center justify-center rounded-lg border border-white/5 bg-white/5">
            <p className="text-center text-white/60">
              {searchQuery ? "검색 결과가 없습니다." : t("filter.empty")}
            </p>
          </div>
        ) : (
          <GalleryWithModal cards={cards} />
        )}
      </main>
    </div>
  );
}
