import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Get raw SQL result
    const result = await prisma.$queryRaw`
      SELECT slug, "cardName", "imageUrl", "estimatedPrice"
      FROM photo_cards
      WHERE slug LIKE 'bts-%'
      LIMIT 3
    `;

    console.log("Raw DB query result:");
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
