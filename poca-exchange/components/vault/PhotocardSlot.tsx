'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Heart as HeartFilled, ImageOff } from 'lucide-react';
import Image from 'next/image';
import { Toast } from '@/components/Toast';

interface PhotocardSlotProps {
  cardId: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  isOwned: boolean;
  isWish: boolean;
  albumName?: string;
  memberName?: string;
  onWishToggle?: (cardId: string, newState: boolean) => Promise<void>;
  onCardClick?: (cardId: string) => void;
  showText?: boolean;
  showBadges?: boolean;
}

export function PhotocardSlot({
  cardId,
  imageUrl,
  fallbackImageUrl,
  isOwned,
  isWish,
  albumName,
  memberName,
  onWishToggle,
  onCardClick,
  showText = true,
  showBadges = true,
}: PhotocardSlotProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  const displayImageUrl = imageError ? fallbackImageUrl : imageUrl;

  const handleWishClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOwned || !onWishToggle) return;

    setIsLoading(true);
    try {
      await onWishToggle(cardId, true);
      setToastMessage('💖 위시 바인더에 담겼어요! (Have & Want 교환 카드에 자동 반영)');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to toggle wish:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    onCardClick?.(cardId);
  };

  // Case 1: Owned Card
  if (isOwned) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="relative group cursor-pointer rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square shadow-md hover:shadow-lg transition-shadow"
      >
        {/* Image Container */}
        <div className="relative w-full h-full">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`${memberName || 'Card'} - ${albumName || 'Album'}`}
              fill
              className="object-cover grayscale-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />
            </div>
          )}
        </div>

        {/* Owned Badge */}
        {showBadges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-lg"
          >
            <span>💎</span>
            <span>소장</span>
          </motion.div>
        )}

        {/* Text Overlay (on hover or always visible for smaller screens) */}
        {showText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            {memberName && (
              <p className="text-xs font-semibold text-white truncate">{memberName}</p>
            )}
            {albumName && (
              <p className="text-xs text-neutral-200 truncate">{albumName}</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Case 2: Wish Card
  if (isWish) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="relative group cursor-pointer rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square shadow-md hover:shadow-lg transition-shadow"
      >
        {/* Image Container */}
        <div className="relative w-full h-full">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`${memberName || 'Card'} - ${albumName || 'Album'}`}
              fill
              className="object-cover grayscale-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />
            </div>
          )}
        </div>

        {/* Wish Badge - Pink Heart */}
        {showBadges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg text-lg"
          >
            💖
          </motion.div>
        )}

        {/* Text Overlay */}
        {showText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            {memberName && (
              <p className="text-xs font-semibold text-white truncate">{memberName}</p>
            )}
            {albumName && (
              <p className="text-xs text-neutral-200 truncate">{albumName}</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Case 3: No Wish / Not Owned
  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={handleCardClick}
        className="relative group cursor-pointer rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square shadow-md hover:shadow-lg transition-shadow"
      >
        {/* Grayscale Image Container */}
        <div className="relative w-full h-full">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`${memberName || 'Card'} - ${albumName || 'Album'}`}
              fill
              className="object-cover grayscale opacity-50 group-hover:opacity-60 transition-opacity"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center opacity-50">
              <ImageOff className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />
            </div>
          )}

          {/* Overlay - Always Visible or Hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWishClick}
              disabled={isLoading}
              className="px-4 py-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-white hover:bg-white/95 dark:hover:bg-neutral-700/95 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  추가 중...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 text-pink-500" />
                  💖 위시 추가
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Text Overlay */}
        {showText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
            {memberName && (
              <p className="text-xs font-semibold text-white truncate">{memberName}</p>
            )}
            {albumName && (
              <p className="text-xs text-neutral-200 truncate">{albumName}</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Toast Notification */}
      <Toast message={toastMessage} show={showToast} />
    </>
  );
}
