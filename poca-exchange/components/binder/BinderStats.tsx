"use client";

import { useEffect, useState } from "react";
import { BookmarkCheck, Heart } from "lucide-react";
import { useBinderStore } from "@/store/useBinderStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function BinderStats() {
  const [hydrated, setHydrated] = useState(false);
  const ownedCount = useBinderStore((state) => state.getOwnedCount());
  const wishedCount = useBinderStore((state) => state.getWishedCount());
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  // 로그인 상태에서만 표시
  if (!isAuthenticated) return null;

  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Owned Count */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-nomad-red/10 p-2">
          <BookmarkCheck size={16} className="text-nomad-red" />
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">보유</p>
          <p className="text-white font-bold text-lg">
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
          <p className="text-white font-bold text-lg">
            {wishedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
