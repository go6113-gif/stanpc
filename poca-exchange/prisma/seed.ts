import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

// Helper: Parse CSV with quoted field support
async function parseCSV(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];
    let isFirstLine = true;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      if (isFirstLine) {
        headers = parseCSVLine(line);
        isFirstLine = false;
      } else {
        const values = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });
        rows.push(row);
      }
    });

    rl.on("close", () => resolve(rows));
    rl.on("error", reject);
  });
}

// Parse CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Generate slug from name (e.g., "TWICE" -> "twice", "&TEAM" -> "and-team")
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function seedGroupsFromCSV() {
  console.log("📊 Phase 1: Seeding Groups from biasroom_groups_master.csv...");

  const csvPath = path.join("D:", "StanPC", "data", "biasroom_groups_master.csv");
  const rows = await parseCSV(csvPath);

  let created = 0;
  for (const row of rows) {
    const nameEn = row["Name_EN"]?.trim() || "";
    const nameKr = row["Name_KR"]?.trim() || "";

    if (!nameEn) continue;

    const slug = generateSlug(nameEn);
    const imageUrl = row["Image_URL"]?.trim() || null;

    try {
      await prisma.group.upsert({
        where: { slug },
        create: {
          slug,
          nameEn,
          nameKr: nameKr || null,
          imageUrl: imageUrl || null,
        },
        update: {
          imageUrl: imageUrl || undefined,
        },
      });
      created++;
    } catch (e: any) {
      if (!e.message.includes("Unique constraint")) {
        console.error(`  ❌ Error creating group ${nameEn}:`, e.message);
      }
    }
  }

  console.log(`  ✅ Seeded ${created} groups from CSV`);
  return rows.length;
}

