import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/completion?userId=...&groupSlug=...
 * 완성도 데이터 조회 (Stub - DB 구현 대기)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const groupSlug = request.nextUrl.searchParams.get("groupSlug");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // TODO: UserBinderCard + 마스터 도감 조합으로 정확한 완성도 계산
    if (groupSlug) {
      return NextResponse.json(
        {
          group: {
            groupName: "NewJeans",
            groupSlug: "newjeans",
            owned: 42,
            total: 220,
            percentage: 19.1,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        portfolio: {
          owned: 42,
          total: 1022,
          percentage: 4.1,
        },
        groups: [
          { groupName: "NewJeans", groupSlug: "newjeans", owned: 42, total: 220, percentage: 19.1 },
          { groupName: "aespa", groupSlug: "aespa", owned: 0, total: 160, percentage: 0 },
          { groupName: "IVE", groupSlug: "ive", owned: 0, total: 120, percentage: 0 },
          { groupName: "SEVENTEEN", groupSlug: "seventeen", owned: 0, total: 286, percentage: 0 },
          { groupName: "TWICE", groupSlug: "twice", owned: 0, total: 180, percentage: 0 },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
