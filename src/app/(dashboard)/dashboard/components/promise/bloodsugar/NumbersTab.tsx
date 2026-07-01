"use client";

import { useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuArrowUpDown, LuArrowUp, LuArrowDown, LuPencil, LuX } from "react-icons/lu";
import { RxDragHandleDots2 } from "react-icons/rx";
import ActionDrawer, { type DrawerRow } from "../../ActionDrawer";

/* --- Types ----------------------------------------------------------- */
interface ActionRow {
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
const WEEKLY_DATA = [
  { week: "Week 1", amount: 2000 },
  { week: "Week 2", amount: 5000 },
  { week: "Week 3", amount: 10000 },
  { week: "Week 4", amount: 15000 },
  { week: "Week 5 (2)", amount: 8000 },
];
const TOTAL = 40000;

const INITIAL_ACTIONS: ActionRow[] = [
  {
    id: "1",
    action: "10 hook/visual/script variants from top 3 angles",
    intendedOutcome: "Identify top performing creative format",
    status: "In Progress",
    due: "2026-06-30",
    accountable: "Yash Poonia",
    linkTo: "Mukesh Kumar",
    completed: false,
  },
  {
    id: "2",
    action: "Top 3 angles ( Existing Winner , SPY top 2 angles which ar...",
    intendedOutcome: "Validate angle performance vs control",
    status: "Todo",
    due: "2026-06-28",
    accountable: "Yash Poonia",
    linkTo: "Mukesh Kumar",
    completed: false,
  },
];

/* --- Helpers --------------------------------------------------------- */
function fmt(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/* --- Status Badge ---------------------------------------------------- */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Done":        "bg-green-500/10 text-green-500 border-green-500/20",
    "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Todo":        "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
    "Planned":     "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? styles["Todo"]}`}>
      {status}
    </span>
  );
}

/* --- Column definitions (module-level) ------------------------------ */
const colHelper = createColumnHelper<ActionRow>();

let openActionDrawer: ((row: ActionRow) => void) | null = null;

