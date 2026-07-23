"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { LuLoader, LuTrash2 } from "react-icons/lu";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  LuPlus, LuCalendar, LuChevronDown,
  LuUsers, LuSearch, LuEllipsisVertical, LuLayoutList, LuTriangle,
  LuChevronLeft, LuChevronRight, LuRefreshCw,
} from "react-icons/lu";
import { DateRangePicker } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const ROW_OPTIONS = [10, 25, 50, 100];

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

/* --- Format date for API (YYYY-MM-DD) ----------------------------------- */
const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* --- Table data & types ------------------------------------------------- */
type MeetingStatus = "Pending" | "Active" | "Completed";

/* --- API meeting shape -------------------------------------------------- */
interface APIMeeting {
  id:               number;
  name:             string;
  type:             string;
  recurrence:       string;
  weekly_days:      string[];
  due_date_time:    string;
  start_date_time:  string | null;
  duration:         number;
  status:           string;
  created_by_name:  string;
  participant_count: number;
  next_instance:    string | null;
}

/* --- Map API response → MeetingRow (list view) -------------------------- */
function mapApiMeeting(m: APIMeeting): MeetingRow {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const typeLabel = m.type === "one_to_one" ? "1-to-1" : capitalize(m.type);
  const recurrenceLabel = capitalize(m.recurrence);
  // Prefer start_date_time; fall back to next_instance then due_date_time
  const displayDate = m.start_date_time || m.next_instance || m.due_date_time || null;
  const nextInstance = displayDate
    ? new Date(displayDate).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";
  const rawStatus = m.status?.toLowerCase();
  const status: "Pending" | "Active" | "Completed" =
    (rawStatus === "completed" || rawStatus === "complete") ? "Completed" :
    rawStatus === "active" ? "Active" : "Pending";

  return {
    id:           String(m.id),
    name:         m.name,
    type:         typeLabel,
    recurrence:   recurrenceLabel,
    nextInstance,
    participants: m.participant_count,
    duration:     m.duration ? `${m.duration} min` : "—",
    createdBy:    m.created_by_name || "—",
    status,
  };
}

/* --- API single meeting detail response ---------------------------------- */
interface APIMeetingDetail {
  id:               number;
  name:             string;
  intention:        string | null;
  type:             string;
  due_date_time:    string;
  start_date_time:  string | null;
  repeat_time:      string | null;
  duration:         number;
  recurrence:       string;
  weekly_days:      string[];
  expected_outcome: string | null;
  note:             string | null;
  agenda:           string | null;
  prework:          string | null;
  report:           string | null;
  summary:          string | null;
  link:             string | null;
  score:            number | null;
  status:           string;
  created_by_name:  string;
  participants: { id: number; user_id: number; name: string; email: string; role: string }[];
  files?: { key: string; url: string; size: number; filename: string; content_type: string }[];
}

/* --- Convert ISO datetime → "datetime-local" input value ---------------- */
const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-") + "T" + [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
  ].join(":");
};

/* --- Map API detail response → MeetingRow (full fields) ----------------- */
function mapApiMeetingDetail(m: APIMeetingDetail): MeetingRow {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const typeLabel = m.type === "one_to_one" ? "1-to-1" : capitalize(m.type);
  const recurrenceMap: Record<string, string> = {
    once: "One-time", daily: "Daily", weekly: "Weekly", monthly: "Monthly",
  };

  const recurrenceLabel = recurrenceMap[m.recurrence] ?? capitalize(m.recurrence);
  const rawStatus = m.status?.toLowerCase();
  const status: "Pending" | "Active" | "Completed" =
    (rawStatus === "completed" || rawStatus === "complete") ? "Completed" :
    rawStatus === "active" ? "Active" : "Pending";

  return {
    id:              String(m.id),
    name:            m.name,
    type:            typeLabel,
    recurrence:      recurrenceLabel,
    nextInstance:    "—",
    participants:    m.participants.length,
    duration:        m.duration ? `${m.duration} min` : "—",
    createdBy:       m.created_by_name || "—",
    status,
    intention:       m.intention        ?? "",
    dueDate:         toDatetimeLocal(m.due_date_time),
    startDateTime:   toDatetimeLocal(m.start_date_time ?? null),
    repeatTime:      m.repeat_time ?? "",
    expectedOutcome: m.expected_outcome ?? "",
    description:     m.note             ?? "",
    agenda:          m.agenda           ?? "",
    prework:         m.prework          ?? "",
    report:          m.report           ?? "",
    summary:         m.summary          ?? "",
    reportScore:     m.score != null ? String(m.score) : "",
    participantsList: m.participants.map(p => ({ id: p.user_id, name: p.name })),
    files:           m.files ?? [],
  };
}

