import { PrismaClient, SourceType, ReleaseType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BASE_DIR = 'D:\\StanPC\\downloaded_pcs\\bts';

const RELEASE_DICT: Record<string, { title: string; year: number; type: ReleaseType }> = {
  proof: { title: 'Proof', year: 2022, type: ReleaseType.ALBUM },
  indigo: { title: 'Indigo', year: 2022, type: ReleaseType.ALBUM },
  rpwp: { title: 'Right Place, Wrong Person', year: 2024, type: ReleaseType.ALBUM },
  astronaut: { title: 'The Astronaut', year: 2022, type: ReleaseType.SINGLE },
  happy: { title: 'Happy', year: 2024, type: ReleaseType.ALBUM },
  ddrive: { title: 'D-DAY', year: 2023, type: ReleaseType.ALBUM },
  jitb: { title: 'Jack In The Box', year: 2022, type: ReleaseType.ALBUM },
  hope_on_the_street: { title: 'HOPE ON THE STREET VOL.1', year: 2024, type: ReleaseType.ALBUM },
  face: { title: 'FACE', year: 2023, type: ReleaseType.ALBUM },
  muse: { title: 'MUSE', year: 2024, type: ReleaseType.ALBUM },
  layover: { title: 'Layover', year: 2023, type: ReleaseType.ALBUM },
  golden: { title: 'Golden', year: 2023, type: ReleaseType.ALBUM },
  lucky_draw: { title: 'Special Lucky Draw', year: 2023, type: ReleaseType.SPECIAL },
  pob: { title: 'Pre-Order Benefits (POB)', year: 2023, type: ReleaseType.SPECIAL },
};

const MEMBER_DICT: Record<string, { kr: string; en: string; real: string }> = {
  rm: { kr: 'RM', en: 'RM', real: '김남준' },
  jin: { kr: '진', en: 'Jin', real: '김석진' },
  suga: { kr: '슈가', en: 'SUGA', real: '민윤기' },
  jhope: { kr: '제이홉', en: 'j-hope', real: '정호석' },
  jimin: { kr: '지민', en: 'Jimin', real: '박지민' },
  v: { kr: '뷔', en: 'V', real: '김태형' },
  jungkook: { kr: '정국', en: 'Jungkook', real: '전정국' },
};

async function main() {
  console.log('🚀 [StanPC] 4단계 레이어 포토카드 DB 시딩 시작...\n');

  const group = await prisma.group.upsert({
    where: { code: 'bts' },
    update: {},
    create: {
      code: 'bts',
      nameKr: '방탄소년단',
      nameEn: 'BTS',
      agency: 'BIGHIT MUSIC',
    },
  });

  const memberMap = new Map<string, string>();
  for (const [code, info] of Object.entries(MEMBER_DICT)) {
    const member = await prisma.member.upsert({
      where: {
        groupId_code: {
          groupId: group.id,
          code: code,
        },
      },
      update: {},
      create: {
        code: code,
        nameKr: info.kr,
        nameEn: info.en,
        realName: info.real,
        groupId: group.id,
      },
    });
    memberMap.set(code, member.id);
  }

  const releaseMap = new Map<string, string>();
  for (const [code, info] of Object.entries(RELEASE_DICT)) {
    let release = await prisma.release.findFirst({ where: { code } });
    if (!release) {
      release = await prisma.release.create({
        data: {
          code: code,
          title: info.title,
          releaseYear: info.year,
          type: info.type,
        },
      });
    }
    releaseMap.set(code, release.id);
  }

  let totalSeeded = 0;
  const memberDirs = fs.readdirSync(BASE_DIR);

  for (const memberCode of memberDirs) {
    const memberDirPath = path.join(BASE_DIR, memberCode);
    if (!fs.statSync(memberDirPath).isDirectory()) continue;

    const memberId = memberMap.get(memberCode);
    if (!memberId) continue;

    const catDirs = fs.readdirSync(memberDirPath);
    for (const catCode of catDirs) {
      const catDirPath = path.join(memberDirPath, catCode);
      if (!fs.statSync(catDirPath).isDirectory()) continue;

      const releaseId = releaseMap.get(catCode);
      if (!releaseId) continue;

      let sourceType: SourceType = SourceType.ALBUM;
      if (catCode === 'lucky_draw') sourceType = SourceType.LUCKY_DRAW;
      else if (catCode === 'pob') sourceType = SourceType.POB;

      const files = fs.readdirSync(catDirPath).filter((f) => f.endsWith('.webp'));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cardSeq = i + 1;
        const relativePath = `pcs/bts/${memberCode}/${catCode}/${file}`;

        await prisma.photocard.upsert({
          where: {
            memberId_releaseId_sourceType_cardSeq: {
              memberId,
              releaseId,
              sourceType,
              cardSeq,
            },
          },
          update: {
            imagePath: relativePath,
          },
          create: {
            groupId: group.id,
            memberId,
            releaseId,
            sourceType,
            cardSeq,
            versionName: `${catCode.toUpperCase()} #${String(cardSeq).padStart(2, '0')}`,
            imagePath: relativePath,
          },
        });
        totalSeeded++;
      }
    }
  }

  console.log(`\n🎉 총 ${totalSeeded}장의 포토카드가 4단계 레이어 규격으로 DB에 성공적으로 인덱싱되었습니다!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
