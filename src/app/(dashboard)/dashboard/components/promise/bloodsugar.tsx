"use client";

import { useState } from "react";
import NumbersTab from "./bloodsugar/NumbersTab";
import CreativeTab from "./bloodsugar/CreativeTab";
import ExperimentsTab from "./bloodsugar/ExperimentsTab";
import { LuHash, LuPaintbrush, LuPlus, LuMenu, LuX } from "react-icons/lu";

/* --- Tab types ------------------------------------------------------- */
type TabId = "numbers" | "creative" | "experiments";

interface SidebarTab {
  id: TabId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const TABS: SidebarTab[] = [
  { id: "numbers",     label: "Numbers",     subtitle: "Promise $30,000 - Net Promise $40,000", icon: <LuHash size={14} /> },
  { id: "creative",    label: "Creative",    subtitle: "Creative deliverables",                  icon: <LuPaintbrush size={14} /> },
  { id: "experiments", label: "Experiments", subtitle: "1 experiment",                           icon: <LuHash size={14} /> },
];

/* --- Sidebar content (shared between desktop + mobile drawer) -------- */
function SidebarContent({
  activeTab,
  onSelect,
}: {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <>
      <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest mb-2 px-2">
        Performance
      </p>
      <div className="flex flex-col gap-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left w-full transition-all duration-150 ${
                isActive
                  ? "bg-[#111928] dark:bg-[#1a2332] border border-[#374151]"
                  : "hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]/50 border border-transparent"
              }`}
            >
              <div className={`mt-0.5 ${isActive ? "text-[#2563eb]" : "text-[#6B7280]"}`}>
                {tab.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold leading-tight ${
                  isActive ? "text-white" : "text-[#111928] dark:text-[#D1D5DB]"
                }`}>
                  {tab.label}
                </p>
                <p className={`text-[10px] mt-0.5 leading-tight ${
                  isActive ? "text-[#9CA3AF]" : "text-[#6B7280]"
                }`}>
                  {tab.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] my-4" />

     
    </>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function BloodSugarPage({ ownOfferId }: { ownOfferId?: string | null }) {
  const [activeTab, setActiveTab] = useState<TabId>("numbers");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSelect(id: TabId) {
    setActiveTab(id);
    setDrawerOpen(false); // close drawer on mobile after selection
  }

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-5">
        {/* Mobile: hamburger to open sidebar drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] text-[#6B7280] hover:text-[#111928] dark:hover:text-white transition-colors"
          aria-label="Open performance sidebar"
        >
          <LuMenu size={16} />
        </button>


        {/* Mobile: show current active tab name */}
        <span className="lg:hidden ml-auto text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          {activeLabel}
        </span>
      </div>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-white dark:bg-[#0d1520] shadow-2xl p-4 flex flex-col transition-transform duration-300 lg:hidden ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[#111928] dark:text-white">Blood Sugar</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-[#6B7280] hover:text-[#111928] dark:hover:text-white transition-colors"
          >
            <LuX size={16} />
          </button>
        </div>
        <SidebarContent activeTab={activeTab} onSelect={handleSelect} />
      </div>

      {/* Layout: sidebar (desktop only) + content */}
      <div className="flex gap-5 items-stretch">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden lg:flex lg:flex-col w-[220px] shrink-0 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-3">
          <SidebarContent activeTab={activeTab} onSelect={setActiveTab} />
        </div>

        {/* Main content — full width on mobile */}
        <div className="flex-1 min-w-0">
          {activeTab === "numbers" && <NumbersTab ownOfferId={ownOfferId} />}
          {activeTab === "creative" && <CreativeTab ownOfferId={ownOfferId} />}
          {activeTab === "experiments" && <ExperimentsTab ownOfferId={ownOfferId} />}
        </div>
      </div>
    </div>
  );
}