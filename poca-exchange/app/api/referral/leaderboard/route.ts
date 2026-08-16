import { NextRequest, NextResponse } from 'next/server';
import { getTopReferrers } from '@/lib/referral/referral-manager';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/referral/leaderboard
 * 상위 추천인(Top Ambassadors) 리더보드
 */
export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '10'),
      50
    );

    const topReferrers = await getTopReferrers(limit);

    if (topReferrers.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        totalCount: 0,
      });
    }

    // 사용자 정보 조회
    const userIds = topReferrers.map((r: any) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        image: true,
        collectorIndex: true,
      },
    });

    // 통합
    const leaderboard = topReferrers.map((r: any, index: number) => {
      const user = users.find((u: any) => u.id === r.userId);
      return {
        rank: index + 1,
        userId: r.userId,
        userName: user?.name || 'Anonymous',
        userImage: user?.image,
        collectorIndex: user?.collectorIndex || 0,
        totalReferrals: r.totalReferrals,
        successfulConversions: r.successfulConversions,
        totalCreditsAwarded: r.totalCreditsAwarded,
        ambassador: r.successfulConversions >= 16, // Top Ambassador 여부
      };
    });

    return NextResponse.json({
      leaderboard,
      totalCount: leaderboard.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return NextResponse.json(
      { error: '리더보드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
