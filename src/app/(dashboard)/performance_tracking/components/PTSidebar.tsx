"use client";

import { LuLayoutDashboard, LuFlame, LuClipboardList, LuCalendarCheck } from "react-icons/lu";

type SidebarItem = { id: string; label: string; icon: React.ElementType };

const ITEMS: SidebarItem[] = [
  { id: "scoreboard",      label: "Scoreboard",     icon: LuLayoutDashboard },
  { id: "heatmap",         label: "Heatmap",         icon: LuFlame },
  { id: "lead-review",     label: "Lead Review",     icon: LuClipboardList },
  { id: "planning-review", label: "Planning Review", icon: LuCalendarCheck },
];

export default function PTSidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-[180px] shrink-0 flex flex-col gap-1 pt-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left w-full transition-all ${
              isActive
                ? "bg-[#111928] dark:bg-[#1a2332] text-[#2563eb]"
                : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]/60 hover:text-[#111928] dark:hover:text-white"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>{item.label}</span>
            {isActive && <span className="ml-auto text-[#2563eb]">›</span>}
          </button>
        );
      })}
    </aside>
  );
}
