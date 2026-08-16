import { MetadataRoute } from "next";
import { getMvpGroupDirectory } from "@/lib/queries";
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
 * Attempts to fetch from database, falls back to FALLBACK_MVP_MEMBERS on error
 */
async function generateMemberSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    // TODO: Implement actual DB query for all members
    // For now, use fallback member data
    console.info(`✓ Sitemap: Using fallback MVP members`);

    const entries: MetadataRoute.Sitemap = [];
    for (const groupMember of FALLBACK_MVP_MEMBERS) {
      for (const memberSlug of groupMember.members) {
        entries.push({
          url: `${SITE_URL}/groups/${groupMember.groupSlug}/${memberSlug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.85, // Slightly lower than group pages
        });
      }
    }
    return entries;
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
          url: `${SITE_URL}/groups/${groupMember.groupSlug}/${memberSlug}`,
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
 * - Dynamic member pages (/groups/aespa/karina, /groups/aespa/giselle, etc.)
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
 *   <!-- Member pages -->
 *   <url>
 *     <loc>https://www.stanpc.com/groups/aespa/karina</loc>
 *     <priority>0.85</priority>
 *     <changefreq>daily</changefreq>
 *   </url>
 * </urlset>
 * ```
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic group entries with fallback error handling
  const groupEntries = await generateGroupSitemapEntries();

  // Fetch dynamic member entries with fallback error handling
  const memberEntries = await generateMemberSitemapEntries();

  // Combine static pages, dynamic group pages, and dynamic member pages
  const allEntries = [...STATIC_PAGES, ...groupEntries, ...memberEntries];

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
