"use client";

import { useRef, useEffect, useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuRefreshCw } from "react-icons/lu";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildLabel(months: Set<number>, year: number): string {
  if (months.size === 0) return `— ${year}`;
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) return `${MONTH_NAMES[sorted[0]]} ${year}`;
  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isConsecutive) return `${MONTH_NAMES[sorted[0]]} – ${MONTH_NAMES[sorted[sorted.length - 1]]} ${year}`;
  if (sorted.length <= 3) return sorted.map(i => MONTH_NAMES[i]).join(", ") + ` ${year}`;
  return `${sorted.length} months ${year}`;
}

export default function FilterBar({
  defaultYear    = new Date().getFullYear(),
  defaultMonths  = new Set([new Date().getMonth()]),
  onCommit       = () => {},
  onRefresh      = () => {},
  isRefreshing   = false,
}: {
  defaultYear?:   number;
  defaultMonths?: Set<number>;
  onCommit?:      (year: number, months: Set<number>) => void;
  onRefresh?:     () => void;
  isRefreshing?:  boolean;
  // Legacy optional props (kept so other tabs using FilterBar still compile)
  selectedYear?:    number;
  setSelectedYear?: (y: number) => void;
  selectedMonths?:  Set<number>;
  setSelectedMonths?: (s: Set<number>) => void;
} = {}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerCoords, setPickerCoords] = useState({ top: 0, right: 0 });

  // Draft state — only committed to parent on Done click
  const [draftYear,   setDraftYear]   = useState(defaultYear);
  const [draftMonths, setDraftMonths] = useState<Set<number>>(new Set(defaultMonths));

  // Label reflects what was last committed (defaultYear/defaultMonths)
  const committedLabel = buildLabel(defaultMonths, defaultYear);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Close on outside click / scroll / resize
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current   && !panelRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
        setDraftYear(defaultYear);
        setDraftMonths(new Set(defaultMonths));
      }
    };
    const close = () => setShowPicker(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showPicker, defaultYear, defaultMonths]);

  const openPicker = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPickerCoords({
        top:   r.bottom + 4,
        right: window.innerWidth - r.right,
      });
    }
    // Sync draft to current committed on open
    setDraftYear(defaultYear);
    setDraftMonths(new Set(defaultMonths));
    setShowPicker(p => !p);
  };

  const toggleMonth = (i: number) => {
    setDraftMonths(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleDone = () => {
    setShowPicker(false);
    onCommit(draftYear, draftMonths);
  };

  const handleClear = () => {
    setDraftMonths(new Set());
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Multi-month picker */}
      <div className="relative ml-auto">
        <div className="flex items-center gap-1.5">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data"
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#5750F1]/40 hover:text-[#5750F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuRefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          </button>

          {/* Date picker trigger */}
          <button
            ref={triggerRef}
            onClick={openPicker}
            className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuCalendar size={12} className="text-[#9CA3AF]" />
            {committedLabel}
            <LuChevronLeft size={11} className="text-[#9CA3AF]" />
            <LuChevronRight size={11} className="text-[#9CA3AF]" />
          </button>
        </div>

        {/* Dropdown picker — position:fixed to escape all stacking contexts */}
        {showPicker && typeof window !== "undefined" && (
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top:   pickerCoords.top,
              right: pickerCoords.right,
              zIndex: 99999,
            }}
            className="w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4"
          >

            {/* Year navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setDraftYear(y => y - 1)}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuChevronLeft size={14} />
              </button>
              <span className="text-sm font-bold text-[#111928] dark:text-white">{draftYear}</span>
              <button
                onClick={() => setDraftYear(y => y + 1)}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuChevronRight size={14} />
              </button>
            </div>

            {/* Month grid — multi-select (draft only) */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((m, i) => {
                const active = draftMonths.has(i);
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
                onClick={handleClear}
                className="text-[10px] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleDone}
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
