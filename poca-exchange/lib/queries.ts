import { prisma } from "@/lib/prisma";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

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
