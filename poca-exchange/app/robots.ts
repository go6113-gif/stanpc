import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/**
 * robots.txt Generator (Next.js 16)
 *
 * Guides search engine crawlers on which parts of the site can be crawled.
 *
 * Serves at: https://www.stanpc.com/robots.txt
 * Format: Robot Exclusion Standard (https://www.robotstxt.org/)
 * Regenerated when this file changes.
 */
export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = `${siteConfig.url}/sitemap.xml`;

  return {
    rules: [
      // 1️⃣ Default policy for all crawlers
      {
        userAgent: "*",
        // ✅ Allow public content
        allow: ["/", "/groups/", "/wiki/", "/gallery/", "/photocard/", "/card/", "/vault/"],
        // ❌ Disallow internal/private areas
        disallow: [
          "/api/", // Internal API endpoints
          "/auth/", // Authentication pages
          "/.next/", // Build artifacts
          "/admin", // Admin panel (if exists)
          "/_next/", // Next.js internal
        ],
        // Polite crawling: wait 1 second between requests
        crawlDelay: 1,
      },

      // 2️⃣ Specific rules for major search engines
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/.next/", "/admin"],
        crawlDelay: 0.5, // Google can crawl faster
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/.next/", "/admin"],
        crawlDelay: 0.5,
      },

      // 3️⃣ Stricter rules for aggressive crawlers
      {
        userAgent: ["AhrefsBot", "SemrushBot", "DotBot"],
        disallow: "/",
        // These bots are known for aggressive crawling
      },
    ],
    // Point search engines to sitemap for comprehensive indexing
    sitemap: sitemapUrl,
  };
}

/**
 * Configuration Notes:
 *
 * - userAgent: "*" applies to all crawlers
 * - allow/disallow: Array of URL patterns
 * - crawlDelay: Seconds to wait between crawling requests
 * - sitemap: URL to XML sitemap for better SEO
 *
 * Pages in Disallow:
 * - /api/: Internal API endpoints (no user-facing content)
 * - /auth/: Authentication, login, logout (private user flows)
 * - /.next/: Build artifacts (not meant for crawling)
 * - /admin: Admin panel (not public)
 *
 * Pages in Allow:
 * - /: Home page
 * - /groups/*: Group listing pages (dynamic)
 * - /wiki/*: Group/member/album wiki pages
 * - /card/*: Individual photocard pages
 * - /vault/*: User vaults (public if shared)
 */
