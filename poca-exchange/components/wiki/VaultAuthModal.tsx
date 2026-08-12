'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface VaultAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerAction?: 'add-to-vault' | 'have' | 'wish';
  memberName?: string;
  cardName?: string;
}

export default function VaultAuthModal({
  isOpen,
  onClose,
  triggerAction = 'add-to-vault',
  memberName,
  cardName,
}: VaultAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'twitter' | null>(null);

  const handleSignIn = async (provider: 'google' | 'twitter') => {
    setIsLoading(true);
    setSelectedProvider(provider);

    try {
      await signIn(provider, {
        redirect: true,
        callbackUrl: `/vault?action=${triggerAction}${memberName ? `&member=${memberName}` : ''}`,
      });
    } catch (error: unknown) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
      setSelectedProvider(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
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
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Save to My Vault
              </h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                100% Free Forever
              </p>
            </div>

            {/* Description */}
            <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
              <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">✓</span>
                  <span>Track your collection progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">✓</span>
                  <span>Calculate total vault value</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">✓</span>
                  <span>Export card generator templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">✓</span>
                  <span>Zero fees, no credit card required</span>
                </li>
              </ul>
            </div>

            {/* Action Description */}
            {triggerAction === 'have' && cardName && (
              <div className="mb-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                You're about to mark "{cardName}" as in your collection
              </div>
            )}
            {triggerAction === 'wish' && cardName && (
              <div className="mb-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                You're about to add "{cardName}" to your wishlist
              </div>
            )}

            {/* Social Auth Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleSignIn('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 font-medium text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedProvider === 'google' && isLoading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {selectedProvider === 'google' && isLoading ? 'Signing in...' : 'Sign up with Google'}
              </button>

              <button
                onClick={() => handleSignIn('twitter')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white px-4 py-3 font-medium text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedProvider === 'twitter' && isLoading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white dark:border-black border-t-blue-600" />
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 002.856-9.86 10.02 10.02 0 01-2.857.856c1.027-1.617 1.772-3.515 2.001-5.576M23.5 3.5c-.962 1.354-2.346 2.42-3.97 2.87 1.25-1.487 2.057-3.49 2.032-5.571M15.46 5.5c-1.252 1.465-3.116 2.382-5.156 2.382-4.14 0-7.5-3.36-7.5-7.5S5.14 0 9.28 0c2.04 0 3.905.917 5.157 2.382m4.023 7a8.996 8.996 0 01-2.652.672c1.216-1.215 2.053-2.947 2.032-4.886M19 9.5c-.962 1.354-2.346 2.42-3.97 2.87 1.25-1.487 2.057-3.49 2.032-5.571M13 13a7 7 0 117 7v-7h-7z" />
                  </svg>
                )}
                {selectedProvider === 'twitter' && isLoading ? 'Signing in...' : 'Sign up with X (Twitter)'}
              </button>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-neutral-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-neutral-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
