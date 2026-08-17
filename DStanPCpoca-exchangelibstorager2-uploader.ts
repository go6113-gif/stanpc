/**
 * Cloudflare R2 WebP Uploader
 *
 * Flow: Download → Resize 512x768 → Compress WebP → Upload to R2
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fetch from 'node-fetch';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
}

let s3Client: S3Client | null = null;

function getR2Config(): R2Config {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured');
  }

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME || 'stanpc-photocards',
    publicDomain: R2_PUBLIC_DOMAIN || 'https://cdn.stanpc.com',
  };
}

function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getR2Config();
    s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

/**
 * Download image from URL
 */
async function downloadImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return response.buffer();
}

/**
 * Resize and compress image to WebP
 */
async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(512, 768, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * Upload WebP to Cloudflare R2
 */
async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string = 'image/webp'
): Promise<UploadResult> {
  try {
    const client = getS3Client();
    const config = getR2Config();

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    await client.send(command);

    const publicUrl = `${config.publicDomain}/${key}`;
    return {
      success: true,
      url: publicUrl,
      path: key,
      size: buffer.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * End-to-end: Download → Process → Upload
 */
export async function uploadPhotocardImage(
  imageUrl: string,
  cardId: string
): Promise<UploadResult> {
  try {
    // Download
    const buffer = await downloadImage(imageUrl);

    // Process
    const webpBuffer = await processImage(buffer);

    // Upload
    const timestamp = Date.now();
    const key = `photocards/${cardId}/source_${timestamp}.webp`;

    return uploadToR2(key, webpBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Batch upload with metadata tracking
 */
export async function batchUploadPhotocards(
  images: Array<{ url: string; cardId: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, UploadResult>> {
  const results = new Map<string, UploadResult>();

  for (let i = 0; i < images.length; i++) {
    const { url, cardId } = images[i];
    const result = await uploadPhotocardImage(url, cardId);
    results.set(cardId, result);

    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }

  return results;
}
