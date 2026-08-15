import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/user/vault
 * Returns the current authenticated user's vault profile data:
 * - User info (name, image, badges, collector index)
 * - Collections grouped by album with HAVE/WANT counts
 * - Stats (total cards, collect completion %)
 *
 * Requires authentication.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user profile with badges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: {
          include: { badge: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all binder cards grouped by album
    const binderCards = await prisma.userBinderCard.findMany({
      where: { userId },
      include: {
        card: {
          include: {
            group: true,
            album: true,
            member: true,
          },
        },
      },
      orderBy: [
        { card: { album: { releaseDate: "desc" } } },
        { card: { member: { nameEn: "asc" } } },
      ],
    });

    // Group by album and calculate stats
    const albumGroups = new Map<
      string,
      {
        albumId: string;
        albumName: string;
        groupName: string;
        total: number;
        have: number;
        want: number;
        cards: typeof binderCards;
      }
    >();

    // Get all cards in the database for the albums user has cards in
    const albumIds = [
      ...new Set(binderCards.map((bc) => bc.card.albumId).filter(Boolean)),
    ];

    const allCardsInAlbums = albumIds.length > 0
      ? await prisma.photoCard.findMany({
          where: { albumId: { in: albumIds as string[] } },
          include: {
            album: true,
            group: true,
            member: true,
          },
        })
      : [];

    // Build album groups with completion stats
    for (const card of allCardsInAlbums as any) {
      if (!card.album) continue;

      const key = card.album.id;
      if (!albumGroups.has(key)) {
        albumGroups.set(key, {
          albumId: card.album.id,
          albumName: card.album.title,
          groupName: card.group?.nameEn || "Unknown",
          total: 0,
          have: 0,
          want: 0,
          cards: [],
        });
      }

      const group = albumGroups.get(key)!;
      group.total += 1;

      // Check if user has this card
      const userCard = binderCards.find((bc) => bc.cardId === card.id);
      if (userCard) {
        if (userCard.status === "OWNED" || userCard.status === "WTT" || userCard.status === "WTS") {
          group.have += 1;
        } else if (userCard.status === "WTB") {
          group.want += 1;
        }
      }
    }

    // Build the grid data: all cards (have + missing)
    const gridCards = [];
    for (const [_, albumGroup] of albumGroups) {
      // Add cards user has
      for (const binderCard of binderCards) {
        if (binderCard.card.albumId === albumGroup.albumId) {
          gridCards.push({
            id: binderCard.id,
            cardId: binderCard.card.id,
            slug: binderCard.card.slug,
            imageUrl: binderCard.card.imageUrl,
            thumbImagePath: binderCard.card.thumbImagePath,
            cardName: binderCard.card.cardName,
            member: binderCard.card.member,
            album: albumGroup.albumName,
            status: binderCard.status,
            isMissing: false,
          });
        }
      }

      // Add missing cards (grayscale placeholder)
      for (const card of allCardsInAlbums) {
        if (card.albumId === albumGroup.albumId) {
          const hasCard = binderCards.some((bc) => bc.cardId === card.id);
          if (!hasCard) {
            gridCards.push({
              id: `missing_${card.id}`,
              cardId: card.id,
              slug: card.slug,
              imageUrl: card.imageUrl,
              thumbImagePath: card.thumbImagePath,
              cardName: card.cardName,
              member: card.member?.nameKr || card.member?.nameEn || undefined,
              album: albumGroup.albumName,
              status: "MISSING",
              isMissing: true,
            });
          }
        }
      }
    }

    // Calculate overall stats
    const ownedCount = binderCards.filter(
      (bc) =>
        bc.status === "OWNED" ||
        bc.status === "WTT" ||
        bc.status === "WTS"
    ).length;
    const wishedCount = binderCards.filter((bc) => bc.status === "WTB").length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || "Anonymous",
        image: user.image,
        collectorIndex: user.collectorIndex,
        mannerScore: user.mannerScore,
        badges: user.badges,
      },
      albums: Array.from(albumGroups.values()),
      cards: gridCards,
      stats: {
        totalCards: binderCards.length,
        ownedCount,
        wishedCount,
        completion: allCardsInAlbums.length
          ? ((ownedCount / allCardsInAlbums.length) * 100).toFixed(1)
          : "0",
      },
    });
  } catch (error) {
    console.error("Error fetching user vault:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault data" },
      { status: 500 }
    );
  }
}
