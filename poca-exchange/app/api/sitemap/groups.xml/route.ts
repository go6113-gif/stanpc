import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stanpc.com';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        slug: true,
        members: {
          select: {
            slug: true,
          },
          take: 1000,
        },
      },
      take: 1000,
    });

    const entries: string[] = [];

    // Add group pages
    for (const group of groups) {
      entries.push(`  <url>
    <loc>${SITE_URL}/wiki/${group.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

      // Add member pages
      for (const member of group.members) {
        entries.push(`  <url>
    <loc>${SITE_URL}/wiki/${group.slug}/${member.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    });
  } catch (error) {
    console.error('Error generating groups sitemap:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
