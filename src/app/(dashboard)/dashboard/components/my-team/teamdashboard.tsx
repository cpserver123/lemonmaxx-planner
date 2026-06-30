"use client";

import { useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

const TIME_FILTERS = ["Yest", "7D", "MTD", "LM"];

/* --- KPI Stat cards -------------------------------------------------- */
const STATS = [
  { label: "Members",      value: "9",    sub: null,                  color: "text-[#111928] dark:text-white" },
  { label: "Promises",     value: "36",   sub: "36 on - 0 risk - 0 break", color: "text-[#2563eb]" },
  { label: "Breakdowns",   value: "20",   sub: "19 over 7d",           color: "text-orange-400" },
  { label: "Escalations",  value: "0",    sub: null,                  color: "text-[#111928] dark:text-white" },
  { label: "Requests",     value: "0",    sub: null,                  color: "text-[#111928] dark:text-white" },
  { label: "Due today",    value: "2",    sub: null,                  color: "text-[#111928] dark:text-white" },
  { label: "Overdue",      value: "6",    sub: null,                  color: "text-orange-400" },
  { label: "Check-in today", value: "0%", sub: null,                  color: "text-orange-400" },
];

/* --- Breakdowns data ------------------------------------------------- */
const BREAKDOWNS = [
  { title: "Manually launched and testing through l...", sub: "Bruno Strategy on Catalog", age: "19d" },
  { title: "Untitled",  sub: "Existing Bruno Strategy", age: "41d" },
  { title: "Untitled",  sub: "Flexible - Bruno",        age: "55d" },
  { title: "trying to find the strategy to increase th...", sub: "Performance Strategy", age: "19d" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* --- FilterBar ------------------------------------------------------- */
function FilterBar() {
  const [activeTime, setActiveTime] = useState(2); // MTD
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear,  setSelectedYear]  = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // 0-indexed, June

  const label = `${MONTHS[selectedMonth]} ${selectedYear}`;

  const selectMonth = (m: number) => {
    setSelectedMonth(m);
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Time pills */}
      <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-[#122031] rounded-lg p-0.5">
        {TIME_FILTERS.map((f, i) => (
          <button key={f} onClick={() => setActiveTime(i)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              i === activeTime
                ? "bg-white dark:bg-[#1a2332] text-[#111928] dark:text-white shadow-sm"
                : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Month picker button */}
      <div className="ml-auto relative">
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuCalendar size={12} className="text-[#9CA3AF]" />
          {label}
          <LuChevronLeft size={12} className="text-[#9CA3AF]" />
          <LuChevronRight size={12} className="text-[#9CA3AF]" />
        </button>

        {showPicker && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
              {/* Year row */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  <LuChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-[#111928] dark:text-white">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  <LuChevronRight size={14} />
                </button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => selectMonth(i)}
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

/* --- Team Dashboard Tab Content -------------------------------------- */
export default function TeamDashboard() {
  return (
    <div className="flex flex-col gap-5">
   

      {/* Section title + filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-[#111928] dark:text-white">Team Dashboard</h2>
        <FilterBar />
      </div>

      {/* KPI stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-3 flex flex-col gap-0.5">
            <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">{s.label}</span>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            {s.sub && <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Promises & Delivery Health (spans 2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-5">
          <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-3">Promises &amp; Delivery Health</h3>
          <div className="mb-2">
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Status</span>
            {/* Progress bar */}
            <div className="mt-2 relative h-2 rounded-full bg-[#E6EBF1] dark:bg-[#1F2A37] overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-[#2563eb]" style={{ width: "55%" }} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-full bg-[#9CA3AF] inline-block" /> Draft <strong className="text-[#111928] dark:text-white ml-0.5">30</strong>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-full bg-[#2563eb] inline-block" /> Active <strong className="text-[#111928] dark:text-white ml-0.5">36</strong>
              </span>
            </div>
          </div>

          {/* On track / At risk / Breaking */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "On track", value: "36", color: "text-[#2563eb]" },
              { label: "At risk",  value: "0",  color: "text-orange-400" },
              { label: "Breaking", value: "0",  color: "text-red-500" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] p-3">
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{item.label}</span>
                <p className={`text-2xl font-bold mt-0.5 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#2563eb] mt-4">21 active promises have no pathway yet.</p>
        </div>

        {/* Execution */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-5">
          <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-3">Execution</h3>

          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mb-2">
              <span>Check-in compliance (7d)</span>
              <span className="text-orange-400 font-semibold">Today: 0%</span>
            </div>
            {/* Day bars */}
            <div className="flex items-end gap-1.5 h-10">
              {["M","T","W","T","F","S","S"].map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-[#2563eb]/20 dark:bg-[#2563eb]/10" style={{ height: `${Math.random() * 28 + 4}px` }} />
                  <span className="text-[9px] text-[#9CA3AF]">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] pt-3 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Actions this week</span>
              <span className="text-[#111928] dark:text-white font-semibold">0/19 (0%)</span>
            </div>
          </div>

          <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] pt-3">
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Cross-team open (0)</span>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">None.</p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Breakdowns */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Breakdowns</h3>
            <button className="text-[11px] text-[#5750F1] hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-2">
            {BREAKDOWNS.map((b, i) => (
              <div key={i} className="flex items-start justify-between gap-2 group">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#111928] dark:text-[#D1D5DB] truncate">{b.title}</p>
                  <p className="text-[10px] text-[#9CA3AF] truncate">{b.sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-orange-400/20 text-orange-400 text-[10px] font-semibold px-1.5 py-0.5">{b.age}</span>
                  <button className="flex items-center gap-0.5 text-[10px] text-[#2563eb] font-semibold hover:opacity-80 whitespace-nowrap">
                    ✓ Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalations */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Escalations</h3>
            <button className="text-[11px] text-[#5750F1] hover:underline">View all</button>
          </div>
          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No escalations 🎉</p>
        </div>

        {/* Requests */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Requests</h3>
            <button className="text-[11px] text-[#5750F1] hover:underline">View all</button>
          </div>
          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No open requests.</p>
        </div>
      </div>
    </div>
  );
}