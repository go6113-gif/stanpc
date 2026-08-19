import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("🔧 Fixing SEVENTEEN image URLs...");

    // SEVENTEEN 그룹의 모든 포토카드 조회
    const seventeen = await prisma.group.findUnique({
      where: { slug: "seventeen" },
    });

    if (!seventeen) {
      console.log("⚠️ SEVENTEEN group not found");
      return;
    }

    // imageUrl이 /images/photocards/로 시작하는 모든 카드 찾기
    const cardsToFix = await prisma.photoCard.findMany({
      where: {
        groupId: seventeen.id,
        imageUrl: {
          startsWith: "/images/photocards/",
        },
      },
    });

    console.log(`Found ${cardsToFix.length} cards to fix`);

    // 각 카드의 URL 수정
    for (const card of cardsToFix) {
      if (!card.imageUrl) continue;

      // /images/photocards/ 제거하고 경로 추출
      const filePath = card.imageUrl.replace("/images/photocards/", "");
      const newUrl = `/api/image?path=${encodeURIComponent(filePath)}`;

      await prisma.photoCard.update({
        where: { id: card.id },
        data: { imageUrl: newUrl },
      });

      console.log(`✓ Updated: ${card.slug}`);
    }

    console.log(`✅ Fixed ${cardsToFix.length} image URLs`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
