import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const groupFilter = { slug: { in: [...MVP_GROUP_SLUGS] } };

  const [groups, members, cards] = await Promise.all([
    prisma.group.findMany({
      where: groupFilter,
      select: { slug: true, updatedAt: true },
    }),
    prisma.member.findMany({
      where: { group: groupFilter, photoCards: { some: {} } },
      select: { slug: true, updatedAt: true, group: { select: { slug: true } } },
    }),
    prisma.photoCard.findMany({
      where: { group: groupFilter },
      select: { slug: true, id: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/gallery`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...groups.map((group) => ({
      url: `${siteConfig.url}/${group.slug}`,
      lastModified: group.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...members.map((member) => ({
      url: `${siteConfig.url}/${member.group.slug}/${member.slug}`,
      lastModified: member.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...cards.map((card) => ({
      url: `${siteConfig.url}/photocard/${card.id}`,
      lastModified: card.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Fallback for old /card/ paths (for SEO compatibility)
    ...cards.map((card) => ({
      url: `${siteConfig.url}/card/${card.slug}`,
      lastModified: card.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  return entries;
}
