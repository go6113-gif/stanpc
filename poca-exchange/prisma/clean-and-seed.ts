import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify, dedupeSlug } from "../lib/slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

const DATA_FILE = path.resolve(__dirname, "..", "..", "data", "ebay_10core_groups.json");

interface EbayItem {
  group: string;
  item_id: string;
  title: string;
  image_url: string;
  price: number;
  currency: string;
  condition: string;
  seller: string;
  item_location: string;
  url: string;
  collected_at: string;
}

interface EbayData {
  meta: Record<string, unknown>;
  items_by_group: Record<string, EbayItem[]>;
}

async function main() {
  const startedAt = Date.now();

  try {
    console.log("🗑️  Cleaning up PhotoCards...");
    const deleted = await prisma.photoCard.deleteMany({
      where: { group: { slug: { in: ["bts", "seventeen", "stray-kids", "enhypen", "tomorrow-x-together", "newjeans", "ive", "aespa", "le-sserafim", "twice"] } } },
    });
    console.log(`✓ Deleted ${deleted.count} old PhotoCards`);

    // Load JSON data
    console.log("\n📥 Loading eBay 10-core data...");
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const data: EbayData = JSON.parse(rawData);
    const itemsByGroup = data.items_by_group;
    console.log(`✓ Loaded ${Object.keys(itemsByGroup).length} groups`);

    // Get or create groups
    const groupMap = new Map<string, string>();

    for (const groupName of Object.keys(itemsByGroup)) {
      let group = await prisma.group.findUnique({
        where: { slug: slugify(groupName) },
      });

      if (!group) {
        group = await prisma.group.create({
          data: {
            slug: slugify(groupName),
            nameEn: groupName,
            nameKr: groupName,
          },
        });
      }
      groupMap.set(groupName, group.id);
    }
    console.log(`✓ ${groupMap.size} groups ready`);

    // Seed PhotoCards
    let totalCreated = 0;
    const cardSlugsUsed = new Set<string>();

    for (const [groupName, items] of Object.entries(itemsByGroup)) {
      const groupId = groupMap.get(groupName);
      if (!groupId) {
        console.warn(`⚠ Group not found: ${groupName}`);
        continue;
      }

      console.log(`📸 Seeding ${groupName}... (${items.length} items)`);

      for (const item of items) {
        try {
          const baseSlug = `${slugify(groupName)}-${item.item_id.replace(/[|]/g, "-").toLowerCase()}`;
          const slug = dedupeSlug(baseSlug, cardSlugsUsed);

          await prisma.photoCard.create({
            data: {
              slug,
              cardName: item.title.substring(0, 255),
              imageUrl: item.image_url,
              estimatedPrice: item.price,
              groupId,
            },
          });

          totalCreated++;
        } catch (err) {
          if ((err as any)?.code === "P2002") {
            // Unique constraint violation, skip
            continue;
          }
          console.error(`❌ Error on ${item.item_id}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`\n✅ Fresh seeding complete!`);
    console.log(`   Total PhotoCards created: ${totalCreated}`);
    console.log(`   Duration: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

    // Verify
    const count = await prisma.photoCard.count();
    const sample = await prisma.photoCard.findFirst({
      include: { group: { select: { nameEn: true } } },
    });

    console.log(`\n🔍 Verification:`);
    console.log(`   Total in DB: ${count}`);
    console.log(`   Sample: ${sample?.cardName} (${sample?.group?.nameEn})`);
    console.log(`   Image URL: ${sample?.imageUrl?.substring(0, 80)}...`);

    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
