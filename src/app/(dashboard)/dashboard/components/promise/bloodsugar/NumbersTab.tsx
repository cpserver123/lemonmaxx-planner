"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { LuPencil, LuX } from "react-icons/lu";
import ActionDrawer, { type DrawerRow } from "../../ActionDrawer";

/* --- Types ----------------------------------------------------------- */
interface ActionRow {
  id: string;
  num: number;
  action: string;
  intendedOutcome: string;
  status: string;
  signal: string;
  crossTeam: string;
  accountable: string;
  toWhom: string;
}

/* --- Dummy Data ------------------------------------------------------ */
const WEEKLY_DATA = [
  { week: "Week 1", amount: 2000 },
  { week: "Week 2", amount: 5000 },
  { week: "Week 3", amount: 10000 },
  { week: "Week 4", amount: 15000 },
  { week: "Week 5 (2)", amount: 8000 },
];
const TOTAL = 40000;

const ACTIONS: ActionRow[] = [
  {
    id: "1",
    num: 1,
    action: "10 hook/visual/script variants from top 3 angles",
    intendedOutcome: "",
    status: "OBSERVATION",
    signal: "",
    crossTeam: "",
    accountable: "Yash Poonia",
    toWhom: "Mukesh Kumar",
  },
  {
    id: "2",
    num: 2,
    action: "Top 3 angles ( Existing Winner , SPY top 2 angles which ar...",
    intendedOutcome: "",
    status: "OBSERVATION",
    signal: "",
    crossTeam: "",
    accountable: "Yash Poonia",
    toWhom: "Mukesh Kumar",
  },
];

