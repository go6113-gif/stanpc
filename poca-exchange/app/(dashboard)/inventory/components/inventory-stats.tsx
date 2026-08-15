interface StatsProps {
  stats: {
    total: number;
    personal: number;
    forTrade: number;
    forSale: number;
    iso: number;
  };
  className?: string;
}

export function InventoryStats({ stats, className = "" }: StatsProps) {
  const statCards = [
    {
      label: "전체",
      value: stats.total,
      color: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "개인 소장",
      value: stats.personal,
      color: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "교환 가능",
      value: stats.forTrade,
      color: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "판매 가능",
      value: stats.forSale,
      color: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "위시리스트",
      value: stats.iso,
      color: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.color} rounded-lg p-4 border border-slate-200 dark:border-slate-700`}
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {stat.label}
          </p>
          <p className={`text-2xl font-bold ${stat.textColor}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
