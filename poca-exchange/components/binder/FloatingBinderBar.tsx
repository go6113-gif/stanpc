"use client";

import { useEffect, useState } from "react";
import { BookmarkCheck, Heart, ChevronUp } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";

interface FloatingBinderBarProps {
  onOpenModal: () => void;
}

export function FloatingBinderBar({ onOpenModal }: FloatingBinderBarProps) {
  const [hydrated, setHydrated] = useState(false);
  const ownedCount = useBinderStore((state) => state.getOwnedCount());
  const wishedCount = useBinderStore((state) => state.getWishedCount());

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const totalCards = ownedCount + wishedCount;
  if (totalCards === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto mb-4 rounded-full border border-gray-700/60 bg-gray-900/90 px-5 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Binder Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <BookmarkCheck size={16} className="text-nomad-red" />
              <span className="text-sm font-semibold text-white">
                {ownedCount}장
              </span>
            </div>

            <div className="h-4 w-px bg-gray-700/40"></div>

            <div className="flex items-center gap-1.5">
              <Heart size={16} className="text-red-500" />
              <span className="text-sm font-semibold text-white">
                {wishedCount}장
              </span>
            </div>
          </div>

          {/* Open Button */}
          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 rounded-full bg-nomad-red px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:px-5 sm:py-2 sm:text-sm"
          >
            바인더 열기
            <ChevronUp size={16} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </div>
  );
}
