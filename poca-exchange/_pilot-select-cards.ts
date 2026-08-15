import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "./lib/prisma";

// TOP 100 by wishedCount desc, site-wide (per the literal instruction — no
// MVP_GROUP_SLUGS scoping applied here, unlike the rest of the app's
// queries). Cards that already have a thumbImagePath are skipped so re-runs
// are idempotent.
async function main() {
  const cards = await prisma.photoCard.findMany({
    where: { thumbImagePath: null },
    orderBy: { wishedCount: "desc" },
    take: 100,
    include: { group: true, member: true, album: true },
  });

  const manifest = cards.map((card) => ({
    id: card.id,
    slug: card.slug,
    cardName: card.cardName,
    wishedCount: card.wishedCount,
    searchQuery: [card.group.nameEn, card.member?.nameEn, card.album?.title ?? card.cardName, "photocard"]
      .filter(Boolean)
      .join(" "),
  }));

  writeFileSync("../scripts/pilot-manifest.json", JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Wrote ${manifest.length} candidates to scripts/pilot-manifest.json`);
}

main().finally(() => prisma.$disconnect());
