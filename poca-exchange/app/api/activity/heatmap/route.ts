import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/activity/heatmap?userId=...
 * 사용자 활동 히트맵 데이터 조회 (Stub - DB 구현 대기)
 *
 * Response:
 * [
 *   { date: "2025-08-16", count: 3, intensity: 2 },
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

    // TODO: ActivityLog 테이블에서 지난 365일 데이터 조회
    const mockData = Array.from({ length: 365 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (364 - i));
      return {
        date: date.toISOString().split("T")[0],
        count: Math.floor(Math.random() * 5),
        intensity: Math.floor(Math.random() * 5),
      };
    });

    return NextResponse.json(mockData, { status: 200 });
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
 * 활동 로그 기록 (Stub - DB 구현 대기)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: "userId and type are required" },
        { status: 400 }
      );
    }

    // TODO: ActivityLog 테이블에 기록
    return NextResponse.json(
      {
        id: `activity_${Date.now()}`,
        userId,
        type,
        createdAt: new Date().toISOString(),
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
