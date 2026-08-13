import { prisma } from "./prisma";

export async function getCardDetail(cardSlug: string) {
  return await prisma.photoCard.findUnique({
    where: { slug: cardSlug },
    include: {
      group: true,
      member: true,
      album: true,
      skuMappings: {
        where: { isActive: true },
      },
      affiliateLinks: {
        include: { partner: true },
      },
    },
  });
}

export async function getUserCardStatus(userId: string, cardId: string) {
  return await prisma.userBinderCard.findUnique({
    where: {
      userId_cardId: { userId, cardId },
    },
  });
}

export async function toggleCardWantStatus(
  userId: string,
  cardId: string,
  isWant: boolean
) {
  if (isWant) {
    // Create or update to ISO status
    return await prisma.userBinderCard.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: { userId, cardId, status: "ISO" },
      update: { status: "ISO" },
    });
  } else {
    // Delete the binder entry if it only exists for want tracking
    return await prisma.userBinderCard.delete({
      where: { userId_cardId: { userId, cardId } },
    }).catch(() => null); // Silently fail if doesn't exist
  }
}
