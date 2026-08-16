import { prisma } from '@/lib/prisma';

export async function awardReferralCredits(
  referrerId: string,
  refereeId: string,
  referralLogId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: referrerId },
      data: { credits: { increment: 3125 } },
    });

    await tx.user.update({
      where: { id: refereeId },
      data: { credits: { increment: 500 } },
    });

    await tx.referralLog.update({
      where: { id: referralLogId },
      data: {
        referrerCreditsAwarded: 3125,
        refereeCreditsAwarded: 500,
        referrerCreditsStatus: 'AWARDED',
        refereeCreditsStatus: 'AWARDED',
      },
    });
  });
}

export async function revokeReferralCredits(
  referrerId: string,
  referralLogId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const referralLog = await tx.referralLog.findUnique({
      where: { id: referralLogId },
      select: {
        referrerCreditsAwarded: true,
        refereeCreditsAwarded: true,
        refereeId: true,
      },
    });

    if (!referralLog) {
      throw new Error('Referral log not found');
    }

    await tx.user.update({
      where: { id: referrerId },
      data: {
        credits: {
          decrement: referralLog.referrerCreditsAwarded || 3125,
        },
      },
    });

    if (referralLog.refereeId) {
      await tx.user.update({
        where: { id: referralLog.refereeId },
        data: {
          credits: {
            decrement: referralLog.refereeCreditsAwarded || 500,
          },
        },
      });
    }

    await tx.referralLog.update({
      where: { id: referralLogId },
      data: {
        referrerCreditsStatus: 'REVOKED',
        refereeCreditsStatus: 'REVOKED',
      },
    });
  });
}
