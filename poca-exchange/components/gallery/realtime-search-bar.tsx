"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface RealtimeSearchBarProps {
  placeholder?: string;
}

export function RealtimeSearchBar({
  placeholder = "카드명, 멤버, 그룹 검색...",
}: RealtimeSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("q") || ""
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);

      // 새 URL 파라미터 생성
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      // URL 업데이트 (scroll 없이)
      router.push(`/gallery${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const handleClear = useCallback(() => {
    handleSearch("");
  }, [handleSearch]);

  return (
    <motion.div
      className="relative w-full mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative flex items-center">
        {/* 검색 아이콘 */}
        <Search
          size={18}
          className="absolute left-3 text-white/50 pointer-events-none"
        />

        {/* 검색 입력 */}
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
        />

        {/* 클리어 버튼 */}
        {searchValue && (
          <motion.button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-white/50 hover:text-white transition-colors"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} />
          </motion.button>
        )}
      </div>

      {/* 검색 힌트 */}
      {searchValue && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-1 text-xs text-white/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          "{searchValue}"로 검색 중...
        </motion.div>
      )}
    </motion.div>
  );
}
