import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCardDetail, getUserCardStatus } from "@/lib/queries-card-detail";
import { CardTabs } from "@/components/card-detail/card-tabs";
import { CardWantButton } from "@/components/card-detail/card-want-button";
import { formatMultiCurrency } from "@/lib/format";

interface CardDetailPageProps {
  params: Promise<{ cardSlug: string }>;
}

export async function generateMetadata({
  params,
}: CardDetailPageProps) {
  const { cardSlug } = await params;
  const card = await getCardDetail(cardSlug);

  if (!card) {
    return { title: "포토카드 찾을 수 없음" };
  }

  return {
    title: `${card.cardName || "포토카드"} - ${card.group.nameKr || card.group.nameEn}`,
    description: `${card.member?.nameKr || card.member?.nameEn || ""} 포토카드. 원하는 수: ${card.wantCount}, 소유한 수: ${card.haveCount}`,
  };
}

export default async function CardDetailPage({
  params,
}: CardDetailPageProps) {
  const { cardSlug } = await params;
  const session = await auth();

  const card = await getCardDetail(cardSlug);
  if (!card) {
    notFound();
  }

  let isWanted = false;
  if (session?.user?.id) {
    const userCard = await getUserCardStatus(session.user.id, card.id);
    isWanted = userCard?.status === "ISO";
  }

  return (
    <main className="w-full min-h-screen bg-neutral-950 text-neutral-100 px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{card.cardName || "포토카드"}</h1>
        <p className="text-neutral-400 mt-2">
          {card.group.nameKr || card.group.nameEn}
          {card.member && ` · ${card.member.nameKr || card.member.nameEn}`}
        </p>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Image Section - Full width on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          <div className="aspect-[2.5/3.5] bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
            {card.thumbImagePath || card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(card.thumbImagePath || card.imageUrl) as string}
                alt={card.cardName || "포토카드"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span className="text-neutral-500">이미지 없음</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section - 2/3 on desktop */}
        <div className="lg:col-span-2">
          {/* Stats Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
              {card.badge && (
                <span className="inline-block px-3 py-1 bg-[#FF4742] text-white text-xs font-bold rounded-full">
                  {card.badge}
                </span>
              )}

              {card.estimatedPrice && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">추정가</p>
                  <p className="text-3xl font-bold text-white">
                    {formatMultiCurrency(card.estimatedPrice)}
                  </p>
                </div>
              )}

              {card.version && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">버전</p>
                  <p className="text-base font-semibold text-white">
                    {card.version}
                  </p>
                </div>
              )}
            </div>

            {/* Want Button - Top Right */}
            <CardWantButton cardId={card.id} isInitiallyWanted={isWanted} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800 mb-8">
            <div>
              <p className="text-xs text-neutral-500 mb-2">원하는 수</p>
              <p className="text-2xl font-bold text-white">♡ {card.wantCount}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-2">소유한 수</p>
              <p className="text-2xl font-bold text-white">◆ {card.haveCount}</p>
            </div>
            {card.viewCount > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">조회수</p>
                <p className="text-lg font-semibold text-white">
                  {card.viewCount.toLocaleString()}
                </p>
              </div>
            )}
            {card.clickCount > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">클릭</p>
                <p className="text-lg font-semibold text-white">
                  {card.clickCount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Album Info */}
          {card.album && (
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <p className="text-sm text-neutral-500 mb-2">앨범</p>
              <p className="text-base font-semibold text-white">
                {card.album.title}
              </p>
              {card.album.releaseDate && (
                <p className="text-xs text-neutral-400 mt-1">
                  {new Date(card.album.releaseDate).toLocaleDateString("ko-KR")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t border-neutral-800 pt-8">
        <CardTabs
          cardData={{
            cardName: card.cardName,
            version: card.version,
            estimatedPrice: card.estimatedPrice,
            wantCount: card.wantCount,
            haveCount: card.haveCount,
          }}
        />
      </div>

      {/* SKU Mappings (Multi-market) */}
      {card.skuMappings.length > 0 && (
        <div className="border-t border-neutral-800 mt-12 pt-8">
          <h2 className="text-xl font-bold mb-6">시장별 가격</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {card.skuMappings.map((sku) => (
              <a
                key={sku.id}
                href={sku.skuUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <p className="text-sm text-neutral-500 mb-2 capitalize">
                  {sku.market}
                </p>
                <p className="font-semibold text-white break-all text-sm">
                  {sku.sku}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
