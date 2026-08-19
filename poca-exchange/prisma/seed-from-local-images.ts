import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify, dedupeSlug } from "../lib/slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(DATA_DIR, "data", "local_photocard_images_manifest.json");

interface ImageMetadata {
  filePath: string;
  group: string;
  groupNameEn: string;
  member: string;
  album: string;
  sequence: number;
  fileName: string;
  fileSize: number;
  checksum: string;
}

interface Manifest {
  images: ImageMetadata[];
  stats: {
    totalImages: number;
    groupCount: number;
    memberCount: number;
    albumCount: number;
  };
}

async function runBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

async function ensureTablesExist() {
  try {
    await prisma.group.count();
    console.log("✓ Tables already exist");
  } catch (err: any) {
    if (err.code === "P2021" || err.message?.includes("does not exist") || err.code === "P2022") {
      console.log("⚙️ Creating/updating tables...");
      try {
        await prisma.$executeRawUnsafe(`
          DROP TABLE IF EXISTS photo_cards CASCADE;
          DROP TABLE IF EXISTS members CASCADE;
          DROP TABLE IF EXISTS albums CASCADE;
          DROP TABLE IF EXISTS groups CASCADE;

          CREATE TABLE IF NOT EXISTS groups (
            id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            slug TEXT NOT NULL UNIQUE,
            "nameEn" TEXT NOT NULL,
            "nameKr" TEXT,
            aliases TEXT[] DEFAULT ARRAY[]::TEXT[],
            agency TEXT,
            "debutDate" TIMESTAMP(3),
            "imageUrl" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS members (
            id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "groupId" TEXT NOT NULL,
            slug TEXT NOT NULL,
            "nameEn" TEXT NOT NULL,
            "nameKr" TEXT,
            "imageUrl" TEXT,
            position TEXT,
            "artist_id" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("groupId", slug),
            CONSTRAINT members_groupId_fkey FOREIGN KEY ("groupId") REFERENCES groups (id) ON DELETE CASCADE ON UPDATE CASCADE
          );

          CREATE TABLE IF NOT EXISTS albums (
            id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "groupId" TEXT NOT NULL,
            slug TEXT NOT NULL,
            title TEXT NOT NULL,
            "coverImageUrl" TEXT,
            "releaseDate" TIMESTAMP(3),
            "artist_id" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("groupId", slug),
            CONSTRAINT albums_groupId_fkey FOREIGN KEY ("groupId") REFERENCES groups (id) ON DELETE CASCADE ON UPDATE CASCADE
          );

          CREATE TABLE IF NOT EXISTS photo_cards (
            id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            slug TEXT NOT NULL UNIQUE,
            "cardName" TEXT,
            version TEXT,
            "imageUrl" TEXT,
            "thumbImagePath" TEXT,
            "groupId" TEXT NOT NULL,
            "memberId" TEXT,
            "albumId" TEXT,
            "catalog_version_id" TEXT,
            "contributed_by_id" TEXT,
            badge TEXT,
            "estimatedPrice" FLOAT8,
            "wantCount" INTEGER NOT NULL DEFAULT 0,
            "haveCount" INTEGER NOT NULL DEFAULT 0,
            "viewCount" INTEGER NOT NULL DEFAULT 0,
            "clickCount" INTEGER NOT NULL DEFAULT 0,
            "price_usd" FLOAT8,
            "guide_content" TEXT,
            "source_type" TEXT,
            retailer TEXT,
            round INTEGER,
            material TEXT,
            "visual_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
            phash TEXT,
            "is_indexed" BOOLEAN NOT NULL DEFAULT true,
            "quality_score" FLOAT8 NOT NULL DEFAULT 0.0,
            "artist_id" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT photo_cards_groupId_fkey FOREIGN KEY ("groupId") REFERENCES groups (id) ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT photo_cards_memberId_fkey FOREIGN KEY ("memberId") REFERENCES members (id) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT photo_cards_albumId_fkey FOREIGN KEY ("albumId") REFERENCES albums (id) ON DELETE SET NULL ON UPDATE CASCADE
          );

          CREATE INDEX IF NOT EXISTS members_groupId_idx ON members("groupId");
          CREATE INDEX IF NOT EXISTS members_artist_id_idx ON members("artist_id");
          CREATE INDEX IF NOT EXISTS albums_groupId_idx ON albums("groupId");
          CREATE INDEX IF NOT EXISTS albums_artist_id_idx ON albums("artist_id");
          CREATE INDEX IF NOT EXISTS photo_cards_groupId_idx ON photo_cards("groupId");
          CREATE INDEX IF NOT EXISTS photo_cards_memberId_idx ON photo_cards("memberId");
          CREATE INDEX IF NOT EXISTS photo_cards_albumId_idx ON photo_cards("albumId");
          CREATE INDEX IF NOT EXISTS photo_cards_is_indexed_idx ON photo_cards("is_indexed");
          CREATE INDEX IF NOT EXISTS photo_cards_created_at_idx ON photo_cards("createdAt");
        `);
        console.log("✓ Tables created successfully");
      } catch (createErr) {
        console.error("⚠️ Could not create tables automatically:", createErr);
        throw createErr;
      }
    } else {
      throw err;
    }
  }
}

