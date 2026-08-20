/**
 * Thumbnail generator — downsizes the crawler's full-size photocard originals
 * into grid-sized WebP thumbnails and records them on PhotoCard.thumbImagePath.
 *
 * Why: every live row ships imageUrl (the original) with thumbImagePath null, so
 * the landing grid renders ~200 originals at up to 1.2 MB each. Thumbnails land
 * in a `thumbs/` tree mirroring `downloaded_pcs/` under the StanPC root, which
 * keeps them reachable through app/api/image/route.ts with no route changes.
 *
 * Also repairs rows whose imageUrl holds a rendered `/api/image?path=...` URL
 * rather than a root-relative path — those double-encode through
 * resolveImageSrc() and never load. See NORMALIZE below.
 *
 *   npm run thumbs                 # generate missing thumbnails
 *   npm run thumbs -- --dry-run    # report what would change, touch nothing
 *   npm run thumbs -- --force      # rebuild thumbnails that already exist
 */

import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js layers .env.local over .env; `dotenv/config` above only reads .env, so
// STANPC_ROOT (defined only in .env.local) needs this second explicit pass.
dotenv.config({ path: ".env.local", override: true });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
const prisma = new PrismaClient({ adapter });

// Source tree the crawler writes into, and the parallel tree for thumbnails.
const SOURCE_DIR = "downloaded_pcs";
const THUMB_DIR = "thumbs";

type Options = {
  width: number;
  quality: number;
  concurrency: number;
  force: boolean;
  dryRun: boolean;
  limit: number | null;
};

function parseArgs(argv: string[]): Options {
  const flag = (name: string) => argv.includes(`--${name}`);
  const value = (name: string, fallback: number) => {
    const index = argv.indexOf(`--${name}`);
    if (index === -1) return fallback;
    const parsed = Number(argv[index + 1]);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`--${name} needs a positive number`);
    }
    return parsed;
  };

  return {
    // 350px covers the widest grid tile (~286px CSS) at 1x and stays sharp
    // enough when a tile grows on hover; originals run 560–930px wide.
    width: value("width", 350),
    quality: value("quality", 72),
    concurrency: value("concurrency", Math.max(4, os.cpus().length)),
    force: flag("force"),
    dryRun: flag("dry-run"),
    limit: argv.includes("--limit") ? value("limit", 0) : null,
  };
}

function resolveStanpcRoot(): string {
  // Mirrors app/api/image/route.ts: dotenv leaves a doubled backslash in a
  // Windows path verbatim, so normalize before resolving.
  const fromEnv = process.env.STANPC_ROOT;
  if (fromEnv) return path.resolve(fromEnv.replace(/\\\\/g, "\\"));
  return path.resolve(process.cwd(), "..");
}

/**
 * NORMALIZE — coerce a stored imageUrl back to a root-relative POSIX path.
 *
 * Rows arrive in two shapes: the intended `downloaded_pcs/...` relative path,
 * and (for every SEVENTEEN row) a rendered `/api/image?path=<encoded>` URL that
 * an earlier import wrote in place of the path. Unwrap the latter so both
 * shapes resolve against the StanPC root. Returns null for remote URLs, which
 * need no local thumbnail.
 */
function normalizeImagePath(imageUrl: string): string | null {
  let value = imageUrl.trim();
  if (/^https?:\/\//i.test(value)) return null;

  const apiPrefix = "/api/image?path=";
  if (value.startsWith(apiPrefix)) {
    value = decodeURIComponent(value.slice(apiPrefix.length));
  }

  value = value.replace(/\\/g, "/").replace(/^\/+/, "");
  return value.length > 0 ? value : null;
}

/** Thumbnail path for a source path, mirroring the tree under `thumbs/`. */
function thumbPathFor(sourcePath: string): string {
  const withoutRoot = sourcePath.startsWith(`${SOURCE_DIR}/`)
    ? sourcePath.slice(SOURCE_DIR.length + 1)
    : sourcePath;
  const parsed = path.posix.parse(withoutRoot);
  return path.posix.join(THUMB_DIR, parsed.dir, `${parsed.name}.webp`);
}

/** Runs `fn` over `items` with at most `concurrency` in flight at once. */
async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        await fn(items[cursor++]);
      }
    }
  );
  await Promise.all(workers);
}

type Card = { slug: string; imageUrl: string | null; thumbImagePath: string | null };

