import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ContributionPayload {
  artistGroup: string;
  artistMember: string;
  releaseType: "ALBUM" | "POB" | "LUCKY_DRAW" | "BROADCAST" | "SEASON_GREETING" | "OTHER";
  sourceStore: string;
  versionOrRound: string;
  imageUrl: string;
  contributorHandle?: string;
  userId?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContributionPayload;

    const {
      artistGroup,
      artistMember,
      releaseType,
      sourceStore,
      versionOrRound,
      imageUrl,
      contributorHandle,
      userId,
    } = body;

    // Validate required fields
    if (
      !artistGroup ||
      !artistMember ||
      !releaseType ||
      !sourceStore ||
      !versionOrRound ||
      !imageUrl
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: [
            "artistGroup",
            "artistMember",
            "releaseType",
            "sourceStore",
            "versionOrRound",
            "imageUrl",
          ],
        },
        { status: 400 }
      );
    }

    // TODO: Save to Prisma when Contribution model is added to schema
    // For now, log the contribution and return success
    console.log("[Contribution Received]", {
      artistGroup,
      artistMember,
      releaseType,
      sourceStore,
      versionOrRound,
      imageUrl,
      contributorHandle: contributorHandle || "Anonymous",
      userId: userId || "Guest",
      timestamp: new Date().toISOString(),
    });

    // Simulate async processing delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json(
      {
        success: true,
        message: "감사합니다! 제보가 접수되었습니다. 검증 후 도감에 정식 등재됩니다.",
        contribution: {
          id: `contrib_${Date.now()}`,
          artistGroup,
          artistMember,
          releaseType,
          sourceStore,
          versionOrRound,
          imageUrl,
          contributorHandle: contributorHandle || "익명",
          status: "PENDING",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Contribution API Error]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
