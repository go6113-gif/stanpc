import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import sharp, { Metadata } from 'sharp';

interface UploadedImage {
  r2Url: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  uploadedAt: string;
}

/**
 * Initialize R2 client
 */
function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  });
}

/**
 * Download image from URL and convert to base64
 */
export async function downloadImageAsBase64(url: string): Promise<Buffer> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'stanpc-vision-pipeline/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    throw new Error(`Failed to download image: ${(error as Error).message}`);
  }
}

/**
 * Validate image dimensions and format
 */
async function validateImage(imageBuffer: Buffer): Promise<Metadata> {
  const metadata = await sharp(imageBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions');
  }

  if (metadata.width < 200 || metadata.height < 300) {
    throw new Error(
      `Image too small: ${metadata.width}x${metadata.height} (minimum 200x300)`
    );
  }

  const validFormats = ['jpeg', 'png', 'webp'];
  if (!metadata.format || !validFormats.includes(metadata.format)) {
    throw new Error(`Invalid format: ${metadata.format}. Must be JPEG, PNG, or WebP`);
  }

  return metadata;
}

/**
 * Process image: resize to 512x768 and convert to WebP
 */
async function processImageToWebP(
  imageBuffer: Buffer
): Promise<{ webpBuffer: Buffer; width: number; height: number }> {
  const metadata = await validateImage(imageBuffer);

  // Resize to 512x768 (standard portrait ratio for K-pop photocards)
  const resizedBuffer = await sharp(imageBuffer)
    .resize(512, 768, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 85 })
    .toBuffer();

  return {
    webpBuffer: resizedBuffer,
    width: 512,
    height: 768,
  };
}

/**
 * Upload WebP image to Cloudflare R2
 */
async function uploadToR2(
  webpBuffer: Buffer,
  bucketPath: string
): Promise<{ key: string; fileSize: number }> {
  const client = getR2Client();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `${bucketPath}/source_${timestamp}.webp`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'stanpc-photocards',
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'pipeline-version': '1.0',
      },
    });

    await client.send(command);

    return {
      key,
      fileSize: webpBuffer.length,
    };
  } catch (error) {
    throw new Error(`R2 upload failed: ${(error as Error).message}`);
  }
}

/**
 * Full pipeline: download → validate → resize → convert → upload
 */
export async function uploadPhotocard(
  sourceUrl: string,
  cardId: string,
  visibilityScope: 'private' | 'public' = 'private'
): Promise<UploadedImage> {
  try {
    // Step 1: Download image
    console.log(`[${cardId}] Downloading image from ${sourceUrl}...`);
    const imageBuffer = await downloadImageAsBase64(sourceUrl);

    // Step 2: Validate
    const metadata = await validateImage(imageBuffer);
    console.log(
      `[${cardId}] Image validated: ${metadata.width}x${metadata.height} (${metadata.format})`
    );

    // Step 3: Process to WebP
    const { webpBuffer, width, height } = await processImageToWebP(imageBuffer);
    console.log(`[${cardId}] Resized to ${width}x${height}, converted to WebP`);

    // Step 4: Upload to R2
    const bucketPath = `photocards/${visibilityScope}/${cardId}`;
    const { key, fileSize } = await uploadToR2(webpBuffer, bucketPath);
    console.log(
      `[${cardId}] Uploaded to R2: ${key} (${Math.round(fileSize / 1024)}KB)`
    );

    // Step 5: Generate public URL
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    return {
      r2Url: publicUrl,
      fileSize,
      width,
      height,
      format: 'webp',
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[${cardId}] Upload failed:`, error);
    throw error;
  }
}

/**
 * Batch upload with metadata logging
 */
export async function uploadPhotocardsBatch(
  items: Array<{ sourceUrl: string; cardId: string }>,
  onProgress?: (completed: number, total: number, current?: string) => void
): Promise<
  Array<{
    cardId: string;
    status: 'success' | 'failed';
    data?: UploadedImage;
    error?: string;
  }>
> {
  const results: Array<{
    cardId: string;
    status: 'success' | 'failed';
    data?: UploadedImage;
    error?: string;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i, items.length, item.cardId);
    }

    try {
      const data = await uploadPhotocard(item.sourceUrl, item.cardId, 'private');
      results.push({
        cardId: item.cardId,
        status: 'success',
        data,
      });
    } catch (error) {
      results.push({
        cardId: item.cardId,
        status: 'failed',
        error: (error as Error).message,
      });
    }

    if (onProgress) {
      onProgress(i + 1, items.length, item.cardId);
    }
  }

  return results;
}

/**
 * Generate R2 public URL from key
 */
export function getPublicR2Url(key: string): string {
  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
}
