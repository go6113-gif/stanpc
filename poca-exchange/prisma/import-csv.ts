import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify, dedupeSlug } from "../lib/slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

// The raw CSVs live at the repo root, one level above this Next.js project.
const DATA_DIR = path.resolve(__dirname, "..", "..");

const GROUPS_CSV = path.join(DATA_DIR, "biasroom_groups_master.csv");
// Sourced from Wikidata P463/P527 membership (scripts/fetch_members_wikidata.py),
// not regex-parsed from album version names — every row is a real member by
// construction, so it needs no noise-word denylist. Replaces the retired
// group_members_final.csv (1st-pass regex parse) + member-name-denylist.ts
// combo — see prisma/member-name-denylist.ts's header for why that existed.
const MEMBERS_CSV = path.join(DATA_DIR, "group_members_wikidata.csv");
const PHOTOCARDS_CSV = path.join(DATA_DIR, "biasroom_photocards_master.csv");

function readCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

/** Runs `fn` over `items` with at most `concurrency` in flight at once. */
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

/** Parses the Python-list-literal strings biasroom exports for aliases, e.g. "['ace']". */
function parsePyListLiteral(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "[]") return [];
  return [...trimmed.matchAll(/'([^']*)'|"([^"]*)"/g)]
    .map((m) => (m[1] ?? m[2] ?? "").trim())
    .filter(Boolean);
}

function parseReleaseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function main() {
  const startedAt = Date.now();

  // ---------------------------------------------------------------------
  // Phase 1: Groups
  // ---------------------------------------------------------------------
  const groupRows = readCsv(GROUPS_CSV);
  console.log(`Groups CSV: ${groupRows.length} rows`);

  const groupSlugsUsed = new Set<string>();
  const groupIdByName = new Map<string, string>();
  const groupSlugByName = new Map<string, string>();

  const groupUpserts = groupRows
    .map((row) => {
      const nameEn = row["Name_EN"]?.trim();
      if (!nameEn) return null;
      const slug = dedupeSlug(slugify(nameEn), groupSlugsUsed);
      groupSlugByName.set(nameEn, slug);
      return {
        nameEn,
        slug,
        aliases: parsePyListLiteral(row["Name_KR"] ?? ""),
        imageUrl: row["Image_URL"]?.trim() || null,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  await runBatches(groupUpserts, 20, async (g) => {
    const group = await prisma.group.upsert({
      where: { slug: g.slug },
      update: {
        nameEn: g.nameEn,
        aliases: g.aliases,
        ...(g.imageUrl ? { imageUrl: g.imageUrl } : {}),
      },
      create: {
        slug: g.slug,
        nameEn: g.nameEn,
        aliases: g.aliases,
        imageUrl: g.imageUrl,
      },
    });
    groupIdByName.set(g.nameEn, group.id);
  });
  console.log(`Groups upserted: ${groupIdByName.size}`);

  // ---------------------------------------------------------------------
  // Phase 2: Members
  // ---------------------------------------------------------------------
  const memberRows = readCsv(MEMBERS_CSV);
  console.log(`Members CSV: ${memberRows.length} rows`);

  const membersByGroup = new Map<string, string[]>(); // groupName -> real member names (for matching in Phase 4)
  let rejectedNoGroup = 0;

  type MemberUpsert = { groupName: string; name: string; nameKr: string | null };
  const seenPair = new Set<string>();
  const memberUpserts: MemberUpsert[] = [];

  for (const row of memberRows) {
    const groupName = row["Group_Name"]?.trim();
    const name = row["Member_Name_EN"]?.trim();
    if (!groupName || !name) continue;
    const groupId = groupIdByName.get(groupName);
    if (!groupId) {
      rejectedNoGroup += 1;
      continue;
    }
    const pairKey = `${groupName}::${name.toLowerCase()}`;
    if (seenPair.has(pairKey)) continue;
    seenPair.add(pairKey);
    const nameKr = row["Member_Name_KO"]?.trim() || null;
    memberUpserts.push({ groupName, name, nameKr });

    const list = membersByGroup.get(groupName) ?? [];
    list.push(name);
    membersByGroup.set(groupName, list);
  }

  // Longest names first so "Standard Winter Edition"-style version text
  // matches the most specific member name available.
  for (const [groupName, names] of membersByGroup) {
    membersByGroup.set(
      groupName,
      [...names].sort((a, b) => b.length - a.length)
    );
  }

  const memberSlugsUsedByGroup = new Map<string, Set<string>>();
  const memberIdByGroupAndName = new Map<string, string>();

  await runBatches(memberUpserts, 20, async (m) => {
    const groupId = groupIdByName.get(m.groupName)!;
    const used = memberSlugsUsedByGroup.get(groupId) ?? new Set<string>();
    memberSlugsUsedByGroup.set(groupId, used);
    const slug = dedupeSlug(slugify(m.name), used);

    const member = await prisma.member.upsert({
      where: { groupId_slug: { groupId, slug } },
      update: { nameEn: m.name, nameKr: m.nameKr },
      create: { groupId, slug, nameEn: m.name, nameKr: m.nameKr },
    });
    memberIdByGroupAndName.set(`${m.groupName}::${m.name.toLowerCase()}`, member.id);
  });
  console.log(
    `Members upserted: ${memberIdByGroupAndName.size} (unmatched group: ${rejectedNoGroup})`
  );

  // Final pipeline cutover to Wikidata as the sole Member source (see the
  // MEMBERS_CSV comment above) — reconcile every group in the DB, not just
  // ones this run's CSV touched, so members left over from the retired
  // regex+denylist pipeline (e.g. "Standard", "Acoustic" on groups Wikidata
  // doesn't cover) are swept too instead of lingering forever.
  // PhotoCard.memberId is onDelete: SetNull, so this never drops a card.
  let staleMembersRemoved = 0;
  const allGroupIds = [...groupIdByName.values()];
  await runBatches(allGroupIds, 10, async (groupId) => {
    const validSlugs = [...(memberSlugsUsedByGroup.get(groupId) ?? [])];
    const { count } = await prisma.member.deleteMany({
      where: { groupId, ...(validSlugs.length > 0 ? { slug: { notIn: validSlugs } } : {}) },
    });
    staleMembersRemoved += count;
  });
  if (staleMembersRemoved > 0) {
    console.log(`Stale/noise members removed on re-import: ${staleMembersRemoved}`);
  }

  // ---------------------------------------------------------------------
  // Phase 3 & 4: Albums + PhotoCards (from the album/version dataset)
  // ---------------------------------------------------------------------
  const cardRows = readCsv(PHOTOCARDS_CSV);
  console.log(`Photocards(album/version) CSV: ${cardRows.length} rows`);

  const albumSlugsUsedByGroup = new Map<string, Set<string>>();
  const albumIdByGroupAndTitle = new Map<string, string>();
  let cardsSkippedNoGroup = 0;
  let cardsSkippedNoImage = 0;
  let cardsMatchedToMember = 0;

  const cardSlugsUsed = new Set<string>();

  type CardRow = {
    groupName: string;
    groupId: string;
    albumTitle: string;
    versionName: string;
    imageUrl: string;
    releaseDate: Date | null;
  };

  const validCardRows: CardRow[] = [];
  for (const row of cardRows) {
    const groupName = row["Group_Name"]?.trim();
    const albumTitle = row["Album_Title"]?.trim();
    const versionName = row["Version_Name"]?.trim();
    const imageUrl = row["Image_URL"]?.trim();
    if (!groupName || !albumTitle || !versionName) continue;
    const groupId = groupIdByName.get(groupName);
    if (!groupId) {
      cardsSkippedNoGroup += 1;
      continue;
    }
    if (!imageUrl) {
      cardsSkippedNoImage += 1;
      continue;
    }
    validCardRows.push({
      groupName,
      groupId,
      albumTitle,
      versionName,
      imageUrl,
      releaseDate: parseReleaseDate(row["Release_Date"] ?? ""),
    });
  }

  // Albums first (PhotoCard.albumId depends on them), de-duplicated by (group, title).
  const albumKeySeen = new Set<string>();
  const albumUpserts: { groupId: string; title: string; releaseDate: Date | null }[] = [];
  for (const c of validCardRows) {
    const key = `${c.groupId}::${c.albumTitle.toLowerCase()}`;
    if (albumKeySeen.has(key)) continue;
    albumKeySeen.add(key);
    albumUpserts.push({ groupId: c.groupId, title: c.albumTitle, releaseDate: c.releaseDate });
  }

  await runBatches(albumUpserts, 20, async (a) => {
    const used = albumSlugsUsedByGroup.get(a.groupId) ?? new Set<string>();
    albumSlugsUsedByGroup.set(a.groupId, used);
    const slug = dedupeSlug(slugify(a.title), used);

    const album = await prisma.album.upsert({
      where: { groupId_slug: { groupId: a.groupId, slug } },
      update: { title: a.title, ...(a.releaseDate ? { releaseDate: a.releaseDate } : {}) },
      create: { groupId: a.groupId, slug, title: a.title, releaseDate: a.releaseDate },
    });
    albumIdByGroupAndTitle.set(`${a.groupId}::${a.title.toLowerCase()}`, album.id);
  });
  console.log(`Albums upserted: ${albumIdByGroupAndTitle.size}`);

  function findMemberId(groupName: string, versionName: string): string | null {
    const candidates = membersByGroup.get(groupName) ?? [];
    for (const name of candidates) {
      const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(name)}(?![a-z0-9])`, "i");
      if (pattern.test(versionName)) {
        return memberIdByGroupAndName.get(`${groupName}::${name.toLowerCase()}`) ?? null;
      }
    }
    return null;
  }

  await runBatches(validCardRows, 25, async (c) => {
    const albumId = albumIdByGroupAndTitle.get(`${c.groupId}::${c.albumTitle.toLowerCase()}`)!;
    const memberId = findMemberId(c.groupName, c.versionName);
    if (memberId) cardsMatchedToMember += 1;

    const groupSlug = groupSlugByName.get(c.groupName)!;
    const albumSlug = slugify(c.albumTitle);
    const baseSlug = slugify(`${groupSlug}-${albumSlug}-${c.versionName}`);
    const slug = dedupeSlug(baseSlug, cardSlugsUsed);

    await prisma.photoCard.upsert({
      where: { slug },
      update: {
        cardName: c.versionName,
        imageUrl: c.imageUrl,
        groupId: c.groupId,
        albumId,
        ...(memberId ? { memberId } : {}),
      },
      create: {
        slug,
        cardName: c.versionName,
        imageUrl: c.imageUrl,
        groupId: c.groupId,
        albumId,
        memberId,
      },
    });
  });

  // ---------------------------------------------------------------------
  // Final report — authoritative counts straight from the database.
  // ---------------------------------------------------------------------
  const [groupCount, memberCount, albumCount, cardCount] = await Promise.all([
    prisma.group.count(),
    prisma.member.count(),
    prisma.album.count(),
    prisma.photoCard.count(),
  ]);

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("\n=== Import complete ===");
  console.log(`Elapsed: ${elapsedSec}s`);
  console.log(`Photocard rows skipped (group not found): ${cardsSkippedNoGroup}`);
  console.log(`Photocard rows skipped (no image): ${cardsSkippedNoImage}`);
  console.log(`Photocards matched to a member: ${cardsMatchedToMember} / ${validCardRows.length}`);
  console.log("--- DB totals ---");
  console.log(`Group:     ${groupCount}`);
  console.log(`Member:    ${memberCount}`);
  console.log(`Album:     ${albumCount}`);
  console.log(`PhotoCard: ${cardCount}`);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
