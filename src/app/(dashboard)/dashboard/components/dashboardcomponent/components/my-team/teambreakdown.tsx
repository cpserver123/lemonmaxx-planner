"use client";

import { useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuCheck } from "react-icons/lu";

/* --- Month picker data ----------------------------------------------- */
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const LONG_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TIME_FILTERS = ["Yest","7D","MTD","LM"];

/* --- Data ------------------------------------------------------------ */
interface BreakdownAction {
  label:    string;
  status:   "Open" | "Closed";
  date:     string;
  initials: string;
  member:   string;
}
interface Breakdown {
  id:      number;
  title:   string;
  desc:    string;
  actions: BreakdownAction[];
}

const BREAKDOWNS: Breakdown[] = [
  {
    id: 1,
    title: "Bruno Strategy on Catalog",
    desc: "I will make catalog testing profitable on Memory 3 winning creatives + 1 winning offer through catalog distribution, achieving ≥30% ROI at ≥$5K spend with 5-day consistency, generating $50K GM by June 30, 2026",
    actions: [
      { label: "For ABO 1$ Spending Issue - Launch Campaign Manually in 2 accounts", status: "Open", date: "09 Jun", initials: "MK", member: "Mukesh Kumar" },
    ],
  },
  {
    id: 2,
    title: "GLP1 Trim RX Bigwave",
    desc: "I will make GLP1 profitable on Meta by scaling Bigwave from May breakeven to ≥20% ROI at ≥$5K spend with 5-day consistency, generating $10K GM by June 30, 2026.",
    actions: [
      { label: "Bigwave scaling plan with existing winner variations (May learnings \u2192 June ramp)", status: "Open", date: "09 Jun", initials: "RN", member: "Rahul Nehra" },
      { label: "Test Story Ads on GLP1 Bigwave at ≥$3K/day stable spend",                         status: "Open", date: "09 Jun", initials: "RN", member: "Rahul Nehra" },
      { label: "Bigwave scaling plan with existing winner variations (May learnings \u2192 June ramp)", status: "Open", date: "09 Jun", initials: "RN", member: "Rahul Nehra" },
      { label: "Test Story Ads on GLP1 Bigwave at ≥$3K/day stable spend",                         status: "Open", date: "09 Jun", initials: "RN", member: "Rahul Nehra" },
    ],
  },
  {
    id: 3,
    title: "Memory VSL Scaling",
    desc: "I will scale Memory VSL to ≥$10K/day spend while maintaining ≥25% ROI with consistent creative testing every 2 weeks, reaching $120K GM by end of Q3 2026.",
    actions: [
      { label: "Launch 3 new VSL variations with updated hooks",           status: "Open", date: "12 Jun", initials: "AB", member: "Arun Bandral" },
      { label: "A/B test landing page variants against current control",   status: "Open", date: "12 Jun", initials: "SK", member: "Satish Kumar" },
    ],
  },
];

/* --- buildLabel helper ----------------------------------------------- */
function buildLabel(months: Set<number>, year: number): string {
  if (months.size === 0) return `${year}`;
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) return `${MONTH_NAMES[sorted[0]]} ${year}`;
  const isContiguous = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isContiguous) return `${MONTH_NAMES[sorted[0]]} – ${MONTH_NAMES[sorted[sorted.length - 1]]} ${year}`;
  const labels = sorted.map(m => MONTH_NAMES[m]);
  return labels.length <= 3 ? `${labels.join(", ")} ${year}` : `${labels.slice(0, 3).join(", ")}… ${year}`;
}

/* --- Month picker component ------------------------------------------ */
function MonthPicker() {
  const [activeTime, setActiveTime] = useState(2); // MTD
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  // Multi-month: store a Set of 0-indexed month numbers
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([5])); // default: June

  const label = buildLabel(selectedMonths, selectedYear);

  const toggleMonth = (m: number) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  };

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

      {/* Prev arrow */}
      <button className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
        <LuChevronLeft size={14} />
      </button>

      {/* Month picker trigger */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuCalendar size={12} className="text-[#9CA3AF]" />
          {label}
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
              {/* Year row */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                  <LuChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-[#111928] dark:text-white">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                  <LuChevronRight size={14} />
                </button>
              </div>

              {/* Selection hint */}
              <p className="text-[10px] text-[#9CA3AF] mb-2">
                {selectedMonths.size === 0
                  ? "Tap months to select"
                  : `${selectedMonths.size} month${selectedMonths.size > 1 ? "s" : ""} selected`}
              </p>

              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES.map((m, i) => {
                  const isSelected = selectedMonths.has(i);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMonth(i)}
                      className={`relative rounded-lg py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[#5750F1] text-white ring-2 ring-[#5750F1]/40"
                          : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}
                    >
                      {m}
                      {isSelected && (
                        <span className="absolute top-0.5 right-0.5 text-[8px] leading-none">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E6EBF1] dark:border-[#27303E]">
                <button
                  onClick={() => setSelectedMonths(new Set())}
                  className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-3 py-1 rounded-lg bg-[#5750F1] text-white text-[11px] font-semibold hover:bg-[#4740d4] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Next arrow */}
      <button className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
        <LuChevronRight size={14} />
      </button>
    </div>
  );
}

/* --- Breakdown card -------------------------------------------------- */
function BreakdownCard({ bd, showClosed }: { bd: Breakdown; showClosed: boolean }) {
  const visibleActions = showClosed ? bd.actions : bd.actions.filter(a => a.status === "Open");

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-1">{bd.title}</h3>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">{bd.desc}</p>
      </div>

      {/* Actions */}
      <div className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
        {visibleActions.map((action, i) => (
          <div key={i} className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018] transition-colors">
            <div className="flex-1 min-w-0">
              {/* ACTION label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Action</span>
                <p className="text-xs font-medium text-[#111928] dark:text-[#E5E7EB] truncate">{action.label}</p>
              </div>
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  action.status === "Open"
                    ? "bg-[#EEF2FF] text-[#5750F1] dark:bg-[#5750F1]/20 dark:text-[#818CF8]"
                    : "bg-[#F3F4F6] text-[#6B7280] dark:bg-[#1a2332] dark:text-[#9CA3AF]"
                }`}>
                  {action.status}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">{action.date}</span>
                <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                  <span className="h-4 w-4 rounded-full bg-[#5750F1] flex items-center justify-center text-[8px] font-bold text-white">{action.initials}</span>
                  {action.member}
                </span>
              </div>
            </div>

            {/* Resolve button */}
            <button className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-[#2563eb] hover:opacity-80 transition-opacity whitespace-nowrap">
              <LuCheck size={13} />
              Resolve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- TeamBreakdown --------------------------------------------------- */
export default function TeamBreakdown() {
  const [showClosed, setShowClosed] = useState(false);
  const totalOpen = BREAKDOWNS.reduce((n, b) => n + b.actions.filter(a => a.status === "Open").length, 0);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#111928] dark:text-white">Breakdowns</h2>
          <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">({totalOpen} open)</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Show closed toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">Show closed</span>
            <button
              role="switch"
              aria-checked={showClosed}
              onClick={() => setShowClosed(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showClosed ? "bg-[#5750F1]" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                showClosed ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          </label>

          {/* Month picker */}
          <MonthPicker />
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="flex flex-col gap-4">
        {BREAKDOWNS.map(bd => (
          <BreakdownCard key={bd.id} bd={bd} showClosed={showClosed} />
        ))}
      </div>
    </div>
  );
}
