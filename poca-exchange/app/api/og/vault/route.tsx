import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export const contentType = "image/png";

const notoSansKrSubset = await readFile(
  join(process.cwd(), "lib/fonts/noto-sans-kr-subset.woff")
);

interface UserVaultOGData {
  userId: string;
  userName: string;
  collectorIndex: number;
  totalCards: number;
  completeSets: number;
  estimatedVaultValue: number;
  topCards: Array<{
    imageUrl: string | null;
    memberName: string | null;
    groupName: string;
  }>;
}

async function fetchUserVaultData(userId: string): Promise<UserVaultOGData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      binderCards: {
        include: {
          card: {
            include: {
              group: true,
              member: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  const binderCards = user.binderCards ?? [];
  const totalCards = binderCards.length;
  const topCards = binderCards.slice(0, 5).map((bc: any) => ({
    imageUrl: bc.card.imageUrl ?? bc.card.thumbImagePath,
    memberName: bc.card.member?.nameEn ?? null,
    groupName: bc.card.group.nameEn,
  }));

  const estimatedVaultValue = binderCards.reduce(
    (sum: number, bc: any) => sum + (bc.card.estimatedPrice ?? 0),
    0
  );

  return {
    userId: user.id,
    userName: user.name ?? "Collector",
    collectorIndex: user.collectorIndex,
    totalCards,
    completeSets: 0, // TODO: Calculate from actual complete sets
    estimatedVaultValue,
    topCards,
  };
}

function VaultOGCard({
  userName,
  totalCards,
  completeSets,
  collectorIndex,
  estimatedVaultValue,
  topCards,
}: UserVaultOGData) {
  const vaultPercentage = Math.min(
    100,
    Math.round((totalCards / 24) * 100) // TODO: Dynamic total cards per group
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        padding: "56px",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#ffffff",
          }}
        >
          📚 StanPC
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#a3a3a3",
          }}
        >
          @{userName}'s Vault
        </div>
      </div>

      {/* Card Thumbnails Grid (5 cards max) */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 40,
          marginBottom: 40,
        }}
      >
        {topCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              width: 120,
              height: 180,
              borderRadius: 8,
              background: "#2a2a2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "2px solid #404040",
            }}
          >
            {card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                width={120}
                height={180}
                style={{ objectFit: "cover" }}
                alt=""
              />
            ) : (
              <div style={{ color: "#737373", fontSize: 12 }}>No Image</div>
            )}
          </div>
        ))}
      </div>

      {/* Collection Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
        <div>
          <div style={{ fontSize: 20, color: "#a3a3a3", marginBottom: 8 }}>
            📊 Collection Progress
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#4ade80" }}>
            {totalCards} / 24 Cards ({vaultPercentage}%)
          </div>
        </div>

        <div>
          <div style={{ fontSize: 20, color: "#a3a3a3", marginBottom: 8 }}>
            💰 Estimated Vault Value
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#60a5fa" }}>
            ${estimatedVaultValue.toFixed(2)}
          </div>
        </div>

        {collectorIndex > 0 && (
          <div>
            <div style={{ fontSize: 20, color: "#a3a3a3", marginBottom: 8 }}>
              🏆 Collector Index
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fbbf24" }}>
              {collectorIndex} pts
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "1px solid #404040",
          marginTop: 24,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 600 }}>
          👉 Build & Showcase your Vault
        </div>
        <div style={{ fontSize: 18, color: "#737373" }}>stanpc.com</div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId query parameter", { status: 400 });
  }

  const vaultData = await fetchUserVaultData(userId);
  if (!vaultData) {
    return new Response("User vault not found", { status: 404 });
  }

  return new ImageResponse(<VaultOGCard {...vaultData} />, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Noto Sans KR",
        data: notoSansKrSubset,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
