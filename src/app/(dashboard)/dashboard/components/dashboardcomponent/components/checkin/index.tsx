"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  LuArrowUpDown,
  LuArrowUp,
  LuArrowDown,
  LuArrowLeft,
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
  LuCircleAlert,
  LuInbox,
} from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import api from "@/app/utils/axios";

/* --- Constants ------------------------------------------------------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ROW_OPTIONS = [10, 25, 50, 100];

/* --- Types ----------------------------------------------------------- */
interface CheckInRow {
  id: string;
  date: string;
  attendanceStatus: string;
}

interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
}

interface AttendanceUser {
  user_id: number;
  user_name: string;
  user_email: string;
  present_days: number;
  absent_days: number;
  attendance: AttendanceRecord[];
}

interface AttendanceResponse {
  success: boolean;
  message: string;
  data: {
    workspace_id: number;
    year: number;
    month: number;
    total_days: number;
    users: AttendanceUser[];
  };
}

/* --- Month Calendar Picker ------------------------------------------- */
function MonthCalendarPicker({
  selectedMonth,
  selectedYear,
  onApply,
  onClear,
  onClose,
}: {
  selectedMonth: number | null;
  selectedYear: number;
  onApply: (month: number, year: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState<number | null>(selectedMonth);

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-[260px] rounded-2xl border border-[#1F2A37] bg-[#0d1520] shadow-2xl overflow-hidden animate-fade-in">
      {/* Year navigation */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1F2A37] transition-colors"
        >
          <LuChevronLeft size={16} />
        </button>
        <span className="text-base font-bold text-white">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1F2A37] transition-colors"
        >
          <LuChevronRight size={16} />
        </button>
      </div>

      {/* Selected label */}
      <p className="px-5 pb-2 text-xs text-[#9CA3AF]">
        {tempMonth !== null ? "1 month selected" : "No month selected"}
      </p>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {MONTHS.map((m, i) => {
          const isSelected = tempMonth === i;
          return (
            <button
              key={m}
              onClick={() => setTempMonth(i)}
              className={`relative flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150 ${
                isSelected
                  ? "bg-[#5750F1] text-white shadow-lg shadow-[#5750F1]/30"
                  : "text-[#9CA3AF] hover:bg-[#1F2A37] hover:text-white"
              }`}
            >
              {m}
              {isSelected && (
                <LuCheck size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-[#1F2A37] px-4 py-3">
        <button
          onClick={() => {
            setTempMonth(null);
            onClear();
          }}
          className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => {
            if (tempMonth !== null) {
              onApply(tempMonth, year);
            }
            onClose();
          }}
          className="rounded-lg bg-[#5750F1] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#4540d4] transition-colors shadow-md shadow-[#5750F1]/30"
        >
          Done
        </button>
      </div>
    </div>
  );
}

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

/* --- Status Badge ---------------------------------------------------- */
function AttendanceBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles: Record<string, string> = {
    present: "bg-green-500/10 text-green-500 border-green-500/20",
    absent: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        styles[normalized] ?? "bg-gray-500/10 text-gray-500 border-gray-500/20"
      }`}
    >
      {label}
    </span>
  );
}

/* --- Skeleton row ---------------------------------------------------- */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3 w-24 rounded bg-[#1F2A37]" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-[#1F2A37]" />
      </td>
    </tr>
  );
}

/* --- Column definitions ---------------------------------------------- */
const columnHelper = createColumnHelper<CheckInRow>();

const columns = [
  columnHelper.accessor("date", {
    header: "Date",
    size: 200,
    cell: (info) => (
      <span className="text-[12px] font-medium text-[#111928] dark:text-white">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("attendanceStatus", {
    header: "Attendance Status",
    size: 200,
    cell: (info) => <AttendanceBadge status={info.getValue()} />,
  }),
];

/* --- Main Component -------------------------------------------------- */
export default function CheckIn({ onClose }: { onClose?: () => void }) {
  const { user, token } = useAuth();
  const [data, setData] = useState<CheckInRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  /* Pagination state */
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* Calendar state — lazy init so new Date() only runs once */
  const [selectedMonth, setSelectedMonth] = useState<number | null>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  /* Stable primitives extracted from user to avoid infinite loop in useCallback */
  const workspaceId = Number((user as Record<string, unknown>)?.workspace_id ?? 1);
  const userId = Number((user as Record<string, unknown>)?.id ?? 0);

  /* --- Fetch attendance ---------------------------------------------- */
  const fetchAttendance = useCallback(
    async (month: number, year: number) => {
      if (!token) return;

      setLoading(true);
      setError(null);
      setCurrentPage(1); // always reset to page 1 on new fetch

      try {
        const res = await api.get<AttendanceResponse>(
          "/api/v1/planner/attendance",
          {
            params: {
              workspace_id: workspaceId,
              year,
              month: month + 1,
            },
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = res.data;

        if (!json.success) {
          throw new Error(json.message || "Failed to fetch attendance");
        }

        /* Find the logged-in user's record; fall back to first if not matched */
        const matched =
          json.data.users.find((u) => u.user_id === userId) ??
          json.data.users[0] ??
          null;

        if (!matched) {
          setData([]);
          return;
        }

        setData(
          matched.attendance.map((a) => ({
            id: a.date,
            date: a.date,
            attendanceStatus: a.status,
          }))
        );
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err instanceof Error ? err.message : "Something went wrong");
        setError(msg);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    // stable primitive deps — no object references
    [token, workspaceId, userId]
  );

  /* Fetch on mount and whenever month/year changes */
  useEffect(() => {
    if (selectedMonth !== null) {
      fetchAttendance(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear, fetchAttendance]);

  /* Reset to page 1 when rows-per-page selector changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  /* Close calendar picker on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  /* Paginate the full data array client-side */
  const totalRows = data.length;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, currentPage, rowsPerPage]);

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const calendarLabel =
    selectedMonth !== null
      ? `${MONTH_NAMES[selectedMonth].slice(0, 3)} ${selectedYear}`
      : "Select Month";

  /* One row height ≈ 45px; show 10 rows = 450px max for the tbody */
  const ROW_HEIGHT = 45;
  const MAX_VISIBLE_ROWS = 10;
  const tbodyMaxHeight = ROW_HEIGHT * MAX_VISIBLE_ROWS;

  return (
    <div className="animate-fade-in">
      {/* Header — wraps cleanly on mobile */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        {/* Left: back button + title */}
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#1a2332] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
            >
              <LuArrowLeft size={16} />
            </button>
          )}
          <h1 className="text-xl font-bold text-[#111928] dark:text-white whitespace-nowrap">Check In</h1>
        </div>

        {/* Right: calendar picker + user info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Month Calendar Trigger */}
          <div className="relative" ref={calendarRef}>
            <button
              id="checkin-month-picker-btn"
              onClick={() => setCalendarOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl border border-[#1F2A37] bg-[#0d1520] px-2.5 py-2 text-xs sm:text-sm font-semibold text-white hover:border-[#5750F1] hover:bg-[#1a2332] transition-all duration-200 shadow-sm"
            >
              <LuCalendar size={14} className="text-[#5750F1] shrink-0" />
              <span className="whitespace-nowrap">{calendarLabel}</span>
              <LuChevronLeft
                size={13}
                className={`text-[#9CA3AF] transition-transform duration-200 shrink-0 ${calendarOpen ? "-rotate-90" : "rotate-180"}`}
              />
            </button>

            {calendarOpen && (
              <MonthCalendarPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onApply={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
                onClear={() => setSelectedMonth(null)}
                onClose={() => setCalendarOpen(false)}
              />
            )}
          </div>

          {/* User avatar + name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5750F1]/10 text-[#5750F1] font-bold text-sm">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-[#111928] dark:text-white leading-tight truncate max-w-[120px]">
                {user?.name || "Unknown User"}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 whitespace-nowrap">
                {(user as Record<string, unknown>)?.id
                  ? `EMP-${String((user as Record<string, unknown>).id).padStart(3, "0")}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <LuCircleAlert size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Section */}
      <section className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        {/* Scrollable table wrapper — thead is sticky, tbody scrolls */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#F3F4F6] dark:bg-[#0a0f1a]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37] text-left select-none"
                    >
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getIsSorted() === "asc" ? (
                          <LuArrowUp size={10} className="text-[#5750F1]" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <LuArrowDown size={10} className="text-[#5750F1]" />
                        ) : (
                          <LuArrowUpDown size={10} className="text-[#9CA3AF] opacity-50" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>

          {/* Scrollable body — capped at 10 rows height */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${tbodyMaxHeight}px` }}
          >
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
                {/* Loading skeletons */}
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                {/* Data rows */}
                {!loading &&
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Empty state */}
                {!loading && table.getRowModel().rows.length === 0 && !error && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-10 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <LuInbox size={20} className="opacity-40" />
                        <span>No attendance records found for this month.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && totalRows > 0 && (
          <PaginationFooter
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onRowsPerPageChange={setRowsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </section>
    </div>
  );
}