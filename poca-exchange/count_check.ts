import "dotenv/config";
import { PrismaClient } from "./app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const [group, artist, member, album, version, photoCard, user, binder, priceHistory, skuMapping, waitlist, badge, notification] = await Promise.all([
      prisma.group.count(),
      prisma.artist.count(),
      prisma.member.count(),
      prisma.album.count(),
      prisma.version.count(),
      prisma.photoCard.count(),
      prisma.user.count(),
      prisma.userBinderCard.count(),
      prisma.priceHistory.count(),
      prisma.globalSKUMapping.count(),
      prisma.waitlistSignup.count(),
      prisma.badge.count(),
      prisma.notification.count(),
    ]);
    const photoCardWithGuide = await prisma.photoCard.count({ where: { guideContent: { not: null } } });
    const photoCardWithImage = await prisma.photoCard.count({ where: { imageUrl: { not: null } } });
    const photoCardWithMember = await prisma.photoCard.count({ where: { memberId: { not: null } } });
    const photoCardWithAlbum = await prisma.photoCard.count({ where: { albumId: { not: null } } });
    const photoCardWithPrice = await prisma.photoCard.count({ where: { estimatedPrice: { not: null } } });
    const groupSample = await prisma.group.findMany({ take: 8, select: { slug: true, nameKr: true } });
    console.log(JSON.stringify({
      group, artist, member, album, version, photoCard, user, binder, priceHistory, skuMapping, waitlist, badge, notification,
      photoCardWithGuide, photoCardWithImage, photoCardWithMember, photoCardWithAlbum, photoCardWithPrice, groupSample
    }, null, 2));
  } catch (error: any) {
    console.error("DB_ERROR:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
main();