const TYPE_COLOR: Record<string, string> = {
  Strategic: "#8b5cf6",
  Review:    "#f59e0b",
  Business:  "#06b6d4",
  Planning:  "#2563eb",
  Standup:   "#10b981",
  "1-on-1":  "#ec4899",
};

/* --- Pagination Footer ----------------------------------------------- */
function PaginationFooter({
  rowsPerPage,
  currentPage,
  totalRows,
  onRowsPerPageChange,
  onPageChange,
}: {
  rowsPerPage: number;
  currentPage: number;
  totalRows: number;
  onRowsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage) || 1);

  const maxVisiblePages = 5;
  const halfWindow = Math.floor(maxVisiblePages / 2);
  let startPage = Math.max(1, currentPage - halfWindow);
  let endPage = startPage + maxVisiblePages - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = Array.from(
    { length: Math.max(0, endPage - startPage + 1) },
    (_, index) => startPage + index,
  );

  const displayPages: Array<number | "ellipsis"> = [];
  if (totalPages <= maxVisiblePages + 2) {
    for (let p = 1; p <= totalPages; p++) displayPages.push(p);
  } else {
    displayPages.push(1);
    if (startPage > 2) displayPages.push("ellipsis");
    for (const p of pages) {
      if (p !== 1 && p !== totalPages) displayPages.push(p);
    }
    if (endPage < totalPages - 1) displayPages.push("ellipsis");
    displayPages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-1 border-t border-[#E6EBF1] dark:border-[#1F2A37] px-4 py-3 text-xs md:text-sm">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="rounded-md border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0a0f1a] px-3 py-1.5 text-xs text-[#374151] dark:text-[#9CA3AF] shadow-sm focus:border-[#5750F1] focus:outline-none focus:ring-1 focus:ring-[#5750F1]"
        >
          {ROW_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} Rows
            </option>
          ))}
        </select>
      </div>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-2 py-1 text-[#6B7280] hover:text-[#111928] dark:text-[#9CA3AF] dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          «
        </button>

        {displayPages.map((page, idx) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-7 w-7 items-center justify-center text-[#6B7280] dark:text-[#9CA3AF]"
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={
                page === currentPage
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#5750F1] text-white text-xs font-semibold"
                  : "flex h-7 w-7 items-center justify-center rounded-full text-[#374151] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2A37] transition-colors"
              }
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="px-2 py-1 text-[#6B7280] hover:text-[#111928] dark:text-[#9CA3AF] dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          »
        </button>
      </div>
    </div>
  );
}

/* --- Meeting Table ------------------------------------------------------- */
function MeetingTable({
  rows,
  onAddMeeting,
  showCompleted,
  onToggleShowCompleted,
  onNameClick,
  rowStatuses,
  onStatusChange,
  startDate,
  endDate,
  onDateRangeChange,
  onDone,
  onClear,
  onDeleteMeeting,
}: {
  rows: MeetingRow[];
  onAddMeeting: () => void;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  onNameClick: (row: MeetingRow) => void;
  rowStatuses: Record<string, MeetingStatus>;
  onStatusChange: (rowId: string, newStatus: MeetingStatus) => void;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
  onDone: () => void;
  onClear: () => void;
  onDeleteMeeting: (row: MeetingRow) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [meMode, setMeMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<MeetingRow | null>(null);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);

  // Build date-range shape for the DateRangePicker
  const dateRange = [{ startDate, endDate, key: "selection" }];

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const fmtBtn = (d: Date) => format(d, "MMM d, yyyy");
  const dateLabel = isSameDay(startDate, endDate)
    ? fmtBtn(startDate)
    : `${fmtBtn(startDate)} – ${fmtBtn(endDate)}`;

  const filtered = rows.filter(r => {
    // Search filter
    if (!r.name.toLowerCase().includes(search.toLowerCase())) return false;
    // Show completed toggle — when ON show only completed, when OFF show all
    if (showCompleted) {
      const status = (rowStatuses[r.id] ?? r.status) as MeetingStatus;
      if (status !== "Completed") return false;
    }
    return true;
  });

  // Reset to page 1 when rowsPerPage or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const allChecked  = paginated.length > 0 && paginated.every(r => selectedRows.has(r.id));
  const someChecked = paginated.some(r => selectedRows.has(r.id));

  const toggleAll = () => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allChecked) { paginated.forEach(r => next.delete(r.id)); }
      else            { paginated.forEach(r => next.add(r.id)); }
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
          {/* Refresh Button */}
          <button
            onClick={onDone}
            className="flex items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-2.5 py-2 hover:border-[#2563eb]/40 text-[#6B7280] dark:text-[#9CA3AF] transition-colors cursor-pointer"
            title="Refresh meetings"
          >
            <LuRefreshCw size={13} />
          </button>

          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40 transition-colors cursor-pointer"
            >
              <LuCalendar size={13} className="text-[#9CA3AF]" />
              <span>{dateLabel}</span>
              <LuChevronDown size={12} className="text-[#9CA3AF]" />
            </button>

            {showDatePicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDatePicker(false)}
                />
                <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-1.5 z-40 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-2xl p-2 max-w-[95vw] overflow-x-auto">
              <DateRangePicker
                onChange={(item: any) => {
                  const sel = item.selection;
                  const s = sel?.startDate instanceof Date ? sel.startDate : startDate;
                  const e = sel?.endDate instanceof Date ? sel.endDate : endDate;
                  onDateRangeChange(s, e);
                }}
                showPreview={false}
                moveRangeOnFirstSelection={false}
                months={1}
                ranges={dateRange}
                direction="horizontal"
                inputRanges={[]}
                shownDate={startDate}
              />
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#E6EBF1] dark:border-[#27303E]">
                    <button
                      onClick={() => {
                        onClear();
                        setShowDatePicker(false);
                      }}
                      className="rounded-md border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        onDone();
                        setShowDatePicker(false);
                      }}
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
        <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#F9FAFB] dark:bg-[#0a1018]">
              <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
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
              {paginated.map((row, i) => (
                <tr key={row.id} className="border-b border-[#F3F4F6] dark:border-[#1F2A37]/60 hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018]/60 transition-colors group cursor-pointer">
                  <td className="w-10 px-3 py-2.5">
                    <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563eb] accent-[#2563eb] cursor-pointer" />
                  </td>
                  <td className="w-10 px-2 py-2.5 text-xs text-[#9CA3AF] text-center">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                  <td className="px-3 py-2.5 min-w-[220px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#111928] dark:text-white truncate block max-w-[220px] hover:text-[#2563eb] cursor-pointer transition-colors" onClick={() => onNameClick(row)}>{row.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteRow(row); }}
                        title="Delete meeting"
                        className="shrink-0 flex items-center justify-center rounded p-1 text-[#D1D5DB] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <LuTrash2 size={13} />
                      </button>
                    </div>
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
                          <select
                            value={s}
                            onChange={e => onStatusChange(row.id, e.target.value as MeetingStatus)}
                            className="appearance-none rounded-md border pl-2.5 pr-6 py-1 text-xs font-semibold cursor-pointer outline-none transition-colors"
                            style={{ color: st.color, background: st.bg, borderColor: st.border }}
                          >
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

      {/* Delete meeting confirmation modal */}
      {pendingDeleteRow && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111928] rounded-2xl shadow-2xl border border-[#E6EBF1] dark:border-[#1F2A37] w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                <LuTrash2 size={22} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-[#111928] dark:text-white text-center mb-2">Delete Meeting</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] text-center mb-6">
              Are you really want to delete the meeting <span className="font-semibold text-[#111928] dark:text-white">&ldquo;{pendingDeleteRow.name}&rdquo;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingDeleteRow(null)}
                disabled={isDeletingMeeting}
                className="flex-1 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-4 py-2.5 text-sm font-medium text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingMeeting}
                onClick={async () => {
                  setIsDeletingMeeting(true);
                  await onDeleteMeeting(pendingDeleteRow);
                  setIsDeletingMeeting(false);
                  setPendingDeleteRow(null);
                }}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeletingMeeting ? <><LuLoader size={14} className="animate-spin" /> Deleting…</> : <><LuTrash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
        <PaginationFooter
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalRows={filtered.length}
          onRowsPerPageChange={setRowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

/* --- Main Component ----------------------------------------------------- */
type ViewTab = "table" | "calendar";

export default function MeetingSection() {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token }   = useAuth();

  const [showModal,        setShowModal]        = useState(false);
  const [selectedMeeting,  setSelectedMeeting]  = useState<MeetingRow | null>(null);
  const [isDetailLoading,  setIsDetailLoading]  = useState(false);
  const [rawMeetings,      setRawMeetings]      = useState<APIMeeting[]>([]);
  const [viewTab,          setViewTab]          = useState<ViewTab>("table");
  const [showCompleted,    setShowCompleted]    = useState(false);
  const [tableRows,        setTableRows]        = useState<MeetingRow[]>([]);
  const [rowStatuses,      setRowStatuses]      = useState<Record<string, MeetingStatus>>({});
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [pendingRowId,     setPendingRowId]     = useState<string | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [fetchError,       setFetchError]       = useState<string | null>(null);
  const now = new Date();
  const monthStart = () => new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = () => new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate,        setStartDate]        = useState<Date>(monthStart);
  const [endDate,          setEndDate]          = useState<Date>(monthEnd);
  const colorIdx = { current: 0 };

  const fetchMeetings = useCallback(async (start?: Date, end?: Date) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        workspace_id: workspaceId,
        own: false,
      };
      if (start) params.start_date = toApiDate(start);
      if (end)   params.end_date   = toApiDate(end);
      const res = await api.get("/api/v1/planner/meetings", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const meetings: APIMeeting[] = res.data?.data?.meetings ?? [];
      const rows = meetings.map(mapApiMeeting).sort((a, b) => Number(b.id) - Number(a.id));
      setTableRows(rows);
      setRawMeetings([...meetings].sort((a, b) => b.id - a.id));
      setRowStatuses(Object.fromEntries(rows.map(r => [r.id, r.status])));
      toast.success(res.data?.message ?? "Meetings loaded successfully");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to load meetings";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  // Initial load — fetch for current month
  useEffect(() => { fetchMeetings(monthStart(), monthEnd()); }, [fetchMeetings]);


  const handleNameClick = async (row: MeetingRow) => {
    const status = rowStatuses[row.id] ?? row.status;
    // Open modal immediately with basic row data
    if (status === "Pending") setPendingRowId(row.id);
    setSelectedMeeting(row);
    setShowModal(true);
    setIsDetailLoading(true);
    try {
      const res = await api.get(`/api/v1/planner/meetings/${row.id}`, {
        params:  { workspace_id: workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const detail: APIMeetingDetail = res.data?.data;
      setSelectedMeeting(mapApiMeetingDetail(detail));
      toast.success(res.data?.message ?? "Meeting details loaded");
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch meeting detail";
      console.error("Failed to fetch meeting detail:", err);
      toast.error(msg);
      // Keep the basic row data already shown
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDeleteMeeting = async (row: MeetingRow) => {
    try {
      const res = await api.delete(`/api/v1/planner/meetings/${row.id}`, {
        params: { workspace_id: workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success((res.data as any)?.message ?? "Meeting deleted successfully");
      setTableRows(prev => prev.filter(r => r.id !== row.id));
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to delete meeting";
      console.error("Failed to delete meeting:", err);
      toast.error(msg);
    }
  };

  const handleStatusChange = async (rowId: string, newStatus: MeetingStatus) => {
    const statusMap: Record<MeetingStatus, string> = {
      Pending: "pending",
      Active: "active",
      Completed: "complete",
    };
    // Optimistic UI update
    setRowStatuses(prev => ({ ...prev, [rowId]: newStatus }));
    try {
      const res = await api.patch(`/api/v1/planner/meetings/${rowId}/status`, {
        workspace_id: workspaceId,
        status: statusMap[newStatus],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success((res.data as any)?.message ?? "Status updated");
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to update meeting status";
      console.error("Failed to update meeting status:", err);
      toast.error(msg);
      // Revert on failure
      setRowStatuses(prev => ({ ...prev, [rowId]: rowStatuses[rowId] ?? "Pending" }));
    }
  };

  const handleCreated = async (_form: MeetingForm) => {
    await fetchMeetings(startDate, endDate);
  };

  /** Called by CreateMeetingModal after a successful PUT (Save Changes) */
  const handleSaved = async () => {
    // If the meeting was Pending when opened, auto-mark it as Completed
    if (pendingRowId) {
      await handleStatusChange(pendingRowId, "Completed");
      setPendingRowId(null);
    }
    // Always re-fetch latest data after saving
    await fetchMeetings(startDate, endDate);
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
            <button
              key={t.id}
              onClick={() => {
                setViewTab(t.id);
                fetchMeetings(startDate, endDate);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${viewTab === t.id ? "bg-white dark:bg-[#0d1520] text-[#111928] dark:text-white shadow-sm border border-[#E6EBF1] dark:border-[#1F2A37]" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {viewTab === "table" && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LuLoader className="animate-spin text-[#5750F1]" size={24} />
            <p className="mt-2 text-sm text-[#9CA3AF]">Loading meetings...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-red-500">{fetchError}</p>
            <button onClick={() => fetchMeetings(startDate, endDate)} className="mt-3 text-xs text-[#5750F1] hover:underline">Retry</button>
          </div>
        ) : (
          <MeetingTable
            rows={tableRows}
            onAddMeeting={() => { setSelectedMeeting(null); setShowModal(true); }}
            showCompleted={showCompleted}
            onToggleShowCompleted={() => setShowCompleted(p => !p)}
            onNameClick={handleNameClick}
            rowStatuses={rowStatuses}
            onStatusChange={handleStatusChange}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            onDone={() => fetchMeetings(startDate, endDate)}
            onClear={() => {
              const s = new Date(now.getFullYear(), now.getMonth(), 1);
              const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setStartDate(s);
              setEndDate(e);
              fetchMeetings(s, e);
            }}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )
      )}

      {/* Calendar view */}
      {viewTab === "calendar" && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => { setSelectedMeeting(null); setShowModal(true); }} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors">
              <LuPlus size={13} />Add Meeting
            </button>
          </div>
          {/* Spinner overlay — rendered on top, MeetingCalendar stays mounted to avoid remount loop */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10">
              <LuLoader className="animate-spin text-[#5750F1]" size={24} />
              <p className="mt-2 text-sm text-[#9CA3AF]">Loading meetings...</p>
            </div>
          )}
          <div className={loading ? "hidden" : undefined}>
            <MeetingCalendar
              meetings={rawMeetings}
              onMonthChange={async (start, end) => {
                setStartDate(start);
                setEndDate(end);
                await fetchMeetings(start, end);
              }}
              onEventClick={(apiMeeting) => {
                // Convert APIMeeting → MeetingRow via same mapper used by the table
                handleNameClick(mapApiMeeting(apiMeeting));
              }}
            />
          </div>
        </div>
      )}

      {/* Confirmation modal — shown after "Save Changes" on a Pending meeting */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => { setShowConfirm(false); }} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
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
                  onClick={() => { setShowConfirm(false); }}
                  className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-semibold text-[#374151] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowConfirm(false); handleSaved(); }}
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
        onClose={() => { setShowModal(false); setPendingRowId(null); setIsDetailLoading(false); }}
        onCreated={handleCreated}
        onSaved={handleSaved}
        onSaveConfirm={pendingRowId ? () => { setShowModal(false); setShowConfirm(true); } : undefined}
        initialData={selectedMeeting}
        isDetailLoading={isDetailLoading}
      />
    </div>
  );
}