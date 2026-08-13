/**
 * Repoint Album.coverImageUrl from the external CDN to our self-hosted WebP
 * assets produced by `scripts/fetch_album_version_images.py`.
 *
 * Matching is done on the stored URL itself rather than by re-deriving album
 * slugs: seed.ts picks an album's cover by taking the first version row it
 * sees, so the URL is the only field guaranteed to line up with the manifest.
 *
 * Version-level images (6,646) have no home in the schema — there is no
 * AlbumVersion model — so they stay addressable through the manifest JSON
 * only. This script therefore touches the 3,044 album covers and nothing else.
 *
 * Idempotent: rows already pointing at /images/album-versions are skipped, and
 * `--dry` reports what would change without writing.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

const MANIFEST_PATH = path.join(
  "D:",
  "StanPC",
  "data",
  "album_version_image_manifest.json",
);
const LOCAL_PREFIX = "/images/album-versions";

type ManifestItem = {
  version_id: string;
  url: string;
  local_path: string;
  status: "ok" | "skipped" | "failed" | "pending";
};

async function main() {
  const dryRun = process.argv.includes("--dry");

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    console.error("   Run scripts/fetch_album_version_images.py first.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const items: ManifestItem[] = manifest.items ?? [];

  // Only images that actually landed on disk are safe to point the DB at.
  const urlToLocal = new Map<string, string>();
  for (const it of items) {
    if (it.status === "ok" || it.status === "skipped") {
      urlToLocal.set(it.url, it.local_path);
    }
  }

  console.log(`📦 Manifest : ${items.length} versions, ${urlToLocal.size} on disk`);
  console.log(`🔧 Mode     : ${dryRun ? "DRY RUN (no writes)" : "APPLY"}\n`);

  const albums = await prisma.album.findMany({
    select: { id: true, title: true, coverImageUrl: true },
  });

  let updated = 0;
  let alreadyLocal = 0;
  let noMatch = 0;
  let noCover = 0;
  const unmatched: string[] = [];

  for (const album of albums) {
    const cover = album.coverImageUrl?.trim();

    if (!cover) {
      noCover++;
      continue;
    }
    if (cover.startsWith(LOCAL_PREFIX)) {
      alreadyLocal++;
      continue;
    }

    const local = urlToLocal.get(cover);
    if (!local) {
      noMatch++;
      if (unmatched.length < 5) unmatched.push(`${album.title} → ${cover}`);
      continue;
    }

    if (!dryRun) {
      await prisma.album.update({
        where: { id: album.id },
        data: { coverImageUrl: local },
      });
    }
    updated++;
  }

  console.log("=".repeat(62));
  console.log(`  albums total       : ${albums.length}`);
  console.log(`  ${dryRun ? "would update" : "updated     "}       : ${updated}`);
  console.log(`  already local      : ${alreadyLocal}`);
  console.log(`  no manifest match  : ${noMatch}`);
  console.log(`  no cover set       : ${noCover}`);
  console.log("=".repeat(62));

  if (unmatched.length) {
    console.log("\n  unmatched samples:");
    for (const u of unmatched) console.log(`    ${u}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
