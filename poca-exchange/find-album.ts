import "dotenv/config";
import { PrismaClient } from "./app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const albums = await prisma.album.findMany({
    where: {
      group: { slug: "twice" },
    },
    take: 3,
    select: { slug: true, title: true },
  });
  console.log(JSON.stringify(albums, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
