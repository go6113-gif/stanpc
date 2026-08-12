/**
 * Affiliate Link Generation & Tracking
 * Supports eBay, Pocamarket, and other partner platforms
 */

export interface AffiliateConfig {
  platform: 'ebay' | 'pocamarket' | 'dk-shop';
  cardName: string;
  memberName?: string;
  groupName?: string;
  estimatedPrice?: number;
}

/**
 * Generate eBay affiliate link with EPN tracking
 * Uses rover.ebay.com as proxy for CPS tracking
 */
export function generateEbayAffiliateLink(config: AffiliateConfig): string {
  const searchQuery = encodeURIComponent(
    `${config.memberName ? config.memberName + ' ' : ''}${config.cardName}`.trim()
  );

  // eBay Partner Network (EPN) link format with tracking ID
  // Replace YOUR_CAMPAIGN_ID with actual EPN campaign ID from dashboard
  const ebayUrl = new URL('https://rover.ebay.com/rover/1/711-53200-19255-0/1');
  ebayUrl.searchParams.set('campid', process.env.EBAY_EPN_CAMPAIGN_ID || '5338182771');
  ebayUrl.searchParams.set('toolid', process.env.EBAY_TOOLID || 'sellertoolkit');
  ebayUrl.searchParams.set('keyword', searchQuery);
  ebayUrl.searchParams.set('mpre', `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`);

  return ebayUrl.toString();
}

/**
 * Generate Pocamarket affiliate link
 */
export function generatePocamarketAffiliateLink(config: AffiliateConfig): string {
  const searchQuery = encodeURIComponent(
    `${config.memberName ? config.memberName + ' ' : ''}${config.cardName}`.trim()
  );

  const pocaUrl = new URL('https://pocamarket.com/search');
  pocaUrl.searchParams.set('q', searchQuery);
  pocaUrl.searchParams.set('ref', 'stanpc'); // Referral tracking

  return pocaUrl.toString();
}

/**
 * Generate DK Shop affiliate link
 */
export function generateDkShopAffiliateLink(config: AffiliateConfig): string {
  const searchQuery = encodeURIComponent(
    `${config.memberName ? config.memberName + ' ' : ''}${config.cardName}`.trim()
  );

  const dkUrl = new URL('https://www.dkshop.co.kr/search');
  dkUrl.searchParams.set('keyword', searchQuery);
  dkUrl.searchParams.set('affiliate_id', process.env.DKSHOP_AFFILIATE_ID || '');

  return dkUrl.toString();
}

/**
 * Get affiliate link by platform with fallback
 */
export function getAffiliateLink(
  platform: AffiliateConfig['platform'],
  config: AffiliateConfig
): string {
  switch (platform) {
    case 'ebay':
      return generateEbayAffiliateLink(config);
    case 'pocamarket':
      return generatePocamarketAffiliateLink(config);
    case 'dk-shop':
      return generateDkShopAffiliateLink(config);
    default:
      return generateEbayAffiliateLink(config);
  }
}

/**
 * Log affiliate click for analytics
 * Integrates with OutboundClick schema
 */
export async function trackAffiliateClick(
  cardId: string,
  platform: AffiliateConfig['platform'],
  userId?: string
): Promise<void> {
  try {
    await fetch('/api/tracking/outbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        platform,
        userId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
}
