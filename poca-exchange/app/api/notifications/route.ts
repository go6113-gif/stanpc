import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('[notifications] Error:', error);
    return NextResponse.json(
      { error: '알림을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
