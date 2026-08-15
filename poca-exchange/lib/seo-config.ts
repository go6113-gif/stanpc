/**
 * SEO Configuration & Metadata Templates
 *
 * Central hub for pSEO formula management. When keyword optimization data
 * is available (global search volume, competitor analysis), update the
 * templates here and all pages regenerate automatically.
 *
 * Template variables:
 * - {memberName}: Primary artist/member name
 * - {groupName}: Group/band name
 * - {albumName}: Album or collection title
 * - {badge}: Special designation (e.g., "Rare", "Pre-order")
 * - {version}: Card version/variant
 * - {price}: Estimated market price
 */

export interface CardSeoData {
  memberName?: string | null;
  groupName: string;
  albumName?: string | null;
  badge?: string | null;
  version?: string | null;
  estimatedPrice?: number | null;
}

export interface VaultSeoData {
  userName: string;
  collectorIndex: number;
  totalCards: number;
  completeSets: number;
  estimatedVaultValue: number;
}

/**
 * Metadata template configuration
 * Modify these formulas to update SEO across all card pages instantly.
 */
export const seoFormulas = {
  /**
   * Title template for card pages
   * Format: {Primary} {Album} [{Badge}] — {Keyword} | StanPC
   */
  cardTitle: (data: CardSeoData): string => {
    const parts: string[] = [];

    // Primary entity (member if exists, otherwise group)
    if (data.memberName) {
      parts.push(data.memberName);
    } else {
      parts.push(data.groupName);
    }

    // Album/collection name (if distinct)
    if (data.albumName) {
      parts.push(data.albumName);
    }

    // Badge annotation
    if (data.badge) {
      parts.push(`[${data.badge}]`);
    }

    // SEO keyword (Photocard Price & Buy)
    const title = `${parts.join(" ")} Photocard Price & Buy - StanPC`;
    return title;
  },

  /**
   * Meta description template
   * Format: {Group} · {Member} · {Album} · {Version} · {Price}
   *
   * Filters out undefined values and joins with separator.
   */
  cardDescription: (data: CardSeoData): string => {
    const parts = [
      data.groupName,
      data.memberName,
      data.albumName,
      data.version,
      data.estimatedPrice != null
        ? `Est. $${data.estimatedPrice.toFixed(2)}`
        : "Price: TBA",
    ];

    return parts.filter(Boolean).join(" · ");
  },

  /**
   * Card keywords (comma-separated for meta tag)
   * Combines member, group, album, and commerce keywords
   */
  cardKeywords: (data: CardSeoData): string => {
    const keywords = [
      data.memberName,
      data.groupName,
      data.albumName,
      "photocard",
      "K-pop",
      "trading card",
      "collectible",
      "price",
    ];
    return keywords.filter(Boolean).join(", ");
  },

  /**
   * Group/member listing page title
   * Format: {Group} {Category} Photocards — Complete Collection | StanPC
   */
  groupTitle: (groupName: string): string => {
    return `${groupName} Photocards — Complete Collection | StanPC`;
  },

  /**
   * Group/member listing page description
   */
  groupDescription: (groupName: string, cardCount: number): string => {
    return `Complete ${groupName} photocard guide. ${cardCount} cards with prices, versions, and trading info.`;
  },

  /**
   * Member detail page title (4-step pSEO hierarchy)
   * Format: [Member] [Group] Photocard Template, Price & PC List | StanPC
   */
  memberTitle: (memberName: string, groupName: string): string => {
    return `${memberName} ${groupName} Photocard Template, Price & PC List | StanPC`;
  },

  /**
   * Member detail page description
   */
  memberDescription: (memberName: string, groupName: string, cardCount?: number): string => {
    const cardInfo = cardCount ? ` Browse ${cardCount}+ cards.` : '';
    return `Explore ${memberName} (${groupName}) photocard templates, rarest cards, prices & size.${cardInfo} The ultimate K-pop PC wiki & wishlist on StanPC.`;
  },

  /**
   * Member page keywords
   */
  memberKeywords: (memberName: string, groupName: string): string => {
    return [memberName, groupName, "photocard", "template", "trading card", "K-pop", "collectible"].join(", ");
  },

  /**
   * Album detail page title (4-step pSEO hierarchy with album)
   * Format: [Member] [Group] [Album] Photocard Template & PC List | StanPC
   */
  albumTitle: (
    memberName: string,
    groupName: string,
    albumName: string
  ): string => {
    return `${memberName} ${groupName} ${albumName} Photocard Template & PC List | StanPC`;
  },

  /**
   * Album detail page description
   */
  albumDescription: (memberName: string, groupName: string): string => {
    return `Explore ${memberName} (${groupName}) photocard templates, rarest cards, prices & size. The ultimate K-pop PC wiki & wishlist on StanPC.`;
  },

  /**
   * My Vault page title (share-friendly)
   * Format: [UserName]'s Photocard Vault — [Cards Collected] Cards | StanPC
   */
  vaultTitle: (data: VaultSeoData): string => {
    return `${data.userName}'s Photocard Vault — ${data.totalCards} Cards Collected | StanPC`;
  },

  /**
   * My Vault page description (social media preview)
   * Format: Collected X/24 cards ($Value). Check out my full vault and track photocard prices!
   */
  vaultDescription: (data: VaultSeoData): string => {
    const vaultPercentage = Math.round((data.totalCards / 24) * 100);
    return `Collected ${data.totalCards}/24 cards (${vaultPercentage}%) worth $${data.estimatedVaultValue.toFixed(2)}. Check out my full vault and track photocard prices on StanPC!`;
  },

  /**
   * Card Generator title (share-friendly)
   * Format: Create Your K-pop Photocard Showcase — [UserName] | StanPC
   */
  cardGeneratorTitle: (userName: string): string => {
    return `Create Your K-pop Photocard Showcase — ${userName} | StanPC`;
  },

  /**
   * Card Generator description
   */
  cardGeneratorDescription: (): string => {
    return `Design stunning 9:16 and 1:1 photocard collection cards. Share your K-pop vault on Instagram and Twitter with auto-generated OG images.`;
  },
};

