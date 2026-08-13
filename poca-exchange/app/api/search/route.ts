import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/search?q={query}
 * Real-time search across groups (artists), members, albums, and photocards.
 * Returns results grouped by type.
 *
 * Query parameters:
 * - q: search query (required, min 2 chars)
 * - limit: max results per category (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (!query || query.length < 1) {
      return NextResponse.json({
        artists: [],
        members: [],
        albums: [],
        photocards: [],
      });
    }

    // Prepare search pattern for PostgreSQL ILIKE (case-insensitive)
    const searchPattern = `%${query}%`;

    // Parallel fetch across all categories
    const [groups, members, albums, photocards] = await Promise.all([
      // Search Groups (Artists)
      prisma.group.findMany({
        where: {
          OR: [
            { nameEn: { contains: query, mode: "insensitive" } },
            { nameKr: { contains: query, mode: "insensitive" } },
            { aliases: { has: query } }, // Search in aliases array
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameKr: true,
          imageUrl: true,
        },
        take: limit,
      }),

      // Search Members
      prisma.member.findMany({
        where: {
          OR: [
            { nameEn: { contains: query, mode: "insensitive" } },
            { nameKr: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          group: {
            select: {
              slug: true,
              nameEn: true,
            },
          },
        },
        take: limit,
      }),

      // Search Albums
      prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { group: { nameEn: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          group: {
            select: {
              nameEn: true,
              nameKr: true,
            },
          },
        },
        take: limit,
      }),

      // Search PhotoCards
      prisma.photoCard.findMany({
        where: {
          OR: [
            { cardName: { contains: query, mode: "insensitive" } },
            { version: { contains: query, mode: "insensitive" } },
            { group: { nameEn: { contains: query, mode: "insensitive" } } },
            { member: { nameEn: { contains: query, mode: "insensitive" } } },
            { member: { nameKr: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          group: {
            select: {
              nameEn: true,
              nameKr: true,
            },
          },
          member: {
            select: {
              nameEn: true,
              nameKr: true,
            },
          },
          album: {
            select: {
              title: true,
            },
          },
        },
        take: limit,
      }),
    ]);

    // Format results
    return NextResponse.json({
      artists: groups.map((g) => ({
        id: g.id,
        slug: g.slug,
        type: "artist",
        nameKo: g.nameKr || g.nameEn,
        nameEn: g.nameEn,
        image: g.imageUrl,
      })),

      members: members.map((m) => ({
        id: m.id,
        type: "member",
        nameKo: m.nameKr || m.nameEn,
        nameEn: m.nameEn,
        groupSlug: m.group.slug,
        groupName: m.group.nameEn,
        image: m.imageUrl,
      })),

      albums: albums.map((a) => ({
        id: a.id,
        slug: a.slug,
        type: "album",
        title: a.title,
        groupName: a.group.nameEn,
        groupNameKo: a.group.nameKr || a.group.nameEn,
        releaseDate: a.releaseDate?.toISOString(),
      })),

      photocards: photocards.map((pc) => ({
        id: pc.id,
        slug: pc.slug,
        type: "photocard",
        cardName: pc.cardName || "Unknown",
        groupName: pc.group.nameEn,
        groupNameKo: pc.group.nameKr || pc.group.nameEn,
        memberName: pc.member?.nameEn,
        memberNameKo: pc.member?.nameKr,
        version: pc.version,
        albumTitle: pc.album?.title,
        image: pc.imageUrl || pc.thumbImagePath,
      })),
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
