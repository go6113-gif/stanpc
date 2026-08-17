/**
 * Seed script for 10-group photocard catalog
 *
 * Loads popular group photocards with placeholder image handling.
 * Groups: BTS, NewJeans, aespa, SEVENTEEN, Stray Kids, IVE, TWICE, EXO, Blackpink, Red Velvet
 *
 * Usage:
 *   NODE_ENV=development npx ts-node --transpile-only scripts/seed-10-groups.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Hardcoded seed data for 10 popular groups
const GROUPS_SEED = [
  { slug: "bts", nameEn: "BTS", nameKr: "방탄소년단" },
  { slug: "newjeans", nameEn: "NewJeans", nameKr: "뉴진스" },
  { slug: "aespa", nameEn: "aespa", nameKr: "에스파" },
  { slug: "seventeen", nameEn: "SEVENTEEN", nameKr: "세븐틴" },
  { slug: "stray-kids", nameEn: "Stray Kids", nameKr: "스트레이 키즈" },
  { slug: "ive", nameEn: "IVE", nameKr: "아이브" },
  { slug: "twice", nameEn: "TWICE", nameKr: "트와이스" },
  { slug: "exo", nameEn: "EXO", nameKr: "엑소" },
  { slug: "blackpink", nameEn: "Blackpink", nameKr: "블랙핑크" },
  { slug: "redvelvet", nameEn: "Red Velvet", nameKr: "레드벨벳" },
];

// Sample members per group
const GROUP_MEMBERS: Record<string, Array<{ name: string; slug: string }>> = {
  bts: [
    { name: "RM", slug: "rm" },
    { name: "Jin", slug: "jin" },
    { name: "Suga", slug: "suga" },
    { name: "J-Hope", slug: "j-hope" },
    { name: "Jimin", slug: "jimin" },
    { name: "V", slug: "v" },
    { name: "Jungkook", slug: "jungkook" },
  ],
  newjeans: [
    { name: "Hanni", slug: "hanni" },
    { name: "Hyein", slug: "hyein" },
    { name: "Danielle", slug: "danielle" },
    { name: "Minji", slug: "minji" },
  ],
  aespa: [
    { name: "Karina", slug: "karina" },
    { name: "Giselle", slug: "giselle" },
    { name: "Winter", slug: "winter" },
    { name: "Ningning", slug: "ningning" },
  ],
  seventeen: [
    { name: "Joshua", slug: "joshua" },
    { name: "Jeonghan", slug: "jeonghan" },
    { name: "S.Coups", slug: "s-coups" },
  ],
  "stray-kids": [
    { name: "Bang Chan", slug: "bang-chan" },
    { name: "Felix", slug: "felix" },
    { name: "Lee Know", slug: "lee-know" },
  ],
  ive: [
    { name: "Iseul", slug: "iseul" },
    { name: "Wonyoung", slug: "wonyoung" },
  ],
  twice: [
    { name: "Nayeon", slug: "nayeon" },
    { name: "Jeongyeon", slug: "jeongyeon" },
  ],
  exo: [
    { name: "Suho", slug: "suho" },
    { name: "Baekhyun", slug: "baekhyun" },
  ],
  blackpink: [
    { name: "Jennie", slug: "jennie" },
    { name: "Lisa", slug: "lisa" },
  ],
  redvelvet: [
    { name: "Irene", slug: "irene" },
    { name: "Seulgi", slug: "seulgi" },
  ],
};

// Sample albums per group
const GROUP_ALBUMS: Record<string, Array<{ title: string; slug: string }>> = {
  bts: [
    { title: "Map of the Soul: 7", slug: "map-of-the-soul-7" },
    { title: "Butter", slug: "butter" },
    { title: "Dynamite", slug: "dynamite" },
  ],
  newjeans: [
    { title: "NewJeans", slug: "newjeans" },
    { title: "Attention", slug: "attention" },
  ],
  aespa: [
    { title: "Spicy", slug: "spicy" },
    { title: "Savage", slug: "savage" },
  ],
  seventeen: [
    { title: "Sector 17", slug: "sector-17" },
    { title: "God's Menu", slug: "gods-menu" },
  ],
  "stray-kids": [
    { title: "NOEASY", slug: "noeasy" },
    { title: "Oddinary", slug: "oddinary" },
  ],
  ive: [
    { title: "I've", slug: "ive" },
  ],
  twice: [
    { title: "Feel Special", slug: "feel-special" },
  ],
  exo: [
    { title: "Obsession", slug: "obsession" },
  ],
  blackpink: [
    { title: "The Album", slug: "the-album" },
  ],
  redvelvet: [
    { title: "Queendom", slug: "queendom" },
  ],
};

async function main() {
  console.log("🌱 Starting 10-group catalog seed...\n");

  let totalCreated = 0;

  for (const groupData of GROUPS_SEED) {
    console.log(`\n📦 Processing group: ${groupData.nameEn}`);

    // Upsert group
    const group = await prisma.group.upsert({
      where: { slug: groupData.slug },
      update: {},
      create: {
        slug: groupData.slug,
        nameEn: groupData.nameEn,
        nameKr: groupData.nameKr,
      },
    });
    console.log(`   ✓ Group created/upserted: ${group.id}`);

    // Create/upsert members
    const members = GROUP_MEMBERS[groupData.slug] || [];
    const memberRecords = [];

    for (const memberData of members) {
      const member = await prisma.member.upsert({
        where: {
          groupId_slug: {
            groupId: group.id,
            slug: memberData.slug,
          },
        },
        update: {},
        create: {
          groupId: group.id,
          slug: memberData.slug,
          nameEn: memberData.name,
        },
      });
      memberRecords.push(member);
    }
    console.log(`   ✓ Members created: ${memberRecords.length}`);

    // Create/upsert albums
    const albums = GROUP_ALBUMS[groupData.slug] || [];
    const albumRecords = [];

    // Debug: Check available models
    console.log("Available Prisma models:", Object.keys(prisma).filter(k => typeof prisma[k as keyof typeof prisma] === 'object'));

    for (const albumData of albums) {
      const album = await prisma.album.upsert({
        where: {
          groupId_slug: {
            groupId: group.id,
            slug: albumData.slug,
          },
        },
        update: {},
        create: {
          slug: albumData.slug,
          title: albumData.title,
          groupId: group.id,
        },
      });
      albumRecords.push(album);
    }
    console.log(`   ✓ Albums created: ${albumRecords.length}`);

    // Create photocard entries (5 per member, all with null images for placeholder)
    const photocardChunks: Array<any> = [];

    for (const member of memberRecords) {
      for (let i = 1; i <= 5; i++) {
        // All images set to null — StanPC placeholder icon used for all cards.
        // Future: User-submitted image contribution flow will add real images.
        photocardChunks.push({
          slug: `${groupData.slug}-${member.slug}-${i}`,
          cardName: `${member.name} #${i}`,
          groupId: group.id,
          memberId: member.id,
          albumId: albumRecords[(i - 1) % albumRecords.length]?.id || null,
          imageUrl: null,
          thumbImagePath: null,
          estimatedPrice: Math.random() * 50 + 5,
          ownedCount: Math.floor(Math.random() * 500),
          wishedCount: Math.floor(Math.random() * 300),
          viewCount: Math.floor(Math.random() * 1000),
        });
      }
    }

    // Batch insert in 500-card chunks to protect connection pool
    for (let i = 0; i < photocardChunks.length; i += 500) {
      const chunk = photocardChunks.slice(i, i + 500);
      try {
        const result = await prisma.photoCard.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        totalCreated += result.count;
        console.log(
          `   ✓ Photocards batch ${Math.floor(i / 500) + 1}: ${result.count} created`
        );
      } catch (err) {
        console.error(
          `   ✗ Photocards batch ${Math.floor(i / 500) + 1} failed:`,
          err
        );
      }
    }
  }

  console.log("\n✅ Seed complete!");
  console.log(`   Total photocards created: ${totalCreated}`);
  console.log(`   Groups processed: ${GROUPS_SEED.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
