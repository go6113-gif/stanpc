import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('[notifications/read] Error:', error);
    return NextResponse.json(
      { error: '알림 업데이트에 실패했습니다' },
      { status: 500 }
    );
  }
}
