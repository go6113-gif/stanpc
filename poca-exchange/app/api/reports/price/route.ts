import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_REPORTED_PRICE = 10_000_000;
const MAX_COMMENT_LENGTH = 500;

type ReportBody = {
  cardId: string;
  reportedPrice: number;
  sourceUrl?: string;
  reporterComment?: string;
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseBody(body: unknown): ReportBody | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.cardId !== "string" || b.cardId.length === 0) return null;
  if (
    typeof b.reportedPrice !== "number" ||
    !Number.isInteger(b.reportedPrice) ||
    b.reportedPrice <= 0 ||
    b.reportedPrice > MAX_REPORTED_PRICE
  ) {
    return null;
  }
  if (
    b.sourceUrl !== undefined &&
    (typeof b.sourceUrl !== "string" || !isValidHttpUrl(b.sourceUrl))
  ) {
    return null;
  }
  if (
    b.reporterComment !== undefined &&
    (typeof b.reporterComment !== "string" ||
      b.reporterComment.length > MAX_COMMENT_LENGTH)
  ) {
    return null;
  }

  return {
    cardId: b.cardId,
    reportedPrice: b.reportedPrice,
    sourceUrl: b.sourceUrl as string | undefined,
    reporterComment: b.reporterComment as string | undefined,
  };
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = parseBody(body);
  if (!parsed) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const report = await prisma.priceReport.create({
      data: {
        cardId: parsed.cardId,
        reportedPrice: parsed.reportedPrice,
        sourceUrl: parsed.sourceUrl,
        reporterComment: parsed.reporterComment,
      },
      select: { id: true, createdAt: true },
    });
    return Response.json(
      { recorded: true, id: report.id },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return Response.json({ error: "card not found" }, { status: 404 });
    }
    throw error;
  }
}
