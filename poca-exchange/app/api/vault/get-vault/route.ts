import { auth } from '@/auth';
import { getFilteredPhotoCards } from '@/lib/queries';
import type { FilterState } from '@/lib/filter-query';
import { NextResponse } from 'next/server';

/**
 * GET /api/vault/get-vault
 * Fetch filtered vault cards for authenticated user
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default filter: show owned cards
    const filters: FilterState = {
      quick: 'owned',
      sort: 'newest',
      groups: [],
      members: [],
      albums: [],
      versions: [],
      priceMin: null,
      priceMax: null,
    };

    const cards = await getFilteredPhotoCards(filters, session.user.id);

    return NextResponse.json({
      cards,
      count: cards.length,
    });
  } catch (error) {
    console.error('[API] /api/vault/get-vault error:', error);
    return NextResponse.json({ error: 'Failed to fetch vault' }, { status: 500 });
  }
}
