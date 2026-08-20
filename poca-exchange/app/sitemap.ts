import { MetadataRoute } from "next";
import { getMvpGroupDirectory, getAllMemberSlugs, getAllAlbumSlugs, getAllCardSlugs } from "@/lib/queries";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

/**
 * Dynamic XML Sitemap Generator
 *
 * Generates a sitemap.xml that includes:
 * - Fixed pages (/, /auth/login, etc.)
 * - Dynamic group pages (/groups/aespa, /groups/newjeans, etc.)
 * - Fallback to MVP_GROUP_SLUGS if database query fails
 *
 * Served at: https://stanpc.com/sitemap.xml
 * Updated on each build (static) or request (ISR)
 *
 * Next.js automatically:
 * - Sorts by lastModified
 * - Validates change frequency and priority
 * - Handles URL encoding
 * - Sets Content-Type: application/xml
 */

const SITE_URL = "https://www.stanpc.com";

/**
 * Fixed static pages that should always appear in sitemap
 */
const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/auth/login`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/vault`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
];

/**
 * Fallback member data for sitemap generation
 * Used when database is unavailable
 */
const FALLBACK_MVP_MEMBERS = [
  {
    groupSlug: "seventeen",
    members: ["scoups", "jeonghan", "joshua", "jun", "hoshi"],
  },
  {
    groupSlug: "stray-kids",
    members: ["bang-chan", "lee-know", "changbin", "hyunjin", "han"],
  },
  {
    groupSlug: "bts",
    members: ["rm", "jin", "suga", "j-hope", "jimin"],
  },
  {
    groupSlug: "aespa",
    members: ["karina", "giselle", "winter", "ningning"],
  },
  {
    groupSlug: "newjeans",
    members: ["hanni", "hybe", "danielle", "jinin", "haerita"],
  },
];

/**
 * Generate dynamic sitemap entries for MVP groups
 * Attempts to fetch from database, falls back to MVP_GROUP_SLUGS on error
 */
async function generateGroupSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    // Attempt to fetch all MVP groups from database
    const groups = await getMvpGroupDirectory();

    console.info(`✓ Sitemap: Loaded ${groups.length} groups from database`);

    // Generate sitemap entry for each group
    return groups.map((group) => ({
      url: `${SITE_URL}/groups/${group.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch (error) {
    // Log error for monitoring
    console.warn(
      "Failed to fetch groups for sitemap:",
      error instanceof Error ? error.message : error
    );

    // Fallback to MVP_GROUP_SLUGS when database is unavailable
    console.info(`⚠️  Using fallback MVP_GROUP_SLUGS (${MVP_GROUP_SLUGS.length} groups)`);

    return MVP_GROUP_SLUGS.map((slug) => ({
      url: `${SITE_URL}/groups/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  }
}

/**
 * Generate dynamic sitemap entries for MVP group members
 * Queries database for all members with photoCards
 */
async function generateMemberSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const members = await getAllMemberSlugs();
    console.info(`✓ Sitemap: Loaded ${members.length} members from database`);

    return members.map((m) => ({
      url: `${SITE_URL}/wiki/${m.group}/${m.member}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));
  } catch (error) {
    // Log error for monitoring
    console.warn(
      "Failed to fetch members for sitemap:",
      error instanceof Error ? error.message : error
    );

    // Fallback to hardcoded MVP member list
    console.info(`⚠️  Using fallback MVP_MEMBERS list`);

    const entries: MetadataRoute.Sitemap = [];
    for (const groupMember of FALLBACK_MVP_MEMBERS) {
      for (const memberSlug of groupMember.members) {
        entries.push({
          url: `${SITE_URL}/wiki/${groupMember.groupSlug}/${memberSlug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.85,
        });
      }
    }
    return entries;
  }
}

/**
 * Generate dynamic sitemap entries for MVP group albums
 * Queries database for all albums with photoCards
 */
