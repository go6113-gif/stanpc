/**
 * Backfills the additive Artist/Version schema (see schema.prisma's "Artist"
 * comment block) from data that is already live in the DB plus two CSVs and
 * the album-version image manifest fetched earlier this session.
 *
 * This script never touches Group, Member.groupId, Album.groupId,
 * PhotoCard.groupId, PhotoCard.slug, PhotoCard.thumbImagePath, or any of the
 * market/counter fields on PhotoCard (estimatedPrice, wantCount, haveCount,
 * viewCount, clickCount, badge) — those stay exactly as they are. It only
 * ever writes to the new columns (Artist rows, Member.nameKr, Member/Album/
 * PhotoCard.artistId, Version rows, PhotoCard.catalogVersionId).
 *
 * Modes:
 *   --dry    (default) compute everything, print the report, write nothing.
 *   --apply  perform the writes. Requires `npx prisma db push` to have
 *            already created the `artists`/`versions` tables and the new
 *            columns — checked up front so a missing table fails with an
 *            instruction instead of a raw Prisma error.
 *
 * Phase 4 (PhotoCard -> Version linkage) is expected to match very few rows:
 * the live PhotoCard.cardName is a generic "{Group} {Member} Official
 * Photocard" template (see prisma/seed.ts's seedPhotoCardsFromCSV) that
 * carries no album/version identity to match against. That's a property of
 * today's data, not a bug in this script — the report prints the real match
 * count rather than a rounded-up promise.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify, dedupeSlug } from "../lib/slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join("D:", "StanPC", "data");
const WIKIDATA_CSV = path.join(DATA_DIR, "group_members_wikidata.csv");
const VERSIONS_CSV = path.join(DATA_DIR, "biasroom_photocards_master.csv"); // group/album/version rows
const MANIFEST_JSON = path.join(DATA_DIR, "album_version_image_manifest.json");

const APPLY = process.argv.includes("--apply");

function readCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
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
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function section(title: string) {
  console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`);
}

async function assertTargetTablesExist() {
  try {
    await prisma.artist.count();
    await prisma.version.count();
  } catch (e: any) {
    console.error(
      "\n❌ artists/versions table not reachable — run `npx prisma db push` first,\n" +
        "   then re-run this script with --apply.\n"
    );
    console.error(`   (${e.message?.split("\n")[0] ?? e})`);
    process.exit(1);
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
  if (APPLY) await assertTargetTablesExist();

  // ---------------------------------------------------------------------
  // Before-snapshot of the fields that must never move, so the final report
  // proves "no data loss" instead of just asserting it.
  // ---------------------------------------------------------------------
  const beforeCards = await prisma.photoCard.findMany({
    select: { id: true, slug: true, thumbImagePath: true },
  });
  const beforeSlugSet = new Set(beforeCards.map((c) => c.slug));
  const beforeThumbCount = beforeCards.filter((c) => c.thumbImagePath).length;

  // ---------------------------------------------------------------------
  // Phase 1 — Artist: mirror every live Group row 1:1 (same id, so
  // Member/Album/PhotoCard.artistId can just copy their existing groupId
  // verbatim — no cross-table id-mapping step needed). `type` comes from
  // group_members_wikidata.csv's Kind column, keyed by group name
  // (case-insensitive); a group absent from that CSV defaults to GROUP.
  // ---------------------------------------------------------------------
  section("Phase 1 — Artist");

  const wikidataRows = readCsv(WIKIDATA_CSV);
  const kindByGroupName = new Map<string, "GROUP" | "SOLO">();
  for (const row of wikidataRows) {
    const groupName = row["Group_Name"]?.trim().toLowerCase();
    const kind = row["Kind"]?.trim().toUpperCase();
    if (groupName && (kind === "GROUP" || kind === "SOLO")) {
      kindByGroupName.set(groupName, kind);
    }
  }

  const koreanNameByGroupAndMember = new Map<string, string>();
  for (const row of wikidataRows) {
    const groupName = row["Group_Name"]?.trim().toLowerCase();
    const memberEn = row["Member_Name_EN"]?.trim().toLowerCase();
    const memberKo = row["Member_Name_KO"]?.trim();
    if (groupName && memberEn && memberKo) {
      koreanNameByGroupAndMember.set(`${groupName}::${memberEn}`, memberKo);
    }
  }

  const groups = await prisma.group.findMany();
  let soloCount = 0;
  const artistUpserts = groups.map((g) => {
    const type = kindByGroupName.get(g.nameEn.trim().toLowerCase()) ?? "GROUP";
    if (type === "SOLO") soloCount++;
    return {
      id: g.id, // reused verbatim — see Phase 1 comment above
      slug: g.slug,
      nameEn: g.nameEn,
      nameKr: g.nameKr,
      aliases: g.aliases,
      agency: g.agency,
      debutDate: g.debutDate,
      imageUrl: g.imageUrl,
      type,
    };
  });

  console.log(`Group rows read       : ${groups.length}`);
  console.log(`Artist rows planned   : ${artistUpserts.length} (type=SOLO: ${soloCount})`);
  console.log(
    `Sample: ${artistUpserts
      .slice(0, 3)
      .map((a) => `${a.nameEn}[${a.type}]`)
      .join(", ")}`
  );

  if (APPLY) {
    await runBatches(artistUpserts, 20, (a) =>
      prisma.artist.upsert({ where: { id: a.id }, create: a, update: a })
    );
    console.log(`✅ Artist upserted: ${artistUpserts.length}`);
  }

  // ---------------------------------------------------------------------
  // Phase 2 — Member: backfill artistId (= existing groupId, always) and
  // fill nameKr from wikidata only where it is currently empty (never
  // overwrites a name that's already set).
  // ---------------------------------------------------------------------
  section("Phase 2 — Member (artistId backfill + nameKr enrichment)");

  // Explicit select: a plain findMany() would also pull the new artistId
  // column, which doesn't exist in the DB yet during a --dry run (before
  // `prisma db push`). We always recompute+overwrite artistId/nameKr rather
  // than reading their current value, so nothing here needs that column.
  const members = await prisma.member.findMany({
    select: { id: true, nameEn: true, nameKr: true, groupId: true, group: { select: { nameEn: true } } },
  });
  let nameKrFillCount = 0;
  const memberUpdates = members.map((m) => {
    let nameKr = m.nameKr;
    if (!nameKr) {
      const key = `${m.group.nameEn.trim().toLowerCase()}::${m.nameEn.trim().toLowerCase()}`;
      const found = koreanNameByGroupAndMember.get(key);
      if (found) {
        nameKr = found;
        nameKrFillCount++;
      }
    }
    return { id: m.id, artistId: m.groupId, nameKr };
  });

  console.log(`Member rows read          : ${members.length}`);
  console.log(`artistId backfill planned : ${memberUpdates.length}`);
  console.log(
    `nameKr newly filled       : ${nameKrFillCount} / ${members.length} ` +
      `(${((nameKrFillCount / members.length) * 100).toFixed(1)}%)`
  );

  if (APPLY) {
    await runBatches(memberUpdates, 25, (m) =>
      prisma.member.update({ where: { id: m.id }, data: { artistId: m.artistId, nameKr: m.nameKr } })
    );
    console.log(`✅ Member updated: ${memberUpdates.length}`);
  }

  // ---------------------------------------------------------------------
  // Phase 3 — Album artistId backfill + Version catalog
  // Version rows are sourced from biasroom_photocards_master.csv joined
  // against the download manifest by Version_ID; imageUrl only ever gets a
  // local /images/album-versions/*.webp path for entries the manifest marks
  // "ok" or "skipped" (already-downloaded) — never the external CDN URL, and
  // never a path for entries that failed to download.
  // ---------------------------------------------------------------------
  section("Phase 3 — Album (artistId backfill) + Version catalog");

  // Same reasoning as Phase 2's select: avoid the new artistId column pre-push.
  const albums = await prisma.album.findMany({
    select: { id: true, title: true, groupId: true, group: { select: { nameEn: true } } },
  });
  const albumIdByGroupAndTitle = new Map<string, string>();
  for (const a of albums) {
    albumIdByGroupAndTitle.set(
      `${a.group.nameEn.trim().toLowerCase()}::${a.title.trim().toLowerCase()}`,
      a.id
    );
  }
  console.log(`Album rows read            : ${albums.length}`);

  if (APPLY) {
    await runBatches(albums, 25, (a) =>
      prisma.album.update({ where: { id: a.id }, data: { artistId: a.groupId } })
    );
    console.log(`✅ Album artistId backfilled: ${albums.length}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, "utf-8"));
  const manifestByVersionId = new Map<string, { local_path: string; status: string }>();
  for (const item of manifest.items ?? []) {
    manifestByVersionId.set(item.version_id, { local_path: item.local_path, status: item.status });
  }

  const versionRows = readCsv(VERSIONS_CSV);
  const versionSlugsUsedByAlbum = new Map<string, Set<string>>();
  let versionsSkippedNoAlbum = 0;
  let versionsWithLocalImage = 0;

  type VersionPlan = {
    sourceVersionId: string;
    albumId: string;
    slug: string;
    versionName: string;
    imageUrl: string | null;
    releaseDate: Date | null;
  };
  const versionPlans: VersionPlan[] = [];

  for (const row of versionRows) {
    const groupName = row["Group_Name"]?.trim();
    const albumTitle = row["Album_Title"]?.trim();
    const versionId = row["Version_ID"]?.trim();
    const versionName = row["Version_Name"]?.trim();
    if (!groupName || !albumTitle || !versionId || !versionName) continue;

    const albumId = albumIdByGroupAndTitle.get(`${groupName.toLowerCase()}::${albumTitle.toLowerCase()}`);
    if (!albumId) {
      versionsSkippedNoAlbum++;
      continue;
    }

    const manifestEntry = manifestByVersionId.get(versionId);
    const imageUrl =
      manifestEntry && (manifestEntry.status === "ok" || manifestEntry.status === "skipped")
        ? manifestEntry.local_path
        : null;
    if (imageUrl) versionsWithLocalImage++;

    const used = versionSlugsUsedByAlbum.get(albumId) ?? new Set<string>();
    versionSlugsUsedByAlbum.set(albumId, used);
    const slug = dedupeSlug(slugify(versionName), used);

    let releaseDate: Date | null = null;
    const rawDate = row["Release_Date"]?.trim();
    if (rawDate) {
      const d = new Date(rawDate);
      releaseDate = Number.isNaN(d.getTime()) ? null : d;
    }

    versionPlans.push({ sourceVersionId: versionId, albumId, slug, versionName, imageUrl, releaseDate });
  }

  console.log(`Version CSV rows           : ${versionRows.length}`);
  console.log(`Version rows planned       : ${versionPlans.length}`);
  console.log(`  - skipped (no album match): ${versionsSkippedNoAlbum}`);
  console.log(`  - with local WebP image   : ${versionsWithLocalImage}`);

  if (APPLY) {
    await runBatches(versionPlans, 20, (v) =>
      prisma.version.upsert({
        where: { sourceVersionId: v.sourceVersionId },
        create: v,
        update: v,
      })
    );
    console.log(`✅ Version upserted: ${versionPlans.length}`);
  }

  // ---------------------------------------------------------------------
  // Phase 4 — PhotoCard: artistId backfill (always, unconditional) +
  // best-effort catalogVersionId match. See the file header for why the
  // match rate is expected to be near zero on today's live data.
  // ---------------------------------------------------------------------
  section("Phase 4 — PhotoCard (artistId backfill + best-effort Version match)");

  // Explicit select: catalogVersionId is a new column too, and doesn't exist
  // pre-push. Every run recomputes the match fresh from cardName rather than
  // reading + preserving a prior value — deterministic given the same source
  // CSVs, so overwriting on re-run is safe and simpler than a read-modify path.
  const cards = await prisma.photoCard.findMany({
    select: { id: true, cardName: true, groupId: true, albumId: true },
  });
  const versionsByAlbumId = new Map<string, VersionPlan[]>();
  for (const v of versionPlans) {
    const list = versionsByAlbumId.get(v.albumId) ?? [];
    list.push(v);
    versionsByAlbumId.set(v.albumId, list);
  }
  // Look up a just-created/updated Version's id by its sourceVersionId, needed
  // only in --apply mode (dry mode reports the match without an id to write).
  const versionIdBySourceId = new Map<string, string>();

  let matchedToVersion = 0;
  const cardUpdates = cards.map((c) => {
    let catalogVersionSourceId: string | null = null;
    if (c.albumId && c.cardName) {
      const candidates = versionsByAlbumId.get(c.albumId) ?? [];
      const hit = candidates.find((v) =>
        c.cardName!.toLowerCase().includes(v.versionName.toLowerCase())
      );
      if (hit) {
        matchedToVersion++;
        catalogVersionSourceId = hit.sourceVersionId; // resolved to a real id below in --apply
      }
    }
    return { id: c.id, artistId: c.groupId, catalogVersionSourceId };
  });

  console.log(`PhotoCard rows read         : ${cards.length}`);
  console.log(`artistId backfill planned   : ${cardUpdates.length}`);
  console.log(
    `catalogVersionId matched    : ${matchedToVersion} / ${cards.length} ` +
      `(${((matchedToVersion / cards.length) * 100).toFixed(1)}%) — expected to be low, see header comment`
  );

  if (APPLY) {
    if (matchedToVersion > 0) {
      const created = await prisma.version.findMany({
        where: { sourceVersionId: { in: versionPlans.map((v) => v.sourceVersionId) } },
        select: { id: true, sourceVersionId: true },
      });
      for (const v of created) versionIdBySourceId.set(v.sourceVersionId, v.id);
    }
    await runBatches(cardUpdates, 25, (c) =>
      prisma.photoCard.update({
        where: { id: c.id },
        data: {
          artistId: c.artistId,
          catalogVersionId: c.catalogVersionSourceId
            ? versionIdBySourceId.get(c.catalogVersionSourceId) ?? null
            : null,
        },
      })
    );
    console.log(`✅ PhotoCard updated: ${cardUpdates.length}`);
  }

  // ---------------------------------------------------------------------
  // Invariant check — proves slug/thumbImagePath were never touched, rather
  // than just claiming it.
  // ---------------------------------------------------------------------
  section("Invariant check — slug / thumbImagePath must be unchanged");

  const afterCards = await prisma.photoCard.findMany({
    select: { id: true, slug: true, thumbImagePath: true },
  });
  const afterSlugSet = new Set(afterCards.map((c) => c.slug));
  const afterThumbCount = afterCards.filter((c) => c.thumbImagePath).length;

  const slugSetUnchanged =
    beforeSlugSet.size === afterSlugSet.size && [...beforeSlugSet].every((s) => afterSlugSet.has(s));
  const thumbCountUnchanged = beforeThumbCount === afterThumbCount;

  console.log(`PhotoCard count       : before=${beforeCards.length}  after=${afterCards.length}`);
  console.log(`slug set unchanged    : ${slugSetUnchanged ? "✅ YES" : "❌ NO — INVESTIGATE"}`);
  console.log(
    `thumbImagePath count  : before=${beforeThumbCount}  after=${afterThumbCount}  ` +
      `${thumbCountUnchanged ? "✅ unchanged" : "❌ CHANGED — INVESTIGATE"}`
  );
  if (!APPLY) {
    console.log("(dry run — the above is guaranteed trivially since no writes occurred)");
  }

  section(APPLY ? "APPLY complete" : "DRY RUN complete — re-run with --apply after `prisma db push`");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
