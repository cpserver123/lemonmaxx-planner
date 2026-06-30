"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { DashboardTabProvider } from "@/context/DashboardTabContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardTabProvider>
        {children}
      </DashboardTabProvider>
    </SidebarProvider>
  );
}
