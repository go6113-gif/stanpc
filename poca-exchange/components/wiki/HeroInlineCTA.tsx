'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import VaultAuthModal from './VaultAuthModal';

interface HeroInlineCTAProps {
  memberName: string;
  cardCount: number;
  groupName: string;
}

export default function HeroInlineCTA({
  memberName,
  cardCount,
  groupName,
}: HeroInlineCTAProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToVault = () => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    // User is logged in, redirect to vault
    window.location.href = `/vault?action=add-member&member=${memberName}&group=${groupName}`;
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center">
            {/* Left: Message */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white">
                Tracking {memberName}'s {cardCount} photocards
              </h3>
              <p className="mt-1 text-sm text-blue-100">
                Save to My Vault & track total value in real-time
              </p>
            </div>

            {/* Right: CTA Button */}
            <button
              onClick={handleAddToVault}
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 font-semibold text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <span>+</span>
              <span>Add to My Vault</span>
            </button>
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
