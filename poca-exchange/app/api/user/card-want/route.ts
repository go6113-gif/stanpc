import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { cardId, isWant } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: "Missing cardId" },
        { status: 400 }
      );
    }

    if (isWant) {
      // Add to ISO (In Search Of) / Want list
      await prisma.userBinderCard.upsert({
        where: {
          userId_cardId: { userId: session.user.id, cardId },
        },
        create: {
          userId: session.user.id,
          cardId,
          status: "ISO",
        },
        update: {
          status: "ISO",
        },
      });
    } else {
      // Remove from want list
      await prisma.userBinderCard.deleteMany({
        where: {
          userId: session.user.id,
          cardId,
          status: "ISO",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Card want toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
