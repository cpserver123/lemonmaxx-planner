"use client";

import { useState } from "react";
import {
  LuChevronLeft, LuChevronRight, LuCalendar, LuUsers, LuChevronDown,
} from "react-icons/lu";

/* --- Team members data ----------------------------------------------- */
const MEMBERS = [
  { initials: "AB", name: "Arun Bandral",   color: "#22c55e" },
  { initials: "SK", name: "Satish Kumar",   color: "#3b82f6" },
  { initials: "KD", name: "Kapil Dev",      color: "#f59e0b" },
  { initials: "RN", name: "Rahul Nehra",    color: "#ec4899" },
  { initials: "MK", name: "Mukesh Kumar",   color: "#8b5cf6" },
  { initials: "NB", name: "Nityashish B.",  color: "#06b6d4", sub: "NO GOOGLE" },
  { initials: "YP", name: "Yash Poonia",    color: "#2563eb" },
  { initials: "SG", name: "Sahil Gupta",    color: "#f97316" },
  { initials: "KI", name: "komal isher",    color: "#6366f1" },
];

/* --- Event data ------------------------------------------------------ */
interface CalEvent {
  member:   number;   // index into MEMBERS
  startHr:  number;
  startMin: number;
  endHr:    number;
  endMin:   number;
  title:    string;
  color:    string;
  allDay?:  boolean;
}

