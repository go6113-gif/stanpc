import { prisma } from '@/lib/prisma';
import type { GetBalanceResponse } from '@/lib/types/referral';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const { auth } = await import('@/auth');
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        credits: true,
        referralCodeStats: {
          select: {
            totalReferrals: true,
            successfulConversions: true,
            totalCreditsAwarded: true,
          },
        },
        referralLogs: {
          where: { referrerId: userId },
          select: {
            id: true,
            refereeEmail: true,
            referrerCreditsAwarded: true,
            referrerCreditsStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user || !user.referralCode) {
      return Response.json(
        { error: 'User referral data not found' },
        { status: 404 }
      );
    }

    const stats = user.referralCodeStats || {
      totalReferrals: 0,
      successfulConversions: 0,
      totalCreditsAwarded: 0,
    };

    const response: GetBalanceResponse = {
      isLoading: false,
      data: {
        referralCode: user.referralCode,
        totalCredits: user.credits || 0,
        successfulInvitations: stats.successfulConversions,
        referralCodeStats: {
          totalReferrals: stats.totalReferrals,
          successfulConversions: stats.successfulConversions,
          totalCreditsAwarded: stats.totalCreditsAwarded,
        },
        recentReferrals: user.referralLogs.map((log: any) => ({
          id: log.id,
          refereeEmail: log.refereeEmail,
          referrerCreditsAwarded: log.referrerCreditsAwarded,
          referrerCreditsStatus: log.referrerCreditsStatus,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    };

    return Response.json(response);
  } catch (err) {
    console.error('[GET /api/credits/get-balance] Error:', err);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
