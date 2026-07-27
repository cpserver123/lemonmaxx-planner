"use client";

import { useState } from "react";
import DashboardTab from "./components/scoreboard/DashboardTab";
import BusinessTabs from "./components/scoreboard/BusinessTabs";
import TeamTab from "./components/scoreboard/TeamTab";
import MemberTab from "./components/scoreboard/MemberTab";
import WeekTab from "./components/scoreboard/WeekTab";
import DailyTab from "./components/scoreboard/DailyTab";

type ScoreboardTab = "Dashboard" | "Business" | "Team" | "Member" | "Week" | "Daily";

const TABS: ScoreboardTab[] = ["Dashboard", "Business", "Team", "Member", "Week", "Daily"];

export default function PerformanceTracking() {
  const [activeTab, setActiveTab] = useState<ScoreboardTab>("Dashboard");

  return (
    <div className="flex flex-col gap-6 h-full min-h-0 min-w-0">
      {/* Top tabs */}
      <div className="border-b border-[#E6EBF1] dark:border-[#1F2A37] flex items-center gap-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                isActive
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab content area */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto pr-2 pb-8">
        {activeTab === "Dashboard" && <DashboardTab />}
        {activeTab === "Business" && <BusinessTabs />}
        {activeTab === "Team" && <TeamTab />}
        {activeTab === "Member" && <MemberTab />}
        {activeTab === "Week" && <WeekTab />}
        {activeTab === "Daily" && <DailyTab />}
      </div>
    </div>
  );
}