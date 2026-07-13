"use client";

import { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuClipboardCheck, LuUsers, LuShieldCheck, LuArrowUpDown, LuArrowUp, LuArrowDown, LuPlus } from "react-icons/lu";
import { RxDragHandleDots2 } from "react-icons/rx";
import MyTeamPanel from "./my-team/MyTeamPanel";
import CheckIn from "./checkin";
import ActionDrawer, { type DrawerRow } from "./ActionDrawer";
import { useDashboardTab } from "@/context/DashboardTabContext";

/* --- Types ----------------------------------------------------------- */
interface CaptureRow {
  id: string;
  action: string;
  intendedOutcome: string;
  status: string;
  due: string;
  accountable: string;
  linkTo: string;
  completed: boolean;
}

/* --- Dummy Data ------------------------------------------------------ */
const DUMMY_DATA: CaptureRow[] = [
  { id: "1", action: "Review Q2 OKRs with leadership",        intendedOutcome: "Align team on goals",               status: "In Progress", due: "2026-06-30", accountable: "Manish U.",  linkTo: "Planning",   completed: false },
  { id: "2", action: "Set up weekly accountability check-in",  intendedOutcome: "Improve team commitment rate",     status: "Done",        due: "2026-06-20", accountable: "Sarah K.",  linkTo: "Meetings",   completed: true  },
  { id: "3", action: "Define team KPIs for July",              intendedOutcome: "Clear performance benchmarks",     status: "Todo",        due: "2026-07-01", accountable: "Raj P.",    linkTo: "Planning",   completed: false },
  { id: "4", action: "Prepare onboarding doc for new hire",    intendedOutcome: "Faster ramp-up time",              status: "In Progress", due: "2026-06-28", accountable: "Lisa T.",   linkTo: "Promises",   completed: false },
  { id: "5", action: "Audit existing promise tracker",         intendedOutcome: "Identify missed commitments",      status: "Todo",        due: "2026-07-05", accountable: "Manish U.", linkTo: "Promises",   completed: false },
  { id: "6", action: "Schedule mission debrief meeting",       intendedOutcome: "Lessons learned documented",       status: "Done",        due: "2026-06-18", accountable: "Chris M.",  linkTo: "Meetings",   completed: true  },
  { id: "7", action: "Update dashboard design tokens",         intendedOutcome: "Consistent UI across modules",     status: "In Progress", due: "2026-06-27", accountable: "Sarah K.",  linkTo: "Dashboard",  completed: false },
  { id: "8", action: "Create monthly promise summary report",  intendedOutcome: "Visibility into promise health",   status: "Todo",        due: "2026-07-10", accountable: "Raj P.",    linkTo: "Promises",   completed: false },
  { id: "9", action: "Run first performance session",       intendedOutcome: "Strategic alignment confirmed",   status: "Todo",        due: "2026-07-08", accountable: "Manish U.", linkTo: "Mission",    completed: false },
  { id: "10", action: "Finalize meeting cadence schedule",     intendedOutcome: "Consistent team touchpoints",     status: "In Progress", due: "2026-06-29", accountable: "Lisa T.",   linkTo: "Meetings",   completed: false },
  { id: "11", action: "Write ADE onboarding guide",            intendedOutcome: "Self-serve onboarding for users", status: "Todo",        due: "2026-07-15", accountable: "Chris M.",  linkTo: "Planning",   completed: false },
  { id: "12", action: "Validate resizable table behavior",     intendedOutcome: "Smooth UX for power users",       status: "In Progress", due: "2026-06-26", accountable: "Sarah K.",  linkTo: "Dashboard",  completed: false },
];

/* --- Status Badge ---------------------------------------------------- */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Done":        "bg-green-500/10 text-green-500 border-green-500/20",
    "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Todo":        "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? styles["Todo"]}`}>
      {status}
    </span>
  );
}

/* --- Toggle ---------------------------------------------------------- */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${checked ? "bg-[#5750F1]" : "bg-[#374151]"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

/* --- Quick Access Card ----------------------------------------------- */
function QuickCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#1a2332] p-4 text-left w-full hover:border-[#5750F1]/40 transition-all duration-200 group">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F3F4F6] dark:bg-[#0d1520] group-hover:border-[#5750F1]/30 transition-colors duration-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[#111928] dark:text-white">{title}</p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">{subtitle}</p>
      </div>
    </button>
  );
}

/* --- Column definitions (module-level to avoid re-creation) ------- */
const columnHelper = createColumnHelper<CaptureRow>();

let openDrawerCb: ((row: DrawerRow) => void) | null = null;

