import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Applies thumbImagePath ONLY for eBay-sourced successes recorded by
// scripts/pilot_image_pipeline.py. Fallback-sourced candidates are
// deliberately never written here — they stay in progress.fallback_needed
// for human review.
async function main() {
  const progress = JSON.parse(readFileSync("../scripts/pilot-progress.json", "utf-8"));
  const successes: { id: string; slug: string; thumbImagePath: string }[] = progress.ebay_success;

  console.log(`Applying thumbImagePath for ${successes.length} eBay-sourced cards...`);

  let updated = 0;
  for (const s of successes) {
    await prisma.photoCard.update({
      where: { id: s.id },
      data: { thumbImagePath: s.thumbImagePath },
    });
    updated++;
  }

  console.log(`Updated ${updated} PhotoCard rows.`);
  console.log(`Fallback candidates awaiting review: ${progress.fallback_needed.length}`);
  console.log(`Complete failures: ${progress.failed.length}`);
}

main().finally(() => prisma.$disconnect());
