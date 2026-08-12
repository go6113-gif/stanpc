'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  getAffiliateLink,
  trackAffiliateClick,
  type AffiliateConfig,
} from '@/lib/affiliate';
import QuickCheckInButton from './QuickCheckInButton';
import { useSession } from 'next-auth/react';

interface AffiliateCardCellProps {
  id: string;
  slug: string;
  imageUrl: string | null;
  version?: string | null;
  estimatedPrice: number | null;
  haveCount: number;
  wantCount: number;
  cardName?: string | null;
  memberName: string;
  groupName: string;
  albumSlug?: string;
  albumTitle?: string;
}

export default function AffiliateCardCell({
  id,
  slug,
  imageUrl,
  version,
  estimatedPrice,
  haveCount,
  wantCount,
  cardName,
  memberName,
  groupName,
  albumSlug,
  albumTitle,
}: AffiliateCardCellProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleAffiliateClick = async (platform: 'ebay' | 'pocamarket' | 'dk-shop') => {
    setIsLoading(true);

    try {
      // Track the click
      await trackAffiliateClick(id, platform, session?.user?.id);

      // Generate and open affiliate link
      const affiliateConfig: AffiliateConfig = {
        platform,
        cardName: cardName || 'Photocard',
        memberName,
        groupName,
        estimatedPrice: estimatedPrice ?? undefined,
      };

      const affiliateUrl = getAffiliateLink(platform, affiliateConfig);
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Affiliate click error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group flex flex-col rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
      {/* Card Image */}
      <Link
        href={`/card/${slug}`}
        className="relative aspect-[56/87] bg-neutral-200 dark:bg-neutral-700 overflow-hidden"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${memberName} ${groupName} ${cardName || ''} Photocard Template`}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700">
            <span className="text-xs text-neutral-600 dark:text-neutral-300">No Image</span>
          </div>
        )}
      </Link>

      {/* Card Info */}
      <div className="flex flex-col flex-1 p-3">
        {/* Version/Album */}
        {(version || albumTitle) && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate line-clamp-1">
            {version || albumTitle}
          </p>
        )}

        {/* Price */}
        {estimatedPrice && (
          <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
            ${estimatedPrice.toFixed(2)}
          </p>
        )}

        {/* Stats */}
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          보유: {haveCount} | 원함: {wantCount}
        </p>

        {/* Spacer */}
        <div className="flex-1 mt-2" />

        {/* Quick Check-in Buttons */}
        <div className="mb-3">
          <QuickCheckInButton cardId={id} cardName={cardName || undefined} memberName={memberName} />
        </div>

        {/* Buy Options */}
        {estimatedPrice && (
          <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-2">
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Lowest Price:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAffiliateClick('ebay')}
                disabled={isLoading}
                className="text-xs font-medium px-2 py-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                eBay
              </button>
              <button
                onClick={() => handleAffiliateClick('pocamarket')}
                disabled={isLoading}
                className="text-xs font-medium px-2 py-1.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
              >
                Pocamarket
              </button>
            </div>
          </div>
        )}

        {/* SEO Link (hidden) */}
        <Link
          href={`/card/${slug}`}
          className="sr-only"
          title={`${memberName} ${groupName} ${cardName || 'Photocard'}`}
        >
          View details
        </Link>
      </div>
    </div>
  );
}
