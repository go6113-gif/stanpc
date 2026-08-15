import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/r2/client'

const ALLOWED_EXTENSIONS = ['webp', 'jpeg', 'jpg', 'png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB default

interface PresignedUrlRequest {
  cardId: string
  fileName: string
  contentType: string
}

interface PresignedUrlResponse {
  presignedUrl: string
  objectKey: string
  expiresIn: number
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId, fileName, contentType } =
      (await req.json()) as PresignedUrlRequest

    if (!cardId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: cardId, fileName, contentType' },
        { status: 400 }
      )
    }

    // Validate content type
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate content type matches extension
    const validContentTypes: Record<string, string[]> = {
      webp: ['image/webp'],
      jpeg: ['image/jpeg'],
      jpg: ['image/jpeg'],
      png: ['image/png'],
    }

    const allowedContentTypes = validContentTypes[ext] || []
    if (!allowedContentTypes.includes(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid content type for .${ext}. Allowed: ${allowedContentTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate photocard exists
    const photocard = await prisma.photoCard.findUnique({
      where: { id: cardId },
      select: { id: true },
    })

    if (!photocard) {
      return NextResponse.json(
        { error: 'Photocard not found' },
        { status: 404 }
      )
    }

    // Generate object key: proofs/{userId}/{cardId}/{timestamp}.webp
    const timestamp = Date.now()
    const objectKey = `proofs/${session.user.id}/${cardId}/${timestamp}.webp`

    // Get presigned URL
    const presignedUrl = await getPresignedUrl(objectKey, contentType)

    const response: PresignedUrlResponse = {
      presignedUrl,
      objectKey,
      expiresIn: 3600,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Presigned URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
