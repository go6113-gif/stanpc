import { prisma } from "@/lib/prisma";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";
import type { Prisma } from "@/app/generated/prisma/client";
import type { FilterState } from "@/lib/filter-query";

export function getGroupBySlug(slug: string) {
  if (!MVP_GROUP_SLUGS.includes(slug as (typeof MVP_GROUP_SLUGS)[number])) {
    return null;
  }
  return prisma.group.findUnique({
    where: { slug },
    include: {
      members: { orderBy: { nameEn: "asc" } },
      photoCards: {
        include: { member: true, album: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export function getMemberBySlug(groupSlug: string, memberSlug: string) {
  if (
    !MVP_GROUP_SLUGS.includes(groupSlug as (typeof MVP_GROUP_SLUGS)[number])
  ) {
    return null;
  }
  return prisma.member.findFirst({
    where: { slug: memberSlug, group: { slug: groupSlug } },
    include: {
      group: true,
      photoCards: {
        include: { group: true, album: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export function getCardBySlug(cardSlug: string) {
  return prisma.photoCard.findFirst({
    where: { slug: cardSlug, group: { slug: { in: [...MVP_GROUP_SLUGS] } } },
    include: { group: true, member: true, album: true },
  });
}

// Group directory (used by /[group] listing UIs) — nameEn ordering matches
// MVP_GROUP_SLUGS declaration order rather than DB insertion order, so
// group order is controlled from one place.
export async function getMvpGroupDirectory() {
  const groups = await prisma.group.findMany({
    where: { slug: { in: [...MVP_GROUP_SLUGS] } },
    select: {
      slug: true,
      nameEn: true,
      nameKr: true,
      imageUrl: true,
      _count: { select: { photoCards: true } },
    },
  });
  const order = new Map(MVP_GROUP_SLUGS.map((slug, i) => [slug, i]));
  return groups.sort(
    (a, b) => (order.get(a.slug as never) ?? 0) - (order.get(b.slug as never) ?? 0)
  );
}

// TOP N popularity ranking for the landing page's photocard grid. Ranked by
// the same weighted score as components/photo-card-grid.tsx's
// popularityScore (want*10 + have*5 + view*1) — kept here as a duplicate of
// that formula rather than a shared import, since Prisma can't express a
// weighted sort as an `orderBy` and the candidate set (MVP-scoped cards) is
// small enough to rank in memory.
export async function getTopPhotoCards(limit = 100) {
  const cards = await prisma.photoCard.findMany({
    where: { group: { slug: { in: [...MVP_GROUP_SLUGS] } } },
    include: { group: true, member: true, album: true },
  });

  const ranked = cards
    .map((card) => ({
      card,
      score: card.wantCount * 10 + card.haveCount * 5 + card.viewCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ card }, index) => ({
    rank: index + 1,
    slug: card.slug,
    cardName: card.cardName,
    imageUrl: card.imageUrl,
    thumbImagePath: card.thumbImagePath,
    version: card.version,
    groupSlug: card.group.slug,
    groupName: card.group.nameKr ?? card.group.nameEn,
    memberSlug: card.member?.slug ?? null,
    memberName: card.member ? (card.member.nameKr ?? card.member.nameEn) : null,
    albumTitle: card.album?.title ?? null,
    estimatedPrice: card.estimatedPrice,
    haveCount: card.haveCount,
    wantCount: card.wantCount,
    viewCount: card.viewCount,
    badge: card.badge,
  }));
}

export function getAllGroupSlugs() {
  return prisma.group.findMany({
    where: { slug: { in: [...MVP_GROUP_SLUGS] } },
    select: { slug: true },
  });
}

export function getAllCardSlugs() {
  return prisma.photoCard.findMany({
    where: { group: { slug: { in: [...MVP_GROUP_SLUGS] } } },
    select: { slug: true },
  });
}

// Scoped to members with at least one photo card — a member with none would
// render an empty grid, which is thin content not worth prerendering or
// listing in the sitemap.
export async function getAllMemberSlugs() {
  const members = await prisma.member.findMany({
    where: {
      group: { slug: { in: [...MVP_GROUP_SLUGS] } },
      photoCards: { some: {} },
    },
    select: { slug: true, group: { select: { slug: true } } },
  });
  return members.map((m) => ({ group: m.group.slug, member: m.slug }));
}

// -----------------------------------------------------------------------------
// Gallery filter system (app/gallery/page.tsx)
// -----------------------------------------------------------------------------

// Drawer option lists: groups + their members (for the group/member
// accordion), distinct card versions (stands in for "특전 출처" — the
// schema has no structured platform/source enum, only the freeform
// PhotoCard.version string, so the drawer offers whatever values actually
// exist in the data instead of a hardcoded Weverse/Soundwave/... list that
// would drift from reality), and the price bounds for the range inputs.
export async function getGalleryFacets() {
  const [groups, albums, versionRows, priceBounds] = await Promise.all([
    prisma.group.findMany({
      where: { slug: { in: [...MVP_GROUP_SLUGS] } },
      select: {
        slug: true,
        nameEn: true,
        nameKr: true,
        members: {
          orderBy: { nameEn: "asc" },
          select: { slug: true, nameEn: true, nameKr: true },
        },
      },
    }),
    prisma.album.findMany({
      where: { group: { slug: { in: [...MVP_GROUP_SLUGS] } } },
      select: { id: true, title: true, group: { select: { slug: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.photoCard.findMany({
      where: { group: { slug: { in: [...MVP_GROUP_SLUGS] } }, version: { not: null } },
      distinct: ["version"],
      select: { version: true },
      orderBy: { version: "asc" },
    }),
    prisma.photoCard.aggregate({
      where: { group: { slug: { in: [...MVP_GROUP_SLUGS] } }, estimatedPrice: { not: null } },
      _min: { estimatedPrice: true },
      _max: { estimatedPrice: true },
    }),
  ]);

  const order = new Map(MVP_GROUP_SLUGS.map((slug, i) => [slug, i]));
  const sortedGroups = groups.sort(
    (a, b) => (order.get(a.slug as never) ?? 0) - (order.get(b.slug as never) ?? 0)
  );

  return {
    groups: sortedGroups,
    albums: albums.map((a) => ({ id: a.id, title: a.title, groupSlug: a.group.slug })),
    versions: versionRows.map((r) => r.version as string),
    priceMin: priceBounds._min.estimatedPrice ?? 0,
    priceMax: priceBounds._max.estimatedPrice ?? 0,
  };
}

export type GalleryFacets = Awaited<ReturnType<typeof getGalleryFacets>>;

// Shared by getFilteredPhotoCards and countFilteredPhotoCards so the drawer's
// live "{N}개의 포카 보기" count (see app/api/gallery/count/route.ts) always
// matches the grid the CTA button navigates to.
function buildGalleryWhere(filters: FilterState, userId?: string): Prisma.PhotoCardWhereInput {
  const AND: Prisma.PhotoCardWhereInput[] = [
    { group: { slug: { in: [...MVP_GROUP_SLUGS] } } },
  ];

  if (filters.groups.length > 0) {
    AND.push({ group: { slug: { in: filters.groups } } });
  }

  if (filters.members.length > 0) {
    AND.push({
      OR: filters.members.map((pair) => {
        const [groupSlug, memberSlug] = pair.split(":");
        return { member: { slug: memberSlug, group: { slug: groupSlug } } };
      }),
    });
  }

  if (filters.albums.length > 0) {
    AND.push({ albumId: { in: filters.albums } });
  }

  if (filters.versions.length > 0) {
    AND.push({ version: { in: filters.versions } });
  }

  if (filters.priceMin != null || filters.priceMax != null) {
    AND.push({
      estimatedPrice: {
        gte: filters.priceMin ?? undefined,
        lte: filters.priceMax ?? undefined,
      },
    });
  }

  if (filters.quick === "wishlist") {
    AND.push({ userBinders: { some: { userId, status: "ISO" } } });
  } else if (filters.quick === "owned") {
    AND.push({ userBinders: { some: { userId } } });
  } else if (filters.quick === "trade") {
    AND.push({ userBinders: { some: { status: "FOR_TRADE" } } });
  }

  return { AND };
}

// Server-side filter query backing the gallery grid. `quick: "wishlist"`
// and `"owned"` read the signed-in user's own UserBinderCard rows and
// return no results without a userId (the UI gates these behind the vault
// auth modal before ever reaching this call); `"trade"` browses
// community-wide FOR_TRADE cards and needs no userId.
export async function getFilteredPhotoCards(filters: FilterState, userId?: string) {
  const requiresLogin = filters.quick === "wishlist" || filters.quick === "owned";
  if (requiresLogin && !userId) {
    return [];
  }

  const where = buildGalleryWhere(filters, userId);

  const orderBy: Prisma.PhotoCardOrderByWithRelationInput | Prisma.PhotoCardOrderByWithRelationInput[] =
    filters.quick === "popular" || filters.sort === "popular"
      ? [{ wantCount: "desc" }, { haveCount: "desc" }, { viewCount: "desc" }]
      : filters.sort === "price-asc"
        ? { estimatedPrice: "asc" }
        : filters.sort === "price-desc"
          ? { estimatedPrice: "desc" }
          : { createdAt: "desc" };

  const cards = await prisma.photoCard.findMany({
    where,
    orderBy,
    include: { group: true, member: true, album: true },
  });

  return cards.map((card) => ({
    slug: card.slug,
    cardName: card.cardName,
    imageUrl: card.imageUrl,
    thumbImagePath: card.thumbImagePath,
    groupSlug: card.group.slug,
    groupName: card.group.nameKr ?? card.group.nameEn,
    memberSlug: card.member?.slug ?? null,
    memberName: card.member ? (card.member.nameKr ?? card.member.nameEn) : null,
    albumTitle: card.album?.title ?? null,
    estimatedPrice: card.estimatedPrice,
    haveCount: card.haveCount,
    wantCount: card.wantCount,
    viewCount: card.viewCount,
    badge: card.badge,
  }));
}

// Live count backing the FilterDrawer's "{N}개의 포카 보기" CTA — mirrors
// getFilteredPhotoCards' where-clause exactly (via buildGalleryWhere) but
// avoids fetching full rows just to display a number.
export async function countFilteredPhotoCards(filters: FilterState, userId?: string) {
  const requiresLogin = filters.quick === "wishlist" || filters.quick === "owned";
  if (requiresLogin && !userId) {
    return 0;
  }
  return prisma.photoCard.count({ where: buildGalleryWhere(filters, userId) });
}
