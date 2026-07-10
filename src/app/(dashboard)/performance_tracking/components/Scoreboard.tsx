"use client";

import { useState } from "react";
import DashboardTab from "./scoreboard/DashboardTab";
import BusinessTab  from "./scoreboard/BusinessTab";
// import FrontTab     from "./scoreboard/FrontTab";
import TeamTab      from "./scoreboard/TeamTab";
import MemberTab    from "./scoreboard/MemberTab";
import WeekTab      from "./scoreboard/WeekTab";
import DailyTab     from "./scoreboard/DailyTab";

type ContentTab = "Dashboard" | "Business" | "Team" | "Member" | "Week" | "Daily";

const TABS: ContentTab[] = ["Dashboard", "Business", "Team", "Member", "Week", "Daily"];

const TAB_VIEWS: Record<ContentTab, React.ReactNode> = {
  Dashboard: <DashboardTab />,
  Business:  <BusinessTab />,
  // Front:     <FrontTab />,
  Team:      <TeamTab />,
  Member:    <MemberTab />,
  Week:      <WeekTab />,
  Daily:     <DailyTab />,
};

export default function ScoreboardDashboard() {
  const [activeTab, setActiveTab] = useState<ContentTab>("Dashboard");

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[#E6EBF1] dark:border-[#1F2A37] overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {TAB_VIEWS[activeTab]}
    </div>
  );
}
