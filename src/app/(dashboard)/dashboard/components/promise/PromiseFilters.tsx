"use client";

import { useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* --- Component ------------------------------------------------------- */
export default function PromiseFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: "org-promises";
  onFilterChange: (f: "org-promises") => void;
}) {
  const [selectedYear,  setSelectedYear]  = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // June
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Org Promises toggle (only option now) */}
      <button
        onClick={() => onFilterChange("org-promises")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          activeFilter === "org-promises"
            ? "bg-[#5750F1] text-white"
            : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
        }`}
      >
        Org Promises
      </button>

      {/* Month-only picker */}
      <div className="relative">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          {MONTHS[selectedMonth]} {selectedYear}
          <LuCalendar size={12} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 w-56 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-3">
              {/* Year nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  <LuChevronLeft size={13} />
                </button>
                <span className="text-xs font-semibold text-[#111928] dark:text-white">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  <LuChevronRight size={13} />
                </button>
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(i); setShowPicker(false); }}
                    className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      i === selectedMonth
                        ? "bg-[#5750F1] text-white"
                        : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
