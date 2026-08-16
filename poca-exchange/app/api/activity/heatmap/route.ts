import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/activity/heatmap?userId=...
 * 사용자 활동 히트맵 데이터 조회 (DB 연동)
 *
 * Response:
 * [
 *   { date: "2025-08-16", count: 3, intensity: 0-4 },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 지난 365일 활동 로그 조회
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: oneYearAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 일자별 집계
    const activityByDate = new Map<string, number>();
    activityLogs.forEach((log: any) => {
      const dateStr = log.createdAt.toISOString().split("T")[0];
      activityByDate.set(dateStr, (activityByDate.get(dateStr) ?? 0) + 1);
    });

    // 365일 배열 생성
    const result = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (364 - i));
      const dateStr = date.toISOString().split("T")[0];
      const count = activityByDate.get(dateStr) ?? 0;

      // intensity: 0-4 (0=없음, 1-4=활동 강도)
      let intensity = 0;
      if (count > 0) intensity = Math.min(4, Math.ceil(count / 2));

      result.push({
        date: dateStr,
        count,
        intensity,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching heatmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activity/heatmap
 * 활동 로그 기록 (DB 연동)
 *
 * Request:
 * {
 *   userId: string,
 *   type: ActivityType,
 *   cardId?: string,
 *   description?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, cardId, description } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: "userId and type are required" },
        { status: 400 }
      );
    }

    // 유효한 ActivityType 검증
    const validTypes: ActivityType[] = [
      "CARD_ADDED",
      "CARD_REMOVED",
      "CARD_SHOWCASED",
      "TRADE_COMPLETED",
      "BADGE_EARNED",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid activity type: ${type}` },
        { status: 400 }
      );
    }

    // ActivityLog 생성
    const activityLog = await prisma.activityLog.create({
      data: {
        userId,
        type,
        cardId,
        description,
      },
    });

    return NextResponse.json(
      {
        id: activityLog.id,
        userId: activityLog.userId,
        type: activityLog.type,
        createdAt: activityLog.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