const EVENTS: CalEvent[] = [
  // All-day
  { member: 0, startHr: 0, startMin: 0, endHr: 0, endMin: 0, title: "Team : Mavericks ...", color: "#3b82f6", allDay: true },
  // 06:30 - 06:45
  { member: 4, startHr: 6, startMin: 30, endHr: 6, endMin: 45, title: "06:30-06:45 Team sta...", color: "#5750F1" },
  // 07:00 blocks
  { member: 0, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "HOC x (T... 07:00-0...", color: "#7c3aed" },
  { member: 0, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL Dail... 07:00-0...", color: "#065f46" },
  { member: 1, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "HOC x (T... 07:00-0...", color: "#7c3aed" },
  { member: 1, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL Dal... 07:00-0...", color: "#065f46" },
  { member: 2, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL Dail... 07:00-0...", color: "#065f46" },
  { member: 3, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "HOC x (T... 07:00-0...", color: "#7c3aed" },
  { member: 3, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "07:00-0...", color: "#5750F1" },
  { member: 4, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "HO... 07:0...", color: "#7c3aed" },
  { member: 4, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL... 07:0...", color: "#065f46" },
  { member: 4, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "07:0...", color: "#5750F1" },
  { member: 6, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "HO... 07:0...", color: "#7c3aed" },
  { member: 6, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL... 07:0...", color: "#065f46" },
  { member: 6, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "07:0...", color: "#f59e0b" },
  { member: 8, startHr: 7, startMin: 0, endHr: 8, endMin: 0, title: "VSL Daily Team Meetin... 07:00-08:30 - gcal", color: "#4ade80" },
  // 08:30
  { member: 5, startHr: 8, startMin: 30, endHr: 9, endMin: 30, title: "Onboarding (Yash Poo... 08:30-09:30 - gcal", color: "#2563eb" },
  // 13:00
  { member: 3, startHr: 13, startMin: 0, endHr: 14, endMin: 0, title: "| VSL | l... 13:00-14...", color: "#78350f" },
  { member: 4, startHr: 13, startMin: 0, endHr: 14, endMin: 0, title: "VSL TLs ... 13:00-14...", color: "#7c3aed" },
  { member: 6, startHr: 13, startMin: 0, endHr: 14, endMin: 0, title: "| VSL | l... 13:00-14...", color: "#78350f" },
  { member: 7, startHr: 13, startMin: 0, endHr: 14, endMin: 0, title: "VSL TLs ... 13:00-14...", color: "#7c3aed" },
  // 14:30
  { member: 3, startHr: 14, startMin: 30, endHr: 15, endMin: 30, title: "Weekly VSL x TECH x ... 14:30-15:30 - gcal", color: "#f59e0b" },
  { member: 6, startHr: 14, startMin: 30, endHr: 15, endMin: 30, title: "Weekly VSL x TECH x ... 14:30-15:30 - gcal", color: "#f59e0b" },
];

/* --- Helpers --------------------------------------------------------- */
const HOURS = [6,7,8,9,10,11,12,13,14,15,16,17];
const PX_PER_HOUR = 64; // height of one hour row in px
const CELL_WIDTH   = 140;
const TIME_COL_W   = 56;

function toTop(hr: number, min: number, baseHr: number) {
  return ((hr - baseHr) + min / 60) * PX_PER_HOUR;
}
function toHeight(startHr: number, startMin: number, endHr: number, endMin: number) {
  const dur = (endHr - startHr) + (endMin - startMin) / 60;
  return Math.max(dur * PX_PER_HOUR, 18);
}

/* --- Month picker ---------------------------------------------------- */
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const LONG_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* --- Calendar component ---------------------------------------------- */
export default function TeamCalender() {
  const [selectedYear,  setSelectedYear]  = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // 0-indexed, June
  const [showPicker, setShowPicker]       = useState(false);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const goToday = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const label = `${LONG_MONTHS[selectedMonth]} ${selectedYear}`;

  const baseHr = HOURS[0];
  const totalH = HOURS.length * PX_PER_HOUR;

  return (
    <div className="flex flex-col gap-4 min-w-0">
    

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">

          {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-[#111928] dark:text-white">Team Calendar</h2>
        {/* All members button */}
        <button className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors">
          <LuUsers size={13} className="text-[#9CA3AF]" />
          All members ({MEMBERS.length})
          <LuChevronDown size={12} className="text-[#9CA3AF]" />
        </button>
      </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronLeft size={14} />
          </button>

          {/* Month picker trigger */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
            >
              <LuCalendar size={12} className="text-[#9CA3AF]" />
              {label}
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
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
                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((m, i) => (
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

          <button onClick={nextMonth} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronRight size={14} />
          </button>
          <button onClick={goToday} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors">
            This Month 
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: TIME_COL_W + MEMBERS.length * CELL_WIDTH }}>

            {/* Member header row */}
            <div
              className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] sticky top-0 z-20"
              style={{ paddingLeft: TIME_COL_W }}
            >
              {MEMBERS.map((m) => (
                <div
                  key={m.initials}
                  className="flex items-center gap-2 px-2 py-2.5 border-l border-[#E6EBF1] dark:border-[#1F2A37] shrink-0"
                  style={{ width: CELL_WIDTH }}
                >
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-[#111928] dark:text-white truncate">{m.name}</p>
                    {m.sub && <p className="text-[9px] text-[#9CA3AF]">{m.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* All-day row */}
            <div
              className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]"
            >
              <div
                className="shrink-0 flex items-center justify-end pr-2 text-[9px] text-[#9CA3AF] font-medium"
                style={{ width: TIME_COL_W, height: 28 }}
              >
                ALL-DAY
              </div>
              {MEMBERS.map((m, mi) => {
                const allDayEvts = EVENTS.filter(e => e.member === mi && e.allDay);
                return (
                  <div
                    key={mi}
                    className="border-l border-[#E6EBF1] dark:border-[#1F2A37] relative shrink-0 px-0.5 py-0.5 flex flex-col gap-0.5"
                    style={{ width: CELL_WIDTH, minHeight: 28 }}
                  >
                    {allDayEvts.map((ev, ei) => (
                      <div
                        key={ei}
                        className="rounded text-[9px] font-semibold text-white px-1.5 py-0.5 truncate"
                        style={{ background: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="flex" style={{ height: totalH }}>
              {/* Time labels column */}
              <div className="shrink-0 relative" style={{ width: TIME_COL_W, height: totalH }}>
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[9px] text-[#9CA3AF] font-medium"
                    style={{ top: i * PX_PER_HOUR - 6 }}
                  >
                    {String(h).padStart(2,"0")}:00
                  </div>
                ))}
              </div>

              {/* Member columns */}
              {MEMBERS.map((m, mi) => {
                const colEvents = EVENTS.filter(e => e.member === mi && !e.allDay);
                return (
                  <div
                    key={mi}
                    className="border-l border-[#E6EBF1] dark:border-[#1F2A37] relative shrink-0"
                    style={{ width: CELL_WIDTH, height: totalH }}
                  >
                    {/* Hour lines */}
                    {HOURS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-[#E6EBF1] dark:border-[#1F2A37]"
                        style={{ top: i * PX_PER_HOUR }}
                      />
                    ))}
                    {/* Events */}
                    {colEvents.map((ev, ei) => {
                      const top = toTop(ev.startHr, ev.startMin, baseHr);
                      const height = toHeight(ev.startHr, ev.startMin, ev.endHr, ev.endMin);
                      return (
                        <div
                          key={ei}
                          className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            top:        top + 1,
                            height:     height - 2,
                            background: ev.color + "cc",
                            borderLeft: `3px solid ${ev.color}`,
                          }}
                        >
                          <p className="text-[9px] font-semibold text-white leading-tight line-clamp-3">
                            {ev.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
