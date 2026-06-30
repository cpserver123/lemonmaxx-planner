"use client";

import { LuBookOpen, LuChevronRight } from "react-icons/lu";
import type { KBCategory } from "./kb-data";

interface KBSidebarProps {
  categories: KBCategory[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export default function KBSidebar({ categories, activeCategory, onSelect }: KBSidebarProps) {
  return (
    <aside className="w-44 shrink-0 flex flex-col border-r border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <LuBookOpen size={15} className="text-[#6B7280] dark:text-[#9CA3AF] shrink-0" />
        <span className="text-sm font-semibold text-[#111928] dark:text-white">Documents</span>
      </div>

      {/* Category list */}
      <nav className="flex-1 py-2">
        {categories.map((cat) => {
          const active = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors text-left ${
                active
                  ? "bg-[#EEF2FF] dark:bg-[#1a1f4e] text-[#5750F1]"
                  : "text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#0a1628]"
              }`}
            >
              <span className="truncate">{cat.label}</span>
              {active && <LuChevronRight size={13} className="shrink-0 text-[#5750F1]" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
