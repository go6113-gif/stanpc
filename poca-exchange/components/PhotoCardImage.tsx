'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PhotoCardImageProps {
  src: string | null | undefined;
  alt: string;
  memberName?: string | null;
  albumTitle?: string | null;
  version?: string | null;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
}

export function PhotoCardImage({
  src,
  alt,
  memberName = 'Unknown',
  albumTitle,
  version,
  className = 'w-full h-full object-cover',
  width,
  height,
  fill = false,
  priority = false,
}: PhotoCardImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(!src);

  // Show placeholder if no image or loading failed
  if (!src || hasError) {
    return (
      <Placeholder
        memberName={memberName}
        albumTitle={albumTitle}
        version={version}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        {...(fill ? { fill: true } : { width, height })}
        className={className}
        priority={priority}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 animate-pulse" />
      )}
    </div>
  );
}

interface PlaceholderProps {
  memberName?: string | null;
  albumTitle?: string | null;
  version?: string | null;
}

export function Placeholder({
  memberName = 'Unknown',
  albumTitle,
  version,
}: PlaceholderProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 dark:from-neutral-600 dark:via-neutral-700 dark:to-neutral-800 flex flex-col items-center justify-center p-4 border border-neutral-600 dark:border-neutral-500 rounded-lg">
      {/* Main Info */}
      <div className="text-center mb-3 flex-1 flex flex-col justify-center">
        <p className="text-sm font-bold text-white/90 truncate mb-1">
          {memberName}
        </p>
        {albumTitle && version && (
          <p className="text-xs text-white/60 truncate">
            {albumTitle} / {version}
          </p>
        )}
        {albumTitle && !version && (
          <p className="text-xs text-white/60 truncate">{albumTitle}</p>
        )}
      </div>

      {/* Status Badge */}
      <div className="inline-block bg-indigo-600/80 text-white px-2 py-1 rounded-full text-xs font-semibold">
        📸 정보 수집 중
      </div>

      {/* Subtle Icon */}
      <div className="mt-2 text-white/40">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

export default PhotoCardImage;
