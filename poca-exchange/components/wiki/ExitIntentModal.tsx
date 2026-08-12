'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import VaultAuthModal from './VaultAuthModal';

interface ExitIntentModalProps {
  memberName: string;
  cardCount: number;
}

export default function ExitIntentModal({
  memberName,
  cardCount,
}: ExitIntentModalProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this modal today
    const dismissedAt = localStorage.getItem('exit-intent-modal-dismissed');
    if (dismissedAt) {
      const dayAgo = new Date().getTime() - 24 * 60 * 60 * 1000;
      if (parseInt(dismissedAt) > dayAgo) {
        setIsDismissed(true);
        return;
      }
    }

    // Only show for unauthenticated users
    if (session?.user) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect if mouse is leaving towards top (browser chrome)
      if (e.clientY <= 0 && !isDismissed) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [session, isDismissed]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    localStorage.setItem('exit-intent-modal-dismissed', String(new Date().getTime()));
  };

  const handleSave = () => {
    if (!session?.user) {
      setShowAuthModal(true);
    } else {
      // Redirect to vault
      window.location.href = '/vault';
    }
  };

  if (!isOpen || isDismissed) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl animate-in fade-in scale-in-95">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="mb-4 text-4xl text-center">📝</div>

            {/* Header */}
            <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Don't lose your wishlist!
            </h2>

            {/* Message */}
            <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
              Save your {memberName} collection to My Vault in just 5 seconds. Track all {cardCount} cards and get instant price updates.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleSave}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors mb-3"
            >
              Save Collection (Free)
            </button>

            {/* Secondary Action */}
            <button
              onClick={handleDismiss}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-6 py-2 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              No thanks
            </button>

            {/* Trust Message */}
            <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
              ✓ 100% free • No credit card • Takes 5 seconds
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <VaultAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        triggerAction="add-to-vault"
        memberName={memberName}
      />
    </>
  );
}
