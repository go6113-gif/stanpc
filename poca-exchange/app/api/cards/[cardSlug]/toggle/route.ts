import { prisma } from "@/lib/prisma";

type ToggleBody = {
  type: "have" | "want";
  value: boolean;
};

function isToggleBody(body: unknown): body is ToggleBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    (b.type === "have" || b.type === "want") && typeof b.value === "boolean"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardSlug: string }> }
) {
  const { cardSlug } = await params;
  const body: unknown = await request.json().catch(() => null);

  if (!isToggleBody(body)) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const column = body.type === "have" ? "haveCount" : "wantCount";
  const delta = body.value ? 1 : -1;

  const rows = await prisma.$queryRawUnsafe<
    { haveCount: number; wantCount: number }[]
  >(
    `UPDATE photo_cards
     SET "${column}" = GREATEST("${column}" + $1, 0)
     WHERE slug = $2
     RETURNING "haveCount", "wantCount"`,
    delta,
    cardSlug
  );

  const card = rows[0];
  if (!card) {
    return Response.json({ error: "card not found" }, { status: 404 });
  }
  return Response.json(card);
}
