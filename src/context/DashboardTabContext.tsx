"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { setActiveTab as setActiveTabAction, type DashboardTabId } from "@/store/slices/dashboardTab.slice";
import type { RootState } from "@/store";

export type { DashboardTabId };

export const DASHBOARD_TABS: { id: DashboardTabId; label: string }[] = [
  { id: "dashboard",   label: "Dashboard"   },
  { id: "planning",    label: "Planning"    },
  { id: "promises",    label: "Promises"    },
  { id: "meetings",    label: "Meetings"    },
  { id: "performance", label: "Performance" },
  { id: "scoreboard",  label: "Scoreboard"  },
];

const VALID_TABS = new Set<string>(DASHBOARD_TABS.map(t => t.id));

interface DashboardTabContextValue {
  activeTab: DashboardTabId;
  setActiveTab: (tab: DashboardTabId) => void;
}

const DashboardTabContext = createContext<DashboardTabContextValue | null>(null);

export function DashboardTabProvider({ children }: { children: ReactNode }) {
  const dispatch     = useDispatch();
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const activeTab    = useSelector((state: RootState) => state.dashboardTab.activeTab);

  // On mount / URL change: sync query param → Redux
  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) return;
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      dispatch(setActiveTabAction(tabFromUrl as DashboardTabId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  const setActiveTab = (tab: DashboardTabId) => {
    dispatch(setActiveTabAction(tab));
    // Update URL query param without a full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

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
