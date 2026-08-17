/**
 * Admin Review Queue API
 * GET: Fetch cards pending review (Vision score 50-89)
 * PATCH: Update review status (APPROVE/REJECT)
 */

import { NextRequest, NextResponse } from 'next/server';

interface ReviewItem {
  id: string;
  imageUrl: string;
  title: string;
  visionScore: number;
  visionReasoning: string;
  source: 'ebay' | 'naver';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Mock review queue database
 * In production: Query from Prisma
 */
const MOCK_REVIEW_QUEUE: ReviewItem[] = [
  {
    id: 'review-1',
    imageUrl: 'https://via.placeholder.com/512x768/FF69B4/FFFFFF?text=BTS+Glare',
    title: 'BTS Jimin Photocard - Minor Glare',
    visionScore: 65,
    visionReasoning: 'Minor glare/reflection on card surface. Slight angle ambiguity.',
    source: 'ebay',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'review-2',
    imageUrl: 'https://via.placeholder.com/512x768/FF1493/FFFFFF?text=Angle+Issue',
    title: 'SEVENTEEN DK - Angle Ambiguity',
    visionScore: 58,
    visionReasoning: 'Card at slight angle, unclear if edge damage or shadow.',
    source: 'naver',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'review-3',
    imageUrl: 'https://via.placeholder.com/512x768/FFB6C1/000000?text=Lighting',
    title: 'BLACKPINK Lisa - Lighting Condition',
    visionScore: 72,
    visionReasoning: 'Backlighting creates shadows. Authenticity uncertain.',
    source: 'ebay',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 10800000),
  },
];

/**
 * GET /api/admin/review-queue
 * Fetch pending reviews
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check via next-auth
    // const session = await getServerSession();
    // if (!session?.user?.email?.includes('admin')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Filter by status
    const filtered = MOCK_REVIEW_QUEUE.filter((item) => item.status === status);

    // Apply limit
    const results = filtered.slice(0, limit);

    return NextResponse.json({
      total: filtered.length,
      results,
    });
  } catch (error) {
    console.error('Review queue fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/review-queue/:id
 * Update review status
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.email?.includes('admin')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find and update item
    const item = MOCK_REVIEW_QUEUE.find((r) => r.id === id);

    if (!item) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    item.status = status;
    item.reviewedAt = new Date();
    item.reviewedBy = 'admin';

    // In production: Save to database
    // await prisma.reviewQueue.update({
    //   where: { id },
    //   data: { status, reviewedAt: new Date(), reviewedBy: session.user.name },
    // });

    console.log(`[ADMIN] Review ${id} marked as ${status} by ${item.reviewedBy}`);

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/review-queue/batch
 * Batch approve/reject multiple reviews
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.email?.includes('admin')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }

    const updated = MOCK_REVIEW_QUEUE
      .filter((item) => ids.includes(item.id))
      .map((item) => {
        item.status = status;
        item.reviewedAt = new Date();
        item.reviewedBy = 'admin';
        return item;
      });

    console.log(
      `[ADMIN] Batch updated ${updated.length} reviews to ${status}`
    );

    return NextResponse.json({
      success: true,
      updated: updated.length,
    });
  } catch (error) {
    console.error('Batch update error:', error);
    return NextResponse.json(
      { error: 'Failed to batch update reviews' },
      { status: 500 }
    );
  }
}
