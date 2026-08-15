import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stanpc.com';

export const dynamic = 'force-dynamic';
export const revalidate = 604800; // 7 days

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        slug: true,
        members: {
          select: {
            slug: true,
          },
          take: 100,
        },
        albums: {
          select: {
            slug: true,
          },
          take: 100,
        },
      },
      take: 100,
    });

    const entries: string[] = [];

    // Add album pages for each group/member/album combination
    for (const group of groups) {
      for (const member of group.members) {
        for (const album of group.albums) {
          entries.push(`  <url>
    <loc>${SITE_URL}/wiki/${group.slug}/${member.slug}/${album.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
      },
    });
  } catch (error) {
    console.error('Error generating albums sitemap:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