/* --- Helpers --------------------------------------------------------- */
function fmt(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/* --- Column defs (module-level) -------------------------------------- */
const columnHelper = createColumnHelper<ActionRow>();

const columns = [
  columnHelper.accessor("num", {
    header: "",
    size: 40,
    minSize: 30,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#6B7280]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("action", {
    header: "Action",
    size: 300,
    minSize: 150,
    cell: (info) => (
      <button
        onClick={() => openActionDrawer?.(info.row.original)}
        className="flex items-center gap-1.5 text-left w-full hover:text-[#5750F1] transition-colors"
      >
        <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">&gt;</span>
        <span className="text-[12px] text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3]">{info.getValue()}</span>
      </button>
    ),
  }),
  columnHelper.accessor("intendedOutcome", {
    header: "Intended Outcome",
    size: 140,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue() || ""}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return null;
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 px-2 py-0.5 text-[10px] font-medium text-[#2563eb]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
          {v}
        </span>
      );
    },
  }),
  columnHelper.accessor("signal", {
    header: "Signal",
    size: 70,
    minSize: 50,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("crossTeam", {
    header: "Cross Team",
    size: 90,
    minSize: 60,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("accountable", {
    header: "Accountable",
    size: 120,
    minSize: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return null;
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-[#2563eb] flex items-center justify-center text-[9px] font-bold text-black shrink-0">
            {v.split(" ").map((w) => w[0]).join("")}
          </div>
          <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] truncate">{v}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("toWhom", {
    header: "To Whom",
    size: 120,
    minSize: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return null;
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-[#ec4899] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
            {v.split(" ").map((w) => w[0]).join("")}
          </div>
          <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] truncate">{v}</span>
        </div>
      );
    },
  }),
];

/* --- Module-level drawer callback ----------------------------------- */
let openActionDrawer: ((row: ActionRow) => void) | null = null;

const coreModel = getCoreRowModel();

/* --- Edit modal ----------------------------------------------------- */
function EditDistributionModal({
  open,
  onClose,
  weeks,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  weeks: { week: string; amount: number }[];
  onSave: (values: number[]) => void;
}) {
  const [values, setValues] = useState(weeks.map((w) => w.amount));

  /* reset if reopened */
  useEffect(() => {
    if (open) setValues(weeks.map((w) => w.amount));
  }, [open, weeks]);

  const weeklySum = values.reduce((a, b) => a + b, 0);
  const netPromise = TOTAL;
  const remaining = netPromise - weeklySum;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Slide panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white dark:bg-[#111928] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div>
            <h2 className="text-lg font-bold text-[#111928] dark:text-white">Edit Weekly Distribution</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">For: Performance Promise</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors mt-1"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Summary card */}
        <div className="mx-6 mt-5 mb-6 rounded-lg bg-[#F3F4F6] dark:bg-[#1a2332] border border-[#E6EBF1] dark:border-[#1F2A37] divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Net Promise</span>
            <span className="text-sm font-semibold text-[#111928] dark:text-white">{fmt(netPromise)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Weekly Sum</span>
            <span className="text-sm font-semibold text-[#111928] dark:text-white">{fmt(weeklySum)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Remaining</span>
            <span className={`text-sm font-semibold ${
              remaining === 0 ? "text-[#111928] dark:text-white" : remaining < 0 ? "text-red-500 dark:text-red-400" : "text-[#65a30d] dark:text-[#2563eb]"
            }`}>{fmt(remaining)}</span>
          </div>
        </div>

        {/* Week inputs */}
        <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-4">
          {weeks.map((w, i) => (
            <div key={w.week} className="flex items-center gap-4">
              <span className="w-14 text-sm font-medium text-[#111928] dark:text-white shrink-0">{w.week}</span>
              <div className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 bg-[#F9FAFB] dark:bg-[#1a2332] transition-colors ${
                i === 0
                  ? "border-[#65a30d] dark:border-[#2563eb]"
                  : "border-[#D1D5DB] dark:border-[#374151] focus-within:border-[#5750F1] dark:focus-within:border-[#5750F1]"
              }`}>
                <span className="text-[#9CA3AF] dark:text-[#9CA3AF] text-sm">$</span>
                <input
                  type="number"
                  value={values[i]}
                  onChange={(e) => {
                    const next = [...values];
                    next[i] = Number(e.target.value) || 0;
                    setValues(next);
                  }}
                  className="flex-1 bg-transparent text-[#111928] dark:text-white text-sm outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-5 border-t border-[#E6EBF1] dark:border-[#1F2A37]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-medium text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(values); onClose(); }}
            className="flex-1 rounded-lg bg-[#2563eb] py-2.5 text-sm font-bold text-black hover:bg-[#b5f03f] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );

}

export default function NumbersTab() {
  const [editOpen, setEditOpen] = useState(false);
  const [weeklyData, setWeeklyData] = useState(WEEKLY_DATA);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);

  openActionDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             "",
    accountable:     row.accountable,
    linkTo:          "",
  });

  const table = useReactTable({
    data: ACTIONS,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    getCoreRowModel: coreModel,
  });

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      {/* Weekly Breakdown — scrollable on mobile */}
      <div className="overflow-x-auto scrollbar-none -mx-0 mb-5">
        <div className="grid grid-cols-6 gap-px rounded-lg overflow-hidden border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#E6EBF1] dark:bg-[#1F2A37] min-w-[520px]">
          {weeklyData.map((w) => (
            <div key={w.week} className="bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2.5">
              <p className="text-[10px] text-[#6B7280] dark:text-[#6B7280] uppercase tracking-wide whitespace-nowrap">{w.week}</p>
              <p className="text-sm font-semibold text-[#111928] dark:text-white mt-0.5">{fmt(w.amount)}</p>
            </div>
          ))}
          <div className="bg-[#F3F4F6] dark:bg-[#122031] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#6B7280] dark:text-[#6B7280] uppercase tracking-wide">Total</p>
              <button
                onClick={() => setEditOpen(true)}
                className="text-[#9CA3AF] hover:text-[#5750F1] transition-colors"
                title="Edit weekly distribution"
              >
                <LuPencil size={11} />
              </button>
            </div>
            <p className="text-sm font-bold text-[#111928] dark:text-white mt-0.5">{fmt(weeklyData.reduce((a, w) => a + w.amount, 0))}</p>
          </div>
        </div>
      </div>

      {/* Edit distribution modal */}
      <EditDistributionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        weeks={weeklyData}
        onSave={(vals) => setWeeklyData(weeklyData.map((w, i) => ({ ...w, amount: vals[i] })))}
      />

      {/* Strategy Card */}
      <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] mb-5 overflow-hidden">

        {/* Collapsed view */}
        {collapsed && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer" onClick={() => setCollapsed(false)}>
            <button
              className="text-[#9CA3AF] dark:text-[#9CA3AF] transition-transform duration-200"
              aria-label="Expand strategy"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 dark:bg-[#5750F1]/20 border border-[#5750F1]/20 dark:border-[#5750F1]/30">
              <span className="text-[#5750F1] text-xs">📋</span>
            </div>
            <span className="text-sm font-semibold text-[#111928] dark:text-white">Bruno Strategy on Catalog</span>
            <span className="rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 px-2 py-0.5 text-[10px] font-medium text-[#65a30d] dark:text-[#2563eb]">Active</span>
            <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">
              Bruno Strategy Identify winning creatives by iterating 2 proven Blood Sugar angles into 10 hook/visual/script variants, achie...
            </p>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              <span className="flex items-center gap-1">👤 Yash Poonia</span>
              <span>📊 2</span>
              <span>📅 Jun 30</span>
              <span className="text-[#9CA3AF] dark:text-[#6B7280]">›</span>
            </div>
          </div>
        )}


        {/* Expanded view */}
        {!collapsed && (
          <>
            {/* Strategy Header */}
            <div className="flex items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              <button
                onClick={() => setCollapsed(true)}
                className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white mt-1 transition-colors"
                aria-label="Collapse strategy"
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5750F1]/10 border border-[#5750F1]/20">
                <span className="text-[#5750F1] text-sm">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Bruno Strategy on Catalog</h3>
                  <span className="rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 px-2 py-0.5 text-[10px] font-medium text-[#2563eb]">Active</span>
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">
                  Bruno Strategy Identify winning creatives by iterating 2 proven Blood Sugar angles into 10 hook/visual/script variants, achie...
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                <span className="flex items-center gap-1">👤 Yash Poonia</span>
                <span>📊 2</span>
                <span>📅 Jun 30</span>
                <button className="text-[#9CA3AF] hover:text-white">&gt;</button>
              </div>
            </div>

            {/* Actions Table */}
            <div className="overflow-x-auto">
              <table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }} className="border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                      <th className="w-8 px-3 py-1.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]" />
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize(), position: "relative" }}
                          className="px-2 py-1.5 text-left"
                        >
                          <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-[3px] cursor-col-resize select-none touch-none transition-colors ${
                              header.column.getIsResizing() ? "bg-[#5750F1]" : "bg-transparent hover:bg-[#5750F1]/40"
                            }`}
                          />
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                      <td className="w-8 px-3 py-2">
                        <div className="h-4 w-4 rounded border border-[#D1D5DB] dark:border-[#374151]" />
                      </td>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-2 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Add action row */}
                  <tr className="hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                    <td className="w-8 px-3 py-2" />
                    <td colSpan={columns.length} className="px-2 py-2">
                      <span className="text-[11px] text-[#9CA3AF] cursor-pointer hover:text-[#6B7280] dark:hover:text-[#D1D5DB]">
                        + Add action...
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Pathway button */}
      <button className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors">
        + Add Pathway
      </button>
      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        onClose={() => setSelectedAction(null)}
        onSave={() => setSelectedAction(null)}
        onDelete={() => setSelectedAction(null)}
      />
    </div>
  );
}
