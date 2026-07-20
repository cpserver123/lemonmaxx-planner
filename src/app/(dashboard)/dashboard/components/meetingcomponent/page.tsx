"use client";

import { useState } from "react";
import {
  LuPlus, LuCalendar, LuChevronDown,
  LuUsers, LuSearch, LuEllipsisVertical, LuLayoutList, LuTriangle,
} from "react-icons/lu";
import { DateRangePicker } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import CreateMeetingModal, {
  type MeetingForm,
  type MeetingRow,
  BLANK,
} from "./components/newmeeting";
import MeetingCalendar, {
  type MeetingEvent,
  EVENT_COLORS,
  DUMMY_EVENTS,
} from "./components/meetingcalendar";

/* --- Helper to parse meeting date from string ---------------------------- */
const parseMeetingDate = (nextInstanceStr: string): Date | null => {
  if (!nextInstanceStr || nextInstanceStr === "—" || nextInstanceStr === "-") return null;
  try {
    const datePart = nextInstanceStr.split("·")[0].trim();
    const parsed = new Date(datePart);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
};

/* --- Table data & types ------------------------------------------------- */
type MeetingStatus = "Pending" | "Active" | "Completed";

const DUMMY_ROWS: MeetingRow[] = [
  {
    id: "r1", name: "Apollo : Leadgen Focused Area Meeting", type: "Strategic", recurrence: "Weekly",
    nextInstance: "Jul 2, 2026 · 17:00", participants: 11, duration: "120 min", createdBy: "Gagan Brar", status: "Active",
    intention: "Lead Generation Strategy & Performance Review",
    startDateTime: "2026-07-21T10:00", repeatTime: "10:00", dueDate: "2026-07-21T12:00",
    expectedOutcome: "Align on lead targets and unblock pipeline blockers",
    description: "Weekly review of Apollo leadgen funnel, conversion rates, and next-step actions.",
  },
  {
    id: "r2", name: "Apollo Strategic Area", type: "Strategic", recurrence: "Weekly",
    nextInstance: "Jul 1, 2026 · 16:00", participants: 14, duration: "120 min", createdBy: "\u2014", status: "Active",
    intention: "Quarterly strategic alignment for Apollo vertical",
    startDateTime: "2026-07-01T16:00", repeatTime: "16:00", dueDate: "2026-07-01T18:00",
    expectedOutcome: "Strategic roadmap finalized for Q3",
  },
  {
    id: "r3", name: "APOLLO- CM* Recorder", type: "Strategic", recurrence: "Weekly",
    nextInstance: "Jul 2, 2026 · 17:15", participants: 2, duration: "15 min", createdBy: "Pankhuri Sharma", status: "Active",
    intention: "Record CM actions and decisions",
    startDateTime: "2026-07-02T17:15", repeatTime: "17:15", dueDate: "2026-07-02T17:30",
    expectedOutcome: "All CM action items documented and assigned",
  },
  { id: "r4",  name: "Board - Leadgen Weekly review",                   type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 1, 2026 \u00b7 23:00", participants: 1,  duration: "60 min",  createdBy: "Devinder",        status: "Active", intention: "Weekly board review of leadgen numbers", expectedOutcome: "Board aligned on leadgen progress" },
  { id: "r5",  name: "Board Meeting Leadgen For Breakdown Resolution",  type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 6, 2026 \u00b7 14:30", participants: 3,  duration: "\u2014",       createdBy: "Devinder",        status: "Active" },
  { id: "r6",  name: "Branding Calendar- All Brands",                  type: "Review",    recurrence: "Daily",             nextInstance: "Jul 1, 2026 \u00b7 09:00", participants: 4,  duration: "120 min", createdBy: "\u2014",             status: "Active", intention: "Daily content calendar sync across all brands" },
  { id: "r7",  name: "Branding Reporting",                             type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 3, 2026 \u00b7 12:30", participants: 4,  duration: "-",       createdBy: "\u2014",             status: "Active" },
  { id: "r8",  name: "Buddy meeting",                                  type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 \u00b7 15:00", participants: 2,  duration: "15 min",  createdBy: "\u2014",             status: "Active" },
  { id: "r9",  name: "Chaos Strategic Meeting",                        type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 1, 2026 \u00b7 16:00", participants: 11, duration: "120 min", createdBy: "\u2014",             status: "Active" },
  { id: "r10", name: "CMx CHAOS Recorder",                             type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 \u00b7 15:30", participants: 2,  duration: "15 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r11", name: "Core Meeting",                                   type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 \u00b7 17:30", participants: 13, duration: "120 min", createdBy: "\u2014",             status: "Active" },
  { id: "r12", name: "Core team meeting for completing the Parked agend...", type: "Strategic", recurrence: "Weekly",      nextInstance: "Jul 3, 2026 \u00b7 14:15", participants: 13, duration: "60 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r13", name: "Daily HOC F-com Scrum",                          type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 \u00b7 12:00", participants: 6,  duration: "30 min",  createdBy: "Sumedha Sharma",  status: "Active" },
  { id: "r14", name: "Daily Huddle Meeting",                           type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 \u00b7 13:00", participants: 8,  duration: "45 min",  createdBy: "\u2014",             status: "Active" },
  { id: "r15", name: "Ecom Board Meeting",                             type: "Business",  recurrence: "Custom...",          nextInstance: "Jul 17, 2026 \u00b7 09:00", participants: 4, duration: "-",       createdBy: "\u2014",             status: "Active" },
  { id: "r16", name: "Ecom Focus Area | Team shubham Gupta )",          type: "Business",  recurrence: "Monthly",           nextInstance: "Jul 3, 2026 \u00b7 14:15", participants: 11, duration: "120 min", createdBy: "\u2014",             status: "Active" },
];

const TYPE_COLOR: Record<string, string> = {
  Strategic: "#8b5cf6",
  Review:    "#f59e0b",
  Business:  "#06b6d4",
  Planning:  "#2563eb",
  Standup:   "#10b981",
  "1-on-1":  "#ec4899",
};

/* --- Meeting Table ------------------------------------------------------- */
function MeetingTable({
  rows,
  onAddMeeting,
  showCompleted,
  onToggleShowCompleted,
  onNameClick,
  rowStatuses,
  setRowStatuses,
}: {
  rows: MeetingRow[];
  onAddMeeting: () => void;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  onNameClick: (row: MeetingRow) => void;
  rowStatuses: Record<string, MeetingStatus>;
  setRowStatuses: React.Dispatch<React.SetStateAction<Record<string, MeetingStatus>>>;
}) {
  const [search, setSearch] = useState("");
  const [meMode, setMeMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<any>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection"
    }
  ]);

  const filtered = rows.filter(r => {
    // Search filter
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Show completed filter (always keep visible)
    const status = rowStatuses[r.id] ?? r.status;

    // Date range filter
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const mDate = parseMeetingDate(r.nextInstance);
      if (mDate) {
        const start = new Date(dateRange[0].startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange[0].endDate);
        end.setHours(23, 59, 59, 999);
        if (mDate < start || mDate > end) return false;
      } else {
        return false;
      }
    }

    return true;
  });

  const allChecked  = filtered.length > 0 && filtered.every(r => selectedRows.has(r.id));
  const someChecked = filtered.some(r => selectedRows.has(r.id));

  const toggleAll = () => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allChecked) { filtered.forEach(r => next.delete(r.id)); }
      else            { filtered.forEach(r => next.add(r.id)); }
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const STATUS_STYLE: Record<MeetingStatus, { color: string; bg: string; border: string }> = {
    Pending:   { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
    Active:    { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
    Completed: { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" },
  };

  const cols = [
    { key: "name",         label: "Name",          w: "min-w-[220px] flex-1" },
    { key: "type",         label: "Type",          w: "w-[110px] shrink-0" },
    { key: "recurrence",   label: "Recurrence",    w: "w-[160px] shrink-0" },
    { key: "nextInstance", label: "Next Instance", w: "w-[170px] shrink-0" },
    { key: "participants", label: "Participants",  w: "w-[110px] shrink-0" },
    { key: "duration",     label: "Duration",      w: "w-[100px] shrink-0" },
    { key: "createdBy",    label: "Created By",    w: "w-[140px] shrink-0" },
    { key: "status",       label: "Status",        w: "w-[120px] shrink-0" },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings..." className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] pl-9 pr-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#2563eb] transition-colors" />
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40 transition-colors cursor-pointer"
            >
              <LuCalendar size={13} className="text-[#9CA3AF]" />
              <span>
                {dateRange[0].startDate && dateRange[0].endDate
                  ? `${format(dateRange[0].startDate, "MMM d, yyyy")} - ${format(dateRange[0].endDate, "MMM d, yyyy")}`
                  : "Filter by Date"}
              </span>
              <LuChevronDown size={12} className="text-[#9CA3AF]" />
            </button>

            {showDatePicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDatePicker(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-2xl p-2 max-w-[95vw] overflow-x-auto">
                  <DateRangePicker
                    onChange={(item: any) => {
                      setDateRange([item.selection]);
                    }}
                    showPreview={true}
                    moveRangeOnFirstSelection={false}
                    months={1}
                    ranges={dateRange}
                    direction="horizontal"
                    inputRanges={[]}
                    shownDate={dateRange[0].startDate || new Date()}
                  />
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#E6EBF1] dark:border-[#27303E]">
                    <button
                      onClick={() => {
                        setDateRange([
                          {
                            startDate: undefined,
                            endDate: undefined,
                            key: "selection"
                          }
                        ]);
                        setShowDatePicker(false);
                      }}
                      className="rounded-md border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
    
          <button onClick={onToggleShowCompleted} className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40 transition-colors">
            <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${showCompleted ? "bg-[#2563eb]" : "bg-[#D1D5DB] dark:bg-[#374151]"}`}>
              <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${showCompleted ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
            Show completed
          </button>
          <button onClick={onAddMeeting} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors">
            <LuPlus size={13} />Add Meeting
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }} onChange={toggleAll} className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563eb] accent-[#2563eb] cursor-pointer" />
                </th>
                <th className="w-10 px-2 py-3 text-[11px] font-semibold text-[#9CA3AF] text-center">#</th>
                {cols.map(c => (
                  <th key={c.key} className={`px-3 py-3 text-left ${c.w}`}>
                    <div className="flex items-center gap-1 group">
                      <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">{c.label}</span>
                      <LuEllipsisVertical size={11} className="text-[#D1D5DB] dark:text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} className="border-b border-[#F3F4F6] dark:border-[#1F2A37]/60 hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018]/60 transition-colors group cursor-pointer">
                  <td className="w-10 px-3 py-2.5">
                    <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563eb] accent-[#2563eb] cursor-pointer" />
                  </td>
                  <td className="w-10 px-2 py-2.5 text-xs text-[#9CA3AF] text-center">{i + 1}</td>
                  <td className="px-3 py-2.5 min-w-[220px] flex-1">
                    <span className="text-sm font-medium text-[#111928] dark:text-white truncate block max-w-[260px] hover:text-[#2563eb] cursor-pointer transition-colors" onClick={() => onNameClick(row)}>{row.name}</span>
                  </td>
                  <td className="px-3 py-2.5 w-[110px] shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: TYPE_COLOR[row.type] ?? "#6B7280", background: (TYPE_COLOR[row.type] ?? "#6B7280") + "18" }}>{row.type}</span>
                  </td>
                  <td className="px-3 py-2.5 w-[160px] shrink-0"><span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.recurrence}</span></td>
                  <td className="px-3 py-2.5 w-[170px] shrink-0"><span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.nextInstance}</span></td>
                  <td className="px-3 py-2.5 w-[110px] shrink-0">
                    <div className="flex items-center gap-1 text-sm text-[#374151] dark:text-[#D1D5DB]"><LuUsers size={13} className="text-[#9CA3AF]" />{row.participants}</div>
                  </td>
                  <td className="px-3 py-2.5 w-[100px] shrink-0"><span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.duration}</span></td>
                  <td className="px-3 py-2.5 w-[140px] shrink-0"><span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.createdBy}</span></td>
                  <td className="px-3 py-2.5 w-[130px] shrink-0" onClick={e => e.stopPropagation()}>
                    {(() => {
                      const s  = rowStatuses[row.id] ?? "Active";
                      const st = STATUS_STYLE[s];
                      return (
                        <div className="relative inline-block">
                          <select value={s} onChange={e => setRowStatuses(prev => ({ ...prev, [row.id]: e.target.value as MeetingStatus }))} className="appearance-none rounded-md border pl-2.5 pr-6 py-1 text-xs font-semibold cursor-pointer outline-none transition-colors" style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <LuChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: st.color }} />
                        </div>
                      );
                    })()}
                  </td>
                  <td className="w-10 px-2 py-2.5">
                    <LuEllipsisVertical size={14} className="text-[#D1D5DB] dark:text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* --- Main Component ----------------------------------------------------- */
type ViewTab = "table" | "calendar";

export default function MeetingSection() {
  const [showModal,        setShowModal]        = useState(false);
  const [selectedMeeting,  setSelectedMeeting]  = useState<MeetingRow | null>(null);
  const [calEvents,        setCalEvents]        = useState<MeetingEvent[]>([]);
  const [viewTab,          setViewTab]          = useState<ViewTab>("table");
  const [showCompleted,    setShowCompleted]    = useState(false);
  const [tableRows,        setTableRows]        = useState<MeetingRow[]>(DUMMY_ROWS);
  const [rowStatuses,      setRowStatuses]      = useState<Record<string, MeetingStatus>>(
    () => Object.fromEntries(DUMMY_ROWS.map(r => [r.id, r.status]))
  );
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [pendingRowId,     setPendingRowId]     = useState<string | null>(null);
  const colorIdx = { current: 0 };

  const handleNameClick = (row: MeetingRow) => {
    const status = rowStatuses[row.id] ?? row.status;
    if (status === "Pending") {
      setPendingRowId(row.id);
      setSelectedMeeting(row);
      setShowConfirm(true);
    } else {
      setSelectedMeeting(row);
      setShowModal(true);
    }
  };

  const handleSaved = () => {
    if (pendingRowId) {
      setRowStatuses(prev => ({ ...prev, [pendingRowId]: "Completed" }));
      setPendingRowId(null);
    }
  };

  const handleCreated = (form: MeetingForm) => {
    const color = EVENT_COLORS[colorIdx.current % EVENT_COLORS.length];
    colorIdx.current++;
    const now       = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    setCalEvents(prev => [...prev, { id: crypto.randomUUID(), title: form.name.trim(), dayOfWeek, startHr: 9, startMin: 0, endHr: 10, endMin: 0, color }]);

    const durationLabel = form.duration ? `${form.duration} min` : "—";
    const nextInstance  = form.dueDate ? `${form.dueDate}${form.dueTime ? " · " + form.dueTime : ""}` : "—";
    const newRow: MeetingRow = {
      id:           crypto.randomUUID(),
      name:         form.name.trim(),
      type:         form.type,
      recurrence:   form.recurrence,
      nextInstance,
      participants: form.participants ? parseInt(form.participants, 10) : 0,
      duration:     durationLabel,
      createdBy:    "—",
      status:       "Active",
    };
    setTableRows(prev => [newRow, ...prev]);
  };

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "table",    label: "Table",    icon: <LuLayoutList size={13} /> },
    { id: "calendar", label: "Calendar", icon: <LuCalendar   size={13} /> },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#111928] dark:text-white">Meetings</h2>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Schedule and manage your team meetings</p>
        </div>
        {/* View Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] p-1">
          {VIEW_TABS.map(t => (
            <button key={t.id} onClick={() => setViewTab(t.id)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${viewTab === t.id ? "bg-white dark:bg-[#0d1520] text-[#111928] dark:text-white shadow-sm border border-[#E6EBF1] dark:border-[#1F2A37]" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {viewTab === "table" && (
        <MeetingTable
          rows={tableRows}
          onAddMeeting={() => { setSelectedMeeting(null); setShowModal(true); }}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => setShowCompleted(p => !p)}
          onNameClick={handleNameClick}
          rowStatuses={rowStatuses}
          setRowStatuses={setRowStatuses}
        />
      )}

      {/* Calendar view */}
      {viewTab === "calendar" && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => { setSelectedMeeting(null); setShowModal(true); }} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors">
              <LuPlus size={13} />Add Meeting
            </button>
          </div>
          <MeetingCalendar events={calEvents} />
        </div>
      )}

      {/* Confirmation modal for Pending meetings */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => { setShowConfirm(false); setPendingRowId(null); setSelectedMeeting(null); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#0d1520] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#1F2A37] p-6 w-full max-w-sm pointer-events-auto">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FEF3C7] mx-auto mb-4">
                <LuTriangle size={22} className="text-[#D97706]" />
              </div>
              <h3 className="text-base font-bold text-[#111928] dark:text-white text-center mb-1">Start Meeting?</h3>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] text-center mb-6">
                Are you sure you want to start <span className="font-semibold text-[#111928] dark:text-white">{selectedMeeting?.name}</span>? Saving changes will mark this meeting as <span className="text-[#16a34a] font-semibold">Completed</span>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setPendingRowId(null); setSelectedMeeting(null); }}
                  className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-semibold text-[#374151] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setShowModal(true); }}
                  className="flex-1 rounded-lg bg-[#2563eb] py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8] transition-colors"
                >
                  Yes, Start
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main meeting modal */}
      <CreateMeetingModal
        open={showModal}
        onClose={() => { setShowModal(false); setPendingRowId(null); }}
        onCreated={handleCreated}
        onSaved={handleSaved}
        initialData={selectedMeeting}
      />
    </div>
  );
}