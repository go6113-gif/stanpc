/**
 * Noindex Route Configuration
 *
 * Routes that should NOT be indexed by search engines.
 * Used in layout/page generateMetadata() to add robots: {index: false}
 *
 * Categories:
 * - UGC (User-Generated Content): Community, Feed, Chat
 * - Private: User settings, billing
 * - Admin: Internal tools
 */

export const NOINDEX_ROUTE_PATTERNS = [
  // UGC Routes
  '/community',
  '/community/**',
  '/feed',
  '/feed/**',
  '/trade/chat',
  '/trade/chat/**',

  // Private User Routes
  '/vault/settings',
  '/vault/settings/**',
  '/profile/settings',
  '/profile/settings/**',
  '/profile/billing',
  '/profile/billing/**',

  // Admin Routes (if ever implemented)
  '/admin',
  '/admin/**',
] as const;

/**
 * Check if a route should be noindexed
 * Usage in page.tsx:
 *
 * export async function generateMetadata({params}: Props): Promise<Metadata> {
 *   const pathname = `/${params.group}/${params.member}`;
 *   return {
 *     robots: shouldNoindex(pathname)
 *       ? { index: false, follow: false }
 *       : { index: true, follow: true },
 *   };
 * }
 */
export function shouldNoindex(pathname: string): boolean {
  return NOINDEX_ROUTE_PATTERNS.some((pattern) => {
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3); // Remove '/**'
      return pathname.startsWith(prefix);
    }
    return pathname === pattern;
  });
}

/**
 * Default noindex robots config
 * Used when a route is explicitly marked as UGC/private
 */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nosnippet: true,
} as const;

/**
 * Default index robots config
 * Used for public, high-quality catalog routes
 */
export const INDEX_ROBOTS = {
  index: true,
  follow: true,
} as const;