async function generateAlbumSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const albums = await getAllAlbumSlugs();
    console.info(`✓ Sitemap: Loaded ${albums.length} albums from database`);

    return albums.map((a) => ({
      url: `${SITE_URL}/wiki/${a.group}/${a.album}`, // Note: using album slug as last segment for simplicity
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    // Log error for monitoring
    console.warn(
      "Failed to fetch albums for sitemap:",
      error instanceof Error ? error.message : error
    );

    // Return empty array on error - albums are secondary content
    return [];
  }
}

/**
 * Generate dynamic sitemap entries for MVP photoCards
 * Queries database for all cards with MVP groups (limited to top cards for performance)
 */
async function generateCardSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const cards = await getAllCardSlugs();

    // Limit to prevent sitemap from becoming too large
    const limitedCards = cards.slice(0, 5000);
    console.info(`✓ Sitemap: Loaded ${limitedCards.length} cards from database (total: ${cards.length})`);

    return limitedCards.map((c) => ({
      url: `${SITE_URL}/card/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    // Log error for monitoring
    console.warn(
      "Failed to fetch cards for sitemap:",
      error instanceof Error ? error.message : error
    );

    // Return empty array on error - cards are secondary content
    return [];
  }
}

/**
 * Main sitemap export
 * Called by Next.js during build or on request (with revalidation)
 *
 * Usage:
 * - Static generation: Built into sitemap.xml at build time
 * - ISR: Revalidated every hour (if configured in route segment config)
 *
 * Includes:
 * - Static pages (/, /auth/login, /vault, /search)
 * - Dynamic group pages (/groups/aespa, /groups/seventeen, etc.)
 * - Dynamic member pages (/wiki/aespa/karina, /wiki/aespa/giselle, etc.)
 * - Dynamic album pages (/wiki/aespa/karina/album-slug, etc.)
 * - Dynamic card pages (/card/aespa-karina-album-001, etc.)
 *
 * Example output:
 * ```xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 *   <!-- Static pages -->
 *   <url>
 *     <loc>https://www.stanpc.com</loc>
 *     <priority>1.0</priority>
 *     <changefreq>daily</changefreq>
 *   </url>
 *
 *   <!-- Group pages -->
 *   <url>
 *     <loc>https://www.stanpc.com/groups/aespa</loc>
 *     <priority>0.9</priority>
 *     <changefreq>daily</changefreq>
 *   </url>
 *
 *   <!-- Member pages (Wiki) -->
 *   <url>
 *     <loc>https://www.stanpc.com/wiki/aespa/karina</loc>
 *     <priority>0.85</priority>
 *     <changefreq>daily</changefreq>
 *   </url>
 *
 *   <!-- Album pages (Wiki) -->
 *   <url>
 *     <loc>https://www.stanpc.com/wiki/aespa/album-slug</loc>
 *     <priority>0.8</priority>
 *     <changefreq>weekly</changefreq>
 *   </url>
 *
 *   <!-- Card pages -->
 *   <url>
 *     <loc>https://www.stanpc.com/card/aespa-karina-album-001</loc>
 *     <priority>0.7</priority>
 *     <changefreq>weekly</changefreq>
 *   </url>
 * </urlset>
 * ```
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic group entries with fallback error handling
  const groupEntries = await generateGroupSitemapEntries();

  // Fetch dynamic member entries with fallback error handling
  const memberEntries = await generateMemberSitemapEntries();

  // Fetch dynamic album entries
  const albumEntries = await generateAlbumSitemapEntries();

  // Fetch dynamic card entries
  const cardEntries = await generateCardSitemapEntries();

  // Combine all entries: static pages, groups, members, albums, and cards
  const allEntries = [
    ...STATIC_PAGES,
    ...groupEntries,
    ...memberEntries,
    ...albumEntries,
    ...cardEntries,
  ];

  console.info(`✓ Sitemap generated with ${allEntries.length} entries`);

  return allEntries;
}

/**
 * Configuration for this route (optional)
 *
 * - revalidate: Cache this sitemap for 1 hour, then regenerate on next request (ISR)
 * - dynamic: "force-static" for static generation at build time
 *
 * Choose based on your needs:
 * - Dynamic content (new groups added frequently): use ISR (revalidate: 3600)
 * - Stable content (groups rarely change): use static (dynamic: "force-static")
 */
export const revalidate = 3600; // Regenerate every 1 hour
