"use client";

import DashboardSection from "./components/dashboard";
import PlanningSection from "./components/planning";
import PromiseSection from "./components/promise/promise";
import MeetingSection from "./components/meeting";
import PerformanceSection from "./components/performancecomponent/performance";
import PerformanceTracking from "./components/performance tracking/page";
import { useDashboardTab } from "@/context/DashboardTabContext";
import type { DashboardTabId } from "@/context/DashboardTabContext";

/* --- Tab content map ------------------------------------------------ */
function TabContent({ activeTab }: { activeTab: DashboardTabId }) {
  switch (activeTab) {
    case "dashboard":   return <DashboardSection />;
    case "planning":    return <PlanningSection />;
    case "promises":    return <PromiseSection />;
    case "meetings":    return <MeetingSection />;
    case "performance": return <PerformanceSection />;
    case "scoreboard":  return <PerformanceTracking />;
  }
}

/* --- Page ----------------------------------------------------------- */
export default function DashboardPage() {
  const { activeTab } = useDashboardTab();

  return (
    <div
      id={`tabpanel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`tab-${activeTab}`}
    >
      <TabContent activeTab={activeTab} />
    </div>
  );
}
