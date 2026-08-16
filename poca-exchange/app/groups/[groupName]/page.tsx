import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getGroupBySlug, getMvpGroupDirectory } from "@/lib/queries";
import { generateGroupMetadata } from "@/lib/seo-generator";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

interface GroupPageProps {
  params: Promise<{
    groupName: string;
  }>;
}

interface PhotoCardItem {
  slug: string;
  cardName: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;
  version: string | null;
  estimatedPrice: number | null;
  wishedCount: number;
  ownedCount: number;
  viewCount: number;
  badge: string | null;
}

interface GroupPageData {
  slug: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  photoCards: PhotoCardItem[];
  cardCount: number;
}

/**
 * Fallback data for development/offline scenarios
 * Prevents 404s when database is unavailable
 */
const FALLBACK_GROUPS = [
  { slug: "seventeen", nameKr: "세븐틴", nameEn: "SEVENTEEN" },
  { slug: "stray-kids", nameKr: "스트레이 키즈", nameEn: "Stray Kids" },
  { slug: "bts", nameKr: "방탄소년단", nameEn: "BTS" },
  { slug: "aespa", nameKr: "에스파", nameEn: "aespa" },
  { slug: "newjeans", nameKr: "뉴진스", nameEn: "NewJeans" },
];

function createFallbackGroupData(slug: string): GroupPageData {
  const group = FALLBACK_GROUPS.find((g) => g.slug === slug) || FALLBACK_GROUPS[0];
  return {
    slug: group.slug,
    nameEn: group.nameEn,
    nameKr: group.nameKr,
    imageUrl: null,
    photoCards: Array.from({ length: 12 }, (_, i) => ({
      slug: `${group.slug}-card-${i + 1}`,
      cardName: `${group.nameKr} 포토카드 ${i + 1}`,
      imageUrl: null,
      thumbImagePath: null,
      version: null,
      estimatedPrice: null,
      wishedCount: 0,
      ownedCount: 0,
      viewCount: 0,
      badge: null,
    })),
    cardCount: 12,
  };
}

/**
 * Fetch group data from database with fallback handling
 * Wraps DB query in try-catch and returns mock data on failure
 */
async function fetchGroupData(groupSlug: string): Promise<GroupPageData | null> {
  // Validate against MVP scope
  if (!MVP_GROUP_SLUGS.includes(groupSlug as (typeof MVP_GROUP_SLUGS)[number])) {
    return null;
  }

  try {
    const group = await getGroupBySlug(groupSlug);

    if (!group) {
      return null;
    }

    return {
      slug: group.slug,
      nameEn: group.nameEn,
      nameKr: group.nameKr,
      imageUrl: group.imageUrl,
      photoCards: group.photoCards.map((card) => ({
        slug: card.slug,
        cardName: card.cardName,
        imageUrl: card.imageUrl,
        thumbImagePath: card.thumbImagePath,
        version: card.version,
        estimatedPrice: card.estimatedPrice,
        wishedCount: card.wishedCount,
        ownedCount: card.ownedCount,
        viewCount: card.viewCount,
        badge: card.badge,
      })),
      cardCount: group.photoCards.length,
    };
  } catch (error) {
    // Log error for monitoring
    console.warn(
      `Failed to fetch group data for "${groupSlug}":`,
      error instanceof Error ? error.message : error
    );

    // Return null to trigger 404, or fallback data in development
    if (process.env.NODE_ENV === "development") {
      console.info(`ℹ️  Using fallback data for group "${groupSlug}"`);
      return createFallbackGroupData(groupSlug);
    }

    return null;
  }
}

/**
 * Dynamic metadata generation for group pages
 * Creates SEO-optimized title, description, OG tags based on group name
 */
