import { Metadata } from "next";
import Link from "next/link";
import { PriceTrendChart } from "@/components/price-trend-chart";
import { siteConfig } from "@/lib/site-config";

// Mock photocard data
const MOCK_PHOTOCARDS: Record<string, any> = {
  "twice-tzuyu-Feel-Special": {
    id: "1",
    slug: "twice-tzuyu-Feel-Special",
    cardName: "TZUYU - Feel Special",
    imageUrl: "https://via.placeholder.com/350x490?text=TZUYU+Feel+Special",
    groupName: "TWICE",
    memberName: "TZUYU",
    albumTitle: "Feel Special",
    version: "Photobook Ver.",
    estimatedPrice: 45.99,
    haveCount: 234,
    wantCount: 1892,
    badge: "Hologram",
  },
  "blackpink-jennie-aptober": {
    id: "2",
    slug: "blackpink-jennie-aptober",
    cardName: "JENNIE - APTOBER",
    imageUrl: "https://via.placeholder.com/350x490?text=JENNIE+APTOBER",
    groupName: "BLACKPINK",
    memberName: "JENNIE",
    albumTitle: "APTOBER",
    version: "Official Album",
    estimatedPrice: 89.5,
    haveCount: 156,
    wantCount: 2341,
    badge: "Signed",
  },
  "exo-sehun-obsession": {
    id: "3",
    slug: "exo-sehun-obsession",
    cardName: "SEHUN - Obsession",
    imageUrl: "https://via.placeholder.com/350x490?text=SEHUN+Obsession",
    groupName: "EXO",
    memberName: "SEHUN",
    albumTitle: "Obsession",
    version: "Standard Ver.",
    estimatedPrice: 35.0,
    haveCount: 89,
    wantCount: 734,
    badge: null,
  },
  "stray-kids-felix-noeasy": {
    id: "4",
    slug: "stray-kids-felix-noeasy",
    cardName: "FELIX - NOEASY",
    imageUrl: "https://via.placeholder.com/350x490?text=FELIX+NOEASY",
    groupName: "Stray Kids",
    memberName: "FELIX",
    albumTitle: "NOEASY",
    version: "Official Album",
    estimatedPrice: 12.99,
    haveCount: 456,
    wantCount: 1245,
    badge: "Rare",
  },
};

// Mock price history data
const MOCK_PRICE_HISTORIES: Record<string, any[]> = {
  "twice-tzuyu-Feel-Special": [
    { date: "2024-01-01", price: 38.99, market: "ebay" },
    { date: "2024-02-01", price: 40.50, market: "ebay" },
    { date: "2024-03-01", price: 42.99, market: "ebay" },
    { date: "2024-04-01", price: 44.99, market: "ebay" },
    { date: "2024-05-01", price: 43.50, market: "ebay" },
    { date: "2024-06-01", price: 45.99, market: "ebay" },
    { date: "2024-07-01", price: 47.99, market: "mercari" },
    { date: "2024-08-11", price: 45.99, market: "buyee" },
  ],
};

// Mock SKU mapping data
const MOCK_SKU_MAPPINGS: Record<string, any[]> = {
  "twice-tzuyu-Feel-Special": [
    {
      market: "ebay",
      marketDisplayName: "eBay",
      sku: "293472946",
      skuUrl: "https://ebay.com/itm/293472946",
      isActive: true,
    },
    {
      market: "mercari",
      marketDisplayName: "Mercari (JP)",
      sku: "m12345678",
      skuUrl: "https://jp.mercari.com/item/m12345678",
      isActive: true,
    },
    {
      market: "buyee",
      marketDisplayName: "Buyee",
      sku: "b98765432",
      skuUrl: "https://buyee.jp/item/b98765432",
      isActive: true,
    },
    {
      market: "bunjang",
      marketDisplayName: "Bungle (번개장터)",
      sku: "bj55555555",
      skuUrl: "https://m.bunjang.co.kr/products/55555555",
      isActive: true,
    },
  ],
};

interface PhotocardPageProps {
  params: Promise<{ id: string }>;
}

