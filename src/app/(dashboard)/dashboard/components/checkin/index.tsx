"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { LuArrowUpDown, LuArrowUp, LuArrowDown, LuArrowLeft } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";

/* --- Types ----------------------------------------------------------- */
interface CheckInRow {
  id: string;
  date: string;
  attendanceStatus: string;
  dayStatus: string;
}

/* --- Dummy Data ------------------------------------------------------ */
const DUMMY_DATA: CheckInRow[] = [
  { id: "1", date: "2026-07-13", attendanceStatus: "Present", dayStatus: "Productive" },
  { id: "2", date: "2026-07-12", attendanceStatus: "Present", dayStatus: "Normal" },
  { id: "3", date: "2026-07-11", attendanceStatus: "Half Day", dayStatus: "Slow" },
  { id: "4", date: "2026-07-10", attendanceStatus: "Absent", dayStatus: "—" },
  { id: "5", date: "2026-07-09", attendanceStatus: "Present", dayStatus: "Productive" },
];

/* --- Status Badges --------------------------------------------------- */
function AttendanceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Present":  "bg-green-500/10 text-green-500 border-green-500/20",
    "Absent":   "bg-red-500/10 text-red-500 border-red-500/20",
    "Half Day": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
      {status}
    </span>
  );
}

function DayStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Productive": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Normal":     "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
    "Slow":       "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  if (status === "—") return <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
      {status}
    </span>
  );
}

/* --- Column definitions ---------------------------------------------- */
const columnHelper = createColumnHelper<CheckInRow>();

const columns = [
  columnHelper.accessor("date", {
    header: "Date",
    size: 150,
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
  columnHelper.accessor("dayStatus", {
    header: "Day Status",
    size: 200,
    cell: (info) => <DayStatusBadge status={info.getValue()} />,
  }),
];

export default function CheckIn({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [data] = useState<CheckInRow[]>(DUMMY_DATA);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#1a2332] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
            >
              <LuArrowLeft size={16} />
            </button>
          )}
          <h1 className="text-xl font-bold text-[#111928] dark:text-white">Check In</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5750F1]/10 text-[#5750F1] font-bold text-base">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111928] dark:text-white leading-tight">{user?.name || "Unknown User"}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              ID: {user?.id ? `EMP-${String(user.id).padStart(3, "0")}` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <section className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
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
            <tbody className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    No check-in records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}