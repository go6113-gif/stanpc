import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";
import type { Prisma } from "@/app/generated/prisma/client";

// DB-first pagination: scoped to MVP groups, ordered at the database level.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "24"));
    const sortBy = searchParams.get("sort") || "popular";
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    // Build where clause scoped to MVP groups
    const where: Prisma.PhotoCardWhereInput = {
      group: { slug: { in: [...MVP_GROUP_SLUGS] } },
    };

    // Price filter
    if (priceMin || priceMax) {
      where.estimatedPrice = {
        gte: priceMin ? parseFloat(priceMin) : undefined,
        lte: priceMax ? parseFloat(priceMax) : undefined,
      };
    }

    // Sort at DB level
    const orderBy: Prisma.PhotoCardOrderByWithRelationInput | Prisma.PhotoCardOrderByWithRelationInput[] =
      sortBy === "price-asc"
        ? { estimatedPrice: "asc" }
        : sortBy === "price-desc"
          ? { estimatedPrice: "desc" }
          : sortBy === "newest"
            ? { createdAt: "desc" }
            : [{ wantCount: "desc" }, { haveCount: "desc" }, { viewCount: "desc" }]; // popular

    // Fetch total count (for pagination metadata)
    const total = await prisma.photoCard.count({ where });

    // Fetch paginated results with relationships
    const cards = await prisma.photoCard.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        group: { select: { slug: true, nameEn: true, nameKr: true } },
        member: { select: { nameEn: true, nameKr: true } },
        album: { select: { title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: cards.map((card) => ({
        slug: card.slug,
        cardName: card.cardName,
        imageUrl: card.imageUrl,
        thumbImagePath: card.thumbImagePath,
        version: card.version,
        groupSlug: card.group.slug,
        groupName: card.group.nameKr ?? card.group.nameEn,
        memberName: card.member ? card.member.nameKr ?? card.member.nameEn : null,
        albumTitle: card.album?.title ?? null,
        estimatedPrice: card.estimatedPrice,
        haveCount: card.haveCount,
        wantCount: card.wantCount,
        viewCount: card.viewCount,
        badge: card.badge,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[/api/photocards] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photocards" },
      { status: 500 }
    );
  }
}
