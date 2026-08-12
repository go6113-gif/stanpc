'use client';

import { useState, type ReactNode } from 'react';

interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export default function MemberTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="no-scrollbar sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950/95">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${
              active === tab.id
                ? 'border-nomad-red bg-nomad-red text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-nomad-red hover:text-nomad-red dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs.find((tab) => tab.id === active)?.content}</div>
    </div>
  );
}
