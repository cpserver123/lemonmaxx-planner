"use client";

import { KB_TABS } from "./kb-data";

type TabId = typeof KB_TABS[number]["id"];

interface KBTabsProps {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}

export default function KBTabs({ activeTab, onSelect }: KBTabsProps) {
  return (
    <div className="flex items-end border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520]">
      {KB_TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`px-8 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              active
                ? "border-[#5750F1] text-[#5750F1]"
                : "border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
