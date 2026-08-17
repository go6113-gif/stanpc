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
  try {
    console.log("📥 Loading eBay data...");
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const data: EbayData = JSON.parse(rawData);

    const itemsByGroup = data.items_by_group;
    const groupName = "BTS";
    const items = itemsByGroup[groupName];

    console.log(`\n🔍 Checking BTS items (first 2):`);
    items.slice(0, 2).forEach((item, idx) => {
      console.log(`\nItem ${idx + 1}:`);
      console.log(`  title: ${item.title}`);
      console.log(`  image_url: ${item.image_url.substring(0, 80)}...`);
      console.log(`  price: ${item.price}`);
    });

    // Find existing BTS card
    const existing = await prisma.photoCard.findFirst({
      where: { group: { nameEn: "BTS" } },
      select: { slug: true, cardName: true, imageUrl: true, estimatedPrice: true },
    });

    console.log(`\n💾 Existing BTS card in DB:`);
    console.log(`  slug: ${existing?.slug}`);
    console.log(`  cardName: ${existing?.cardName}`);
    console.log(`  imageUrl: ${existing?.imageUrl?.substring(0, 80) || "NULL"}...`);
    console.log(`  estimatedPrice: ${existing?.estimatedPrice}`);

    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
