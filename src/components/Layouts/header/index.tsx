"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { ThemeToggleSwitch } from "./theme-toggle";
import { WorkspaceDropdown } from "./WorkspaceDropdown";
import { CiMenuBurger } from "react-icons/ci";
import { useDashboardTab, DASHBOARD_TABS } from "@/context/DashboardTabContext";
import { UserInfo } from "./user-info";

/* --- Header ---------------------------------------------------------- */
function HeaderComponent() {
  const { toggleSidebar } = useSidebarContext();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const { activeTab, setActiveTab } = useDashboardTab();

  return (
    <header className="sticky top-0 z-30 border-b border-[#E6EBF1] bg-white dark:border-[#27303E] dark:bg-[#020d1a]">
      <div className="flex items-center justify-between px-4 py-3 md:px-5 2xl:px-10 gap-4">
        {/* Left — mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg border px-1.5 py-1 border-[#E6EBF1] dark:border-[#27303E] dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden shrink-0"
        >
          <CiMenuBurger />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        {/* Center — tabs (only on /dashboard) */}
        {isDashboard ? (
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 min-w-max">
              {DASHBOARD_TABS.map(({ id, label }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(id)}
                    className={[
                      "px-4 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap",
                      "border-b-2 -mb-px",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5750F1]",
                      isActive
                        ? "border-[#5750F1] text-[#5750F1] dark:text-white dark:border-white"
                        : "border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right — theme toggle + avatar with dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <WorkspaceDropdown />
          <ThemeToggleSwitch />
          <UserInfo />
        </div>
      </div>
    </header>
  );
}

export const Header = React.memo(HeaderComponent);
