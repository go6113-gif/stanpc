import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformUserBinderCardsToBinderCards } from "@/lib/utils/cardTransform";
import { calculateTotalPortfolioCompletion } from "@/lib/utils/completionEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/[userId]
 * 사용자 프로필 데이터 조회 (DB 연동)
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

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        collectorIndex: true,
        mannerScore: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 사용자의 바인더 카드 조회
    const binderCards = await prisma.userBinderCard.findMany({
      where: { userId },
      include: {
        card: {
          include: {
            group: { select: { nameEn: true } },
            member: { select: { nameEn: true } },
          },
        },
      },
    });

    // 상태별 카운트
    const ownedCount = binderCards.filter((b: any) => b.status === "OWNED").length;
    const wishedCount = binderCards.filter((b: any) => b.status === "WTB").length;
    const wttCount = binderCards.filter((b: any) => b.status === "WTT").length;

    // BinderCard 배열로 변환 (OWNED 상태만)
    const ownedBinderCards = transformUserBinderCardsToBinderCards(
      binderCards.filter((b: any) => b.status === "OWNED" && b.card.group)
    );

    // 완성도 계산
    const completion = calculateTotalPortfolioCompletion(ownedBinderCards);

    return NextResponse.json(
      {
        user,
        stats: {
          ownedCount,
          wishedCount,
          wttCount,
        },
        completion: {
          owned: completion.owned,
          total: completion.total,
          percentage: completion.percentage,
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
