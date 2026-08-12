import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MARKETS = ["ebay", "buyee"] as const;
type Market = (typeof MARKETS)[number];

type OutboundBody = {
  cardId: string;
  market: Market;
};

function isOutboundBody(body: unknown): body is OutboundBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.cardId === "string" &&
    b.cardId.length > 0 &&
    typeof b.market === "string" &&
    MARKETS.includes(b.market as Market)
  );
}

export async function POST(request: Request) {
  // sendBeacon posts a Blob without a JSON content-type guarantee across
  // browsers, so parse the body as text first rather than relying on
  // request.json()'s content-type check.
  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  if (!isOutboundBody(body)) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { cardId, market } = body;

  try {
    const [click] = await prisma.$transaction([
      prisma.outboundClick.create({
        data: { cardId, market },
        select: { id: true, createdAt: true },
      }),
      prisma.photoCard.update({
        where: { id: cardId },
        data: { clickCount: { increment: 1 } },
        select: { id: true },
      }),
    ]);
    return Response.json({ recorded: true, timestamp: click.createdAt });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2025")
    ) {
      return Response.json({ error: "card not found" }, { status: 404 });
    }
    throw error;
  }
}