async function main() {
  const startedAt = Date.now();

  // Force drop all old tables to start fresh
  try {
    console.log("🧹 Cleaning up old tables...");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS photo_cards CASCADE;");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS versions CASCADE;");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS members CASCADE;");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS albums CASCADE;");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS groups CASCADE;");
    console.log("✓ Old tables dropped");
  } catch (err) {
    console.warn("⚠️ Cleanup skipped (tables may not exist)");
  }

  // Ensure tables exist
  await ensureTablesExist();

  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifestRaw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  const manifest: Manifest = JSON.parse(manifestRaw);
  const { images } = manifest;

  console.log(`📦 Loaded manifest: ${images.length} images`);

  // Counters
  let groupsCreated = 0;
  let membersCreated = 0;
  let albumsCreated = 0;
  let photocardsCreated = 0;

  const groupSlugsUsed = new Set<string>();
  const memberSlugsUsedByGroup = new Map<string, Set<string>>();
  const albumSlugsUsedByGroup = new Map<string, Set<string>>();
  const cardSlugsUsed = new Set<string>();

  // Track IDs for foreign keys
  const groupIdBySlug = new Map<string, string>();
  const memberIdByGroupAndSlug = new Map<string, string>();
  const albumIdByGroupAndSlug = new Map<string, string>();

  // -------------------------------------------------------
  // Phase 1: Extract unique groups and create them
  // -------------------------------------------------------
  const uniqueGroups = new Map<string, string>();
  for (const img of images) {
    if (!uniqueGroups.has(img.group)) {
      uniqueGroups.set(img.group, img.groupNameEn);
    }
  }

  console.log(`\n🔄 Phase 1: Creating ${uniqueGroups.size} groups...`);

  const groupEntries = Array.from(uniqueGroups.entries());
  await runBatches(groupEntries, 20, async ([groupSlugRaw, groupNameEn]) => {
    const slug = dedupeSlug(slugify(groupNameEn), groupSlugsUsed);
    groupSlugsUsed.add(slug);

    const group = await prisma.group.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        nameEn: groupNameEn,
        nameKr: null,
      },
    });

    groupIdBySlug.set(groupSlugRaw, group.id);
    memberSlugsUsedByGroup.set(group.id, new Set());
    albumSlugsUsedByGroup.set(group.id, new Set());
    groupsCreated++;
    return group;
  });

  // -------------------------------------------------------
  // Phase 2: Extract unique members and create them
  // -------------------------------------------------------
  const uniqueMembers = new Map<string, Set<string>>();
  for (const img of images) {
    const groupId = groupIdBySlug.get(img.group);
    if (!groupId) continue;

    if (!uniqueMembers.has(groupId)) {
      uniqueMembers.set(groupId, new Set());
    }
    uniqueMembers.get(groupId)!.add(img.member);
  }

  console.log(`\n🔄 Phase 2: Creating members...`);

  const memberCreationTasks: Array<{
    groupId: string;
    member: string;
  }> = [];

  for (const [groupId, memberSet] of uniqueMembers.entries()) {
    for (const member of memberSet) {
      memberCreationTasks.push({ groupId, member });
    }
  }

  await runBatches(memberCreationTasks, 20, async ({ groupId, member }) => {
    const slug = slugify(member);
    const slugWithDedupe = dedupeSlug(slug, memberSlugsUsedByGroup.get(groupId)!);

    memberSlugsUsedByGroup.get(groupId)!.add(slugWithDedupe);

    const memberRecord = await prisma.member.upsert({
      where: {
        groupId_slug: {
          groupId,
          slug: slugWithDedupe,
        },
      },
      update: {},
      create: {
        groupId,
        slug: slugWithDedupe,
        nameEn: member,
        nameKr: null,
      },
    });

    memberIdByGroupAndSlug.set(`${groupId}::${slugWithDedupe}`, memberRecord.id);
    membersCreated++;
    return memberRecord;
  });

  // -------------------------------------------------------
  // Phase 3: Extract unique albums and create them
  // -------------------------------------------------------
  const uniqueAlbums = new Map<string, Set<string>>();
  for (const img of images) {
    const groupId = groupIdBySlug.get(img.group);
    if (!groupId) continue;

    if (!uniqueAlbums.has(groupId)) {
      uniqueAlbums.set(groupId, new Set());
    }
    uniqueAlbums.get(groupId)!.add(img.album);
  }

  console.log(`\n🔄 Phase 3: Creating albums...`);

  const albumCreationTasks: Array<{
    groupId: string;
    album: string;
  }> = [];

  for (const [groupId, albumSet] of uniqueAlbums.entries()) {
    for (const album of albumSet) {
      albumCreationTasks.push({ groupId, album });
    }
  }

  await runBatches(albumCreationTasks, 20, async ({ groupId, album }) => {
    const slug = slugify(album);
    const slugWithDedupe = dedupeSlug(slug, albumSlugsUsedByGroup.get(groupId)!);

    albumSlugsUsedByGroup.get(groupId)!.add(slugWithDedupe);

    const albumRecord = await prisma.album.upsert({
      where: {
        groupId_slug: {
          groupId,
          slug: slugWithDedupe,
        },
      },
      update: {},
      create: {
        groupId,
        slug: slugWithDedupe,
        title: album,
      },
    });

    albumIdByGroupAndSlug.set(`${groupId}::${slugWithDedupe}`, albumRecord.id);
    albumsCreated++;
    return albumRecord;
  });

  // -------------------------------------------------------
  // Phase 4: Create PhotoCards
  // -------------------------------------------------------
  console.log(`\n🔄 Phase 4: Creating ${images.length} photocards...`);

  const cardCreationTasks = images.map((img) => ({
    img,
    groupId: groupIdBySlug.get(img.group)!,
  }));

  await runBatches(cardCreationTasks, 25, async ({ img, groupId }) => {
    // Skip if group not found
    if (!groupId) {
      console.log(`⚠ Skipped: no group found for ${img.group}`);
      return null;
    }

    // Get member slug
    const memberSlug = slugify(img.member);
    const memberSlugsForGroup = memberSlugsUsedByGroup.get(groupId) || new Set();
    const actualMemberSlug = Array.from(memberSlugsForGroup).find((s) =>
      s.startsWith(memberSlug)
    ) || memberSlug;

    const memberId = memberIdByGroupAndSlug.get(`${groupId}::${actualMemberSlug}`);

    // Get album slug
    const albumSlug = slugify(img.album);
    const albumSlugsForGroup = albumSlugsUsedByGroup.get(groupId) || new Set();
    const actualAlbumSlug = Array.from(albumSlugsForGroup).find((s) =>
      s.startsWith(albumSlug)
    ) || albumSlug;

    const albumId = albumIdByGroupAndSlug.get(`${groupId}::${actualAlbumSlug}`);

    // Generate card slug
    const groupSlug = Array.from(groupSlugsUsed).find((s) =>
      img.groupNameEn.toLowerCase().includes(s)
    ) || slugify(img.groupNameEn);

    const baseCardSlug = slugify(
      `${groupSlug}-${actualMemberSlug}-${actualAlbumSlug}-${String(img.sequence).padStart(3, "0")}`
    );
    const cardSlug = dedupeSlug(baseCardSlug, cardSlugsUsed);
    cardSlugsUsed.add(cardSlug);

    // Create PhotoCard
    const photocard = await prisma.photoCard.upsert({
      where: { slug: cardSlug },
      update: {},
      create: {
        slug: cardSlug,
        groupId,
        memberId: memberId || null,
        albumId: albumId || null,
        imageUrl: img.filePath, // Store relative path from root
        cardName: `${img.groupNameEn} ${img.member} ${img.album} #${img.sequence}`,
        wishedCount: 0,
        ownedCount: 0,
        viewCount: 0,
      },
    });

    photocardsCreated++;
    return photocard;
  });

  // -------------------------------------------------------
  // Summary
  // -------------------------------------------------------
  const elapsedSeconds = (Date.now() - startedAt) / 1000;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Seed complete in ${elapsedSeconds.toFixed(2)}s`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Groups created: ${groupsCreated}`);
  console.log(`Members created: ${membersCreated}`);
  console.log(`Albums created: ${albumsCreated}`);
  console.log(`PhotoCards created: ${photocardsCreated}`);
  console.log(`Total: ${groupsCreated + membersCreated + albumsCreated + photocardsCreated} records`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
  process.exit(1);
});
