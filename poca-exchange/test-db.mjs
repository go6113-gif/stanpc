import { prisma } from '@/lib/prisma'; (async () => { const groups = await prisma.group.findMany({ take: 1 }); console.log('Groups:', groups); process.exit(0); })()
