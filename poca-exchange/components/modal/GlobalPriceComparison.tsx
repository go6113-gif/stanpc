"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";

interface PriceData {
  market: string;
  flag: string;
  country: string;
  currency: string;
  basePrice: number;
  krwPrice: number;
  trendPercent: number;
  lastUpdated: string;
}

interface GlobalPriceComparisonProps {
  cardName?: string;
}

/**
 * 글로벌 3개국(USD, JPY, KRW) 실시간 시세 비교.
 * Mock 데이터 기반으로 환율이 적용된 가격 표시.
 */
export function GlobalPriceComparison({ cardName = "Photocard" }: GlobalPriceComparisonProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<"KRW" | "USD" | "JPY">("KRW");

  // Mock price data with real-world exchange rates (as of Aug 2024)
  // Exchange rates: 1 USD = 1,300 KRW, 1 JPY = 10 KRW
  const priceData: PriceData[] = [
    {
      market: "eBay",
      flag: "🇺🇸",
      country: "USA",
      currency: "USD",
      basePrice: 8.5,
      krwPrice: 11050,
      trendPercent: 2.5,
      lastUpdated: "5분 전",
    },
    {
      market: "Mercari",
      flag: "🇯🇵",
      country: "Japan",
      currency: "JPY",
      basePrice: 980,
      krwPrice: 9800,
      trendPercent: -1.2,
      lastUpdated: "2분 전",
    },
    {
      market: "번개장터",
      flag: "🇰🇷",
      country: "Korea",
      currency: "KRW",
      basePrice: 10500,
      krwPrice: 10500,
      trendPercent: 0.8,
      lastUpdated: "방금",
    },
    {
      market: "Buyee",
      flag: "🇯🇵",
      country: "Japan (Proxy)",
      currency: "JPY",
      basePrice: 1050,
      krwPrice: 10500,
      trendPercent: -0.5,
      lastUpdated: "3분 전",
    },
  ];

  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") {
      return `$${price.toFixed(2)}`;
    } else if (currency === "JPY") {
      return `¥${price.toLocaleString("en-US")}`;
    } else {
      return `₩${price.toLocaleString("ko-KR")}`;
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      JPY: "¥",
      KRW: "₩",
    };
    return symbols[currency] || "";
  };

  const lowestKRWPrice = Math.min(...priceData.map((p) => p.krwPrice));
  const highestKRWPrice = Math.max(...priceData.map((p) => p.krwPrice));

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 dark:border-neutral-700 dark:from-neutral-900/50 dark:to-neutral-900/30">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
              🌍 글로벌 실시간 시세
            </h3>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              {cardName} · KRW 기준 환산
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-nomad-red shadow-sm dark:bg-neutral-800">
            <div className="h-2 w-2 animate-pulse rounded-full bg-nomad-red" />
            Live
          </div>
        </div>
      </div>

      {/* 통화 선택 탭 */}
      <div className="flex gap-2">
        {["KRW", "USD", "JPY"].map((curr) => (
          <button
            key={curr}
            type="button"
            onClick={() => setSelectedCurrency(curr as "KRW" | "USD" | "JPY")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
              selectedCurrency === curr
                ? "bg-nomad-red text-white shadow-md"
                : "border border-neutral-200 text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {curr === "KRW" ? "₩ KRW" : curr === "USD" ? "$ USD" : "¥ JPY"}
          </button>
        ))}
      </div>

      {/* 가격 비교 카드 그리드 */}
      <div className="grid gap-3">
        {priceData.map((data, idx) => {
          const displayPrice =
            selectedCurrency === "KRW"
              ? data.krwPrice
              : selectedCurrency === "USD"
                ? data.basePrice
                : data.basePrice * 100;

          const isLowest = data.krwPrice === lowestKRWPrice;
          const isHighest = data.krwPrice === highestKRWPrice;

          return (
            <div
              key={idx}
              className={`rounded-lg border p-4 transition-all ${
                isLowest
                  ? "border-green-300 bg-green-50 dark:border-green-800/50 dark:bg-green-950/20"
                  : isHighest
                    ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
                    : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
              }`}
            >
              <div className="flex items-start justify-between">
                {/* 좌측: 마켓 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{data.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {data.market}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {data.country}
                      </p>
                    </div>
                  </div>

                  {/* 가격 및 배지 */}
                  <div className="flex items-center gap-2 mt-3">
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatPrice(displayPrice, selectedCurrency)}
                    </p>
                    {isLowest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                        🏆 최저가
                      </span>
                    )}
                    {isHighest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        📈 최고가
                      </span>
                    )}
                  </div>
                </div>

                {/* 우측: 추세 및 업데이트 */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-2">
                    <TrendingUp
                      size={14}
                      className={
                        data.trendPercent > 0
                          ? "text-red-500"
                          : data.trendPercent < 0
                            ? "text-green-500"
                            : "text-neutral-400"
                      }
                    />
                    <span
                      className={`text-xs font-bold ${
                        data.trendPercent > 0
                          ? "text-red-500"
                          : data.trendPercent < 0
                            ? "text-green-500"
                            : "text-neutral-500"
                      }`}
                    >
                      {data.trendPercent > 0 ? "+" : ""}
                      {data.trendPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    업데이트: {data.lastUpdated}
                  </p>
                </div>
              </div>

              {/* KRW 환산가 (다른 통화 선택 시에만 표시) */}
              {selectedCurrency !== "KRW" && (
                <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    KRW 환산가 (참고):
                  </p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    ₩{data.krwPrice.toLocaleString("ko-KR")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700 dark:bg-neutral-950">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide dark:text-neutral-400">
            평균가
          </p>
          <p className="mt-1.5 text-sm font-bold text-neutral-900 dark:text-white">
            ₩{Math.round(priceData.reduce((sum, p) => sum + p.krwPrice, 0) / priceData.length).toLocaleString("ko-KR")}
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800/50 dark:bg-green-950/20">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide dark:text-green-400">
            최저가
          </p>
          <p className="mt-1.5 text-sm font-bold text-green-700 dark:text-green-300">
            ₩{lowestKRWPrice.toLocaleString("ko-KR")}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-xs font-medium text-red-700 uppercase tracking-wide dark:text-red-400">
            최고가
          </p>
          <p className="mt-1.5 text-sm font-bold text-red-700 dark:text-red-300">
            ₩{highestKRWPrice.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      {/* 공지사항 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
        <p className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
          <span className="shrink-0">ℹ️</span>
          <span>
            시세는 Mock 데이터입니다. 실제 환율과 수수료가 적용될 수 있으니 거래 전 최신 정보를 확인하세요.
          </span>
        </p>
      </div>
    </div>
  );
}
