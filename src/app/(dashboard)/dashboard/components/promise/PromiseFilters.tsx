"use client";

import { useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuRotateCw } from "react-icons/lu";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Build a compact label from a Set of selected month indices */
function buildLabel(months: Set<number>, year: number): string {
  if (months.size === 0) return `— ${year}`;
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) return `${MONTHS[sorted[0]]} ${year}`;
  // Check if consecutive
  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isConsecutive) return `${MONTHS[sorted[0]]} – ${MONTHS[sorted[sorted.length - 1]]} ${year}`;
  if (sorted.length <= 3) return sorted.map(i => MONTHS[i]).join(", ") + ` ${year}`;
  return `${sorted.length} months ${year}`;
}

/* --- Component ------------------------------------------------------- */
export default function PromiseFilters({
  activeFilter,
  onFilterChange,
  selectedYear,
  setSelectedYear,
  selectedMonths,
  setSelectedMonths,
  onRefresh,
}: {
  activeFilter: "org-promises" | "my-items";
  onFilterChange: (f: "org-promises" | "my-items") => void;
  selectedYear: number;
  setSelectedYear: (y: number | ((prev: number) => number)) => void;
  selectedMonths: Set<number>;
  setSelectedMonths: (m: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  onRefresh?: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [localYear, setLocalYear] = useState<number>(selectedYear);
  const [localMonths, setLocalMonths] = useState<Set<number>>(new Set(selectedMonths));

  const handleOpenPicker = () => {
    setLocalYear(selectedYear);
    setLocalMonths(new Set(selectedMonths));
    setShowPicker(true);
  };

  const toggleLocalMonth = (i: number) => {
    setLocalMonths(prev => {
      const next = new Set<number>();
      if (!prev.has(i)) {
        next.add(i);
      }
      return next;
    });
  };

  const label = buildLabel(selectedMonths, selectedYear);

  return (
    <div className="flex items-center gap-2">
      {/* Org Promises toggle */}
     
      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center justify-center rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] p-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#5750F1]/40 hover:text-[#5750F1] transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <LuRotateCw size={13} />
        </button>
      )}

      {/* Month picker */}
      <div className="relative">
        <button
          onClick={handleOpenPicker}
          className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          {label}
          <LuCalendar size={12} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 w-56 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-3">
              {/* Year nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setLocalYear(y => y - 1)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  <LuChevronLeft size={13} />
                </button>
                <span className="text-xs font-semibold text-[#111928] dark:text-white">{localYear}</span>
                <button
                  onClick={() => setLocalYear(y => y + 1)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  <LuChevronRight size={13} />
                </button>
              </div>

              {/* Month grid — select 1 month at a time */}
              <div className="grid grid-cols-3 gap-1">
                {MONTHS.map((m, i) => {
                  const active = localMonths.has(i);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleLocalMonth(i)}
                      className={`relative rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#5750F1] text-white"
                          : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}
                    >
                      {m}
                      {active && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white">
                          <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                            <path d="M1 2.5L2.5 4L5 1" stroke="#5750F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E6EBF1] dark:border-[#27303E]">
                <button
                  onClick={() => setLocalMonths(new Set())}
                  className="text-[10px] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setSelectedYear(localYear);
                    setSelectedMonths(localMonths);
                    setShowPicker(false);
                  }}
                  className="rounded-md bg-[#5750F1] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#4742d4] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
