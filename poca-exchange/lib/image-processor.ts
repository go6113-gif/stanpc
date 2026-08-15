/**
 * Async WebP Image Processor — Concurrent download & convert
 * Input: Image URL array
 * Processing: Download → Resize to 259×400 → Compress to WebP
 * Output: Save to pilot-output/, return metadata
 */

import { promises as fs } from 'fs';
import sharp from 'sharp';

export interface ImageProcessResult {
  url: string;
  filename: string;
  path: string;
  sizeKb: number;
  error?: string;
}

export interface ImageProcessorOptions {
  /** Output directory path (default: public/images/pilot-output) */
  outputDir?: string;
  /** Max concurrent downloads (default: 3) */
  concurrency?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Target height for WebP (width auto-adjusted for 259×400 aspect) */
  targetHeight?: number;
  /** Target width for WebP (fixed at 259) */
  targetWidth?: number;
}

const DEFAULT_OUTPUT_DIR = 'public/images/pilot-output';
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_TARGET_WIDTH = 259;
const DEFAULT_TARGET_HEIGHT = 400;

/**
 * Download a single image from URL with timeout.
 */
async function downloadImage(url: string, timeout: number): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    } as RequestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert image buffer to WebP format (259×400 letterbox).
 * Uses letterbox (preserve aspect) rather than crop to avoid losing card details.
 */
async function convertToWebP(
  imageBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, {
      fit: 'contain', // letterbox: preserve aspect, pad with white
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // white letterbox
    })
    .webp({ quality: 85 }) // balance quality vs file size
    .toBuffer();
}

/**
 * Generate a safe filename from URL.
 * Strips query params and uses only alphanumeric + dash.
 */
function generateFilename(url: string, index: number): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.split('/').pop() || '';
    const name = pathname
      .replace(/\.[^.]+$/, '') // strip extension
      .replace(/[^a-z0-9-]/gi, '-') // only alphanumeric + dash
      .replace(/-+/g, '-') // collapse multiple dashes
      .substring(0, 50); // cap length

    return name ? `${name}-${index}.webp` : `image-${index}.webp`;
  } catch {
    return `image-${index}.webp`;
  }
}

/**
 * Process a single image: download, convert, save.
 */
async function processImage(
  url: string,
  index: number,
  outputDir: string,
  options: Required<Omit<ImageProcessorOptions, 'outputDir' | 'concurrency'>>,
): Promise<ImageProcessResult> {
  const filename = generateFilename(url, index);
  const filepath = `${outputDir}/${filename}`;

  try {
    // Download
    const imageBuffer = await downloadImage(url, options.timeout);

    // Convert to WebP
    const webpBuffer = await convertToWebP(
      imageBuffer,
      options.targetWidth,
      options.targetHeight,
    );

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Save
    await fs.writeFile(filepath, webpBuffer);

    const sizeKb = Math.round(webpBuffer.length / 1024);

    return {
      url,
      filename,
      path: filepath,
      sizeKb,
    };
  } catch (error) {
    return {
      url,
      filename,
      path: filepath,
      sizeKb: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process multiple images concurrently with bounded concurrency.
 * Returns results in the same order as input URLs.
 */
export async function processImages(
  urls: string[],
  options: ImageProcessorOptions = {},
): Promise<ImageProcessResult[]> {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const concurrency = options.concurrency || DEFAULT_CONCURRENCY;
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const targetWidth = options.targetWidth || DEFAULT_TARGET_WIDTH;
  const targetHeight = options.targetHeight || DEFAULT_TARGET_HEIGHT;

  const results: ImageProcessResult[] = [];
  const queue = urls.map((url, index) => ({ url, index }));

  // Bounded concurrency: process `concurrency` items at a time
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);

    const batchResults = await Promise.all(
      batch.map(({ url, index }) =>
        processImage(
          url,
          index,
          outputDir,
          { timeout, targetWidth, targetHeight },
        ),
      ),
    );

    results.push(...batchResults);
  }

  // Re-sort to match input order (concurrent processing may shuffle)
  results.sort((a, b) => {
    const aIndex = urls.indexOf(a.url);
    const bIndex = urls.indexOf(b.url);
    return aIndex - bIndex;
  });

  return results;
}

/**
 * Get summary stats for processed batch.
 */
export function getProcessingStats(results: ImageProcessResult[]) {
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const totalSizeKb = successful.reduce((sum, r) => sum + r.sizeKb, 0);

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    totalSizeKb,
    avgSizeKb: successful.length > 0 ? Math.round(totalSizeKb / successful.length) : 0,
    failureRate: `${((failed.length / results.length) * 100).toFixed(1)}%`,
  };
}
