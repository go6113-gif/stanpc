import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface VerifyProofRequest {
  objectKey: string
  cardId: string
  hashSha256: string
  metadata?: Record<string, string | number | boolean | null>
}

interface VerifyProofResponse {
  success: boolean
  proofRecordId: string
  status: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { objectKey, cardId, hashSha256, metadata } =
      (await req.json()) as VerifyProofRequest

    if (!objectKey || !cardId || !hashSha256) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: objectKey, cardId, hashSha256',
        },
        { status: 400 }
      )
    }

    // Validate that the objectKey belongs to this user (security check)
    const expectedPrefix = `proofs/${userId}/${cardId}/`
    if (!objectKey.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Invalid objectKey: does not match expected user/card path' },
        { status: 403 }
      )
    }

    // Use transaction to ensure atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Find or create UserBinderCard
      let binderCard = await tx.userBinderCard.findUnique({
        where: {
          userId_cardId: {
            userId,
            cardId,
          },
        },
      })

      if (!binderCard) {
        // Create new binder card if it doesn't exist
        binderCard = await tx.userBinderCard.create({
          data: {
            userId,
            cardId,
            status: 'PERSONAL',
          },
        })
      }

      // Create ProofRecord
      const proofRecord = await tx.proofRecord.create({
        data: {
          userBinderCardId: binderCard.id,
          userId,
          rawImageKey: objectKey,
          hashSha256,
          status: 'PENDING',
          metadata: (metadata as unknown) || undefined,
        },
      })

      return proofRecord
    })

    const response: VerifyProofResponse = {
      success: true,
      proofRecordId: result.id,
      status: result.status,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Proof verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify proof' },
      { status: 500 }
    )
  }
}
