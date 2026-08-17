import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // Cache for 1 hour

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  xp: number;
  contributorTier: string;
  contributionsCount: number;
}

export async function GET(req: Request) {
  try {
    // Query top 10 users by XP
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        xp: true,
        contributorTier: true,
        _count: {
          select: {
            contributions: true,
          },
        },
      },
      orderBy: [
        { xp: 'desc' },
        { createdAt: 'asc' }, // Tiebreaker: earlier users rank higher
      ],
      take: 10,
    });

    // Format response
    const leaderboard: LeaderboardEntry[] = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      image: user.image,
      xp: user.xp,
      contributorTier: user.contributorTier,
      contributionsCount: user._count.contributions,
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      leaderboard,
    });
  } catch (error) {
    console.error('[leaderboard] Error:', error);
    return NextResponse.json(
      { error: '순위표를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
