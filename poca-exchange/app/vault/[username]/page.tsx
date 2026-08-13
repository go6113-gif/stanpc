import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

interface PublicVaultPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ vaultStatus?: string }>;
}

/**
 * Public vault profile page — shared photocard collection
 * Accessible at /vault/[username]
 * No auth required; displays public binder info with C2C contact buttons
 */
export async function generateMetadata(
  props: PublicVaultPageProps
): Promise<Metadata> {
  const { username } = await props.params;

  return {
    title: `${username}'s Photocard Vault — StanPC`,
    description: `Check out ${username}'s K-pop photocard collection on StanPC. Browse, trade, and connect!`,
    openGraph: {
      ...siteConfig.ogDefaults,
      title: `${username}'s Photocard Vault — StanPC`,
      description: `Check out ${username}'s K-pop photocard collection on StanPC. Browse, trade, and connect!`,
      url: `/vault/${username}`,
    },
  };
}

export default async function PublicVaultPage(props: PublicVaultPageProps) {
  const { username } = await props.params;
  const { vaultStatus } = await props.searchParams;

  // Fetch public profile data
  const apiUrl = new URL(`/api/vault/profile/${username}`, siteConfig.url);
  if (vaultStatus && vaultStatus !== 'all') {
    apiUrl.searchParams.set('vaultStatus', vaultStatus);
  }

  let profileData: any = null;
  try {
    const res = await fetch(apiUrl.toString(), { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) notFound();
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }
    profileData = await res.json();
  } catch (error) {
    console.error('Error fetching vault profile:', error);
    notFound();
  }

  const { user, cards, stats } = profileData;

  // Filter options
  const filterOptions = [
    { label: 'All Cards', value: 'all' },
    { label: 'Owned', value: 'owned', badge: stats.ownedCards },
    { label: 'ISO', value: 'iso', badge: stats.isoCards },
    { label: 'For Trade', value: 'trade', badge: stats.forTradeCards },
    { label: 'For Sale', value: 'sale', badge: stats.forSaleCards },
  ];

  const currentFilter = vaultStatus || 'all';

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* User Header */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800 object-cover"
          />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 sm:justify-start">
            <span>📊 Collector Index: {user.collectorIndex}</span>
            <span>🤝 Manner: {user.mannerScore.toFixed(1)}°C</span>
            <span>📦 {stats.totalCards} Cards</span>
          </div>
        </div>
      </div>

      {/* C2C Contact Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center sm:justify-start">
        {user.twitterHandle && (
          <a
            href={`https://twitter.com/${user.twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <span>𝕏</span> DM on Twitter
          </a>
        )}
        {user.openKakaoUrl && (
          <a
            href={user.openKakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-black hover:bg-yellow-500 transition-colors"
          >
            <span>💬</span> Kakao Talk
          </a>
        )}
        {user.discordUrl && (
          <a
            href={user.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <span>⚙️</span> Discord
          </a>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Link
            key={option.value}
            href={
              option.value === 'all'
                ? `/vault/${username}`
                : `/vault/${username}?vaultStatus=${option.value}`
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentFilter === option.value
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            {option.label}
            {option.badge && option.badge > 0 && (
              <span className="ml-2 rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-white dark:bg-neutral-300 dark:text-neutral-900">
                {option.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Cards Grid */}
      {cards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((item: any) => (
            <Link
              key={item.id}
              href={`/card/${item.card.slug}`}
              className="group"
            >
              <div className="aspect-[5/7] w-full overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800 mb-2">
                {item.card.imageUrl || item.card.thumbImagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.card.imageUrl || item.card.thumbImagePath}
                    alt={item.card.cardName || `${item.card.group.nameEn} PC`}
                    className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="text-xs">
                <p className="font-semibold line-clamp-1 group-hover:underline">
                  {item.card.cardName ||
                    `${item.card.group.nameEn} PC`}
                </p>
                <p className="text-neutral-500 text-xs">
                  {item.card.member?.nameEn && (
                    <span>{item.card.member.nameEn}</span>
                  )}
                </p>
                {item.card.estimatedPrice && (
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ${item.card.estimatedPrice.toFixed(2)}
                  </p>
                )}
              </div>
              {/* Trade/Sale Badge */}
              {(item.status === 'FOR_TRADE' || item.status === 'FOR_SALE') && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                  {item.status === 'FOR_TRADE' ? '🔄 Trade' : '💰 Sale'}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-neutral-500">
          <p>No cards found in this category.</p>
        </div>
      )}

      {/* Sign Up CTA */}
      <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center dark:from-blue-950 dark:to-indigo-950">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Want to showcase your own collection?
        </h2>
        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
          Create your personal photocard vault in 10 seconds. Start collecting,
          trading, and connecting with other collectors!
        </p>
        <Link
          href="/auth/signup"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Create My Vault Now
        </Link>
      </div>
    </main>
  );
}
