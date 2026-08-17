import { MetadataRoute } from 'next';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma/client.js';

const adapter = new PrismaPg({ 
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL 
});
const prisma = new PrismaClient({ adapter });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stanpc.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all groups
    const groups = await prisma.group.findMany({
      select: { slug: true, updatedAt: true },
    });

    // Fetch all members with their groups
    const members = await prisma.member.findMany({
      select: {
        slug: true,
        group: { select: { slug: true } },
        updatedAt: true,
      },
    });

    // Fetch all albums with their groups
    const albums = await prisma.album.findMany({
      select: {
        slug: true,
        group: { select: { slug: true } },
        updatedAt: true,
      },
    });

    // Fetch all photocards
    const cards = await prisma.photoCard.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 10000, // Limit to prevent timeout
    });

    const sitemapEntries: MetadataRoute.Sitemap = [
      // Static pages
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/wiki`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/gallery`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },

      // Dynamic group pages
      ...groups.map((group) => ({
        url: `${BASE_URL}/wiki/${group.slug}`,
        lastModified: group.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),

      // Dynamic member pages
      ...members.map((member) => ({
        url: `${BASE_URL}/wiki/${member.group.slug}/${member.slug}`,
        lastModified: member.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),

      // Dynamic album pages
      ...albums.map((album) => ({
        url: `${BASE_URL}/wiki/${album.group.slug}/${album.slug}`,
        lastModified: album.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),

      // Dynamic card pages
      ...cards.map((card) => ({
        url: `${BASE_URL}/card/${card.slug}`,
        lastModified: card.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];

    return sitemapEntries;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return minimal sitemap on error
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  } finally {
    await prisma.$disconnect();
  }
}
