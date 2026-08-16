import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/[userId]
 * 사용자 프로필 데이터 조회 (Stub - DB 구현 대기)
 *
 * Response:
 * {
 *   user: { id, email, name, collectorIndex, mannerScore },
 *   stats: { ownedCount, wishedCount, wttCount },
 *   completion: { owned, total, percentage }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // TODO: Prisma 쿼리로 실제 데이터 조회
    // 현재는 스텁 응답으로 API 계약만 정의

    return NextResponse.json(
      {
        user: {
          id: userId,
          email: "user@example.com",
          name: "Collector",
          collectorIndex: 385,
          mannerScore: 38.2,
        },
        stats: {
          ownedCount: 42,
          wishedCount: 15,
          wttCount: 8,
        },
        completion: {
          owned: 42,
          total: 220,
          percentage: 19.1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
