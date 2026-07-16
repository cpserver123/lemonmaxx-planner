"use client";

import { useState } from "react";
import {
  LuPlus, LuCalendar, LuChevronDown,
  LuUsers, LuSearch, LuEllipsisVertical, LuLayoutList,
} from "react-icons/lu";
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

/* --- Table data & types ------------------------------------------------- */
type MeetingStatus = "Pending" | "Active" | "Completed";

const DUMMY_ROWS: MeetingRow[] = [
  { id: "r1",  name: "Apollo : Leadgen Focused Area Meeting",          type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:00", participants: 11, duration: "120 min", createdBy: "Gagan Brar",     status: "Active" },
  { id: "r2",  name: "Apollo Strategic Area",                          type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 16:00", participants: 14, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r3",  name: "APOLLO- CM* Recorder",                           type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:15", participants: 2,  duration: "15 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r4",  name: "Board - Leadgen Weekly review",                   type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 23:00", participants: 1,  duration: "60 min",  createdBy: "Devinder",        status: "Active" },
  { id: "r5",  name: "Board Meeting Leadgen For Breakdown Resolution",  type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 6, 2026 · 14:30", participants: 3,  duration: "—",       createdBy: "Devinder",        status: "Active" },
  { id: "r6",  name: "Branding Calendar- All Brands",                  type: "Review",    recurrence: "Daily",             nextInstance: "Jul 1, 2026 · 09:00", participants: 4,  duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r7",  name: "Branding Reporting",                             type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 12:30", participants: 4,  duration: "-",       createdBy: "—",             status: "Active" },
  { id: "r8",  name: "Buddy meeting",                                  type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 15:00", participants: 2,  duration: "15 min",  createdBy: "—",             status: "Active" },
  { id: "r9",  name: "Chaos Strategic Meeting",                        type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 16:00", participants: 11, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r10", name: "CMx CHAOS Recorder",                             type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 15:30", participants: 2,  duration: "15 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r11", name: "Core Meeting",                                   type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:30", participants: 13, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r12", name: "Core team meeting for completing the Parked agend...", type: "Strategic", recurrence: "Weekly",     nextInstance: "Jul 3, 2026 · 14:15", participants: 13, duration: "60 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r13", name: "Daily HOC F-com Scrum",                          type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 · 12:00", participants: 6,  duration: "30 min",  createdBy: "Sumedha Sharma",  status: "Active" },
  { id: "r14", name: "Daily Huddle Meeting",                           type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 · 13:00", participants: 8,  duration: "45 min",  createdBy: "—",             status: "Active" },
  { id: "r15", name: "Ecom Board Meeting",                             type: "Business",  recurrence: "Custom...",          nextInstance: "Jul 17, 2026 · 09:00",participants: 4,  duration: "-",       createdBy: "—",             status: "Active" },
  { id: "r16", name: "Ecom Focus Area | Team shubham Gupta )",          type: "Business",  recurrence: "Monthly",           nextInstance: "Jul 3, 2026 · 14:15", participants: 11, duration: "120 min", createdBy: "—",             status: "Active" },
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
}: {
  rows: MeetingRow[];
  onAddMeeting: () => void;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  onNameClick: (row: MeetingRow) => void;
}) {
  const [search, setSearch] = useState("");
  const [meMode, setMeMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [rowStatuses, setRowStatuses] = useState<Record<string, MeetingStatus>>(
    () => Object.fromEntries(rows.map(r => [r.id, r.status]))
  );

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
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
          <button onClick={() => setMeMode(p => !p)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${meMode ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]" : "border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40"}`}>
            <LuUsers size={13} />Me mode
          </button>
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
  const colorIdx = { current: 0 };

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
          onNameClick={row => { setSelectedMeeting(row); setShowModal(true); }}
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

      {/* Modal */}
      <CreateMeetingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
        initialData={selectedMeeting}
      />
    </div>
  );
}