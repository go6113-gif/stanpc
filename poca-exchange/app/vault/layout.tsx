import { ReactNode } from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { seoFormulas } from "@/lib/seo-config";
import { siteConfig } from "@/lib/site-config";
import { VaultLayoutClient } from "./VaultLayoutClient";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      title: "My Vault",
      description: "Build and showcase your photocard collection",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      binderCards: {
        select: {
          card: { select: { estimatedPrice: true } },
        },
      },
    },
  });

  if (!user) {
    return {
      title: "My Vault",
      description: "Build and showcase your photocard collection",
    };
  }

  const totalCards = user.binderCards.length;
  const estimatedVaultValue = user.binderCards.reduce(
    (sum, bc) => sum + (bc.card.estimatedPrice ?? 0),
    0
  );

  const vaultData = {
    userName: user.name ?? "Collector",
    collectorIndex: user.collectorIndex,
    totalCards,
    completeSets: 0,
    estimatedVaultValue,
  };

  const title = seoFormulas.vaultTitle(vaultData);
  const description = seoFormulas.vaultDescription(vaultData);
  const ogImageUrl = `${siteConfig.url}/api/og/vault?userId=${user.id}`;

  return {
    title,
    description,
    openGraph: {
      ...siteConfig.ogDefaults,
      title,
      description,
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.name}'s Photocard Vault`,
        },
      ],
      url: `${siteConfig.url}/vault`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: user.name ? `@${user.name.replace(/\s+/g, "")}` : undefined,
    },
  };
}

export default function VaultLayout({ children }: { children: ReactNode }) {
  return <VaultLayoutClient>{children}</VaultLayoutClient>;
}
