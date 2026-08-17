import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Check total PhotoCard count
    const totalCount = await prisma.photoCard.count();
    console.log(`\n📊 Total PhotoCards in DB: ${totalCount}`);

    // Get sample of 3 cards with all details
    const sampleCards = await prisma.photoCard.findMany({
      take: 3,
      include: {
        group: { select: { nameEn: true, slug: true } },
        member: { select: { nameEn: true, nameKr: true } },
      },
    });

    console.log(`\n✅ Sample PhotoCards (3/2991):`);
    sampleCards.forEach((card, idx) => {
      console.log(`\n${idx + 1}. Card: ${card.cardName || "NO NAME"}`);
      console.log(`   Slug: ${card.slug}`);
      console.log(`   Group: ${card.group?.nameEn || "N/A"}`);
      console.log(`   Member: ${card.member?.nameEn || "N/A"}`);
      console.log(`   ImageURL: ${card.imageUrl?.substring(0, 80) || "MISSING"}...`);
      console.log(`   Price: $${card.estimatedPrice || "N/A"}`);
    });

    // Check by group
    const groupCounts = await prisma.group.findMany({
      select: {
        nameEn: true,
        slug: true,
        _count: { select: { photoCards: true } },
      },
    });

    console.log(`\n📈 PhotoCards by Group:`);
    groupCounts.forEach((g) => {
      console.log(`   ${g.nameEn}: ${g._count.photoCards} cards`);
    });

    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
