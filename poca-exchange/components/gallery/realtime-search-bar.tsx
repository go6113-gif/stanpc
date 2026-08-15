"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock } from "lucide-react";

interface RealtimeSearchBarProps {
  placeholder?: string;
}

export function RealtimeSearchBar({
  placeholder = "카드명, 멤버, 그룹 검색...",
}: RealtimeSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState(
    searchParams.get("q") || ""
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 검색 히스토리 초기화
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

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

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;

    // 검색 히스토리에 추가
    const newHistory = [
      value,
      ...searchHistory.filter((h) => h !== value),
    ].slice(0, 5);

    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    setIsDropdownOpen(false);
  };

  const handleHistoryClick = (value: string) => {
    setSearchValue(value);
    handleSearch(value);
    handleSubmit(value);
  };

  const handleClear = useCallback(() => {
    handleSearch("");
  }, [handleSearch]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full mb-4 z-[60]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative flex items-center z-[60]">
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
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(searchValue);
            }
          }}
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

      {/* 검색 드롭다운 */}
      <AnimatePresence>
        {isDropdownOpen && !searchValue && searchHistory.length > 0 && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1E] border border-white/10 rounded-lg shadow-lg z-[61] overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-xs font-semibold text-white/50 uppercase">
                최근 검색
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {searchHistory.map((query, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleHistoryClick(query)}
                  className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                  whileHover={{ paddingLeft: 16 }}
                >
                  <Clock size={14} className="text-white/40 flex-shrink-0" />
                  <span className="truncate">{query}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 검색 힌트 */}
      {searchValue && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-1 text-xs text-white/50 text-center pointer-events-none"
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
