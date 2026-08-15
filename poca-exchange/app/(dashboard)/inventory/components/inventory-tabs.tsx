"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { UserBinderCardStatus } from "@/app/generated/prisma/enums";

interface InventoryTabsProps {
  currentStatus?: UserBinderCardStatus;
}

const tabs = [
  { status: undefined, label: "전체", count: null },
  {
    status: UserBinderCardStatus.OWNED,
    label: "소유 중",
    count: null,
  },
  {
    status: UserBinderCardStatus.WTT,
    label: "교환 중",
    count: null,
  },
  {
    status: UserBinderCardStatus.WTS,
    label: "판매 중",
    count: null,
  },
  { status: UserBinderCardStatus.WTB, label: "구매 중", count: null },
];

export function InventoryTabs({ currentStatus }: InventoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (status: UserBinderCardStatus | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/inventory?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.status || "all"}
          onClick={() => handleTabChange(tab.status)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            currentStatus === tab.status
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
