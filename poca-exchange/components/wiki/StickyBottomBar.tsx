'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StickyBottomBarProps {
  memberName: string;
  groupName: string;
}

export default function StickyBottomBar({
  memberName,
  groupName,
}: StickyBottomBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this bar today
    const dismissedAt = localStorage.getItem('sticky-bar-dismissed');
    if (dismissedAt) {
      const dayAgo = new Date().getTime() - 24 * 60 * 60 * 1000;
      if (parseInt(dismissedAt) > dayAgo) {
        setIsDismissed(true);
        return;
      }
    }

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercentage >= 30 && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('sticky-bar-dismissed', String(new Date().getTime()));
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              🎨 Show off your {memberName} collection to X/Twitter!
            </p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Generate shareable cards with collection stats
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/card-generator"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Generate My Card 🎨
            </Link>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
