import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockPhotocards } from "@/lib/mock-photocards";

interface PriceRange {
  min: number;
  max: number;
}

interface FilterParams {
  priceRange?: PriceRange;
  countries?: string[];
}

// Parse filter query param: "price:1000-5000,country:US,JP"
function parseFilters(filterStr?: string): FilterParams {
  const filters: FilterParams = {};

  if (!filterStr) return filters;

  const parts = filterStr.split(",");

  for (const part of parts) {
    const [key, value] = part.split(":");

    if (key === "price" && value) {
      const [min, max] = value.split("-").map(Number);
      filters.priceRange = { min, max };
    }

    if (key === "country" && value) {
      filters.countries = value.split("|");
    }
  }

  return filters;
}

// Sort photocards based on sort param
type SortType = "popular" | "price-asc" | "price-desc" | "newest";

function sortPhotocards(
  cards: any[],
  sortType: SortType
): any[] {
  const sorted = [...cards];

  switch (sortType) {
    case "popular":
      return sorted.sort((a, b) => b.viewCount - a.viewCount);

    case "price-asc":
      return sorted.sort((a, b) => (a.estimatedPrice || 0) - (b.estimatedPrice || 0));

    case "price-desc":
      return sorted.sort((a, b) => (b.estimatedPrice || 0) - (a.estimatedPrice || 0));

    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    default:
      return sorted;
  }
}

// Apply filters to photocards
function filterPhotocards(cards: any[], filters: FilterParams): any[] {
  return cards.filter((card) => {
    // Price filter
    if (filters.priceRange) {
      const price = card.estimatedPrice || 0;
      if (
        price < filters.priceRange.min ||
        price > filters.priceRange.max
      ) {
        return false;
      }
    }

    // Country filter (stub: normally would check group.country or similar)
    // For MVP, skip country filter as schema doesn't have country field yet

    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "12"));
    const sortParam = (searchParams.get("sort") || "popular") as SortType;
    const filterParam = searchParams.get("filter");

    // Parse filters
    const filters = parseFilters(filterParam || undefined);

    // Attempt to fetch from database
    const photocards = await prisma.photoCard.findMany({
      include: {
        priceHistory: {
          orderBy: { createdAt: "desc" },
          take: 5, // Last 5 price entries
        },
        skuMappings: {
          where: { isActive: true },
        },
        group: {
          select: { id: true, nameEn: true, nameKr: true, slug: true },
        },
        member: {
          select: { id: true, nameEn: true, nameKr: true, slug: true },
        },
        album: {
          select: { id: true, title: true, slug: true },
        },
      },
      take: limit * 2, // Fetch extra to account for filtering
    });

    // Apply filters and sorting
    let filtered = filterPhotocards(photocards, filters);
    let sorted = sortPhotocards(filtered, sortParam);

    // Paginate
    const total = sorted.length;
    const paginatedCards = sorted.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      success: true,
      source: "database",
      data: paginatedCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // Log error server-side for debugging
    console.error("[/api/photocards] Database error:", error);

    // Graceful degradation: return mock data
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get("limit") || "12"));
    const sortParam = (request.nextUrl.searchParams.get("sort") || "popular") as SortType;
    const filterParam = request.nextUrl.searchParams.get("filter");

    const filters = parseFilters(filterParam || undefined);
    let filtered = filterPhotocards(mockPhotocards, filters);
    let sorted = sortPhotocards(filtered, sortParam);

    const total = sorted.length;
    const paginatedCards = sorted.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      success: true,
      source: "mock",
      warning: "Database unavailable, returning mock data",
      data: paginatedCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}