async function getPhotocardData(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/photocards/${id}`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log("Using mock data for photocard");
  }

  // Fallback to mock data
  return null;
}

export async function generateMetadata({
  params,
}: PhotocardPageProps): Promise<Metadata> {
  const { id } = await params;
  const photocard = MOCK_PHOTOCARDS[id];

  if (!photocard) {
    return {
      title: "포토카드 - StanPC",
      description: "K-Pop 포토카드 시세 도감",
    };
  }

  const title = `${photocard.memberName} ${photocard.albumTitle} 포토카드 | StanPC`;
  const description = [
    photocard.groupName,
    photocard.memberName,
    photocard.albumTitle,
    photocard.version,
    `추정가: $${photocard.estimatedPrice.toFixed(2)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const imageUrl = photocard.imageUrl || "https://via.placeholder.com/1200x630";

  return {
    title,
    description,
    alternates: { canonical: `/photocard/${id}` },
    openGraph: {
      ...siteConfig.ogDefaults,
      title,
      description,
      url: `/photocard/${id}`,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${photocard.memberName} ${photocard.albumTitle} 포토카드`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PhotocardPage({
  params,
}: PhotocardPageProps) {
  const { id } = await params;
  const photocard = MOCK_PHOTOCARDS[id];
  const priceHistory = MOCK_PRICE_HISTORIES[id] || [];
  const skuMappings = MOCK_SKU_MAPPINGS[id] || [];

  if (!photocard) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-center text-neutral-500">포토카드를 찾을 수 없습니다.</p>
        <div className="mt-4 text-center">
          <Link href="/gallery" className="text-blue-600 hover:underline">
            갤러리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: photocard.cardName,
    image: photocard.imageUrl,
    brand: { "@type": "Brand", name: photocard.groupName },
    category: photocard.memberName,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: photocard.estimatedPrice.toFixed(2),
      availability: "https://schema.org/LimitedAvailability",
      url: `https://${siteConfig.url}/photocard/${id}`,
    },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex gap-2 text-sm text-neutral-500">
          <Link href="/gallery" className="hover:underline">
            갤러리
          </Link>
          <span>/</span>
          <span>{photocard.groupName}</span>
          <span>/</span>
          <span>{photocard.memberName}</span>
        </nav>

        {/* Hero Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Image */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[5/7] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
              <img
                src={photocard.imageUrl}
                alt={photocard.cardName}
                className="h-full w-full object-cover"
              />
            </div>
            {photocard.badge && (
              <div className="inline-flex items-center gap-2">
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                  ✨ {photocard.badge}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-neutral-500">{photocard.groupName}</p>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {photocard.memberName}
              </h1>
              <p className="mt-1 text-lg text-neutral-600 dark:text-neutral-400">
                {photocard.albumTitle}
              </p>
            </div>

            {/* Price Section */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500">추정가</p>
              <p className="mt-1 text-3xl font-bold">
                ${photocard.estimatedPrice.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                💡 여러 판매처의 가격 정보를 기반으로 계산된 추정가입니다.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">보유 중</p>
                <p className="text-xl font-bold">{photocard.haveCount}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">찾는 중</p>
                <p className="text-xl font-bold">{photocard.wantCount}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {photocard.version && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">버전</span>
                  <span className="font-medium">{photocard.version}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Link
                href="/gallery"
                className="flex-1 rounded-lg bg-neutral-100 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                계속 둘러보기
              </Link>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        {priceHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-bold">가격 변동 추이</h2>
            <PriceTrendChart data={priceHistory} currency="USD" />
          </div>
        )}

        {/* Buy Links */}
        {skuMappings.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-bold">구매 가능한 판매처</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {skuMappings.map((mapping) => (
                <a
                  key={`${mapping.market}-${mapping.sku}`}
                  href={mapping.skuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-blue-400 hover:bg-blue-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-blue-950"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {mapping.market.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {mapping.marketDisplayName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        SKU: {mapping.sku}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="font-semibold">정보</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              ✅ 우리의 추정가는 eBay, Mercari, Buyee, 번개장터 등 주요
              판매처의 실시간 가격을 기반으로 계산됩니다.
            </li>
            <li>
              📊 가격은 매주 업데이트되며, 시세 변동 추이를 추적할 수 있습니다.
            </li>
            <li>
              🌍 다양한 국가의 판매처에서 포토카드를 찾고 구매할 수 있습니다.
            </li>
            <li>
              💬 가격 정보 제보는 우측 상단의 "시세 제보" 버튼을 눌러주세요.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
