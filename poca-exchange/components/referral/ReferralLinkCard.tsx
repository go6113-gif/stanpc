'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface LinkCardProps {
  referralCode?: string;
  onShare?: () => void;
}

export function ReferralLinkCard({ referralCode }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = referralCode ? `https://stanpc.com?ref=${referralCode}` : '';

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!referralCode) return null;

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
      <h3 className="font-semibold text-neutral-900 dark:text-white">📤 추천 링크</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm dark:text-white font-mono text-neutral-600"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}
