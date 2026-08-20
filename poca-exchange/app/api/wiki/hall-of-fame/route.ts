import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hall of Fame — top 20 users by Collector Index.
 *
 * Returns rank, user info, collector index breakdown, and earned badges.
 * Public read-only endpoint (no auth required).
 */
export async function GET() {
  try {
    const topUsers = await prisma.user.findMany({
      where: { collectorIndex: { gt: 0 } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        collectorIndex: true,
        badges: {
          select: {
            badge: {
              select: {
                badgeId: true,
                badgeName: true,
                badgeIcon: true,
              },
            },
            acquiredAt: true,
          },
        },
      },
      orderBy: { collectorIndex: "desc" },
      take: 20,
    });

    const ranked = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      collectorIndex: user.collectorIndex,
      badges: user.badges.map((ub) => ({
        id: ub.badge.badgeId,
        name: ub.badge.badgeName,
        icon: ub.badge.badgeIcon,
        acquiredAt: ub.acquiredAt,
      })),
    }));

    return NextResponse.json({
      users: ranked,
      totalCount: topUsers.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Hall of Fame error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Hall of Fame" },
      { status: 500 }
    );
  }
}
