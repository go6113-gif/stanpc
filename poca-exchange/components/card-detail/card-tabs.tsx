"use client";

import { useState } from "react";

type TabId = "guide" | "price" | "version" | "collector";

interface CardTabsProps {
  cardData: {
    cardName?: string | null;
    version?: string | null;
    estimatedPrice?: number | null;
    wantCount: number;
    haveCount: number;
  };
}

const TAB_LABELS: Record<TabId, string> = {
  guide: "가이드",
  price: "가격",
  version: "버전",
  collector: "수집가",
};

export function CardTabs({ cardData }: CardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("price");

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-neutral-800 mb-6">
        {(Object.entries(TAB_LABELS) as [TabId, string][]).map(
          ([tabId, label]) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`pb-3 font-medium transition-colors ${
                activeTab === tabId
                  ? "text-[#FF4742] border-b-2 border-[#FF4742]"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] py-6">
        {activeTab === "guide" && (
          <TabContent>
            <p className="text-neutral-400">콘텐츠 준비 중</p>
          </TabContent>
        )}

        {activeTab === "price" && (
          <TabContent>
            {cardData.estimatedPrice ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-2">추정가</p>
                  <p className="text-2xl font-bold text-white">
                    ${cardData.estimatedPrice.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">원하는 수</p>
                    <p className="text-lg font-semibold text-white">
                      ♡ {cardData.wantCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">소유한 수</p>
                    <p className="text-lg font-semibold text-white">
                      ◆ {cardData.haveCount}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-neutral-400">콘텐츠 준비 중</p>
            )}
          </TabContent>
        )}

        {activeTab === "version" && (
          <TabContent>
            {cardData.version ? (
              <div>
                <p className="text-sm text-neutral-500 mb-2">버전</p>
                <p className="text-lg font-semibold text-white">
                  {cardData.version}
                </p>
              </div>
            ) : (
              <p className="text-neutral-400">콘텐츠 준비 중</p>
            )}
          </TabContent>
        )}

        {activeTab === "collector" && (
          <TabContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500 mb-2">원하는 수집가</p>
                <p className="text-lg font-semibold text-white">
                  ♡ {cardData.wantCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-2">소유한 수집가</p>
                <p className="text-lg font-semibold text-white">
                  ◆ {cardData.haveCount}
                </p>
              </div>
            </div>
          </TabContent>
        )}
      </div>
    </div>
  );
}

function TabContent({ children }: { children: React.ReactNode }) {
  return <div className="text-white">{children}</div>;
}
