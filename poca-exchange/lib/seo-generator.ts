/**
 * SEO Metadata Generator
 *
 * Uses seoFormulas from seo-config.ts to generate titles, descriptions,
 * and structured data. Centralized so formula changes auto-propagate.
 */

import { seoFormulas, structuredDataTemplates, type CardSeoData } from "./seo-config";

export interface CardMetadataResult {
  title: string;
  description: string;
  ogImageUrl: string;
  canonicalUrl: string;
  jsonLd: Record<string, unknown>;
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

  return {
    title,
    description,
    ogImageUrl,
    canonicalUrl,
    jsonLd,
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
 * Generate member detail page metadata
 */
export function generateMemberMetadata(
  memberName: string,
  groupName: string,
  cardCount: number
): {
  title: string;
  description: string;
} {
  return {
    title: seoFormulas.memberTitle(memberName, groupName),
    description: seoFormulas.memberDescription(memberName, groupName, cardCount),
  };
}
