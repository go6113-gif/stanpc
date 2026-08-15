import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
})

export async function getPresignedUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'stanpc-proofs',
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(r2, command, { expiresIn: 3600 })
}

export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`
}