const columns = [
  columnHelper.accessor("action", {
    header: "Action",
    size: 260,
    minSize: 120,
    cell: (info) => (
      <button
        onClick={() => openDrawerCb?.(info.row.original as DrawerRow)}
        className="text-left cursor-pointer text-[12px] text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors w-full"
      >
        {info.getValue() || <span className="text-[#9CA3AF]">+ Add action...</span>}
      </button>
    ),
  }),
  columnHelper.accessor("intendedOutcome", {
    header: "Intended Outcome",
    size: 220,
    minSize: 100,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 120,
    minSize: 80,
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("due", {
    header: "Due",
    size: 110,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("accountable", {
    header: "Accountable",
    size: 130,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("linkTo", {
    header: "To Whom",
    size: 110,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#5750F1] dark:text-[#7c78f3] underline-offset-2 hover:underline cursor-pointer">
        {info.getValue() || "—"}
      </span>
    ),
  }),
];

/* --- Row model factories (module-level — stable references) ------- */
const coreRowModel = getCoreRowModel();
const sortedRowModel = getSortedRowModel();

/* --- Main Component -------------------------------------------------- */
export default function DashboardSection() {
  const user = useSelector((state: any) => state.user?.user);
  const allowedRoles = ["superadmin", "Team Leader", "Admin"];
  const canViewTeam = user && allowedRoles.includes(user.role);

  const [data, setData] = useState<CaptureRow[]>(DUMMY_DATA);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showMyTeam, setShowMyTeam] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DrawerRow | null>(null);
  const { setActiveTab } = useDashboardTab();

  // Provide the open-drawer callback to the module-level column definition
  openDrawerCb = setSelectedRow;

  const visibleData = useMemo(
    () => (showCompleted ? data : data.filter((r) => !r.completed)),
    [data, showCompleted]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    const newRow: DrawerRow = {
      id: crypto.randomUUID(),
      action: "",
      intendedOutcome: "",
      status: "Todo",
      due: "",
      accountable: "",
      linkTo: "",
    };
    setSelectedRow(newRow);
  }, []);

  const table = useReactTable({
    data: visibleData,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
  });

  if (showMyTeam) {
    return <MyTeamPanel onClose={() => setShowMyTeam(false)} />;
  }

  if (showCheckIn) {
    return <CheckIn onClose={() => setShowCheckIn(false)} />;
  }

  return (
    <div className="animate-fade-in">
      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#111928] dark:text-white">ADE Dashboard</h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Accountability Driven Execution overview</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickCard 
          icon={<LuClipboardCheck size={20} className="text-[#5750F1]" />} 
          title="Check In"  
          subtitle="Daily check-in and status updates" 
          onClick={() => setShowCheckIn(true)}
        />
        {canViewTeam && (
          <button
            onClick={() => setShowMyTeam(true)}
            className="flex items-center gap-3 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#1a2332] p-4 text-left w-full hover:border-[#5750F1]/40 transition-all duration-200 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F3F4F6] dark:bg-[#0d1520] group-hover:border-[#5750F1]/30 transition-colors duration-200">
              <LuUsers size={20} className="text-[#5750F1]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight text-[#111928] dark:text-white">My Team</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">View your team</p>
            </div>
          </button>
        )}
        <button
          onClick={() => setActiveTab("promises")}
          className="flex items-center gap-3 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#1a2332] p-4 text-left w-full hover:border-[#5750F1]/40 transition-all duration-200 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F3F4F6] dark:bg-[#0d1520] group-hover:border-[#5750F1]/30 transition-colors duration-200">
            <LuShieldCheck size={20} className="text-[#5750F1]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-[#111928] dark:text-white">Promises</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">View and manage performance promises</p>
          </div>
        </button>
      </div>

      {/* Capture Tool */}
      <section className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111928] dark:text-white">Capture Tool</h2>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Drop in actions, then move them to a real promise / deliverable / pathway.
            </p>
          </div>
          {/* <div className="flex items-center gap-3">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 bg-[#111928] dark:bg-white text-white dark:text-[#111928] text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <LuPlus size={13} />
              New note
            </button>
          </div> */}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}
            className="border-collapse"
          >
            {/* Column Headers */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#F3F4F6] dark:bg-[#0a0f1a]">
                  {/* Checkbox col */}
                  <th className="w-8 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    <span className="sr-only">Select</span>
                  </th>
                  {/* Drag col */}
                  <th className="w-5 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]" />

                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize(), position: "relative" }}
                      className="px-3 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37] text-left select-none"
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

                      {/* Resize handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-[4px] cursor-col-resize select-none touch-none transition-colors ${
                          header.column.getIsResizing()
                            ? "bg-[#5750F1]"
                            : "bg-transparent hover:bg-[#5750F1]/40"
                        }`}
                      />
                    </th>
                  ))}
                  {/* Options col */}
                  <th className="w-8 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]" />
                </tr>
              ))}
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
              {table.getRowModel().rows.map((row) => {
                const completed = row.original.completed;
                return (
                  <tr
                    key={row.id}
                    className="group hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100"
                  >
                    {/* Checkbox */}
                    <td className="w-8 px-3 py-2">
                      <button
                        onClick={() => toggleSelected(row.original.id)}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-150 ${
                          selectedIds.has(row.original.id)
                            ? "border-[#5750F1] bg-[#5750F1]"
                            : "border-[#D1D5DB] dark:border-[#374151] hover:border-[#5750F1]"
                        }`}
                        aria-label={selectedIds.has(row.original.id) ? "Deselect" : "Select"}
                      >
                        {selectedIds.has(row.original.id) && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </td>
                    {/* Drag handle */}
                    <td className="w-5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RxDragHandleDots2 size={13} className="text-[#9CA3AF]" />
                    </td>

                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`px-3 py-2 ${completed ? "opacity-50" : ""}`}
                      >
                        <div className={completed ? "line-through" : ""}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    ))}

                    <td className="w-8 py-2 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors text-xs">
                        ⋮
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </section>

      {/* Action edit drawer */}
      <ActionDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onSave={(updated) => {
          setData(prev => {
            const exists = prev.some(r => r.id === updated.id);
            if (exists) {
              return prev.map(r => r.id === updated.id ? { ...r, ...updated } : r);
            }
            // New row — only add to table on save
            return [...prev, { ...updated, completed: false }];
          });
        }}
        onDelete={(id) => {
          setData(prev => prev.filter(r => r.id !== id));
        }}
      />
    </div>
  );
}