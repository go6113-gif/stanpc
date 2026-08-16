import { NextRequest, NextResponse } from "next/server";
import {
  TradePostCreateRequest,
  TradePost,
  TradePostListResponse,
} from "@/lib/types/trade";

// TODO: Prisma를 통한 DB 저장. 현재는 메모리 기반 Mock 저장소.
// 실제 구현 시 prisma client를 import하고 db.tradePost.create() 사용
const mockTradeStore: Map<string, TradePost> = new Map();

/**
 * POST /api/trades
 * 새 거래글을 등록합니다.
 *
 * Request body:
 * {
 *   "type": "WTT" | "WTS" | "WTB",
 *   "offeringCardIds": ["card-1", "card-2"],
 *   "seekingCardIds": ["card-3"],
 *   "price": 15000,
 *   "currency": "KRW",
 *   "shippingFee": 3000,
 *   "contactType": "twitter" | "instagram" | "openKakao" | "discord" | "kakaoTalk",
 *   "contactValue": "@username or URL"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TradePostCreateRequest = await request.json();

    // 필수 필드 검증
    if (!body.type || !body.offeringCardIds || !body.contactType) {
      return NextResponse.json(
        { error: "Missing required fields: type, offeringCardIds, contactType" },
        { status: 400 }
      );
    }

    // 거래글 ID 생성
    const tradePostId = `trade_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // 거래글 객체 생성
    const newPost: TradePost = {
      id: tradePostId,
      type: body.type,
      userId: body.userId,
      guestToken: body.guestToken,
      offeringCardIds: body.offeringCardIds,
      seekingCardIds: body.seekingCardIds || [],
      price: body.price,
      currency: body.currency,
      shippingFee: body.shippingFee,
      contactType: body.contactType,
      contactValue: body.contactValue,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock 저장소에 저장
    mockTradeStore.set(tradePostId, newPost);

    return NextResponse.json(
      {
        success: true,
        tradePostId,
        post: newPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating trade post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trades
 * 활성 거래글 목록을 페이징하여 반환합니다.
 *
 * Query parameters:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 항목 수 (기본값: 20, 최대: 100)
 * - type: 거래글 유형 필터 (선택사항, WTT|WTS|WTB)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const typeFilter = searchParams.get("type");

    // Mock 데이터: 테스트용 거래글
    const mockPosts: TradePost[] = [
      {
        id: "trade_mock_1",
        type: "WTT",
        offeringCardIds: ["card-aespa-001", "card-aespa-002"],
        seekingCardIds: ["card-bts-001", "card-newjeans-003"],
        contactType: "twitter",
        contactValue: "@collector_1",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        id: "trade_mock_2",
        type: "WTS",
        offeringCardIds: ["card-bts-005"],
        seekingCardIds: [],
        price: 25000,
        currency: "KRW",
        shippingFee: 3000,
        contactType: "openKakao",
        contactValue: "https://open.kakao.com/xxx",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
      },
      {
        id: "trade_mock_3",
        type: "WTB",
        offeringCardIds: [],
        seekingCardIds: ["card-seventeen-010"],
        price: 18000,
        currency: "KRW",
        contactType: "discord",
        contactValue: "collector#1234",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 259200000),
      },
    ];

    // 저장된 posts와 mock posts 합치기
    const allPosts = [
      ...Array.from(mockTradeStore.values()),
      ...mockPosts,
    ];

    // 유형 필터 적용
    let filteredPosts = allPosts;
    if (typeFilter && ["WTT", "WTS", "WTB"].includes(typeFilter)) {
      filteredPosts = allPosts.filter((post) => post.type === typeFilter);
    }

    // 활성 거래글만 반환
    filteredPosts = filteredPosts.filter((post) => post.status === "ACTIVE");

    // 최신순 정렬
    filteredPosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 페이징
    const total = filteredPosts.length;
    const start = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(start, start + limit);

    const response: TradePostListResponse = {
      posts: paginatedPosts,
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching trade posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
