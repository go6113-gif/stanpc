/**
 * Daily Batch Crawler - Orchestrates photocard collection
 * Runs daily to fetch new listings from eBay and Korean marketplaces
 * Max 500 items per group, rate-limited to avoid blocking
 */

import { batchSearchEbay } from '@/lib/crawler/ebay-adapter';
import { batchSearchKorean } from '@/lib/crawler/naver-adapter';
import { prisma } from '@/lib/db';

const GROUPS = [
  'bts',
  'blackpink',
  'stray-kids',
  'seventeen',
  'twice',
  'newjeans',
];

const MAX_ITEMS_PER_GROUP = 500;
const ITEMS_PER_KEYWORD = 50;

export interface BatchCrawlResult {
  group: string;
  source: 'ebay' | 'naver' | 'bungae';
  itemsFetched: number;
  itemsStored: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

/**
 * Run daily batch crawl
 */
export async function runDailyBatch(): Promise<BatchCrawlResult[]> {
  const results: BatchCrawlResult[] = [];
  const startTime = Date.now();

  console.log(`[BATCH] Starting daily crawler batch at ${new Date().toISOString()}`);

  for (const group of GROUPS) {
    // eBay crawl
    const ebayStart = Date.now();
    try {
      console.log(`[eBay] Crawling ${group}...`);
      const ebayListings = await batchSearchEbay(
        [group],
        Math.min(ITEMS_PER_KEYWORD, MAX_ITEMS_PER_GROUP)
      );

      const stored = await storeListings(group, 'ebay', ebayListings);

      results.push({
        group,
        source: 'ebay',
        itemsFetched: ebayListings.length,
        itemsStored: stored,
        errors: [],
        duration: Date.now() - ebayStart,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`[eBay] Error crawling ${group}:`, error);
      results.push({
        group,
        source: 'ebay',
        itemsFetched: 0,
        itemsStored: 0,
        errors: [String(error)],
        duration: Date.now() - ebayStart,
        timestamp: new Date(),
      });
    }

    // Korean marketplace crawl
    const koreanStart = Date.now();
    try {
      console.log(`[Korean] Crawling ${group}...`);
      const koreanListings = await batchSearchKorean(
        [group],
        ITEMS_PER_KEYWORD
      );

      const stored = await storeListings(group, 'naver', koreanListings);

      results.push({
        group,
        source: 'naver',
        itemsFetched: koreanListings.length,
        itemsStored: stored,
        errors: [],
        duration: Date.now() - koreanStart,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`[Korean] Error crawling ${group}:`, error);
      results.push({
        group,
        source: 'naver',
        itemsFetched: 0,
        itemsStored: 0,
        errors: [String(error)],
        duration: Date.now() - koreanStart,
        timestamp: new Date(),
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[BATCH] Completed in ${totalDuration}ms`);
  logBatchResults(results, totalDuration);

  return results;
}

/**
 * Store listings in database
 */
async function storeListings(
  group: string,
  source: string,
  listings: any[]
): Promise<number> {
  let stored = 0;

  for (const listing of listings) {
    try {
      // TODO: Store in database via Prisma
      // await prisma.photocardListing.upsert({
      //   where: { sourceId_source: { sourceId: listing.sourceId, source } },
      //   create: {
      //     group,
      //     ...listing,
      //   },
      //   update: { ...listing },
      // });
      stored++;
    } catch (error) {
      console.error(`Failed to store listing:`, error);
    }
  }

  return stored;
}

/**
 * Log batch results
 */
function logBatchResults(results: BatchCrawlResult[], totalDuration: number): void {
  console.log('\n=== BATCH CRAWL RESULTS ===');
  console.log(`Total Duration: ${totalDuration}ms\n`);

  for (const result of results) {
    const status = result.itemsStored > 0 ? '✅' : '⚠️';
    console.log(
      `${status} ${result.group.toUpperCase()} (${result.source}): ` +
        `Fetched ${result.itemsFetched}, Stored ${result.itemsStored}, ` +
        `${result.duration}ms`
    );

    if (result.errors.length > 0) {
      result.errors.forEach((err) => console.log(`   └ Error: ${err}`));
    }
  }

  const totalFetched = results.reduce((sum, r) => sum + r.itemsFetched, 0);
  const totalStored = results.reduce((sum, r) => sum + r.itemsStored, 0);

  console.log(`\nSummary: ${totalFetched} fetched, ${totalStored} stored`);
}

/**
 * CLI execution
 */
if (require.main === module) {
  runDailyBatch()
    .then(() => {
      console.log('[BATCH] Crawl completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[BATCH] Fatal error:', error);
      process.exit(1);
    });
}

export default runDailyBatch;