/**
 * Open Graph metadata structure
 * Used for social sharing (Facebook, LinkedIn, Discord, etc.)
 */
export interface OpenGraphMetadata {
  title: string;
  description: string;
  url: string;
  type: "website" | "article" | "product";
  image?: string;
  imageAlt?: string;
  locale?: string;
}

/**
 * Twitter Card metadata structure
 * Used for Twitter/X social sharing
 */
export interface TwitterCardMetadata {
  card: "summary" | "summary_large_image" | "player";
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  creator?: string;
  site?: string;
}

/**
 * Open Graph metadata generators
 */
export const openGraphGenerators = {
  /**
   * Generate OG metadata for card pages
   */
  cardOG: (
    data: CardSeoData,
    imageUrl: string | undefined,
    canonicalUrl: string
  ): OpenGraphMetadata => ({
    title: seoFormulas.cardTitle(data),
    description: seoFormulas.cardDescription(data),
    url: `https://www.stanpc.com${canonicalUrl}`,
    type: "product",
    image: imageUrl,
    imageAlt: `${data.memberName || data.groupName} ${data.albumName || "Photocard"} Template`,
    locale: "en_US",
  }),

  /**
   * Generate OG metadata for member pages
   */
  memberOG: (
    memberName: string,
    groupName: string,
    imageUrl: string | undefined,
    canonicalUrl: string,
    cardCount: number
  ): OpenGraphMetadata => ({
    title: seoFormulas.memberTitle(memberName, groupName),
    description: seoFormulas.memberDescription(memberName, groupName, cardCount),
    url: `https://www.stanpc.com${canonicalUrl}`,
    type: "website",
    image: imageUrl,
    imageAlt: `${memberName} ${groupName} Photocard Template`,
    locale: "en_US",
  }),

  /**
   * Generate OG metadata for album pages
   */
  albumOG: (
    memberName: string,
    groupName: string,
    albumName: string,
    imageUrl: string | undefined,
    canonicalUrl: string
  ): OpenGraphMetadata => ({
    title: seoFormulas.albumTitle(memberName, groupName, albumName),
    description: seoFormulas.albumDescription(memberName, groupName),
    url: `https://www.stanpc.com${canonicalUrl}`,
    type: "website",
    image: imageUrl,
    imageAlt: `${memberName} ${groupName} ${albumName} Photocard Template`,
    locale: "en_US",
  }),
};

