"use client";

import { useState } from "react";
import PromiseFilters from "./promise/PromiseFilters";
import VerticalGrid from "./promise/VerticalGrid";
import type { VerticalData } from "./promise/VerticalCard";
import BloodSugarPage from "./promise/bloodsugar";
import GLP1Page from "./promise/glp1";
import MemoryPage from "./promise/memory";
import NADPage from "./promise/nad";
import WeighLosePage from "./promise/weighlose";
import { LuArrowLeft } from "react-icons/lu";

/* --- Dummy Data ------------------------------------------------------ */
const VERTICALS: VerticalData[] = [
  {
    id: "blood-sugar",
    name: "Blood Sugar",
    promise: 30000,
    netPromise: 40000,
    platforms: [{ icon: "meta" }],
    offers: [
      { id: "blood-sugar-bruno", name: "Bruno VSL", promise: 12000, netPromise: 16000 },
      { id: "blood-sugar-bifi",  name: "BIFI",      promise: 10000, netPromise: 14000 },
      { id: "blood-sugar-vince", name: "VINCE",     promise: 8000,  netPromise: 10000 },
    ],
  },
  {
    id: "glp1",
    name: "GLP1",
    promise: 10000,
    netPromise: 15000,
    hasWarning: true,
    platforms: [{ icon: "meta" }],
    offers: [
      { id: "glp1-main",   name: "GLP1 Main",   promise: 6000, netPromise: 9000  },
      { id: "glp1-upsell", name: "GLP1 Upsell", promise: 4000, netPromise: 6000  },
    ],
  },
  {
    id: "memory",
    name: "Memory",
    promise: 110000,
    netPromise: 135000,
    hasWarning: true,
    platforms: [{ icon: "meta" }, { icon: "taboola", count: 1 }],
    offers: [
      { id: "memory-primary", name: "Memory Pro",  promise: 65000, netPromise: 80000 },
      { id: "memory-lite",    name: "Memory Lite", promise: 45000, netPromise: 55000 },
    ],
  },
  {
    id: "nad",
    name: "NAD+",
    promise: 10000,
    netPromise: 15000,
    hasWarning: true,
    platforms: [{ icon: "meta" }],
    offers: [
      { id: "nad-main", name: "NAD+ Main", promise: 10000, netPromise: 15000 },
    ],
  },
  {
    id: "weight-loss",
    name: "Weight Loss",
    promise: 40000,
    netPromise: 55000,
    hasWarning: true,
    platforms: [{ icon: "meta" }, { icon: "taboola", count: 1 }],
    offers: [
      { id: "wl-slim",  name: "SlimFast VSL", promise: 15000, netPromise: 20000 },
      { id: "wl-burn",  name: "BurnMax",       promise: 14000, netPromise: 19000 },
      { id: "wl-keto",  name: "Keto Offer",    promise: 11000, netPromise: 16000 },
    ],
  },
];

/* --- Vertical detail mapping ----------------------------------------- */
const VERTICAL_COMPONENTS: Record<string, React.ComponentType> = {
  "blood-sugar": BloodSugarPage,
  "glp1": GLP1Page,
  "memory": MemoryPage,
  "nad": NADPage,
  "weight-loss": WeighLosePage,
};

/* --- Main Component -------------------------------------------------- */
export default function PromiseSection() {
  const [activeFilter, setActiveFilter] = useState<"my-items" | "org-promises">("my-items");
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);

  const selectedName = VERTICALS.find((v) => v.id === selectedVertical)?.name ?? "";
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
            onClick={() => setSelectedVertical(null)}
            className="flex items-center gap-1.5 text-xs text-[#5750F1] hover:underline mb-4"
          >
            <LuArrowLeft size={14} />
            Back to verticals
          </button>

          {/* Vertical detail component */}
          <DetailComponent />
        </div>
      ) : (
        <div >
          <VerticalGrid
            verticals={VERTICALS}
            onSelect={(id) => setSelectedVertical(id)}
          />
        </div>
      )}
    </div>
  );
}