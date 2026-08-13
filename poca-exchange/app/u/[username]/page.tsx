"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/vault/profile-header";
import { CollectionGrid } from "@/components/vault/collection-grid";
import { ShowcaseModal } from "@/components/vault/showcase-modal";

interface VaultData {
  user: {
    id: string;
    name: string;
    image: string | null;
    collectorIndex: number;
    mannerScore: number;
    badges: Array<{
      badge: {
        badgeName: string;
        badgeIcon: string | null;
      };
    }>;
  };
  albums: Array<{
    albumId: string;
    albumName: string;
    groupName: string;
    total: number;
    have: number;
    want: number;
    cards: Array<{
      id: string;
      cardId: string;
      slug: string;
      imageUrl: string | null;
      thumbImagePath: string | null;
      cardName: string | null;
      member: {
        nameEn: string;
      } | null;
      album: string;
      status: string;
      isMissing: boolean;
    }>;
  }>;
  cards: Array<{
    imageUrl: string | null;
    thumbImagePath: string | null;
    isMissing: boolean;
  }>;
  stats: {
    totalCards: number;
    haveCount: number;
    wantCount: number;
    completion: string;
  };
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function MyVaultPage({ params }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShowcase, setShowShowcase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setUsername(resolvedParams.username as string);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const fetchVault = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/user/vault");
        if (!res.ok) {
          throw new Error(`Failed to fetch vault: ${res.status}`);
        }
        const data = await res.json();
        setVaultData(data);
      } catch (err) {
        console.error("Error fetching vault:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVault();
  }, [session, router]);

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-red-500" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            바인더를 불러오는 중...
          </p>
        </div>
      </main>
    );
  }

  if (error || !vaultData) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <p className="font-semibold text-red-900 dark:text-red-100">
            오류가 발생했습니다
          </p>
          <p className="mt-2 text-red-800 dark:text-red-200">
            {error || "바인더 데이터를 불러올 수 없습니다."}
          </p>
        </div>
      </main>
    );
  }

  const totalCards = vaultData.cards.filter((c) => !c.isMissing).length;
  const remaining = Math.max(
    0,
    vaultData.cards.length - totalCards
  );

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <ProfileHeader
          user={vaultData.user}
          stats={{
            haveCount: vaultData.stats.haveCount,
            wantCount: vaultData.stats.wantCount,
          }}
          isOwn={true}
          onShowcaseClick={() => setShowShowcase(true)}
        />

        {/* Collection Grid */}
        <CollectionGrid albums={vaultData.albums} />
      </main>

      {/* Showcase Modal */}
      {username && (
        <ShowcaseModal
          isOpen={showShowcase}
          onClose={() => setShowShowcase(false)}
          username={username}
          userImage={vaultData.user.image}
          userName={vaultData.user.name}
          cards={vaultData.cards}
          completionPercentage={Math.round(
            Number(vaultData.stats.completion)
          )}
          remainingCount={remaining}
        />
      )}
    </>
  );
}