const columns = [
  colHelper.accessor("action", {
    header: "Action",
    size: 260,
    minSize: 120,
    cell: (info) => (
      <button
        onClick={() => openActionDrawer?.(info.row.original)}
        className="text-left cursor-pointer text-[12px] text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors w-full"
      >
        {info.getValue() || <span className="text-[#9CA3AF]">+ Add action...</span>}
      </button>
    ),
  }),
  colHelper.accessor("intendedOutcome", {
    header: "Intended Outcome",
    size: 220,
    minSize: 100,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  colHelper.accessor("status", {
    header: "Status",
    size: 120,
    minSize: 80,
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  colHelper.accessor("due", {
    header: "Due",
    size: 110,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  colHelper.accessor("accountable", {
    header: "Accountable",
    size: 130,
    minSize: 80,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  colHelper.accessor("linkTo", {
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

const coreModel = getCoreRowModel();
const sortedModel = getSortedRowModel();

/* --- Edit distribution modal ---------------------------------------- */
function EditDistributionModal({
  open, onClose, weeks, onSave,
}: {
  open: boolean;
  onClose: () => void;
  weeks: { week: string; amount: number }[];
  onSave: (values: number[]) => void;
}) {
  const [values, setValues] = useState(weeks.map((w) => w.amount));

  const weeklySum = values.reduce((a, b) => a + b, 0);
  const remaining = TOTAL - weeklySum;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50" onClick={onClose} />}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white dark:bg-[#111928] shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-6 pt-8 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div>
            <h2 className="text-lg font-bold text-[#111928] dark:text-white">Edit Weekly Distribution</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">For: Performance Promise</p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors mt-1">
            <LuX size={18} />
          </button>
        </div>
        <div className="mx-6 mt-5 mb-6 rounded-lg bg-[#F3F4F6] dark:bg-[#1a2332] border border-[#E6EBF1] dark:border-[#1F2A37] divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
          <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Net Promise</span><span className="text-sm font-semibold text-[#111928] dark:text-white">{fmt(TOTAL)}</span></div>
          <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Weekly Sum</span><span className="text-sm font-semibold text-[#111928] dark:text-white">{fmt(weeklySum)}</span></div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Remaining</span>
            <span className={`text-sm font-semibold ${remaining === 0 ? "text-[#111928] dark:text-white" : remaining < 0 ? "text-red-500" : "text-green-500"}`}>{fmt(remaining)}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-4">
          {weeks.map((w, i) => (
            <div key={w.week} className="flex items-center gap-4">
              <span className="w-14 text-sm font-medium text-[#111928] dark:text-white shrink-0">{w.week}</span>
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-[#D1D5DB] dark:border-[#374151] px-3 py-2.5 bg-[#F9FAFB] dark:bg-[#1a2332] focus-within:border-[#5750F1]">
                <span className="text-[#9CA3AF] text-sm">$</span>
                <input type="number" value={values[i]} onChange={(e) => { const next = [...values]; next[i] = Number(e.target.value) || 0; setValues(next); }} className="flex-1 bg-transparent text-[#111928] dark:text-white text-sm outline-none" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 py-5 border-t border-[#E6EBF1] dark:border-[#1F2A37]">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-medium text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button onClick={() => { onSave(values); onClose(); }} className="flex-1 rounded-lg bg-[#5750F1] py-2.5 text-sm font-bold text-white hover:bg-[#4742d4] transition-colors">Save Changes</button>
        </div>
      </div>
    </>
  );
}

/* --- Actions Table --------------------------------------------------- */
function ActionsTable({
  data,
  onRowClick,
  onAddAction,
}: {
  data: ActionRow[];
  onRowClick: (row: ActionRow) => void;
  onAddAction: () => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: coreModel,
    getSortedRowModel: sortedModel,
  });

  return (
    <div className="overflow-x-auto">
      <table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }} className="border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-[#F3F4F6] dark:bg-[#0a0f1a]">
              <th className="w-8 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]"><span className="sr-only">Select</span></th>
              <th className="w-5 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]" />
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize(), position: "relative" }}
                  className="px-3 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37] text-left select-none"
                >
                  <div className="flex items-center gap-1 cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
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
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={`absolute right-0 top-0 h-full w-[4px] cursor-col-resize select-none touch-none transition-colors ${header.column.getIsResizing() ? "bg-[#5750F1]" : "bg-transparent hover:bg-[#5750F1]/40"}`}
                  />
                </th>
              ))}
              <th className="w-8 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]" />
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="group hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100">
              <td className="w-8 px-3 py-2">
                <button
                  onClick={() => toggleSelected(row.original.id)}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-150 ${selectedIds.has(row.original.id) ? "border-[#5750F1] bg-[#5750F1]" : "border-[#D1D5DB] dark:border-[#374151] hover:border-[#5750F1]"}`}
                  aria-label={selectedIds.has(row.original.id) ? "Deselect" : "Select"}
                >
                  {selectedIds.has(row.original.id) && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </td>
              <td className="w-5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <RxDragHandleDots2 size={13} className="text-[#9CA3AF]" />
              </td>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <td className="w-8 py-2 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors text-xs">⋮</button>
              </td>
            </tr>
          ))}
          {/* Add action row */}
          <tr className="hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors cursor-pointer" onClick={onAddAction}>
            <td className="w-8 px-3 py-2" />
            <td className="w-5 py-2" />
            <td colSpan={columns.length} className="px-3 py-2">
              <span className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-[#D1D5DB]">+ Add action...</span>
            </td>
            <td className="w-8 py-2" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function NumbersTab() {
  const [editOpen, setEditOpen] = useState(false);
  const [weeklyData, setWeeklyData] = useState(WEEKLY_DATA);
  const [collapsed, setCollapsed] = useState(false);
  const [actions, setActions] = useState<ActionRow[]>(INITIAL_ACTIONS);
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);

  openActionDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             row.due,
    accountable:     row.accountable,
    linkTo:          row.linkTo,
  });

  const handleAddAction = () => {
    setSelectedAction({
      id: crypto.randomUUID(),
      action: "",
      intendedOutcome: "",
      status: "Todo",
      due: "",
      accountable: "",
      linkTo: "",
    });
  };

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      {/* Weekly Breakdown */}
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
              <button onClick={() => setEditOpen(true)} className="text-[#9CA3AF] hover:text-[#5750F1] transition-colors" title="Edit weekly distribution">
                <LuPencil size={11} />
              </button>
            </div>
            <p className="text-sm font-bold text-[#111928] dark:text-white mt-0.5">{fmt(weeklyData.reduce((a, w) => a + w.amount, 0))}</p>
          </div>
        </div>
      </div>

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
            <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 border border-[#5750F1]/20">
              <span className="text-[#5750F1] text-xs">📋</span>
            </div>
            <span className="text-sm font-semibold text-[#111928] dark:text-white">Bruno Strategy on Catalog</span>
            <span className="rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 px-2 py-0.5 text-[10px] font-medium text-[#2563eb]">Active</span>
            <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">
              Bruno Strategy Identify winning creatives by iterating 2 proven Blood Sugar angles...
            </p>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              <span>👤 Yash Poonia</span>
              <span>📊 2</span>
              <span>📅 Jun 30</span>
            </div>
          </div>
        )}

        {/* Expanded view */}
        {!collapsed && (
          <>
            <div className="flex items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              <button onClick={() => setCollapsed(true)} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white mt-1 transition-colors" aria-label="Collapse">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                <span>👤 Yash Poonia</span>
                <span>📊 2</span>
                <span>📅 Jun 30</span>
              </div>
            </div>

            <ActionsTable
              data={actions}
              onRowClick={(row) => openActionDrawer?.(row)}
              onAddAction={handleAddAction}
            />
          </>
        )}
      </div>

      {/* Add Pathway button */}
      <button
        onClick={() => setSelectedAction({
          id: crypto.randomUUID(),
          action: "",
          intendedOutcome: "",
          status: "Planned",
          due: "",
          accountable: "",
          linkTo: "",
        })}
        className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
      >
        + Add Pathway
      </button>

      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        onClose={() => setSelectedAction(null)}
        onSave={(updated) => {
          setActions(prev => {
            const exists = prev.some(r => r.id === updated.id);
            if (exists) return prev.map(r => r.id === updated.id ? { ...r, ...updated } : r);
            return [...prev, { ...updated, completed: false }];
          });
          setSelectedAction(null);
        }}
        onDelete={(id) => {
          setActions(prev => prev.filter(r => r.id !== id));
          setSelectedAction(null);
        }}
      />
    </div>
  );
}
