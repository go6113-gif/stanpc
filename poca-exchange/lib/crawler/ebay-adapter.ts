/**
 * eBay Adapter - Photocard Search & Extraction
 * Handles eBay Browse API integration for photocard listing collection
 */

interface EbayListingItem {
  itemId: string;
  title: string;
  image: {
    imageUrl: string;
  };
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  itemWebUrl: string;
  sellerItemRevision?: string;
}

export interface PhotocardListing {
  source: 'ebay';
  sourceId: string;
  title: string;
  imageUrl: string;
  priceUsd: number;
  currency: string;
  condition?: string;
  url: string;
  fetchedAt: Date;
  isDraft?: boolean; // Mark as bundle/draft
}

const EXCLUDE_KEYWORDS = [
  'lot',
  'set of',
  'bulk',
  'collection',
  'booster',
  'sealed',
  'factory',
  'wholesale',
  'damaged',
];

const EBAY_API_BASE = 'https://api.ebay.com/buy/browse/v1';

export class EbayAdapter {
  private apiKey: string;
  private rateLimitDelay = 1500; // 1.5 seconds between requests

  constructor(apiKey: string = process.env.EBAY_CLIENT_ID || '') {
    this.apiKey = apiKey;
  }

  /**
   * Search eBay for photocard listings
   */
  async searchPhotocards(
    keyword: string,
    limit: number = 50
  ): Promise<PhotocardListing[]> {
    try {
      const query = `${keyword} photocard`;
      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
        sort: 'newlyListed',
        filter: 'conditionIds:{3000|5000}', // Used/Unspecified
      });

      const response = await fetch(
        `${EBAY_API_BASE}/item_summary/search?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.statusText}`);
      }

      const data = (await response.json()) as { itemSummaries: EbayListingItem[] };

      // Filter out bundles, damaged, etc.
      const filtered = (data.itemSummaries || []).filter(
        (item) => !this.shouldExclude(item.title)
      );

      return filtered.map((item) => this.transformListing(item));
    } catch (error) {
      console.error(`eBay search failed for "${keyword}":`, error);
      return [];
    }
  }

  /**
   * Determine if listing should be excluded
   */
  private shouldExclude(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return EXCLUDE_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
  }

  /**
   * Transform eBay listing to standard format
   */
  private transformListing = (item: EbayListingItem): PhotocardListing => {
    return {
      source: 'ebay',
      sourceId: item.itemId,
      title: item.title,
      imageUrl: item.image?.imageUrl || '',
      priceUsd: parseFloat(item.price?.value || '0'),
      currency: item.price?.currency || 'USD',
      condition: item.condition,
      url: item.itemWebUrl || '',
      fetchedAt: new Date(),
      isDraft: this.shouldExclude(item.title),
    };
  };

  /**
   * Apply rate limiting
   */
  async applyRateLimit(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, this.rateLimitDelay)
    );
  }
}

/**
 * Batch search with rate limiting
 */
export async function batchSearchEbay(
  keywords: string[],
  itemsPerKeyword: number = 50
): Promise<PhotocardListing[]> {
  const adapter = new EbayAdapter();
  const results: PhotocardListing[] = [];

  for (const keyword of keywords) {
    const listings = await adapter.searchPhotocards(keyword, itemsPerKeyword);
    results.push(...listings);
    await adapter.applyRateLimit();
  }

  return results;
}
