"use client";

import { useRef, useEffect, useState } from "react";
import { UserBinderCardStatus } from "@/app/generated/prisma/enums";
import { statusLabels, statusColors } from "@/lib/state-machine/inventory";

interface CardStatusDropdownProps {
  currentStatus: UserBinderCardStatus;
  onStatusChange: (status: UserBinderCardStatus) => void;
  isLoading: boolean;
}

const statuses = [
  UserBinderCardStatus.PERSONAL,
  UserBinderCardStatus.FOR_TRADE,
  UserBinderCardStatus.FOR_SALE,
  UserBinderCardStatus.ISO,
];

export function CardStatusDropdown({
  currentStatus,
  onStatusChange,
  isLoading,
}: CardStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full px-2 py-1 text-xs font-medium rounded border transition-colors flex items-center justify-between gap-1 ${statusColors[currentStatus]} disabled:opacity-50`}
      >
        <span>{statusLabels[currentStatus]}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded shadow-lg z-10">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                onStatusChange(status);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                status === currentStatus
                  ? `${statusColors[status]} font-semibold`
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
