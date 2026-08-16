import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 추천인 통계 조회 (상위 10명)
    const leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        credits: true,
        referralLogs: {
          select: { id: true, refereeId: true },
        },
      },
      where: {
        referralLogs: { some: { refereeId: { not: null } } },
      },
      orderBy: { credits: 'desc' },
      take: 100,
    });

    // 데이터 포맷팅
    const formattedLeaderboard = leaderboard
      .map((user, idx) => ({
        rank: idx + 1,
        userId: user.id,
        userName: user.name || `User ${user.id.slice(0, 8)}`,
        totalReferrals: user.referralLogs.filter((l) => l.refereeId).length,
        totalCredits: user.credits,
        badge: user.credits >= 50000 ? '👑' : user.credits >= 25000 ? '🌐' : user.credits >= 12500 ? '✨' : undefined,
      }))
      .slice(0, 10);

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[/api/referral/leaderboard]', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
