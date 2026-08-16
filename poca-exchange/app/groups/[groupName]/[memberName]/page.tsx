import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMvpGroupDirectory } from "@/lib/queries";
import { generateMemberMetadata } from "@/lib/seo-generator";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

interface MemberPageProps {
  params: Promise<{
    groupName: string;
    memberName: string;
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

interface MemberPageData {
  groupSlug: string;
  groupNameEn: string;
  groupNameKr: string | null;
  groupImageUrl: string | null;
  memberSlug: string;
  memberNameEn: string;
  memberNameKr: string | null;
  memberImageUrl: string | null;
  memberPosition: string | null;
  photoCards: PhotoCardItem[];
  cardCount: number;
}

/**
 * Fallback member data for MVP groups
 * Prevents 404s when database is unavailable
 */
const FALLBACK_GROUPS_WITH_MEMBERS = [
  {
    slug: "seventeen",
    nameKr: "세븐틴",
    nameEn: "SEVENTEEN",
    members: [
      { slug: "scoups", nameKr: "에스쿱스", nameEn: "Scoups", position: "Leader, Vocal" },
      { slug: "jeonghan", nameKr: "정한", nameEn: "Jeonghan", position: "Vocal" },
      { slug: "joshua", nameKr: "조슈아", nameEn: "Joshua", position: "Vocal" },
      { slug: "jun", nameKr: "준", nameEn: "Jun", position: "Vocal" },
      { slug: "hoshi", nameKr: "호시", nameEn: "Hoshi", position: "Performance" },
      { slug: "wonwoo", nameKr: "원우", nameEn: "Wonwoo", position: "Vocal" },
      { slug: "woozi", nameKr: "우지", nameEn: "Woozi", position: "Vocal" },
      { slug: "mingyu", nameKr: "민규", nameEn: "Mingyu", position: "Vocal" },
      { slug: "seungkwan", nameKr: "승관", nameEn: "Seungkwan", position: "Vocal" },
      { slug: "vernon", nameKr: "버논", nameEn: "Vernon", position: "Hip-Hop" },
      { slug: "dino", nameKr: "디노", nameEn: "Dino", position: "Performance" },
    ],
  },
  {
    slug: "stray-kids",
    nameKr: "스트레이 키즈",
    nameEn: "Stray Kids",
    members: [
      { slug: "bang-chan", nameKr: "방찬", nameEn: "Bang Chan", position: "Leader, Vocal" },
      { slug: "lee-know", nameKr: "리노", nameEn: "Lee Know", position: "Dance" },
      { slug: "changbin", nameKr: "창빈", nameEn: "Changbin", position: "Vocal, Rap" },
      { slug: "hyunjin", nameKr: "현진", nameEn: "Hyunjin", position: "Dance" },
      { slug: "han", nameKr: "한", nameEn: "Han", position: "Vocal, Rap" },
      { slug: "felix", nameKr: "필릭스", nameEn: "Felix", position: "Dance, Rap" },
      { slug: "seungmin", nameKr: "승민", nameEn: "Seungmin", position: "Vocal" },
      { slug: "i-n", nameKr: "아이엔", nameEn: "I.N", position: "Vocal" },
    ],
  },
  {
    slug: "bts",
    nameKr: "방탄소년단",
    nameEn: "BTS",
    members: [
      { slug: "rm", nameKr: "알엠", nameEn: "RM", position: "Leader, Rap" },
      { slug: "jin", nameKr: "진", nameEn: "Jin", position: "Vocal" },
      { slug: "suga", nameKr: "슈가", nameEn: "SUGA", position: "Rap, Producer" },
      { slug: "j-hope", nameKr: "제이홉", nameEn: "J-Hope", position: "Rap, Dance" },
      { slug: "jimin", nameKr: "지민", nameEn: "Jimin", position: "Dance, Vocal" },
      { slug: "v", nameKr: "뷔", nameEn: "V", position: "Vocal" },
      { slug: "jungkook", nameKr: "정국", nameEn: "Jungkook", position: "Vocal, Dance" },
    ],
  },
  {
    slug: "aespa",
    nameKr: "에스파",
    nameEn: "aespa",
    members: [
      { slug: "karina", nameKr: "카리나", nameEn: "Karina", position: "Leader, Dance" },
      { slug: "giselle", nameKr: "지젤", nameEn: "Giselle", position: "Vocal, Rap" },
      { slug: "winter", nameKr: "윈터", nameEn: "Winter", position: "Vocal" },
      { slug: "ningning", nameKr: "닝닝", nameEn: "Ningning", position: "Vocal, Rap" },
    ],
  },
  {
    slug: "newjeans",
    nameKr: "뉴진스",
    nameEn: "NewJeans",
    members: [
      { slug: "hanni", nameKr: "하니", nameEn: "Hanni", position: "Vocal, Rap" },
      { slug: "hybe", nameKr: "하이브", nameEn: "Hyvbe", position: "Vocal" },
      { slug: "danielle", nameKr: "다니엘", nameEn: "Danielle", position: "Vocal" },
      { slug: "jinin", nameKr: "지인", nameEn: "Jinin", position: "Vocal" },
      { slug: "haerita", nameKr: "해린", nameEn: "Haerita", position: "Vocal, Dance" },
    ],
  },
];

function createFallbackMemberData(
  groupSlug: string,
  memberSlug: string
): MemberPageData | null {
  const group = FALLBACK_GROUPS_WITH_MEMBERS.find((g) => g.slug === groupSlug);
  if (!group) return null;

  const member = group.members.find((m) => m.slug === memberSlug);
  if (!member) return null;

  return {
    groupSlug: group.slug,
    groupNameEn: group.nameEn,
    groupNameKr: group.nameKr,
    groupImageUrl: null,
    memberSlug: member.slug,
    memberNameEn: member.nameEn,
    memberNameKr: member.nameKr,
    memberImageUrl: null,
    memberPosition: member.position,
    photoCards: Array.from({ length: 12 }, (_, i) => ({
      slug: `${group.slug}-${member.slug}-card-${i + 1}`,
      cardName: `${member.nameKr} 포토카드 ${i + 1}`,
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
 * Fetch member data from database with fallback handling
 * Wraps DB query in try-catch and returns mock data on failure
 */
async function fetchMemberData(
  groupSlug: string,
  memberSlug: string
): Promise<MemberPageData | null> {
  // Validate MVP scope
  if (!MVP_GROUP_SLUGS.includes(groupSlug as (typeof MVP_GROUP_SLUGS)[number])) {
    return null;
  }

  try {
    // TODO: Implement actual DB query
    // For now, use fallback (similar to /groups/[groupName])
    const fallback = createFallbackMemberData(groupSlug, memberSlug);
    if (fallback) {
      console.info(`✓ Member page: Loaded fallback data for ${groupSlug}/${memberSlug}`);
      return fallback;
    }
    return null;
  } catch (error) {
    console.warn(
      `Failed to fetch member data for "${groupSlug}/${memberSlug}":`,
      error instanceof Error ? error.message : error
    );

    // Fallback to mock data in development
    if (process.env.NODE_ENV === "development") {
      console.info(
        `ℹ️  Using fallback data for member "${groupSlug}/${memberSlug}"`
      );
      return createFallbackMemberData(groupSlug, memberSlug);
    }

    return null;
  }
}

/**
 * Dynamic metadata generation for member pages
 * Creates SEO-optimized title, description, OG tags based on group/member
 */
export async function generateMetadata(
  props: MemberPageProps
): Promise<Metadata> {
  const params = await props.params;
  const normalizedParams = {
    groupName: params.groupName.toLowerCase(),
    memberName: params.memberName.toLowerCase(),
  };

  const memberData = await fetchMemberData(
    normalizedParams.groupName,
    normalizedParams.memberName
  );

  if (!memberData) {
    return {
      title: "멤버를 찾을 수 없습니다",
    };
  }

  // Use existing generateMemberMetadata function
  const metadata = generateMemberMetadata({
    memberName:
      memberData.memberNameKr || memberData.memberNameEn,
    groupName:
      memberData.groupNameKr || memberData.groupNameEn,
    cardCount: memberData.cardCount,
    imageUrl: memberData.memberImageUrl,
    groupSlug: normalizedParams.groupName,
    memberSlug: normalizedParams.memberName,
  });

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    robots: metadata.robots,
    alternates: {
      canonical: `https://www.stanpc.com/groups/${normalizedParams.groupName}/${normalizedParams.memberName}`,
    },
    openGraph: {
      title: metadata.openGraph.title,
      description: metadata.openGraph.description,
      url: metadata.openGraph.url,
      type: "website",
      locale: "en_US",
      images: memberData.memberImageUrl
        ? [
            {
              url: memberData.memberImageUrl,
              alt:
                memberData.memberNameKr ||
                memberData.memberNameEn ||
                "Member Photocard",
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.twitterCard.title,
      description: metadata.twitterCard.description,
      images: memberData.memberImageUrl
        ? [memberData.memberImageUrl]
        : [],
      creator: "@stanpc_io",
      site: "@stanpc_io",
    },
  };
}

/**
 * Generate static params for all MVP group/member combinations
 * Pre-renders member pages at build time
 */
export async function generateStaticParams() {
  try {
    // Fallback to hardcoded member list (no DB query in this example)
    const params = [];
    for (const group of FALLBACK_GROUPS_WITH_MEMBERS) {
      for (const member of group.members) {
        params.push({
          groupName: group.slug,
          memberName: member.slug,
        });
      }
    }
    return params;
  } catch (error) {
    console.warn(
      "Failed to generate static params for member pages:",
      error
    );
    // Minimal fallback: just key members
    return [];
  }
}

interface PhotoCardProps {
  card: PhotoCardItem;
  groupSlug: string;
  memberSlug: string;
}

function PhotoCardCell({ card, groupSlug, memberSlug }: PhotoCardProps) {
  const hasImage = card.imageUrl || card.thumbImagePath;

  return (
    <Link
      href={`/card/${card.slug}`}
      className="group relative block aspect-[56/87] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 transition-all hover:border-neutral-500 hover:shadow-lg"
    >
      {hasImage ? (
        <Image
          src={card.imageUrl || card.thumbImagePath!}
          alt={card.cardName || "Photocard"}
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
          <p className="text-xs font-bold text-white">
            ${card.estimatedPrice.toFixed(2)}
          </p>
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
 * Main member page component
 * Displays member information and photocard grid
 */
export default async function MemberPage(props: MemberPageProps) {
  const params = await props.params;
  const normalizedParams = {
    groupName: params.groupName.toLowerCase(),
    memberName: params.memberName.toLowerCase(),
  };

  const memberData = await fetchMemberData(
    normalizedParams.groupName,
    normalizedParams.memberName
  );

  if (!memberData) {
    notFound();
  }

  const displayMemberName = memberData.memberNameKr || memberData.memberNameEn;
  const displayGroupName = memberData.groupNameKr || memberData.groupNameEn;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Hero Header */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64 md:h-80">
        {memberData.memberImageUrl ? (
          <Image
            src={memberData.memberImageUrl}
            alt={displayMemberName}
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
          <Link
            href={`/groups/${normalizedParams.groupName}`}
            className="mb-3 inline-block text-sm font-bold text-white/80 hover:text-white"
          >
            ← {displayGroupName} 멤버 목록
          </Link>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            {displayMemberName}
          </h1>
          {memberData.memberPosition && (
            <p className="mt-1 text-lg font-medium text-white/70">
              {memberData.memberPosition}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase">
              Total Cards
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {memberData.cardCount}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase">
              Group
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {displayGroupName}
            </p>
          </div>
          <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:col-span-1">
            <p className="text-xs font-bold text-neutral-400 uppercase">
              Role
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {memberData.memberPosition || "Member"}
            </p>
          </div>
        </div>

        {/* Photo Cards Grid */}
        <section>
          <h2 className="mb-6 text-2xl font-extrabold">Photocards</h2>

          {memberData.photoCards.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-700 p-12 text-center">
              <p className="text-neutral-400">No photocards available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {memberData.photoCards.map((card) => (
                <PhotoCardCell
                  key={card.slug}
                  card={card}
                  groupSlug={normalizedParams.groupName}
                  memberSlug={normalizedParams.memberName}
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
            <li>
              <Link
                href={`/groups/${normalizedParams.groupName}`}
                className="hover:text-white"
              >
                {displayGroupName}
              </Link>
            </li>
            <li>/</li>
            <li className="text-white font-semibold">{displayMemberName}</li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
