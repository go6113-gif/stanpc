'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

interface VaultAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VaultAuthModal({ isOpen, onClose }: VaultAuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-neutral-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
            로그인이 필요합니다
          </h2>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
            바인더에 접근하려면 로그인해주세요
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="block rounded-lg border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
