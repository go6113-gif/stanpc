import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

interface SeedDataFile {
  priceHistory: Array<{
    photocard_slug: string;
    price: number;
    currency: string;
    market: string;
    sourceUrl?: string;
    createdAt: string;
  }>;
  globalSKUMapping: Array<{
    photocard_slug: string;
    market: string;
    sku: string;
    skuUrl?: string;
    lastChecked: string;
    isActive: boolean;
  }>;
  timestamp: string;
  summary: {
    priceHistoryCount: number;
    skuMappingCount: number;
  };
}

async function seedMarketData() {
  console.log("🌱 Starting market data seeding...");

  // Read seed data from Python scraper output
  const seedDataPath = path.join(
    __dirname,
    "../scripts/seed_data/seed_data.json"
  );

  if (!fs.existsSync(seedDataPath)) {
    console.warn(
      `⚠️  Seed data file not found at: ${seedDataPath}`
    );
    console.warn(
      "Run: python scripts/seed_market_data.py to generate seed data"
    );
    return;
  }

  const seedData: SeedDataFile = JSON.parse(
    fs.readFileSync(seedDataPath, "utf-8")
  );

  console.log(`📊 Seed data loaded:`);
  console.log(`  - PriceHistory records: ${seedData.summary.priceHistoryCount}`);
  console.log(
    `  - GlobalSKUMapping records: ${seedData.summary.skuMappingCount}`
  );

  try {
    // Process PriceHistory records
    console.log("\n💰 Seeding PriceHistory...");
    let priceHistorySeeded = 0;
    for (const record of seedData.priceHistory) {
      // Find photocard by slug
      const photoCard = await prisma.photoCard.findUnique({
        where: { slug: record.photocard_slug },
      });

      if (!photoCard) {
        console.warn(
          `  ⚠️  PhotoCard not found for slug: ${record.photocard_slug}`
        );
        continue;
      }

      // Insert price history
      await prisma.priceHistory.create({
        data: {
          price: record.price,
          currency: record.currency,
          market: record.market,
          sourceUrl: record.sourceUrl,
          cardId: photoCard.id,
          createdAt: new Date(record.createdAt),
        },
      });

      priceHistorySeeded++;
    }
    console.log(`  ✅ Seeded ${priceHistorySeeded} PriceHistory records`);

    // Process GlobalSKUMapping records
    console.log("\n🔗 Seeding GlobalSKUMapping...");
    let skuMappingSeeded = 0;
    for (const record of seedData.globalSKUMapping) {
      // Find photocard by slug
      const photoCard = await prisma.photoCard.findUnique({
        where: { slug: record.photocard_slug },
      });

      if (!photoCard) {
        console.warn(
          `  ⚠️  PhotoCard not found for slug: ${record.photocard_slug}`
        );
        continue;
      }

      // Check if SKU mapping already exists (avoid duplicates)
      const existing = await prisma.globalSKUMapping.findUnique({
        where: {
          cardId_market_sku: {
            cardId: photoCard.id,
            market: record.market,
            sku: record.sku,
          },
        },
      });

      if (existing) {
        // Update lastChecked instead of creating duplicate
        await prisma.globalSKUMapping.update({
          where: { id: existing.id },
          data: {
            lastChecked: new Date(record.lastChecked),
            isActive: record.isActive,
          },
        });
        console.log(
          `  📝 Updated existing SKU: ${record.market}/${record.sku}`
        );
      } else {
        // Create new SKU mapping
        await prisma.globalSKUMapping.create({
          data: {
            market: record.market,
            sku: record.sku,
            skuUrl: record.skuUrl,
            lastChecked: new Date(record.lastChecked),
            isActive: record.isActive,
            cardId: photoCard.id,
          },
        });
        console.log(
          `  ✅ Created new SKU: ${record.market}/${record.sku}`
        );
      }

      skuMappingSeeded++;
    }
    console.log(`  ✅ Seeded ${skuMappingSeeded} GlobalSKUMapping records`);

    console.log("\n✨ Market data seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

async function seedDirectoryContent() {
  console.log("🌱 Starting directory content seeding...");

  // Seed Groups (K-pop groups)
  const groups = await prisma.group.createMany({
    data: [
      {
        slug: "twice",
        nameEn: "TWICE",
        nameKr: "트와이스",
        agency: "JYP Entertainment",
        debutDate: new Date("2015-10-20"),
      },
      {
        slug: "blackpink",
        nameEn: "BLACKPINK",
        nameKr: "블랙핑크",
        agency: "YG Entertainment",
        debutDate: new Date("2016-08-08"),
      },
      {
        slug: "exo",
        nameEn: "EXO",
        nameKr: "엑소",
        agency: "SM Entertainment",
        debutDate: new Date("2012-04-08"),
      },
      {
        slug: "stray-kids",
        nameEn: "Stray Kids",
        nameKr: "스트레이 키즈",
        agency: "JYP Entertainment",
        debutDate: new Date("2018-03-25"),
      },
      {
        slug: "seventeen",
        nameEn: "SEVENTEEN",
        nameKr: "세븐틴",
        agency: "Pledis Entertainment",
        debutDate: new Date("2015-05-26"),
      },
      {
        slug: "red-velvet",
        nameEn: "Red Velvet",
        nameKr: "레드벨벳",
        agency: "SM Entertainment",
        debutDate: new Date("2014-03-17"),
      },
      {
        slug: "txt",
        nameEn: "TXT",
        nameKr: "투모로우엑스투게더",
        agency: "HYBE",
        debutDate: new Date("2019-03-04"),
      },
      {
        slug: "aespa",
        nameEn: "aespa",
        nameKr: "에스파",
        agency: "SM Entertainment",
        debutDate: new Date("2020-11-17"),
      },
      {
        slug: "nct-dream",
        nameEn: "NCT Dream",
        nameKr: "엔씨티 드림",
        agency: "SM Entertainment",
        debutDate: new Date("2016-08-02"),
      },
      {
        slug: "newjeans",
        nameEn: "NewJeans",
        nameKr: "뉴진스",
        agency: "HYBE",
        debutDate: new Date("2022-08-01"),
      },
      {
        slug: "ive",
        nameEn: "IVE",
        nameKr: "아이브",
        agency: "Starship Entertainment",
        debutDate: new Date("2021-12-01"),
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Seeded ${groups.count} groups`);

  // Seed Members
  const memberPairs = [
    { group: "twice", name: "TZUYU", nameKr: "쯔위" },
    { group: "twice", name: "SANA", nameKr: "사나" },
    { group: "blackpink", name: "JENNIE", nameKr: "제니" },
    { group: "exo", name: "SEHUN", nameKr: "세훈" },
    { group: "stray-kids", name: "FELIX", nameKr: "펠릭스" },
    { group: "seventeen", name: "JOSHUA", nameKr: "조슈아" },
    { group: "red-velvet", name: "JOY", nameKr: "조이" },
    { group: "txt", name: "YEONJUN", nameKr: "연준" },
    { group: "aespa", name: "KARINA", nameKr: "카리나" },
    { group: "nct-dream", name: "MARK", nameKr: "마크" },
    { group: "newjeans", name: "HANNI", nameKr: "하니" },
    { group: "ive", name: "WONYOUNG", nameKr: "원영" },
  ];

  for (const pair of memberPairs) {
    const group = await prisma.group.findUnique({
      where: { slug: pair.group },
    });

    if (group) {
      await prisma.member.upsert({
        where: {
          groupId_slug: {
            groupId: group.id,
            slug: pair.name.toLowerCase(),
          },
        },
        create: {
          slug: pair.name.toLowerCase(),
          nameEn: pair.name,
          nameKr: pair.nameKr,
          groupId: group.id,
        },
        update: {},
      });
    }
  }
  console.log(`✅ Seeded members`);

  // Seed PhotoCards
  const photoCardPairs = [
    {
      slug: "twice-tzuyu-Feel-Special",
      name: "TZUYU - Feel Special",
      groupSlug: "twice",
      memberName: "TZUYU",
      estimatedPrice: 45.99,
      badge: "Hologram",
    },
    {
      slug: "blackpink-jennie-aptober",
      name: "JENNIE - APTOBER",
      groupSlug: "blackpink",
      memberName: "JENNIE",
      estimatedPrice: 89.5,
      badge: "Signed",
    },
    {
      slug: "exo-sehun-obsession",
      name: "SEHUN - Obsession",
      groupSlug: "exo",
      memberName: "SEHUN",
      estimatedPrice: 35.0,
      badge: null,
    },
    {
      slug: "stray-kids-felix-noeasy",
      name: "FELIX - NOEASY",
      groupSlug: "stray-kids",
      memberName: "FELIX",
      estimatedPrice: 12.99,
      badge: "Rare",
    },
    {
      slug: "seventeen-joshua-sector17",
      name: "JOSHUA - Sector17",
      groupSlug: "seventeen",
      memberName: "JOSHUA",
      estimatedPrice: 22.5,
      badge: null,
    },
    {
      slug: "red-velvet-joy-feel-good",
      name: "JOY - Feel Good",
      groupSlug: "red-velvet",
      memberName: "JOY",
      estimatedPrice: 67.0,
      badge: "Limited",
    },
    {
      slug: "txt-yeonjun-chaos",
      name: "YEONJUN - Chaos",
      groupSlug: "txt",
      memberName: "YEONJUN",
      estimatedPrice: 18.99,
      badge: null,
    },
    {
      slug: "aespa-karina-spicy",
      name: "KARINA - Spicy",
      groupSlug: "aespa",
      memberName: "KARINA",
      estimatedPrice: 55.0,
      badge: "Hologram",
    },
    {
      slug: "nct-dream-mark-hello-future",
      name: "MARK - Hello Future",
      groupSlug: "nct-dream",
      memberName: "MARK",
      estimatedPrice: 28.5,
      badge: null,
    },
    {
      slug: "twice-sana-scientist",
      name: "SANA - Scientist",
      groupSlug: "twice",
      memberName: "SANA",
      estimatedPrice: 42.0,
      badge: "Signed",
    },
    {
      slug: "newjeans-hanni-attention",
      name: "HANNI - Attention",
      groupSlug: "newjeans",
      memberName: "HANNI",
      estimatedPrice: 15.99,
      badge: null,
    },
    {
      slug: "ive-wonyoung-either-or",
      name: "WONYOUNG - Either Or",
      groupSlug: "ive",
      memberName: "WONYOUNG",
      estimatedPrice: 77.5,
      badge: "Limited",
    },
  ];

  for (const card of photoCardPairs) {
    const group = await prisma.group.findUnique({
      where: { slug: card.groupSlug },
    });

    if (group) {
      const member = await prisma.member.findUnique({
        where: {
          groupId_slug: {
            groupId: group.id,
            slug: card.memberName.toLowerCase(),
          },
        },
      });

      await prisma.photoCard.upsert({
        where: { slug: card.slug },
        create: {
          slug: card.slug,
          cardName: card.name,
          groupId: group.id,
          memberId: member?.id,
          estimatedPrice: card.estimatedPrice,
          badge: card.badge,
          wantCount: Math.floor(Math.random() * 3000),
          haveCount: Math.floor(Math.random() * 500),
          viewCount: Math.floor(Math.random() * 10000),
        },
        update: {},
      });
    }
  }
  console.log(`✅ Seeded photo cards`);
}

async function main() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("STANPC DATABASE SEEDING");
    console.log("=".repeat(60) + "\n");

    // First, seed directory content (Groups, Members, PhotoCards)
    await seedDirectoryContent();

    // Then, seed market data (PriceHistory, GlobalSKUMapping)
    await seedMarketData();

    console.log("\n" + "=".repeat(60));
    console.log("✨ All seeding completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
