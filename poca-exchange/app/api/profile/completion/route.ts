import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformUserBinderCardsToBinderCards } from "@/lib/utils/cardTransform";
import { calculateTotalPortfolioCompletion, getAllGroupCompletions, calculateGroupCompletion } from "@/lib/utils/completionEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/completion?userId=...&groupSlug=...
 * 완성도 데이터 조회 (DB 연동)
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

    // 사용자의 바인더 카드 조회 (OWNED 상태만)
    const binderCards = await prisma.userBinderCard.findMany({
      where: {
        userId,
        status: "OWNED",
      },
      include: {
        card: {
          include: {
            group: { select: { nameEn: true } },
            member: { select: { nameEn: true } },
          },
        },
      },
    });

    // BinderCard 배열로 변환
    const binderCardsData = transformUserBinderCardsToBinderCards(
      binderCards.filter((b: any) => b.card.group)
    );

    // 그룹별 완성도 요청
    if (groupSlug) {
      const groupCompletion = calculateGroupCompletion(groupSlug, binderCardsData);
      return NextResponse.json(
        {
          group: {
            groupSlug,
            owned: groupCompletion.owned,
            total: groupCompletion.total,
            percentage: groupCompletion.percentage,
          },
        },
        { status: 200 }
      );
    }

    // 전체 포트폴리오 완성도
    const portfolioCompletion = calculateTotalPortfolioCompletion(binderCardsData);
    const groupCompletions = getAllGroupCompletions(binderCardsData);

    return NextResponse.json(
      {
        portfolio: {
          owned: portfolioCompletion.owned,
          total: portfolioCompletion.total,
          percentage: portfolioCompletion.percentage,
        },
        groups: groupCompletions.map(g => ({
          groupName: g.groupName,
          groupSlug: g.groupSlug,
          owned: g.owned,
          total: g.total,
          percentage: g.percentage,
        })),
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
