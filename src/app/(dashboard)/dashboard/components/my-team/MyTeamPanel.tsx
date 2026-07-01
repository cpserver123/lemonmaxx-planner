"use client";

import { useState } from "react";
import {
  LuLayoutDashboard, LuCalendar, LuTrendingUp,
  LuFileText, LuTriangleAlert, LuMessageSquare, LuX, LuMenu,
} from "react-icons/lu";
import TeamDashboard from "./teamdashboard";
import TeamCalender  from "./teamcalender";
import TeamBreakdown from "./teambreakdown";

type Tab = "dashboard" | "calendar" | "breakdown";

const SIDEBAR_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",  icon: LuLayoutDashboard },
  { id: "calendar",  label: "Calendar",   icon: LuCalendar },
  { id: "breakdown", label: "Breakdowns", icon: LuTrendingUp },
];

const EXTRA_LINKS = [
  { label: "Reports",     icon: LuFileText },
  { label: "Escalations", icon: LuTriangleAlert },
  { label: "Requests",    icon: LuMessageSquare },
];

const TAB_VIEWS: Record<Tab, React.ReactNode> = {
  dashboard: <TeamDashboard />,
  calendar:  <TeamCalender />,
  breakdown: <TeamBreakdown />,
};

/* --- Shared sidebar nav content -------------------------------------- */
function SidebarNav({
  activeTab,
  onSelect,
  onClose,
}: {
  activeTab: Tab;
  onSelect: (t: Tab) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1 mb-3">
        <span className="text-xs font-bold text-[#111928] dark:text-white uppercase tracking-wide">My Team</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
        >
          <LuX size={14} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 mb-3">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full text-left transition-all ${
                isActive
                  ? "bg-[#111928] dark:bg-[#1a2332] text-[#2563eb]"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]/60 hover:text-[#111928] dark:hover:text-white"
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {item.label}
              {isActive && <span className="ml-auto text-[#2563eb]">›</span>}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] my-2" />

      {/* Extra links */}
      <nav className="flex flex-col gap-0.5">
        {EXTRA_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]/60 hover:text-[#111928] dark:hover:text-white transition-all w-full text-left"
            >
              <Icon size={15} className="shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* --- Main panel ------------------------------------------------------ */
export default function MyTeamPanel({ onClose, initialTab = "dashboard" }: { onClose: () => void; initialTab?: Tab }) {
  const [activeTab, setActiveTab]     = useState<Tab>(initialTab);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  const handleSelect = (tab: Tab) => {
    setActiveTab(tab);
    setDrawerOpen(false); // close drawer on mobile after selecting
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6] dark:bg-[#020d1a]">

      {/* ---- Desktop sidebar (hidden on mobile) ---- */}
      <aside className="hidden md:flex md:w-[200px] shrink-0 flex-col h-full">
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-3 h-full overflow-y-auto">
          <SidebarNav activeTab={activeTab} onSelect={handleSelect} onClose={onClose} />
        </div>
      </aside>

      {/* ---- Mobile drawer overlay ---- */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ---- Mobile slide-in drawer ---- */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[220px] bg-white dark:bg-[#0d1520] border-r border-[#E6EBF1] dark:border-[#1F2A37] p-3 transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav activeTab={activeTab} onSelect={handleSelect} onClose={onClose} />
      </div>

      {/* ---- Main content (scrollable) ---- */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-8 pl-5 pr-2 pt-1">
        {/* Mobile top bar with hamburger */}
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
            aria-label="Open navigation"
          >
            <LuMenu size={18} />
          </button>
          <span className="text-sm font-semibold text-[#111928] dark:text-white capitalize">
            {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label ?? "My Team"}
          </span>
        </div>

        {TAB_VIEWS[activeTab]}
      </div>
    </div>
  );
}
