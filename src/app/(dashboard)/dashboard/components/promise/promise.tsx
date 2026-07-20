"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import PromiseFilters from "./PromiseFilters";
import VerticalGrid from "./VerticalGrid";
import type { VerticalData } from "./VerticalCard";
import BloodSugarPage from "./bloodsugar";
import GLP1Page from "./glp1";
import MemoryPage from "./memory";
import NADPage from "./nad";
import WeighLosePage from "./weighlose";
import { LuArrowLeft, LuLoader } from "react-icons/lu";


/* --- Vertical detail mapping ----------------------------------------- */
const VERTICAL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "blood-sugar": BloodSugarPage,
  "glp1": GLP1Page,
  "memory": MemoryPage,
  "nad": NADPage,
  "weight-loss": WeighLosePage,
};

/* --- Main Component -------------------------------------------------- */
export default function PromiseSection() {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  const [activeFilter, setActiveFilter] = useState<"my-items" | "org-promises">("my-items");
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(() => new Set([new Date().getMonth()])); // Default current month
  
  const [verticals, setVerticals] = useState<VerticalData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerticals = useCallback(async () => {
    setLoading(true);
    const firstMonth = Array.from(selectedMonths)[0] ?? 5;
    const monthStr = `${selectedYear}-${String(firstMonth + 1).padStart(2, "0")}`;
    
    try {
      const res = await api.get("/api/v1/planner/verticals", {
        params: { workspace_id: workspaceId, with_own_offers: true, month_year: monthStr },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data?.data?.verticals || [];
      const mapped: VerticalData[] = data.map((v: any) => ({
        id: String(v.id),
        name: v.name,
        promise: v.promise || 0,
        netPromise: v.net_promise || 0,
        actuals: v.actual_promise || 0,
        platforms: [], // Add logic if platforms data is needed
        offers: (v.own_offers || []).map((o: any) => ({
          id: String(o.id),
          name: o.name,
          promise: o.promise || 0,
          netPromise: o.net_promise || 0,
          actuals: o.actual_promise || 0
        }))
      }));
      setVerticals(mapped);
    } catch (err) {
      console.error("Failed to fetch verticals", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token, selectedYear, selectedMonths]);

  useEffect(() => {
    fetchVerticals();
  }, [fetchVerticals]);

  const selectedName = verticals.find((v) => v.id === selectedVertical)?.name ?? "";
  // Any offer whose vertical is not in the map defaults to BloodSugarPage
  const DetailComponent = selectedVertical
    ? (VERTICAL_COMPONENTS[selectedVertical] ?? BloodSugarPage)
    : null;

  return (
    <div>
      {/* Content */}
      {selectedVertical && DetailComponent ? (
        <div>
          {/* Back button */}
          <button
            onClick={() => { setSelectedVertical(null); setSelectedOffer(null); }}
            className="flex items-center gap-1.5 text-xs text-[#5750F1] hover:underline mb-4"
          >
            <LuArrowLeft size={14} />
            Back to verticals
          </button>

          {/* Vertical detail component */}
          <DetailComponent ownOfferId={selectedOffer} />
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LuLoader className="animate-spin text-[#5750F1]" size={24} />
          <p className="mt-2 text-sm text-[#9CA3AF]">Loading verticals...</p>
        </div>
      ) : verticals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-[#111928] dark:text-white">No Verticals Found</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Create a vertical first to see it here.</p>
        </div>
      ) : (
        <div >
          <VerticalGrid
            verticals={verticals}
            onSelect={(id, offerId) => { setSelectedVertical(id); setSelectedOffer(offerId); }}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            onRefresh={fetchVerticals}
          />
        </div>
      )}
    </div>
  );
}