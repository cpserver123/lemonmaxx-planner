"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DashboardTabId =
  | "dashboard"
  | "planning"
  | "promises"
  | "meetings"
  | "mission-control";

export const DASHBOARD_TABS: { id: DashboardTabId; label: string }[] = [
  { id: "dashboard",       label: "Dashboard"       },
  { id: "planning",        label: "Planning"        },
  { id: "promises",        label: "Promises"        },
  { id: "meetings",        label: "Meetings"        },
  { id: "mission-control", label: "Mission Control" },
];

interface DashboardTabContextValue {
  activeTab: DashboardTabId;
  setActiveTab: (tab: DashboardTabId) => void;
}

const DashboardTabContext = createContext<DashboardTabContextValue | null>(null);

export function DashboardTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("dashboard");
  return (
    <DashboardTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </DashboardTabContext.Provider>
  );
}

export function useDashboardTab() {
  const ctx = useContext(DashboardTabContext);
  if (!ctx) throw new Error("useDashboardTab must be used within DashboardTabProvider");
  return ctx;
}
