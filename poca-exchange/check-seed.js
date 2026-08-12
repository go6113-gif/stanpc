const { PrismaClient } = require("./app/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const groups = await prisma.group.count();
  const albums = await prisma.album.count();
  const cards = await prisma.photoCard.count();
  const members = await prisma.member.count();
  const prices = await prisma.priceHistory.count();

  console.log("\n📊 Database Status:");
  console.log(`  Groups: ${groups}`);
  console.log(`  Albums: ${albums}`);
  console.log(`  PhotoCards: ${cards}`);
  console.log(`  Members: ${members}`);
  console.log(`  PriceHistory: ${prices}`);

  // Show sample group
  const sampleGroup = await prisma.group.findFirst({
    include: { members: true, albums: true },
  });
  if (sampleGroup) {
    console.log(`\n📌 Sample Group: ${sampleGroup.nameEn}`);
    console.log(`   Members: ${sampleGroup.members.length}`);
    console.log(`   Albums: ${sampleGroup.albums.length}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
