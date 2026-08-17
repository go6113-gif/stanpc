"use client";

import { useEffect, useState } from "react";
import { BookmarkCheck, Heart } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";

export function BinderStats() {
  const [hydrated, setHydrated] = useState(false);
  const ownedCount = useBinderStore((state) => state.getOwnedCount());
  const wishedCount = useBinderStore((state) => state.getWishedCount());

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Owned Count */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-nomad-red/10 p-2">
          <BookmarkCheck size={16} className="text-nomad-red" />
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">보유</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">
            {ownedCount}
          </p>
        </div>
      </div>

      {/* Wished Count */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-red-500/10 p-2">
          <Heart size={16} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">위시리스트</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">
            {wishedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
