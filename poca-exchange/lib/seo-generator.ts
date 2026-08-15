/**
 * SEO Metadata Generator
 *
 * Uses seoFormulas from seo-config.ts to generate titles, descriptions,
 * and structured data. Centralized so formula changes auto-propagate.
 */

import {
  seoFormulas,
  structuredDataTemplates,
  openGraphGenerators,
  twitterCardGenerators,
  type CardSeoData,
  type OpenGraphMetadata,
  type TwitterCardMetadata,
} from "./seo-config";

export interface CardMetadataResult {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  canonicalUrl: string;
  openGraph: OpenGraphMetadata;
  twitterCard: TwitterCardMetadata;
  jsonLd: Record<string, unknown>;
  robots?: string;
}

export interface MemberMetadataResult {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  openGraph: OpenGraphMetadata;
  twitterCard: TwitterCardMetadata;
  jsonLd: Record<string, unknown>;
  robots?: string;
}

/**
 * Generate complete card page metadata using SEO formulas
 */
export function generateCardMetadata(
  card: {
    slug: string;
    cardName: string | null | undefined;
    member: { nameEn: string } | null | undefined;
    group: { nameEn: string };
    album: { title: string } | null | undefined;
    badge?: string | null;
    version?: string | null;
    estimatedPrice?: number | null;
    imageUrl?: string | null;
    thumbImagePath?: string | null;
  },
  ogImageUrl: string
): CardMetadataResult {
  const seoData: CardSeoData = {
    memberName: card.member?.nameEn ?? undefined,
    groupName: card.group.nameEn,
    albumName: card.album?.title ?? undefined,
    badge: card.badge ?? undefined,
    version: card.version ?? undefined,
    estimatedPrice: card.estimatedPrice ?? undefined,
  };

  const title = seoFormulas.cardTitle(seoData);
  const description = seoFormulas.cardDescription(seoData);
  const keywords = seoFormulas.cardKeywords(seoData);
  const canonicalUrl = `/card/${card.slug}`;

  // Product schema for rich snippets
  const image = (card.imageUrl ?? card.thumbImagePath) || undefined;
  const jsonLd = structuredDataTemplates.productSchema({
    name: card.cardName ?? `${card.group.nameEn} 포토카드`,
    image,
    brand: card.group.nameEn,
    category: card.member?.nameEn || undefined,
    price: card.estimatedPrice || undefined,
    url: `https://www.stanpc.com${canonicalUrl}`,
  });

  // Open Graph metadata
  const openGraph = openGraphGenerators.cardOG(seoData, image, canonicalUrl);

  // Twitter Card metadata
  const twitterCard = twitterCardGenerators.cardCard(seoData, image);

  return {
    title,
    description,
    keywords,
    ogImageUrl,
    canonicalUrl,
    openGraph,
    twitterCard,
    jsonLd,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}

/**
 * Generate group/member listing page metadata
 */
export function generateGroupMetadata(
  groupName: string,
  cardCount: number
): {
  title: string;
  description: string;
} {
  return {
    title: seoFormulas.groupTitle(groupName),
    description: seoFormulas.groupDescription(groupName, cardCount),
  };
}

/**
 * Generate complete member detail page metadata
 */
export function generateMemberMetadata(options: {
  memberName: string;
  groupName: string;
  cardCount: number;
  imageUrl?: string | null;
  groupSlug: string;
  memberSlug: string;
}): MemberMetadataResult {
  const canonicalUrl = `/wiki/${options.groupSlug}/${options.memberSlug}`;
  const title = seoFormulas.memberTitle(options.memberName, options.groupName);
  const description = seoFormulas.memberDescription(
    options.memberName,
    options.groupName,
    options.cardCount
  );
  const keywords = seoFormulas.memberKeywords(options.memberName, options.groupName);

  // Collection schema for rich snippets
  const jsonLd = structuredDataTemplates.collectionSchema({
    name: `${options.memberName} (${options.groupName})`,
    description,
    itemCount: options.cardCount,
    url: `https://www.stanpc.com${canonicalUrl}`,
  });

  // Open Graph metadata
  const openGraph = openGraphGenerators.memberOG(
    options.memberName,
    options.groupName,
    options.imageUrl || undefined,
    canonicalUrl,
    options.cardCount
  );

  // Twitter Card metadata
  const twitterCard = twitterCardGenerators.memberCard(
    options.memberName,
    options.groupName,
    options.imageUrl || undefined,
    options.cardCount
  );

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    openGraph,
    twitterCard,
    jsonLd,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}

/**
 * Generate complete album detail page metadata
 */
export function generateAlbumMetadata(options: {
  memberName: string;
  groupName: string;
  albumName: string;
  cardCount?: number;
  imageUrl?: string | null;
  groupSlug: string;
  memberSlug: string;
  albumSlug: string;
}): MemberMetadataResult {
  const canonicalUrl = `/wiki/${options.groupSlug}/${options.memberSlug}/${options.albumSlug}`;
  const title = seoFormulas.albumTitle(
    options.memberName,
    options.groupName,
    options.albumName
  );
  const description = seoFormulas.albumDescription(
    options.memberName,
    options.groupName
  );
  const keywords = [
    options.memberName,
    options.groupName,
    options.albumName,
    "photocard",
    "template",
    "K-pop",
    "trading card",
  ].join(", ");

  // Collection schema for rich snippets
  const jsonLd = structuredDataTemplates.collectionSchema({
    name: `${options.memberName} - ${options.albumName}`,
    description,
    itemCount: options.cardCount || 0,
    url: `https://www.stanpc.com${canonicalUrl}`,
  });

  // Open Graph metadata
  const openGraph = openGraphGenerators.albumOG(
    options.memberName,
    options.groupName,
    options.albumName,
    options.imageUrl || undefined,
    canonicalUrl
  );

  // Twitter Card metadata
  const twitterCard = twitterCardGenerators.albumCard(
    options.memberName,
    options.groupName,
    options.albumName,
    options.imageUrl || undefined
  );

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    openGraph,
    twitterCard,
    jsonLd,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}
