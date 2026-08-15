/**
 * JSON-LD Utility Functions
 *
 * Provides helpers for structuring data in Next.js using JSON-LD markup.
 * This data improves SEO and enables rich snippets in search results.
 *
 * Usage in React components (Client-side):
 * See app/card/[cardSlug]/page.tsx for implementation examples.
 */

/**
 * Safely stringify and inject JSON-LD schema
 * Returns the JSON string suitable for Script tag
 */
export function serializeJsonLd(schema: Record<string, unknown>): string {
  try {
    return JSON.stringify(schema);
  } catch (error) {
    console.error('Failed to serialize JSON-LD schema:', error);
    return '{}';
  }
}

/**
 * Create a breadcrumb schema for navigation hierarchy
 * Useful for member/album pages
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Create an organization schema for StanPC
 * Place in app/layout.tsx for site-wide visibility
 */
export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StanPC',
    url: 'https://www.stanpc.com',
    logo: 'https://www.stanpc.com/logo.png',
    sameAs: [
      'https://twitter.com/stanpc_io',
      'https://instagram.com/stanpc.io',
    ],
    description:
      'The ultimate K-pop photocard wiki, trading, and collection platform',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@stanpc.com',
    },
  };
}

/**
 * Create a website schema (place in root layout)
 */
export function createWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StanPC',
    url: 'https://www.stanpc.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.stanpc.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
