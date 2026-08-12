import { getCardBySlug } from "@/lib/queries";
import { buildPhotocardSearchQuery } from "@/lib/search-query";
import { searchEbayPhotocards } from "@/lib/ebay";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardSlug = searchParams.get("cardSlug");
  if (!cardSlug) {
    return Response.json(
      { error: "Missing cardSlug query parameter" },
      { status: 400 }
    );
  }

  const card = await getCardBySlug(cardSlug);
  if (!card) {
    return Response.json({ error: "card not found" }, { status: 404 });
  }

  try {
    const listings = await searchEbayPhotocards(
      buildPhotocardSearchQuery(card)
    );
    return Response.json({ listings });
  } catch (error) {
    // eBay being down/misconfigured shouldn't break the page — this is a
    // nice-to-have live-data panel, not core functionality. Log server-side
    // for debuggability and degrade to an empty result client-side.
    console.error("eBay Browse API search failed:", error);
    return Response.json({ listings: [] });
  }
}
