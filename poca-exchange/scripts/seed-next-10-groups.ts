/**
 * Seed 10 Groups for Phase 2 Expansion
 * RIIZE, TWS, LE SSERAFIM, ZEROBASEONE, NMIXX, BOYNEXTDOOR, ILLIT, KISS OF LIFE, NCT 127, NCT DREAM
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEXT_10_GROUPS = [
  {
    slug: 'riize',
    name: 'RIIZE',
    members: ['Shotaro', 'Wonbin', 'Seunghan', 'Sohee', 'Eunseok', 'Sungchan', 'Jihoon'],
    albums: ['Get A Taste'],
  },
  {
    slug: 'tws',
    name: 'TWS',
    members: ['Youngjae', 'Jihoon', 'Kyungmin', 'Jaewon', 'Eunchan', 'Dohoon', 'Shinyu', 'Josh'],
    albums: ['Debut'],
  },
  {
    slug: 'le-sserafim',
    name: 'LE SSERAFIM',
    members: ['Sakura', 'Chaewon', 'Yunjin', 'Kazuha', 'Hong Eunchae'],
    albums: ['Fearless', 'Antifragile'],
  },
  {
    slug: 'zerobaseone',
    name: 'ZEROBASEONE',
    members: ['Sung Hanbin', 'Kim Jiwoong', 'Zhang Hao', 'Ricky', 'Junhan', 'Gunwook', 'Yujin'],
    albums: ['Youth In The Chaos'],
  },
  {
    slug: 'nmixx',
    name: 'NMIXX',
    members: ['Lily', 'Haeun', 'Jinni', 'Sullyoon', 'Jiwoo', 'Kyujin'],
    albums: ['Expérgo', 'Entwurf'],
  },
  {
    slug: 'boynextdoor',
    name: 'BOYNEXTDOOR',
    members: ['Jaehyun', 'Leehan', 'Hanni', 'Taesan', 'Leehan', 'Woonhak'],
    albums: ['Why Ch.1'],
  },
  {
    slug: 'illit',
    name: 'ILLIT',
    members: ['Moka', 'Wonhee', 'Iroha', 'Minju'],
    albums: ['I'LL-it'],
  },
  {
    slug: 'kiss-of-life',
    name: 'KISS OF LIFE',
    members: ['Natty', 'Haneul', 'Julie', 'Belle'],
    albums: ['Kiss of Life'],
  },
  {
    slug: 'nct-127',
    name: 'NCT 127',
    members: ['Taeil', 'Hansol', 'Johnny', 'Taeyong', 'Yuta', 'Kun', 'Doyoung', 'Ten', 'Jaehyun', 'Winwin', 'Jungwoo', 'Mark', 'Renjun', 'Chenle', 'Jisung'],
    albums: ['Regular', 'Sticker'],
  },
  {
    slug: 'nct-dream',
    name: 'NCT DREAM',
    members: ['Mark', 'Renjun', 'Jeno', 'Haechan', 'Jaemin', 'Chenle', 'Jisung'],
    albums: ['Reload', 'Istj'],
  },
];

async function seedNextGroups() {
  try {
    console.log('🌱 Seeding Next 10 Groups...\n');

    for (const group of NEXT_10_GROUPS) {
      console.log(`📦 Creating ${group.name}...`);

      // 그룹 생성/업데이트
      const savedGroup = await prisma.group.upsert({
        where: { slug: group.slug },
        update: { name: group.name },
        create: {
          slug: group.slug,
          name: group.name,
          imageUrl: `https://via.placeholder.com/200x200?text=${group.name}`,
        },
      });

      // 멤버 생성
      for (const memberName of group.members) {
        await prisma.member.upsert({
          where: {
            group_id_name: {
              group_id: savedGroup.id,
              name: memberName,
            },
          },
          update: {},
          create: {
            group_id: savedGroup.id,
            name: memberName,
            imageUrl: `https://via.placeholder.com/150x150?text=${memberName}`,
          },
        });
      }

      // 앨범 생성
      for (const albumName of group.albums) {
        await prisma.album.upsert({
          where: {
            group_id_title: {
              group_id: savedGroup.id,
              title: albumName,
            },
          },
          update: {},
          create: {
            group_id: savedGroup.id,
            title: albumName,
            releaseDate: new Date(),
            imageUrl: `https://via.placeholder.com/300x300?text=${albumName}`,
          },
        });
      }

      console.log(`✅ ${group.name} seeded successfully`);
    }

    console.log('\n🎉 All 10 groups seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedNextGroups();
