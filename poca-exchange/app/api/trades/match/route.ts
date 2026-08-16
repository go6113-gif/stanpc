import { NextRequest, NextResponse } from "next/server";
import { calculateMatchScore, cardArrayToSet } from "@/lib/matching/engine";
import { TradeMatchListResponse, TradeMatchResult, TradePost } from "@/lib/types/trade";

/**
 * GET /api/trades/match
 * 내 Have/Wish와 매칭되는 다른 유저의 거래글 목록을 조회합니다.
 *
 * Query parameters:
 * - myHave: 내가 제공할 수 있는 카드 ID (쉼표로 구분)
 * - myWish: 내가 원하는 카드 ID (쉼표로 구분)
 * - limit: 반환할 매칭 결과 수 (기본값: 20, 최대: 100)
 *
 * Response:
 * {
 *   "matches": [
 *     {
 *       "tradePostId": "trade_xxx",
 *       "type": "WTT",
 *       "matchRate": 85,
 *       "giveCards": ["card-aespa-001"],
 *       "getCards": ["card-bts-001"],
 *       "contactChannel": {
 *         "type": "twitter",
 *         "value": "@collector_1"
 *       },
 *       "createdAt": "2026-08-16T00:00:00Z"
 *     }
 *   ],
 *   "total": 1
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const myHaveParam = searchParams.get("myHave") || "";
    const myWishParam = searchParams.get("myWish") || "";
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );

    // 배열로 변환
    const myHaveIds = myHaveParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const myWishIds = myWishParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    // 입력 검증
    if (myHaveIds.length === 0 && myWishIds.length === 0) {
      return NextResponse.json(
        {
          error: "At least one of myHave or myWish must be provided",
        },
        { status: 400 }
      );
    }

    // Set으로 변환
    const myHave = cardArrayToSet(myHaveIds);
    const myWish = cardArrayToSet(myWishIds);

    // Mock 거래글 데이터
    const mockTradePosts: TradePost[] = [
      {
        id: "trade_mock_1",
        type: "WTT",
        offeringCardIds: ["card-bts-001", "card-bts-002"],
        seekingCardIds: ["card-aespa-001", "card-aespa-002"],
        contactType: "twitter",
        contactValue: "@collector_1",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        id: "trade_mock_2",
        type: "WTT",
        offeringCardIds: ["card-newjeans-001"],
        seekingCardIds: ["card-aespa-001"],
        contactType: "openKakao",
        contactValue: "https://open.kakao.com/yyy",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
      },
      {
        id: "trade_mock_3",
        type: "WTT",
        offeringCardIds: ["card-seventeen-010", "card-seventeen-011"],
        seekingCardIds: ["card-aespa-002", "card-bts-001"],
        contactType: "discord",
        contactValue: "collector#5678",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 259200000),
      },
    ];

    // WTT (교환) 거래글만 필터링
    const wttPosts = mockTradePosts.filter((post) => post.type === "WTT");

    // 매칭 점수 계산
    const matchedPosts = wttPosts
      .map((post) => {
        const theirHave = cardArrayToSet(post.offeringCardIds);
        const theirWish = cardArrayToSet(post.seekingCardIds);

        const matchScore = calculateMatchScore({
          haveA: myHave,
          wishA: myWish,
          haveB: theirHave,
          wishB: theirWish,
        });

        // 매칭되지 않은 거래글 제외 (점수 0)
        if (matchScore === 0) {
          return null;
        }

        // 내가 제공할 카드와 상대방의 원하는 카드의 교집합
        const giveCards = Array.from(myHave).filter((id) => theirWish.has(id));

        // 상대방이 제공할 카드와 내가 원하는 카드의 교집합
        const getCards = Array.from(theirHave).filter((id) => myWish.has(id));

        const result: TradeMatchResult = {
          tradePostId: post.id,
          type: post.type,
          matchRate: Math.round(matchScore),
          giveCards,
          getCards,
          contactChannel: {
            type: post.contactType,
            value: post.contactValue,
          },
          createdAt: post.createdAt,
        };

        return result;
      })
      .filter((result): result is TradeMatchResult => result !== null);

    // 매칭 점수 기준 내림차순 정렬
    matchedPosts.sort((a, b) => b.matchRate - a.matchRate);

    // Limit 적용
    const limitedMatches = matchedPosts.slice(0, limit);

    const response: TradeMatchListResponse = {
      matches: limitedMatches,
      total: matchedPosts.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error matching trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
