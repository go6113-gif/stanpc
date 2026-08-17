import { prisma } from '@/lib/prisma';
import type { LeaderboardEntry } from '@/lib/types/referral';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const topAmbassadors = await prisma.referralCodeStats.findMany({
      select: {
        userId: true,
        totalCreditsAwarded: true,
        successfulConversions: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { successfulConversions: 'desc' },
        { totalCreditsAwarded: 'desc' },
      ],
      take: 10,
    });

    const leaderboard: LeaderboardEntry[] = topAmbassadors.map((entry: any, index: number) => ({
      userId: entry.userId,
      username: entry.user.name || 'Anonymous',
      avatar: entry.user.image || undefined,
      totalCredits: entry.totalCreditsAwarded,
      successfulInvitations: entry.successfulConversions,
      rank: index + 1,
    }));

    return Response.json({ data: leaderboard });
  } catch (err) {
    console.error('[GET /api/leaderboard/ambassadors] Error:', err);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
