import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const cards = await prisma.photoCard.findMany({
    select: { 
      slug: true, 
      imageUrl: true, 
      thumbImagePath: true 
    },
    where: {
      group: { slug: 'bts' },
      member: { slug: 'jimin' }
    },
    take: 3
  });
  
  console.log('📊 DB Image Paths for BTS Jimin:');
  console.log(JSON.stringify(cards, null, 2));
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await prisma.$disconnect();
}
