"use client";

import { useRef, useEffect, useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";

const TIME_FILTERS = ["Yest", "7D", "MTD", "LM"];
const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Build a compact label from a Set of selected month indices */
function buildLabel(months: Set<number>, year: number): string {
  if (months.size === 0) return `— ${year}`;
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) return `${MONTH_NAMES[sorted[0]]} ${year}`;
  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isConsecutive) return `${MONTH_NAMES[sorted[0]]} – ${MONTH_NAMES[sorted[sorted.length - 1]]} ${year}`;
  if (sorted.length <= 3) return sorted.map(i => MONTH_NAMES[i]).join(", ") + ` ${year}`;
  return `${sorted.length} months ${year}`;
}

export default function FilterBar() {
  const [search,     setSearch]     = useState("");
  const [activeTime, setActiveTime] = useState(1);
  const [showPicker, setShowPicker] = useState(false);

  // Multi-month selection
  const today = new Date();
  const [selectedYear,   setSelectedYear]   = useState(today.getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([today.getMonth()]));

  // Picker year (navigation inside picker)
  const [pickerYear, setPickerYear] = useState(selectedYear);

  const dropRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const openPicker = () => {
    setPickerYear(selectedYear);
    setShowPicker(p => !p);
  };

  const toggleMonth = (i: number) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
    // Commit picker year when any month is toggled
    setSelectedYear(pickerYear);
  };

  const label = buildLabel(selectedMonths, selectedYear);

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Time pills */}
      <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-[#122031] rounded-lg p-0.5">
        {TIME_FILTERS.map((f, i) => (
          <button
            key={f}
            onClick={() => setActiveTime(i)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              i === activeTime
                ? "bg-white dark:bg-[#1a2332] text-[#111928] dark:text-white shadow-sm"
                : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 w-44">
        <LuSearch size={12} className="text-[#9CA3AF] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 bg-transparent text-[11px] text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none"
        />
      </div>

      {/* Multi-month picker */}
      <div ref={dropRef} className="ml-auto relative">
        {/* Trigger button */}
        <button
          onClick={openPicker}
          className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuCalendar size={12} className="text-[#9CA3AF]" />
          {label}
          <LuChevronLeft size={11} className="text-[#9CA3AF]" />
          <LuChevronRight size={11} className="text-[#9CA3AF]" />
        </button>

        {/* Dropdown picker */}
        {showPicker && (
          <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">

            {/* Year navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setPickerYear(y => y - 1)}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuChevronLeft size={14} />
              </button>
              <span className="text-sm font-bold text-[#111928] dark:text-white">{pickerYear}</span>
              <button
                onClick={() => setPickerYear(y => y + 1)}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuChevronRight size={14} />
              </button>
            </div>

            {/* Month grid — multi-select */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((m, i) => {
                const active = selectedMonths.has(i) && pickerYear === selectedYear;
                return (
                  <button
                    key={m}
                    onClick={() => toggleMonth(i)}
                    className={`relative rounded-lg py-2 text-xs font-medium transition-all ${
                      active
                        ? "bg-[#5750F1] text-white shadow-sm"
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
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E6EBF1] dark:border-[#27303E]">
              <button
                onClick={() => setSelectedMonths(new Set())}
                className="text-[10px] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded-md bg-[#5750F1] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#4742d4] transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