async function seedAlbumsFromCSV() {
  console.log("\n📀 Phase 2: Seeding Albums from biasroom_photocards_master.csv...");

  const csvPath = path.join("D:", "StanPC", "data", "biasroom_photocards_master.csv");
  const rows = await parseCSV(csvPath);

  const albumMap = new Map<string, any>(); // Dedupe by groupName + albumTitle
  let created = 0;

  for (const row of rows) {
    const groupName = row["Group_Name"]?.trim() || "";
    const albumTitle = row["Album_Title"]?.trim() || "";
    const versionName = row["Version_Name"]?.trim() || "";
    const releaseDate = row["Release_Date"]?.trim() || "";
    const imageUrl = row["Image_URL"]?.trim() || "";

    if (!groupName || !albumTitle) continue;

    const key = `${groupName}|${albumTitle}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, {
        groupName,
        albumTitle,
        versionName,
        releaseDate,
        imageUrl,
      });
    }
  }

  // Insert into DB
  let idx = 0;
  for (const [_, album] of albumMap) {

    const group = await prisma.group.findFirst({
      where: { nameEn: album.groupName },
    });

    if (!group) {
      console.warn(`    ⚠️  Group not found: ${album.groupName}`);
      continue;
    }

    const slug = generateSlug(`${album.groupName}-${album.albumTitle}`);
    let parsedDate: Date | null = null;
    if (album.releaseDate) {
      const date = new Date(album.releaseDate);
      parsedDate = isNaN(date.getTime()) ? null : date;
    }

    try {
      await prisma.album.upsert({
        where: { groupId_slug: { groupId: group.id, slug } },
        create: {
          slug,
          title: album.albumTitle,
          coverImageUrl: album.imageUrl || null,
          releaseDate: parsedDate,
          groupId: group.id,
        },
        update: {
          coverImageUrl: album.imageUrl || undefined,
          releaseDate: parsedDate || undefined,
        },
      });
      created++;
    } catch (e: any) {
      console.error(`    ❌ Error creating album ${album.albumTitle}:`, e.message);
    }

    idx++;
  }

  console.log(`  ✅ Seeded ${created} albums from CSV (deduped)`);
}

async function seedPhotoCardsFromCSV() {
  console.log("\n🎴 Phase 3: Seeding PhotoCards from poca_master_db_mb.csv...");

  const csvPath = path.join("D:", "StanPC", "data", "poca_master_db_mb.csv");
  const rows = await parseCSV(csvPath);

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const skuId = row["SKU_ID"]?.trim() || "";
    const groupName = row["Group_Name"]?.trim() || "";
    const memberName = row["Member_Name"]?.trim() || "";
    const cardTitle = row["Card_Title"]?.trim() || "";
    // Use Album_Cover_URL if Image_URL is empty (fix for coverartarchive.org CDN)
    const imageUrl = (row["Image_URL"]?.trim() || row["Album_Cover_URL"]?.trim()) || "";
    const usPrice = parseFloat(row["US_Market_Price"] || "0") || null;

    if (!skuId || !cardTitle) continue;

    // Find group
    const group = await prisma.group.findFirst({
      where: { nameEn: groupName },
    });

    if (!group) continue;

    // Find or create member
    let member = null;
    if (memberName && memberName !== "Unknown") {
      const memberSlug = generateSlug(memberName);
      member = await prisma.member.upsert({
        where: {
          groupId_slug: {
            groupId: group.id,
            slug: memberSlug,
          },
        },
        create: {
          slug: memberSlug,
          nameEn: memberName,
          groupId: group.id,
        },
        update: {
          nameEn: memberName,
        },
      });
    }

    const slug = generateSlug(skuId);

    try {
      const existing = await prisma.photoCard.findUnique({
        where: { slug },
      });

      if (existing) {
        await prisma.photoCard.update({
          where: { slug },
          data: {
            estimatedPrice: usPrice || existing.estimatedPrice,
            imageUrl: imageUrl || existing.imageUrl,
          },
        });
        updated++;
      } else {
        await prisma.photoCard.create({
          data: {
            slug,
            cardName: cardTitle,
            imageUrl: imageUrl || null,
            estimatedPrice: usPrice,
            groupId: group.id,
            memberId: member?.id || null,
            wantCount: Math.floor(Math.random() * 200),
            haveCount: Math.floor(Math.random() * 50),
            viewCount: Math.floor(Math.random() * 1000),
          },
        });
        created++;
      }
    } catch (e: any) {
      console.error(`    ❌ Error seeding card ${skuId}:`, e.message);
    }
  }

  console.log(`  ✅ Created ${created} cards, Updated ${updated} cards from CSV`);
}

async function seedPriceHistoryFromCSV() {
  console.log("\n💰 Phase 4: Seeding PriceHistory from poca_master_db_mb.csv...");

  const csvPath = path.join("D:", "StanPC", "data", "poca_master_db_mb.csv");
  const rows = await parseCSV(csvPath);

  let seeded = 0;

  for (const row of rows) {
    const skuId = row["SKU_ID"]?.trim() || "";
    const usPrice = parseFloat(row["US_Market_Price"] || "0");

    if (!skuId || !usPrice || usPrice === 0) continue;

    const slug = generateSlug(skuId);
    const card = await prisma.photoCard.findUnique({ where: { slug } });

    if (!card) continue;

    try {
      await prisma.priceHistory.create({
        data: {
          price: usPrice,
          currency: "USD",
          market: "ebay",
          cardId: card.id,
          createdAt: new Date(),
        },
      });
      seeded++;
    } catch (e: any) {
      if (!e.message.includes("constraint")) {
        console.error(`    ❌ Error: ${e.message}`);
      }
    }
  }

  console.log(`  ✅ Seeded ${seeded} price history records`);
}

async function main() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("STANPC MASTER DATA SEEDING");
    console.log("=".repeat(60) + "\n");

    // Phase 1-4: Seed from CSV files
    await seedGroupsFromCSV();
    await seedAlbumsFromCSV();
    await seedPhotoCardsFromCSV();
    await seedPriceHistoryFromCSV();

    console.log("\n" + "=".repeat(60));
    console.log("✨ All seeding completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
