"use client";

import { useState } from "react";
import PTSidebar from "./components/PTSidebar";
import Scoreboard from "./components/Scoreboard";
import Heatmap from "./components/Heatmap";
import LeadReview from "./components/LeadReview";
import PlanningReview from "./components/PlanningReview";

type Tab = "scoreboard" | "heatmap" | "lead-review" | "planning-review";

const VIEWS: Record<Tab, React.ReactNode> = {
  scoreboard:      <Scoreboard />,
  heatmap:         <Heatmap />,
  "lead-review":   <LeadReview />,
  "planning-review": <PlanningReview />,
};

export default function PerformanceTracking() {
  const [activeTab, setActiveTab] = useState<Tab>("scoreboard");

  return (
    <div className="flex gap-5 min-h-screen p-5 bg-[#F3F4F6] dark:bg-[#020d1a]">
      {/* Left sidebar */}
      <div className="shrink-0 self-stretch">
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-3 h-full">
          <PTSidebar
            active={activeTab}
            onSelect={(id) => setActiveTab(id as Tab)}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {VIEWS[activeTab]}
      </div>
    </div>
  );
}