export async function generateMetadata(
  props: GroupPageProps
): Promise<Metadata> {
  const params = await props.params;
  const normalizedGroupName = params.groupName.toLowerCase();

  const groupData = await fetchGroupData(normalizedGroupName);

  if (!groupData) {
    return {
      title: "그룹을 찾을 수 없습니다",
    };
  }

  const metadata = generateGroupMetadata(
    groupData.nameEn || groupData.nameKr || normalizedGroupName,
    groupData.cardCount
  );

  return {
    title: metadata.title,
    description: metadata.description,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    alternates: {
      canonical: `https://www.stanpc.com/groups/${normalizedGroupName}`,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `https://www.stanpc.com/groups/${normalizedGroupName}`,
      type: "website",
      locale: "en_US",
      images: groupData.imageUrl
        ? [
            {
              url: groupData.imageUrl,
              alt: `${groupData.nameKr || groupData.nameEn} Photocards`,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: groupData.imageUrl ? [groupData.imageUrl] : [],
      creator: "@stanpc_io",
      site: "@stanpc_io",
    },
  };
}

/**
 * Generate static params for all MVP groups (ISR optimization)
 * Pre-renders group pages at build time
 */
export async function generateStaticParams() {
  try {
    const groups = await getMvpGroupDirectory();
    return groups.map((group) => ({
      groupName: group.slug,
    }));
  } catch (error) {
    console.warn("Failed to generate static params for groups:", error);
    // Fallback to MVP_GROUP_SLUGS if query fails
    return MVP_GROUP_SLUGS.map((slug) => ({
      groupName: slug,
    }));
  }
}

interface PhotoCardProps {
  card: PhotoCardItem;
  groupSlug: string;
}

/**
 * Photo card grid cell component
 * Displays individual card with image, price, and stats
 */
function PhotoCardCell({ card, groupSlug }: PhotoCardProps) {
  const hasImage = card.imageUrl || card.thumbImagePath;

  return (
    <Link
      href={`/card/${card.slug}`}
      className="group relative block aspect-[56/87] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 transition-all hover:border-neutral-500 hover:shadow-lg"
    >
      {hasImage ? (
        <Image
          src={card.imageUrl || card.thumbImagePath!}
          alt={card.cardName || `${groupSlug} photocard`}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
          <span className="text-xs text-neutral-500">No image</span>
        </div>
      )}

      {/* Price overlay */}
      {card.estimatedPrice && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <p className="text-xs font-bold text-white">${card.estimatedPrice.toFixed(2)}</p>
        </div>
      )}

      {/* Badge */}
      {card.badge && (
        <div className="absolute top-2 left-2">
          <span className="inline-block bg-nomad-red px-2 py-1 text-xs font-bold text-white rounded">
            {card.badge}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="absolute top-2 right-2 flex gap-1">
        {card.wishedCount > 0 && (
          <span className="inline-flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded text-xs font-semibold text-white backdrop-blur-sm">
            ♡ {card.wishedCount}
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * Main group page component
 * Displays group information and photocard grid
 */
export default async function GroupPage(props: GroupPageProps) {
  const params = await props.params;
  const normalizedGroupName = params.groupName.toLowerCase();

  const groupData = await fetchGroupData(normalizedGroupName);

  if (!groupData) {
    notFound();
  }

  const displayName = groupData.nameKr || groupData.nameEn;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Hero Header */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64 md:h-80">
        {groupData.imageUrl ? (
          <Image
            src={groupData.imageUrl}
            alt={displayName}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{displayName}</h1>
          {groupData.nameKr && groupData.nameEn && groupData.nameKr !== groupData.nameEn && (
            <p className="mt-1 text-lg font-medium text-white/70">{groupData.nameEn}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase">Total Cards</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{groupData.cardCount}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase">Latest Update</p>
            <p className="mt-2 text-sm font-semibold text-neutral-300">Real-time</p>
          </div>
          <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:col-span-1">
            <p className="text-xs font-bold text-neutral-400 uppercase">View All</p>
            <Link
              href={`/wiki/${normalizedGroupName}`}
              className="mt-2 inline-block text-sm font-bold text-nomad-red hover:underline"
            >
              Group Wiki →
            </Link>
          </div>
        </div>

        {/* Photo Cards Grid */}
        <section>
          <h2 className="mb-6 text-2xl font-extrabold">Photocards</h2>

          {groupData.photoCards.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-700 p-12 text-center">
              <p className="text-neutral-400">No photocards available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {groupData.photoCards.map((card) => (
                <PhotoCardCell
                  key={card.slug}
                  card={card}
                  groupSlug={normalizedGroupName}
                />
              ))}
            </div>
          )}
        </section>

        {/* Breadcrumb Navigation */}
        <nav className="mt-12 border-t border-neutral-800 pt-8">
          <ul className="flex gap-2 text-sm text-neutral-400">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-white font-semibold">{displayName}</li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
