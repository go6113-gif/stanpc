import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify, dedupeSlug } from "../lib/slugify";
import crypto from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

// SEVENTEEN 멤버 정보 (13인)
const SEVENTEEN_MEMBERS = {
  scoups: { nameEn: "S.Coups", nameKr: "에스쿱스", position: "Leader, Vocal" },
  jeonghan: { nameEn: "Jeonghan", nameKr: "정한", position: "Vocal" },
  joshua: { nameEn: "Joshua", nameKr: "조슈아", position: "Vocal" },
  jun: { nameEn: "Jun", nameKr: "준", position: "Dancer" },
  hoshi: { nameEn: "Hoshi", nameKr: "호시", position: "Dancer" },
  wonwoo: { nameEn: "Wonwoo", nameKr: "원우", position: "Vocal" },
  woozi: { nameEn: "Woozi", nameKr: "우지", position: "Vocal, Producer" },
  dk: { nameEn: "DK", nameKr: "도겸", position: "Vocal" },
  mingyu: { nameEn: "Mingyu", nameKr: "민규", position: "Dancer" },
  the8: { nameEn: "The8", nameKr: "더에잇", position: "Dancer" },
  seungkwan: { nameEn: "Seungkwan", nameKr: "승관", position: "Vocal" },
  vernon: { nameEn: "Vernon", nameKr: "버논", position: "Rapper" },
  dino: { nameEn: "Dino", nameKr: "디노", position: "Dancer" },
};

// 세분화된 앨범 정보
const SEVENTEEN_ALBUMS = {
  "17_is_right_here": { title: "17 Is Right Here", releaseDate: new Date("2015-07-16") },
  fml: { title: "Going Seventeen", releaseDate: new Date("2017-10-05") },
  lucky_draw: { title: "Love & Letter Repackage", releaseDate: new Date("2017-01-16") },
};

const DATA_DIR = path.resolve(__dirname, "..", "..");
const DOWNLOADED_DIR = path.join(DATA_DIR, "downloaded_pcs", "seventeen");

interface FileInfo {
  member: string;
  album: string;
  filePath: string;
  fileName: string;
}

async function calculateChecksum(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      return "unknown";
    }
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return `sha256:${hash}`;
  } catch (err) {
    console.warn(`⚠️ Failed to calculate checksum for ${filePath}:`, err);
    return "unknown";
  }
}

function scanDownloadedFiles(): FileInfo[] {
  const files: FileInfo[] = [];

  // 각 멤버 폴더 순회
  for (const member of Object.keys(SEVENTEEN_MEMBERS)) {
    const memberDir = path.join(DOWNLOADED_DIR, member);
    if (!fs.existsSync(memberDir)) continue;

    // 앨범 폴더 순회
    for (const album of Object.keys(SEVENTEEN_ALBUMS)) {
      const albumDir = path.join(memberDir, album);
      if (!fs.existsSync(albumDir)) continue;

      // 폴더 내 모든 .webp 파일 스캔
      try {
        const fileNames = fs.readdirSync(albumDir);
        for (const fileName of fileNames) {
          if (fileName.endsWith(".webp")) {
            const filePath = path.join(albumDir, fileName);
            files.push({
              member,
              album,
              filePath: path.relative(DATA_DIR, filePath).replace(/\\/g, "/"),
              fileName,
            });
          }
        }
      } catch (err) {
        console.warn(`⚠️ Failed to read ${albumDir}:`, err);
      }
    }
  }

  return files;
}

async function main() {
  const startedAt = Date.now();

  try {
    console.log("🎤 SEVENTEEN Photocard Seeding");
    console.log("=============================\n");

    // 1. 그룹 생성 또는 조회
    console.log("📍 Creating/finding group: SEVENTEEN");
    let group = await prisma.group.findUnique({
      where: { slug: "seventeen" },
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          slug: "seventeen",
          nameEn: "SEVENTEEN",
          nameKr: "세븐틴",
          agency: "Pledis Entertainment",
        },
      });
      console.log("✓ Created SEVENTEEN group");
    } else {
      console.log("✓ SEVENTEEN group already exists");
    }

    // 2. 멤버 생성 또는 조회
    console.log("\n👥 Creating/finding members...");
    const memberMap = new Map<string, string>();
    for (const [slug, info] of Object.entries(SEVENTEEN_MEMBERS)) {
      let member = await prisma.member.findFirst({
        where: { groupId: group.id, slug },
      });

      if (!member) {
        member = await prisma.member.create({
          data: {
            groupId: group.id,
            slug,
            nameEn: info.nameEn,
            nameKr: info.nameKr,
            position: info.position,
          },
        });
        console.log(`✓ Created ${info.nameEn}`);
      } else {
        console.log(`✓ ${info.nameEn} already exists`);
      }

      memberMap.set(slug, member.id);
    }

    // 3. 앨범 생성 또는 조회
    console.log("\n💿 Creating/finding albums...");
    const albumMap = new Map<string, string>();
    for (const [slug, info] of Object.entries(SEVENTEEN_ALBUMS)) {
      let album = await prisma.album.findFirst({
        where: { groupId: group.id, slug },
      });

      if (!album) {
        album = await prisma.album.create({
          data: {
            groupId: group.id,
            slug,
            title: info.title,
            releaseDate: info.releaseDate,
          },
        });
        console.log(`✓ Created ${info.title}`);
      } else {
        console.log(`✓ ${info.title} already exists`);
      }

      albumMap.set(slug, album.id);
    }

    // 4. 포토카드 시딩
    console.log("\n📸 Scanning and seeding photocards...");
    const files = scanDownloadedFiles();
    console.log(`Found ${files.length} files to process`);

    const cardSlugsUsed = new Set<string>();
    let createdCount = 0;
    let updatedCount = 0;

    for (const file of files) {
      try {
        const fullPath = path.join(DATA_DIR, file.filePath);
        const memberId = memberMap.get(file.member);
        const albumId = albumMap.get(file.album);

        if (!memberId || !albumId) {
          console.warn(`⚠️ Missing member or album for ${file.fileName}`);
          continue;
        }

        // 슬러그 생성: seventeen-member-album-filename
        const baseSlug = `${group.slug}-${file.member}-${file.album}-${file.fileName
          .replace(/\.webp$/i, "")
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase()}`;
        const slug = dedupeSlug(baseSlug, cardSlugsUsed);

        // 포토카드 생성 또는 업데이트
        const result = await prisma.photoCard.upsert({
          where: { slug },
          update: {
            imageUrl: `/api/image?path=${encodeURIComponent(file.filePath)}`,
            updatedAt: new Date(),
          },
          create: {
            slug,
            cardName: `${SEVENTEEN_MEMBERS[file.member as keyof typeof SEVENTEEN_MEMBERS].nameEn} - ${file.album}`,
            imageUrl: `/api/image?path=${encodeURIComponent(file.filePath)}`,
            groupId: group.id,
            memberId,
            albumId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        if (result) {
          if (baseSlug === slug) {
            createdCount++;
          } else {
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error processing ${file.fileName}:`, err);
      }
    }

    console.log(`✓ Created: ${createdCount}, Updated: ${updatedCount}`);

    // 5. 통계
    const totalPhotocards = await prisma.photoCard.count({
      where: { groupId: group.id },
    });

    const elapsedMs = Date.now() - startedAt;
    console.log("\n✅ Seeding complete!");
    console.log(`📊 Total photocards for SEVENTEEN: ${totalPhotocards}`);
    console.log(`⏱️ Time elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
