"use client";

import { useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const TIME_FILTERS = ["Yest", "7D", "MTD", "LM"];

export default function FilterBar() {
  const [search, setSearch]         = useState("");
  const [activeTime, setActiveTime] = useState(1);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange]           = useState([{
    startDate: new Date(2026, 5, 1),
    endDate:   new Date(2026, 5, 30),
    key:       "selection",
  }]);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

      {/* Date picker */}
      <div className="ml-auto relative">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuCalendar size={12} className="text-[#9CA3AF]" />
          {fmt(range[0].startDate)} - {fmt(range[0].endDate)}
          <LuChevronLeft size={12} className="text-[#9CA3AF]" />
          <LuChevronRight size={12} className="text-[#9CA3AF]" />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl overflow-hidden">
              <div className="p-3">
                <DateRangePicker
                  onChange={(item: any) => setRange([item.selection])}
                  ranges={range as any}
                  moveRangeOnFirstSelection={false}
                  months={1}
                  rangeColors={["#5750F1"]}
                  inputRanges={[]}
                />
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EBF1] dark:border-[#27303E] px-3 py-2">
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                  {range[0].startDate.toLocaleDateString()} – {range[0].endDate.toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setShowPicker(false)} className="rounded-md border border-[#E6EBF1] dark:border-[#374151] px-2.5 py-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]">Cancel</button>
                  <button onClick={() => setShowPicker(false)} className="rounded-md bg-[#5750F1] px-2.5 py-1 text-[11px] text-white hover:opacity-90">Apply</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
