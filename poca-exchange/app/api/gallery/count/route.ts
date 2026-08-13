import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { countFilteredPhotoCards } from "@/lib/queries";
import { parseFilterState } from "@/lib/filter-query";

// Backs FilterDrawer's live "{N}개의 포카 보기" CTA — same filter query
// params as the gallery page itself, but returns just the count so the
// drawer can re-fetch on every draft change without pulling full card rows.
export async function GET(request: NextRequest) {
  const filters = parseFilterState(request.nextUrl.searchParams);
  const session = await auth();
  const count = await countFilteredPhotoCards(filters, session?.user?.id);
  return NextResponse.json({ count });
}
