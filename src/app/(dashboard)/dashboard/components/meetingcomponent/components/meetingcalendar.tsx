"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

/* --- Types -------------------------------------------------------------- */
export interface MeetingEvent {
  id:        string;
  title:     string;
  dayOfWeek: number;   // 0=Mon ... 6=Sun
  startHr:   number;
  startMin:  number;
  endHr:     number;
  endMin:    number;
  color:     string;
  dueDate?:  string;
}

/* --- Constants ---------------------------------------------------------- */
export const EVENT_COLORS = ["#2563eb", "#7c3aed", "#065f46", "#5750F1", "#f59e0b", "#ec4899", "#06b6d4"];

export const DUMMY_EVENTS: MeetingEvent[] = [
  { id: "e1", title: "Weekly Sprint Planning",  dayOfWeek: 0, startHr: 9,  startMin: 0,  endHr: 10, endMin: 0,  color: "#2563eb" },
  { id: "e2", title: "VSL Daily Standup",        dayOfWeek: 0, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#065f46" },
  { id: "e3", title: "1-on-1 with Arun",         dayOfWeek: 1, startHr: 10, startMin: 30, endHr: 11, endMin: 0,  color: "#7c3aed" },
  { id: "e4", title: "Team Retrospective",       dayOfWeek: 2, startHr: 14, startMin: 0,  endHr: 15, endMin: 0,  color: "#f59e0b" },
  { id: "e5", title: "performance",              dayOfWeek: 3, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#5750F1" },
  { id: "e6", title: "Onboarding Session",       dayOfWeek: 3, startHr: 9,  startMin: 0,  endHr: 10, endMin: 30, color: "#06b6d4" },
  { id: "e7", title: "KPI Review",               dayOfWeek: 4, startHr: 13, startMin: 0,  endHr: 14, endMin: 0,  color: "#ec4899" },
];

/* --- Calendar helpers --------------------------------------------------- */
const HOURS_CAL       = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const PX_PER_HOUR_CAL = 80;
const TIME_COL_W      = 56;
const DAYS_SHORT      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_MONTHS_CAL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAMES_CAL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function calTop(hr: number, min: number) {
  return ((hr - HOURS_CAL[0]) + min / 60) * PX_PER_HOUR_CAL;
}
function calHeight(sHr: number, sMin: number, eHr: number, eMin: number) {
  return Math.max(((eHr - sHr) + (eMin - sMin) / 60) * PX_PER_HOUR_CAL, 44);
}

/** Get Monday of the week containing `date` */
function getMonday(d: Date) {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m    = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

/** Convert event time to minutes-from-midnight for overlap math */
function toMins(hr: number, min: number) { return hr * 60 + min; }

/**
 * Assigns each event a `col` (0-indexed) and `totalCols` so overlapping
 * events sit side-by-side rather than stacked.
 */
function layoutEvents(events: MeetingEvent[]) {
  type LayoutEvent = MeetingEvent & { col: number; totalCols: number };

  if (!events.length) return [] as LayoutEvent[];

  // Sort by start time
  const sorted = [...events].sort(
    (a, b) => toMins(a.startHr, a.startMin) - toMins(b.startHr, b.startMin)
  );

  const result: LayoutEvent[] = sorted.map(e => ({ ...e, col: 0, totalCols: 1 }));

  // Find clusters of overlapping events
  let i = 0;
  while (i < result.length) {
    // Grow cluster while next event overlaps current cluster end
    let clusterEnd = toMins(result[i].endHr, result[i].endMin);
    let j = i + 1;
    while (j < result.length && toMins(result[j].startHr, result[j].startMin) < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, toMins(result[j].endHr, result[j].endMin));
      j++;
    }
    // Assign columns within cluster using a greedy algorithm
    const cluster = result.slice(i, j);
    const cols: number[] = []; // cols[k] = end-minute of last event assigned to column k
    cluster.forEach(ev => {
      let assigned = -1;
      for (let c = 0; c < cols.length; c++) {
        if (toMins(ev.startHr, ev.startMin) >= cols[c]) {
          assigned = c;
          cols[c] = toMins(ev.endHr, ev.endMin);
          break;
        }
      }
      if (assigned === -1) {
        assigned = cols.length;
        cols.push(toMins(ev.endHr, ev.endMin));
      }
      ev.col = assigned;
    });
    // Set totalCols for all events in cluster
    cluster.forEach(ev => { ev.totalCols = cols.length; });
    i = j;
  }

  return result;
}

export interface APIMeeting {
  id:                number;
  name:              string;
  type:              string;
  recurrence:        string;
  weekly_days:       string[];
  due_date_time:     string;
  start_date_time:   string | null;
  duration:          number;
  status:            string;
  created_by_name:   string;
  participant_count: number;
  next_instance:     string | null;
}

/* --- Meeting Calendar --------------------------------------------------- */
export default function MeetingCalendar({
  meetings = [],
  onMonthChange,
  onEventClick,
}: {
  meetings?:      APIMeeting[];
  onMonthChange?: (start: Date, end: Date) => void;
  onEventClick?:  (meeting: APIMeeting) => void;
}) {
  const today      = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear,  setPickerYear]  = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());

  const lastFiredRef    = useRef<string>("");
  const onMonthChangeRef = useRef(onMonthChange);
  // Keep ref in sync without making it a useEffect dependency
  onMonthChangeRef.current = onMonthChange;

  useEffect(() => {
    const midWeek = new Date(weekStart);
    midWeek.setDate(weekStart.getDate() + 3);
    const y = midWeek.getFullYear();
    const m = midWeek.getMonth();
    const key = `${y}-${m}`;
    if (lastFiredRef.current !== key) {
      lastFiredRef.current = key;
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      onMonthChangeRef.current?.(start, end);
    }
  }, [weekStart]); // ← onMonthChange intentionally excluded via ref pattern

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  const goToday  = () => setWeekStart(getMonday(today));

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const label   = weekStart.getMonth() === weekEnd.getMonth()
    ? `${LONG_MONTHS_CAL[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTH_NAMES_CAL[weekStart.getMonth()]} - ${MONTH_NAMES_CAL[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const totalH = HOURS_CAL.length * PX_PER_HOUR_CAL;

  // Map meeting id → APIMeeting for click handler
  const meetingById = useMemo(() => {
    const map = new Map<string, APIMeeting>();
    meetings.forEach(m => map.set(String(m.id), m));
    return map;
  }, [meetings]);

  const allEvents = useMemo(() => {
    const startT = weekStart.getTime();
    const endT   = weekEnd.getTime() + 24 * 60 * 60 * 1000;

    return meetings.map((m) => {
      const displayDate = m.start_date_time || m.next_instance || m.due_date_time;
      if (!displayDate) return null;
      const mDate = new Date(displayDate);
      const t = mDate.getTime();
      if (t < startT || t >= endT) return null;

      const jsDay    = mDate.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

      const startHr  = mDate.getHours();
      const startMin = mDate.getMinutes();

      const duration = m.duration || 30;
      const endDate  = new Date(mDate.getTime() + duration * 60 * 1000);
      const endHr    = endDate.getHours();
      const endMin   = endDate.getMinutes();

      const typeColors: Record<string, string> = {
        Strategic: "#8b5cf6",
        Review:    "#f59e0b",
        Business:  "#06b6d4",
        Planning:  "#2563eb",
        Standup:   "#10b981",
        "1-on-1":  "#ec4899",
      };
      const color = typeColors[m.type] || EVENT_COLORS[m.id % EVENT_COLORS.length] || "#2563eb";

      return {
        id: String(m.id),
        title: m.name,
        dayOfWeek,
        startHr,
        startMin,
        endHr,
        endMin,
        color,
        dueDate: m.due_date_time,
      } as MeetingEvent;
    }).filter(Boolean) as MeetingEvent[];
  }, [meetings, weekStart, weekEnd]);

  // Pre-layout events per day column (resolves overlaps)
  const layoutByDay = useMemo(() => {
    const map: Record<number, ReturnType<typeof layoutEvents>> = {};
    for (let d = 0; d < 7; d++) {
      map[d] = layoutEvents(allEvents.filter(e => e.dayOfWeek === d));
    }
    return map;
  }, [allEvents]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronLeft size={14} />
          </button>

          {/* Month picker */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors"
            >
              <LuCalendar size={12} className="text-[#9CA3AF]" />
              {label}
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPickerYear(y => y - 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={13} /></button>
                    <span className="text-sm font-semibold text-[#111928] dark:text-white">{pickerYear}</span>
                    <button onClick={() => setPickerYear(y => y + 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={13} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES_CAL.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => {
                          const target = new Date(pickerYear, i, 1);
                          setWeekStart(getMonday(target));
                          setPickerMonth(i);
                          setShowPicker(false);
                          // Directly fire API fetch for the full selected month.
                          // Don't rely on the useEffect (it may skip if the key already matches).
                          const start = new Date(pickerYear, i, 1);
                          const end   = new Date(pickerYear, i + 1, 0);
                          // Update ref so the useEffect won't double-fire for the same month
                          lastFiredRef.current = `${pickerYear}-${i}`;
                          onMonthChange?.(start, end);
                        }}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          i === pickerMonth && pickerYear === weekStart.getFullYear()
                            ? "bg-[#2563eb] text-white"
                            : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}
                      >{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={nextWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronRight size={14} />
          </button>
          <button onClick={goToday} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors">
            This Week
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="w-full" style={{ minWidth: 640 }}>
            {/* Day header */}
            <div className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] sticky top-0 z-20" style={{ paddingLeft: TIME_COL_W }}>
              {dayDates.map((d, di) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div key={di} className="flex flex-1 flex-col items-center justify-center py-2.5 border-l border-[#E6EBF1] dark:border-[#1F2A37]">
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{DAYS_SHORT[di]}</span>
                    <span className={`text-sm font-bold mt-0.5 ${isToday ? "text-[#2563eb]" : "text-[#111928] dark:text-white"}`}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="flex" style={{ height: totalH }}>
              {/* Time labels */}
              <div className="shrink-0 relative" style={{ width: TIME_COL_W, height: totalH }}>
                {HOURS_CAL.map((h, i) => (
                  <div key={h} className="absolute right-2 text-[9px] text-[#9CA3AF] font-medium" style={{ top: i * PX_PER_HOUR_CAL - 6 }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayDates.map((_, di) => {
                const colEvents = layoutByDay[di] ?? [];
                return (
                  <div key={di} className="flex-1 border-l border-[#E6EBF1] dark:border-[#1F2A37] relative" style={{ height: totalH }}>
                    {/* Hour grid lines */}
                    {HOURS_CAL.map((_, hi) => (
                      <div key={hi} className="absolute left-0 right-0 border-t border-[#E6EBF1] dark:border-[#1F2A37]" style={{ top: hi * PX_PER_HOUR_CAL }} />
                    ))}

                    {/* Events — laid out side-by-side when overlapping */}
                    {colEvents.map(ev => {
                      const top    = calTop(ev.startHr, ev.startMin);
                      const height = calHeight(ev.startHr, ev.startMin, ev.endHr, ev.endMin);
                      const pct    = 100 / ev.totalCols;
                      const left   = `calc(${ev.col * pct}% + 2px)`;
                      const width  = `calc(${pct}% - 4px)`;
                      const raw    = meetingById.get(ev.id);

                      return (
                        <div
                          key={ev.id}
                          className="absolute rounded-md px-2 py-1.5 overflow-hidden cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all flex flex-col justify-start"
                          style={{
                            top:    top + 1,
                            height: height - 2,
                            left,
                            width,
                            background:  ev.color + "dd",
                            borderLeft: `3px solid ${ev.color}`,
                          }}
                          onClick={() => raw && onEventClick?.(raw)}
                        >
                          <p className="text-[11px] font-bold text-white leading-tight" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: height - 2 > 54 ? 2 : 1, WebkitBoxOrient: "vertical" }}>{ev.title}</p>
                          <p className="text-[10px] text-white/80 mt-0.5 font-medium whitespace-nowrap">
                            {String(ev.startHr).padStart(2, "0")}:{String(ev.startMin).padStart(2, "0")}–{String(ev.endHr).padStart(2, "0")}:{String(ev.endMin).padStart(2, "0")}
                          </p>
                          {ev.dueDate && height - 2 >= 72 && (
                            <p className="text-[9px] text-white/60 mt-0.5 truncate font-normal">
                              Due: {(() => {
                                try {
                                  const d = new Date(ev.dueDate!);
                                  const mName = MONTH_NAMES_CAL[d.getMonth()];
                                  return `${mName} ${d.getDate()}, ${String(d.getHours()).padStart(2,"00")}:${String(d.getMinutes()).padStart(2,"00")}`;
                                } catch { return ev.dueDate; }
                              })()}
                            </p>
                          )}
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
