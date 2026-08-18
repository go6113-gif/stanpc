import { PrismaClient, SourceType, ReleaseType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BASE_DIR = 'D:\\StanPC\\downloaded_pcs\\seventeen';

const RELEASE_DICT: Record<string, { title: string; year: number; type: ReleaseType }> = {
  fml: { title: 'FML', year: 2023, type: ReleaseType.ALBUM },
  seventeenth_heaven: { title: 'SEVENTEENTH HEAVEN', year: 2023, type: ReleaseType.ALBUM },
  '17_is_right_here': { title: '17 IS RIGHT HERE', year: 2024, type: ReleaseType.ALBUM },
  spill_the_feels: { title: 'SPILL THE FEELS', year: 2024, type: ReleaseType.ALBUM },
  lucky_draw: { title: 'Special Lucky Draw', year: 2024, type: ReleaseType.SPECIAL },
  pob: { title: 'Pre-Order Benefits (POB)', year: 2024, type: ReleaseType.SPECIAL },
};

const MEMBER_DICT: Record<string, { kr: string; en: string; real: string }> = {
  scoups: { kr: '에스쿱스', en: 'S.COUPS', real: '최승철' },
  jeonghan: { kr: '정한', en: 'Jeonghan', real: '윤정한' },
  joshua: { kr: '조슈아', en: 'Joshua', real: '홍지수' },
  jun: { kr: '준', en: 'Jun', real: '문준휘' },
  hoshi: { kr: '호시', en: 'Hoshi', real: '권순영' },
  wonwoo: { kr: '원우', en: 'Wonwoo', real: '전원우' },
  woozi: { kr: '우지', en: 'Woozi', real: '이지훈' },
  the8: { kr: '디에잇', en: 'THE 8', real: '서명호' },
  mingyu: { kr: '민규', en: 'Mingyu', real: '김민규' },
  dk: { kr: '도겸', en: 'DK', real: '이석민' },
  seungkwan: { kr: '승관', en: 'Seungkwan', real: '부승관' },
  vernon: { kr: '버논', en: 'Vernon', real: '최한솔' },
  dino: { kr: '디노', en: 'Dino', real: '이찬' },
};

async function main() {
  console.log('🚀 [StanPC] 세븐틴(SEVENTEEN) DB 시딩 시작...\n');

  const group = await prisma.group.upsert({
    where: { code: 'seventeen' },
    update: {},
    create: {
      code: 'seventeen',
      nameKr: '세븐틴',
      nameEn: 'SEVENTEEN',
      agency: 'PLEDIS Entertainment',
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

  if (!fs.existsSync(BASE_DIR)) {
    console.log(`⚠️ ${BASE_DIR} 경로가 존재하지 않습니다. 먼저 수집을 진행하세요.`);
    return;
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
        const relativePath = `pcs/seventeen/${memberCode}/${catCode}/${file}`;

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

  console.log(`\n🎉 세븐틴 총 ${totalSeeded}장의 포토카드가 DB에 성공적으로 적재되었습니다!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
