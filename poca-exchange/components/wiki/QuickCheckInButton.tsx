'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import VaultAuthModal from './VaultAuthModal';

interface QuickCheckInButtonProps {
  cardId: string;
  cardName?: string;
  memberName?: string;
  onHaveClick?: () => void;
  onWishClick?: () => void;
}

export default function QuickCheckInButton({
  cardId,
  cardName,
  memberName,
  onHaveClick,
  onWishClick,
}: QuickCheckInButtonProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [triggerAction, setTriggerAction] = useState<'have' | 'wish'>('have');
  const [isLoading, setIsLoading] = useState(false);

  const handleHaveClick = async () => {
    if (!session?.user) {
      setTriggerAction('have');
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/vault/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          action: 'have',
          tags: ['In Hand'],
        }),
      });

      if (response.ok) {
        onHaveClick?.();
        // Show success toast
        const event = new CustomEvent('showToast', {
          detail: { message: '컬렉션에 추가되었습니다', type: 'success' },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to add card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishClick = async () => {
    if (!session?.user) {
      setTriggerAction('wish');
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/vault/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          action: 'wish',
          tags: ['ISO'], // ISO = In Search Of (wishlist)
        }),
      });

      if (response.ok) {
        onWishClick?.();
        // Show success toast
        const event = new CustomEvent('showToast', {
          detail: { message: '원함 목록에 추가되었습니다', type: 'success' },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleHaveClick}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Mark as in your collection"
        >
          {isLoading ? '...' : '보유 ✓'}
        </button>
        <button
          onClick={handleWishClick}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Add to wishlist"
        >
          {isLoading ? '...' : '원함 ★'}
        </button>
      </div>

      {/* Auth Modal */}
      <VaultAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        triggerAction={triggerAction}
        cardName={cardName}
        memberName={memberName}
      />
    </>
  );
}