type Stats = {
  generated: number;
  reused: number;
  pathRepaired: number;
  skippedRemote: number;
  missingSource: number;
  failed: number;
  sourceBytes: number;
  thumbBytes: number;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const stanpcRoot = resolveStanpcRoot();

  if (!fs.existsSync(path.join(stanpcRoot, SOURCE_DIR))) {
    throw new Error(
      `Source directory not found: ${path.join(stanpcRoot, SOURCE_DIR)}\n` +
        `Set STANPC_ROOT in .env.local to the StanPC repo root.`
    );
  }

  const where = options.force ? {} : { thumbImagePath: null };
  const cards: Card[] = await prisma.photoCard.findMany({
    where: { ...where, imageUrl: { not: null } },
    select: { slug: true, imageUrl: true, thumbImagePath: true },
    ...(options.limit ? { take: options.limit } : {}),
  });

  console.log(
    `Root      : ${stanpcRoot}\n` +
      `Candidates: ${cards.length} card(s)\n` +
      `Output    : ${options.width}px wide WebP q${options.quality} -> ${THUMB_DIR}/\n` +
      `Mode      : ${options.dryRun ? "DRY RUN" : "write"}${options.force ? " (force rebuild)" : ""}\n`
  );

  const stats: Stats = {
    generated: 0,
    reused: 0,
    pathRepaired: 0,
    skippedRemote: 0,
    missingSource: 0,
    failed: 0,
    sourceBytes: 0,
    thumbBytes: 0,
  };
  const updates: { slug: string; imageUrl: string; thumbImagePath: string }[] = [];

  await runPool(cards, options.concurrency, async (card) => {
    const sourcePath = normalizeImagePath(card.imageUrl!);
    if (!sourcePath) {
      stats.skippedRemote++;
      return;
    }
    if (sourcePath !== card.imageUrl) stats.pathRepaired++;

    const absoluteSource = path.resolve(stanpcRoot, sourcePath);
    if (!absoluteSource.startsWith(stanpcRoot) || !fs.existsSync(absoluteSource)) {
      stats.missingSource++;
      console.warn(`  missing source: ${card.slug} -> ${sourcePath}`);
      return;
    }

    const thumbRelative = thumbPathFor(sourcePath);
    const absoluteThumb = path.resolve(stanpcRoot, thumbRelative);

    try {
      const sourceSize = fs.statSync(absoluteSource).size;
      let thumbSize: number;

      if (!options.force && fs.existsSync(absoluteThumb)) {
        thumbSize = fs.statSync(absoluteThumb).size;
        stats.reused++;
      } else if (options.dryRun) {
        thumbSize = 0;
        stats.generated++;
      } else {
        fs.mkdirSync(path.dirname(absoluteThumb), { recursive: true });
        const output = await sharp(absoluteSource)
          .rotate() // honour EXIF orientation before resizing
          .resize({ width: options.width, withoutEnlargement: true })
          .webp({ quality: options.quality })
          .toFile(absoluteThumb);
        thumbSize = output.size;
        stats.generated++;
      }

      stats.sourceBytes += sourceSize;
      stats.thumbBytes += thumbSize;
      updates.push({
        slug: card.slug,
        imageUrl: sourcePath,
        thumbImagePath: thumbRelative,
      });
    } catch (err) {
      stats.failed++;
      console.error(`  failed: ${card.slug} -> ${(err as Error).message}`);
    }
  });

  if (!options.dryRun && updates.length > 0) {
    let written = 0;
    await runPool(updates, 10, async (update) => {
      await prisma.photoCard.update({
        where: { slug: update.slug },
        data: {
          imageUrl: update.imageUrl,
          thumbImagePath: update.thumbImagePath,
        },
      });
      written++;
      if (written % 200 === 0) console.log(`  updated ${written}/${updates.length}`);
    });
    console.log(`  updated ${written}/${updates.length}\n`);
  }

  const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const saved = stats.sourceBytes - stats.thumbBytes;
  console.log(
    `\nDone.\n` +
      `  generated      : ${stats.generated}\n` +
      `  reused existing: ${stats.reused}\n` +
      `  imageUrl fixed : ${stats.pathRepaired}\n` +
      `  missing source : ${stats.missingSource}\n` +
      `  remote skipped : ${stats.skippedRemote}\n` +
      `  failed         : ${stats.failed}\n` +
      `  db rows updated: ${options.dryRun ? 0 : updates.length}\n` +
      (stats.thumbBytes > 0
        ? `  payload        : ${mb(stats.sourceBytes)} -> ${mb(stats.thumbBytes)} ` +
          `(-${((saved / stats.sourceBytes) * 100).toFixed(1)}%)\n`
        : "")
  );

  if (stats.failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
