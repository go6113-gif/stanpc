import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PriceHistoryData {
  cardId: string;
  price: number;
  currency: string;
  market: string;
  sourceUrl?: string;
}

interface SKUMappingData {
  cardId: string;
  market: string;
  sku: string;
  skuUrl?: string;
}

interface SeedData {
  priceHistory: PriceHistoryData[];
  skuMappings: SKUMappingData[];
}

async function main() {
  console.log('\n============================================================');
  console.log('STANPC DATABASE SEEDING');
  console.log('============================================================\n');

  try {
    // ===== GROUPS =====
    console.log('🌱 Starting directory content seeding...');

    const groups = [
      { name: 'TWICE', slug: 'twice' },
      { name: 'BLACKPINK', slug: 'blackpink' },
      { name: 'EXO', slug: 'exo' },
      { name: 'Stray Kids', slug: 'stray-kids' },
      { name: 'SEVENTEEN', slug: 'seventeen' },
      { name: 'Red Velvet', slug: 'red-velvet' },
      { name: 'TXT', slug: 'txt' },
      { name: 'aespa', slug: 'aespa' },
      { name: 'NCT Dream', slug: 'nct-dream' },
      { name: 'NewJeans', slug: 'newjeans' },
      { name: 'IVE', slug: 'ive' },
    ];

    for (const group of groups) {
      await prisma.group.upsert({
        where: { slug: group.slug },
        update: {},
        create: {
          name: group.name,
          slug: group.slug,
        },
      });
    }
    console.log(`✅ Seeded ${groups.length} groups`);

    // ===== MEMBERS & PHOTOCARDS =====
    const memberData = [
      { groupSlug: 'twice', name: 'TZUYU', slug: 'tzuyu' },
      { groupSlug: 'blackpink', name: 'JENNIE', slug: 'jennie' },
      { groupSlug: 'exo', name: 'SEHUN', slug: 'sehun' },
      { groupSlug: 'stray-kids', name: 'FELIX', slug: 'felix' },
      { groupSlug: 'seventeen', name: 'JEONGHAN', slug: 'jeonghan' },
      { groupSlug: 'red-velvet', name: 'IRENE', slug: 'irene' },
      { groupSlug: 'txt', name: 'YEONJUN', slug: 'yeonjun' },
      { groupSlug: 'aespa', name: 'KARINA', slug: 'karina' },
      { groupSlug: 'nct-dream', name: 'JENO', slug: 'jeno' },
      { groupSlug: 'newjeans', name: 'HANNI', slug: 'hanni' },
      { groupSlug: 'ive', name: 'WONyoung', slug: 'wonying' },
      { groupSlug: 'twice', name: 'NAYEON', slug: 'nayeon' },
    ];

    for (const memberInfo of memberData) {
      const group = await prisma.group.findUnique({
        where: { slug: memberInfo.groupSlug },
      });

      if (group) {
        await prisma.member.upsert({
          where: {
            groupId_slug: {
              groupId: group.id,
              slug: memberInfo.slug,
            },
          },
          update: {},
          create: {
            name: memberInfo.name,
            slug: memberInfo.slug,
            groupId: group.id,
          },
        });
      }
    }
    console.log(`✅ Seeded members`);

    // ===== PHOTOCARDS =====
    const photoCardData = [
      { slug: 'twice-tzuyu-Feel-Special', name: 'TZUYU - Feel Special', groupSlug: 'twice', memberSlug: 'tzuyu', price: 45.99, album: 'Feel Special' },
      { slug: 'twice-nayeon-Formula-of-Love', name: 'NAYEON - Formula of Love', groupSlug: 'twice', memberSlug: 'nayeon', price: 52.50, album: 'Formula of Love' },
      { slug: 'blackpink-jennie-The-Album', name: 'JENNIE - The Album', groupSlug: 'blackpink', memberSlug: 'jennie', price: 65.00, album: 'The Album' },
      { slug: 'exo-sehun-Addiction', name: 'SEHUN - Addiction', groupSlug: 'exo', memberSlug: 'sehun', price: 38.50, album: 'Addiction' },
      { slug: 'stray-kids-felix-Go-Live', name: 'FELIX - Go Live', groupSlug: 'stray-kids', memberSlug: 'felix', price: 42.00, album: 'Go Live' },
      { slug: 'seventeen-jeonghan-God-s-Menu', name: 'JEONGHAN - Gods Menu', groupSlug: 'seventeen', memberSlug: 'jeonghan', price: 55.99, album: 'Gods Menu' },
      { slug: 'red-velvet-irene-Psycho', name: 'IRENE - Psycho', groupSlug: 'red-velvet', memberSlug: 'irene', price: 48.75, album: 'Psycho' },
      { slug: 'txt-yeonjun-Minisode1', name: 'YEONJUN - Minisode 1', groupSlug: 'txt', memberSlug: 'yeonjun', price: 35.50, album: 'Minisode 1' },
      { slug: 'aespa-karina-Savage', name: 'KARINA - Savage', groupSlug: 'aespa', memberSlug: 'karina', price: 58.00, album: 'Savage' },
      { slug: 'nct-dream-jeno-Hot-Sauce', name: 'JENO - Hot Sauce', groupSlug: 'nct-dream', memberSlug: 'jeno', price: 41.25, album: 'Hot Sauce' },
      { slug: 'newjeans-hanni-NewJeans', name: 'HANNI - NewJeans', groupSlug: 'newjeans', memberSlug: 'hanni', price: 62.50, album: 'NewJeans' },
      { slug: 'ive-wonying-I-AM', name: 'WONYING - I AM', groupSlug: 'ive', memberSlug: 'wonying', price: 50.00, album: 'I AM' },
    ];

    for (const cardInfo of photoCardData) {
      const group = await prisma.group.findUnique({
        where: { slug: cardInfo.groupSlug },
      });

      const member = await prisma.member.findFirst({
        where: {
          slug: cardInfo.memberSlug,
          groupId: group?.id,
        },
      });

      if (group && member) {
        await prisma.photoCard.upsert({
          where: { slug: cardInfo.slug },
          update: {},
          create: {
            slug: cardInfo.slug,
            cardName: cardInfo.name,
            estimatedPrice: cardInfo.price,
            groupId: group.id,
            memberId: member.id,
            albumTitle: cardInfo.album,
            pobCode: 'POB-' + Math.random().toString(36).substring(7).toUpperCase(),
            haveCount: Math.floor(Math.random() * 5) + 1,
            wantCount: Math.floor(Math.random() * 10) + 1,
          },
        });
      }
    }
    console.log(`✅ Seeded photo cards`);

    // ===== LOAD SEED DATA (PriceHistory & GlobalSKUMapping) =====
    console.log('\n💰 Seeding PriceHistory...');

    const seedDataPath = path.join(__dirname, '..', 'scripts', 'seed_data', 'seed_data.json');
    let seedData: SeedData = { priceHistory: [], skuMappings: [] };

    if (fs.existsSync(seedDataPath)) {
      const jsonContent = fs.readFileSync(seedDataPath, 'utf-8');
      seedData = JSON.parse(jsonContent);
    }

    // Seed PriceHistory
    for (const ph of seedData.priceHistory) {
      const card = await prisma.photoCard.findUnique({
        where: { slug: ph.cardId },
      });

      if (card) {
        await prisma.priceHistory.create({
          data: {
            cardId: card.id,
            price: ph.price,
            currency: ph.currency,
            market: ph.market,
            sourceUrl: ph.sourceUrl,
          },
        });
      }
    }
    console.log(`✅ Seeded ${seedData.priceHistory.length} PriceHistory records`);

    // Seed GlobalSKUMapping
    console.log('\n🔗 Seeding GlobalSKUMapping...');
    for (const sku of seedData.skuMappings) {
      const card = await prisma.photoCard.findUnique({
        where: { slug: sku.cardId },
      });

      if (card) {
        await prisma.globalSKUMapping.upsert({
          where: {
            cardId_market_sku: {
              cardId: card.id,
              market: sku.market,
              sku: sku.sku,
            },
          },
          update: {
            lastChecked: new Date(),
          },
          create: {
            cardId: card.id,
            market: sku.market,
            sku: sku.sku,
            skuUrl: sku.skuUrl,
          },
        });
      }
    }
    console.log(`✅ Seeded ${seedData.skuMappings.length} GlobalSKUMapping records`);

    console.log('\n============================================================');
    console.log('✨ All seeding completed successfully!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