/**
 * Twitter Card metadata generators
 */
export const twitterCardGenerators = {
  /**
   * Generate Twitter Card metadata for card pages
   */
  cardCard: (
    data: CardSeoData,
    imageUrl: string | undefined
  ): TwitterCardMetadata => ({
    card: imageUrl ? "summary_large_image" : "summary",
    title: seoFormulas.cardTitle(data),
    description: seoFormulas.cardDescription(data),
    image: imageUrl,
    imageAlt: `${data.memberName || data.groupName} ${data.albumName || "Photocard"} Template`,
    site: "@stanpc_io",
    creator: "@stanpc_io",
  }),

  /**
   * Generate Twitter Card metadata for member pages
   */
  memberCard: (
    memberName: string,
    groupName: string,
    imageUrl: string | undefined,
    cardCount: number
  ): TwitterCardMetadata => ({
    card: imageUrl ? "summary_large_image" : "summary",
    title: seoFormulas.memberTitle(memberName, groupName),
    description: seoFormulas.memberDescription(memberName, groupName, cardCount),
    image: imageUrl,
    imageAlt: `${memberName} ${groupName} Photocard Template`,
    site: "@stanpc_io",
    creator: "@stanpc_io",
  }),

  /**
   * Generate Twitter Card metadata for album pages
   */
  albumCard: (
    memberName: string,
    groupName: string,
    albumName: string,
    imageUrl: string | undefined
  ): TwitterCardMetadata => ({
    card: imageUrl ? "summary_large_image" : "summary",
    title: seoFormulas.albumTitle(memberName, groupName, albumName),
    description: seoFormulas.albumDescription(memberName, groupName),
    image: imageUrl,
    imageAlt: `${memberName} ${groupName} ${albumName} Photocard Template`,
    site: "@stanpc_io",
    creator: "@stanpc_io",
  }),
};

/**
 * Keyword priority & weights (extensible for Google Search Volume data)
 *
 * Structure for future enhancement:
 * - globalSearchVolume: Number of monthly searches (from Google Keyword Planner)
 * - competitorCount: Estimated competing listings (from market analysis)
 * - conversionWeight: Relative likelihood to drive commerce intent
 *
 * When these metrics are available, the formula can prioritize keywords
 * that balance search demand with lower competition.
 */
export const keywordStrategy = {
  /**
   * Keyword priority order for title construction
   * (Higher index = higher priority when space is limited)
   */
  cardPriorityOrder: ["memberName", "groupName", "albumName", "badge"] as const,

  /**
   * Reserved space in descriptions for structured data
   */
  descriptionMaxLength: 160, // Google preview limit

  /**
   * Future: Inject global search volume data
   * Shape: { "keyword_slug": { volume: 1200, difficulty: 35 } }
   */
  globalKeywordMetrics: {} as Record<
    string,
    {
      monthlySearchVolume?: number;
      competitionLevel?: "low" | "medium" | "high";
      conversionWeight?: number;
    }
  >,

  /**
   * URI-friendly slug generation rules
   * Applied during URL construction for consistency
   */
  slugRules: {
    separator: "-",
    lowercase: true,
    replaceSpecialChars: true,
  },
};

/**
 * Schema.org structured data templates
 * Supports rich results in Google Search
 */
export const structuredDataTemplates = {
  /**
   * Product schema for card pages
   * Includes pricing, availability, and brand info
   */
  productSchema: (data: {
    name: string;
    image?: string;
    brand: string;
    category?: string;
    price?: number;
    url: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    ...(data.image ? { image: [data.image] } : {}),
    brand: { "@type": "Brand", name: data.brand },
    ...(data.category ? { category: data.category } : {}),
    ...(data.price != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: data.price.toFixed(2),
            availability: "https://schema.org/LimitedAvailability",
            url: data.url,
          },
        }
      : {}),
  }),

  /**
   * Collection schema for group/member pages
   */
  collectionSchema: (data: {
    name: string;
    description: string;
    itemCount: number;
    url: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Collection",
    name: data.name,
    description: data.description,
    numberOfItems: data.itemCount,
    url: data.url,
  }),
};
