"use client";

interface PriceData {
  date: string;
  price: number;
  market: string;
}

interface PriceTrendChartProps {
  data: PriceData[];
  currency?: string;
}

export function PriceTrendChart({
  data,
  currency = "USD",
}: PriceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">가격 변동 데이터 없음</p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const priceRange = maxPrice - minPrice || 1;
  const avgPrice =
    data.reduce((sum, d) => sum + d.price, 0) / data.length;

  // Group by market for colors
  const marketColors: Record<string, string> = {
    ebay: "text-blue-600 dark:text-blue-400",
    mercari: "text-purple-600 dark:text-purple-400",
    buyee: "text-orange-600 dark:text-orange-400",
    bunjang: "text-green-600 dark:text-green-400",
    wts: "text-pink-600 dark:text-pink-400",
  };

  const marketBgColors: Record<string, string> = {
    ebay: "bg-blue-100 dark:bg-blue-900",
    mercari: "bg-purple-100 dark:bg-purple-900",
    buyee: "bg-orange-100 dark:bg-orange-900",
    bunjang: "bg-green-100 dark:bg-green-900",
    wts: "bg-pink-100 dark:bg-pink-900",
  };

  const marketDisplayNames: Record<string, string> = {
    ebay: "eBay",
    mercari: "Mercari",
    buyee: "Buyee",
    bunjang: "Bungle",
    wts: "WTS",
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">최저가</p>
          <p className="mt-1 text-2xl font-bold">
            ${minPrice.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">평균가</p>
          <p className="mt-1 text-2xl font-bold">
            ${avgPrice.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">최고가</p>
          <p className="mt-1 text-2xl font-bold">
            ${maxPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Simple ASCII-style Chart */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-3">
          {data.map((item, idx) => {
            const normalizedHeight =
              ((item.price - minPrice) / priceRange) * 100;
            const marketColor =
              marketColors[item.market] ||
              "text-neutral-600 dark:text-neutral-400";
            const marketBgColor =
              marketBgColors[item.market] ||
              "bg-neutral-200 dark:bg-neutral-800";

            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-16 text-right">
                  <p className="text-xs text-neutral-500">{item.date}</p>
                </div>
                <div className="flex-1">
                  <div
                    className={`${marketBgColor} rounded h-6 flex items-center px-2`}
                    style={{
                      width: `${Math.max(20, normalizedHeight)}%`,
                    }}
                  >
                    <span
                      className={`text-xs font-semibold ${marketColor}`}
                    >
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs text-neutral-500">
                    {marketDisplayNames[item.market] || item.market}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Array.from(new Set(data.map((d) => d.market))).map((market) => (
          <div key={market} className="flex items-center gap-1.5">
            <div
              className={`h-3 w-3 rounded ${marketBgColors[market] || "bg-neutral-200"}`}
            ></div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {marketDisplayNames[market] || market}
            </span>
          </div>
        ))}
      </div>

      {/* Info */}
      <p className="text-xs text-neutral-500">
        💡 가격 데이터는 주요 판매처(eBay, Mercari, Buyee, 번개장터)의 시세 추적 데이터입니다.
      </p>
    </div>
  );
}
