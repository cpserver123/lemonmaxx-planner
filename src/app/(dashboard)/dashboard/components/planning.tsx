"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
  type ExpandedState,
} from "@tanstack/react-table";
import { LuArrowUpDown, LuArrowUp, LuArrowDown, LuChevronRight, LuChevronDown, LuChevronLeft, LuLayoutGrid, LuCalendar, LuFileText } from "react-icons/lu";
import PlanSubmissionDrawer from "./PlanSubmissionDrawer";

/* --- Types ----------------------------------------------------------- */
interface PlanningRow {
  id: string;
  category: string;           // "Blood Sugar" | "Memory" | "Weight Loss"
  platform: string;           // "Meta" | "Taboola"
  actuals: number | null;
  promise: number | null;
  perfCeiling: number | null;
  perfDelta: number | null;
  deltaLoss: number | null;
  netPromise: number | null;
  resources: string;
  isSubTotal?: boolean;
  isPromiseNote?: boolean;
  promiseNote?: string;
  promiseDate?: string;
  hasExpand?: boolean;
  expandCount?: number;
  subRows?: PlanningRow[];
}

/* --- Dummy Data ------------------------------------------------------ */
const PLANNING_DATA: PlanningRow[] = [
  // Blood Sugar
  { id: "bs-meta",    category: "Blood Sugar", platform: "Meta",      actuals: 34185,   promise: 30000,  perfCeiling: 20000,  perfDelta: 10000,  deltaLoss: 10000,  netPromise: 40000,  resources: "Arun, Satish, Kapil, Nityashish, Yash, Sahil...", hasExpand: true, expandCount: 1 },
  { id: "bs-meta-note", category: "Blood Sugar", platform: "",        actuals: null,    promise: null,   perfCeiling: null,   perfDelta: null,   deltaLoss: null,   netPromise: null,   resources: "", isPromiseNote: true, promiseNote: "Drive Blood Sugar revenue on Meta by scaling the top 2 proven angles across 10 hook/visual/script variants, hitting ≥$20K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026.", promiseDate: "Jun 30, 2026" },
  { id: "bs-sub",     category: "Blood Sugar", platform: "Sub Total",  actuals: 34185,  promise: 30000,  perfCeiling: 20000,  perfDelta: 10000,  deltaLoss: 10000,  netPromise: 40000,  resources: "", isSubTotal: true },

  // Memory
  { id: "mem-tab",    category: "Memory",      platform: "Taboola",   actuals: 1744,    promise: 10000,  perfCeiling: null,   perfDelta: 10000,  deltaLoss: 5000,   netPromise: 15000,  resources: "komal", hasExpand: true, expandCount: 1 },
  { id: "mem-note",   category: "Memory",      platform: "",          actuals: null,    promise: null,   perfCeiling: null,   perfDelta: null,   deltaLoss: null,   netPromise: null,   resources: "", isPromiseNote: true, promiseNote: "I will establish \"MediaGo\" as a validated platform by completing testing → platform setup → baseline test campaign → Go/No-Go decision, with documented learnings to inform July scale-or-kill decision, by June 30, 2026.", promiseDate: "Jun 29, 2026" },
  { id: "mem-meta",   category: "Memory",      platform: "Meta",      actuals: 101182,  promise: 106000, perfCeiling: 70000,  perfDelta: 30000,  deltaLoss: 20000,  netPromise: 120000, resources: "Arun, Satish, Kapil, Nityashish, Yash, Sahil", hasExpand: true, expandCount: 1 },
  { id: "mem-meta-note", category: "Memory",   platform: "",          actuals: null,    promise: null,   perfCeiling: null,   perfDelta: null,   deltaLoss: null,   netPromise: null,   resources: "", isPromiseNote: true, promiseNote: "Scale Memory on Meta by testing 3 proven VSL angles across catalog and standard placements, achieving ≥$70K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026.", promiseDate: "Jun 30, 2026" },
  { id: "mem-sub",    category: "Memory",      platform: "Sub Total",  actuals: 152926, promise: 116000, perfCeiling: 70000,  perfDelta: 40000,  deltaLoss: 25000,  netPromise: 135000, resources: "", isSubTotal: true },

  // Weight Loss
  { id: "wl-tab",     category: "Weight Loss", platform: "Taboola",   actuals: null,    promise: 10000,  perfCeiling: null,   perfDelta: 10000,  deltaLoss: 5000,   netPromise: 15000,  resources: "Yash, komal", hasExpand: true, expandCount: 1 },
  { id: "wl-tab-note", category: "Weight Loss", platform: "",         actuals: null,    promise: null,   perfCeiling: null,   perfDelta: null,   deltaLoss: null,   netPromise: null,   resources: "", isPromiseNote: true, promiseNote: "Establish Weight Loss on Taboola by completing platform onboarding, launching baseline test campaign, and delivering a Go/No-Go decision with documented learnings to guide July scale-or-kill decision, by Jun 30, 2026.", promiseDate: "Jun 30, 2026" },
  { id: "wl-meta",    category: "Weight Loss", platform: "Meta",      actuals: -82943,  promise: 30000,  perfCeiling: null,   perfDelta: 30000,  deltaLoss: 10000,  netPromise: 40000,  resources: "Arun, Satish, Kapil, komal", hasExpand: true, expandCount: 1 },
  { id: "wl-note",    category: "Weight Loss", platform: "",          actuals: null,    promise: null,   perfCeiling: null,   perfDelta: null,   deltaLoss: null,   netPromise: null,   resources: "", isPromiseNote: true, promiseNote: "Promise: I will make catalog testing profitable on Weight Loss / Meta by delivering 2 winning creatives through catalog distribution, achieving ≥30% ROI at ≥$10K spend with 5-day consistency, generating $10K additional GM ...", promiseDate: "Jun 28, 2026" },
  { id: "wl-sub",     category: "Weight Loss", platform: "Sub Total",  actuals: -82943, promise: 40000, perfCeiling: null,   perfDelta: 40000,  deltaLoss: 15000,  netPromise: 55000,  resources: "", isSubTotal: true },
];

const TOTALS = {
  actuals: 194168,
  promise: 180000,
  perfCeiling: 90000,
  perfDelta: 90000,
  deltaLoss: 50000,
  netPromise: 230000,
};

/* --- Helpers -------------------------------------------------------- */
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
  const neg = n < 0;
  const abs = Math.abs(n);
  const str = abs >= 1000 ? `$${abs.toLocaleString("en-US")}` : `$${abs}`;
  return neg ? `-${str}` : str;
}

/* --- VSL Dropdown --------------------------------------------------- */
function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-[#4B5563] dark:border-[#2563eb] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-[#2563eb] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
      >
        {value}
        <LuChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-md border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-lg py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  opt === value
                    ? "bg-[#5750F1]/10 text-[#5750F1]"
                    : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* --- Column defs (module-level) ------------------------------------- */
const columnHelper = createColumnHelper<PlanningRow>();

const planColumns = [
  columnHelper.accessor("platform", {
    header: "",
    size: 140,
    minSize: 100,
    cell: (info) => {
      const row = info.row.original;
      if (row.isSubTotal) return <span className="text-xs font-medium text-[#4B5563] dark:text-[#9CA3AF]">Sub Total</span>;
      if (row.isPromiseNote) return null;
      // NOTE: toggleRow is injected via table meta — see CategoryTable
      const toggleRow = (info.table.options.meta as { toggleRow?: (id: string) => void } | undefined)?.toggleRow;
      const isExpanded = (info.table.options.meta as { expandedRows?: Set<string> } | undefined)?.expandedRows?.has(row.id);
      return (
        <div className="flex items-center gap-1.5">
          {row.hasExpand && (
            <button
              onClick={() => toggleRow?.(row.id)}
              className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
            >
              <LuChevronRight
                size={12}
                className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
          <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{row.platform}</span>
          {row.hasExpand && row.expandCount && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#FBBF24]">
              {row.expandCount}
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("actuals", {
    header: "Actuals (May 2026)",
    size: 140,
    minSize: 100,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      const v = info.getValue();
      return (
        <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} ${v !== null && v < 0 ? "text-red-500 dark:text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>
          {fmt(v)}
        </span>
      );
    },
  }),
  columnHelper.accessor("promise", {
    header: "Promise",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      return <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} text-[#111928] dark:text-[#D1D5DB]`}>{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("perfCeiling", {
    header: "Perf. Ceiling",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      return <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} text-[#111928] dark:text-[#D1D5DB]`}>{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("perfDelta", {
    header: "Perf. Delta",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      return <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} text-[#111928] dark:text-[#D1D5DB]`}>{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("deltaLoss", {
    header: "Delta Loss",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      return <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} text-[#111928] dark:text-[#D1D5DB]`}>{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("netPromise", {
    header: "Net Promise",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      return <span className={`text-xs ${row.isSubTotal ? "font-medium" : ""} text-[#111928] dark:text-[#D1D5DB]`}>{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("resources", {
    header: "Resources",
    size: 200,
    minSize: 100,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote || row.isSubTotal) return null;
      const v = info.getValue();
      if (!v) return <span className="text-xs text-[#6B7280]">-</span>;
      return (
        <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate block max-w-[180px]" title={v}>
          👥 {v}
        </span>
      );
    },
  }),
];

const coreModel = getCoreRowModel();
const sortedModel = getSortedRowModel();
const expandedModel = getExpandedRowModel();

/* --- Group Data by Category ----------------------------------------- */
function groupByCategory(data: PlanningRow[]): Map<string, PlanningRow[]> {
  const groups = new Map<string, PlanningRow[]>();
  for (const row of data) {
    const cat = row.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(row);
  }
  return groups;
}

/* --- Category Table ------------------------------------------------- */
function CategoryTable({ category, rows }: { category: string; rows: PlanningRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  /** Tracks which hasExpand row IDs are currently open */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const table = useReactTable({
    data: rows,
    columns: planColumns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: coreModel,
    getSortedRowModel: sortedModel,
    getExpandedRowModel: expandedModel,
    meta: { toggleRow, expandedRows },
  });

  /**
   * Build the final render order with sort-safe pinning:
   * 1. Separate Sub Total and promiseNote rows from data rows
   * 2. Group each data row with its immediately-following note row(s)
   * 3. Sort those groups by the active sort column
   * 4. Flatten: sorted groups + Sub Total always last
   */
  const sortedRows = useMemo(() => {
    const allRows = table.getRowModel().rows;

    // Separate sub-total row(s) — they go to the end
    const subTotalRows = allRows.filter(r => r.original.isSubTotal);
    const nonSubRows   = allRows.filter(r => !r.original.isSubTotal);

    // Build groups: each data row paired with its following note row(s)
    type Group = { head: typeof allRows[0]; notes: typeof allRows };
    const groups: Group[] = [];
    for (let i = 0; i < nonSubRows.length; i++) {
      const r = nonSubRows[i];
      if (r.original.isPromiseNote) continue; // already consumed
      const noteRows: typeof allRows = [];
      // Collect consecutive note rows that follow this data row
      let j = i + 1;
      while (j < nonSubRows.length && nonSubRows[j].original.isPromiseNote) {
        noteRows.push(nonSubRows[j]);
        j++;
      }
      i = j - 1; // advance past consumed note rows
      groups.push({ head: r, notes: noteRows });
    }

    // Sort groups (tanstack already applied column sort to `head` rows)
    // We rely on the ORDER from tanstack's sorted model — the data rows
    // come out in the right order, we just rebuild groups from that order.
    // (No extra sort needed — tanstack sorted `allRows` already.)

    // Flatten: each group = [head, ...notes]
    const ordered: typeof allRows = [];
    for (const g of groups) {
      ordered.push(g.head);
      ordered.push(...g.notes);
    }

    return [...ordered, ...subTotalRows];
  }, [table.getRowModel().rows]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-1">
      {/* Category header */}
      <div className="px-4 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <h3 className="text-sm font-semibold text-[#2563eb] dark:text-[#2563eb]">{category}</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }} className="border-collapse">
          {/* Show header only for the first group */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize(), position: "relative" }}
                    className="px-3 py-1.5 text-left select-none"
                  >
                    <div className="flex items-center gap-1 cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                      <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getIsSorted() === "asc" ? (
                        <LuArrowUp size={9} className="text-[#2563eb] dark:text-[#2563eb]" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <LuArrowDown size={9} className="text-[#2563eb] dark:text-[#2563eb]" />
                      ) : header.column.columnDef.header ? (
                        <LuArrowUpDown size={9} className="text-[#6B7280] opacity-40" />
                      ) : null}
                    </div>
                    {/* Resize handle */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-[3px] cursor-col-resize select-none touch-none transition-colors ${
                        header.column.getIsResizing() ? "bg-[#2563eb] dark:bg-[#2563eb]" : "bg-transparent hover:bg-[#2563eb]/40 dark:hover:bg-[#2563eb]/40"
                      }`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const orig = row.original;

              /* - Promise Note Row: only show when the parent hasExpand row is expanded - */
              if (orig.isPromiseNote) {
                // Find the preceding hasExpand row to check expansion
                const rowIdx = sortedRows.findIndex(r => r.id === row.id);
                const prevRow = rowIdx > 0 ? sortedRows[rowIdx - 1].original : null;
                const parentId = prevRow?.hasExpand ? prevRow.id : null;
                if (!parentId || !expandedRows.has(parentId)) return null;
                return (
                  <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    <td colSpan={planColumns.length} className="px-4 py-2.5">
                      <div className="flex items-start gap-2 rounded-md bg-[#FFFBEB] dark:bg-[#1a1f10] border border-[#FDE68A] dark:border-[#374151] px-3 py-2">
                        {/* <LuTriangleAlert size={14} className="text-[#FBBF24] shrink-0 mt-0.5" /> */}
                        <p className="text-[11px] text-[#374151] dark:text-[#D1D5DB] leading-relaxed flex-1">{orig.promiseNote}</p>
                        <span className="text-[10px] text-[#6B7280] whitespace-nowrap shrink-0 ml-2">{orig.promiseDate}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              /* - Sub Total Row - */
              if (orig.isSubTotal) {
                return (
                  <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0d1520]/60">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              }

              /* - Normal Row - */
              return (
                <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

  );
}

/* --- Main Component -------------------------------------------------- */
export default function PlanningSection() {
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);
  const [vslFilter, setVslFilter] = useState("VSL");

  /* Planning month */
  const [planningYear,  setPlanningYear]  = useState(2026);
  const [planningMonth, setPlanningMonth] = useState(5); // June
  const [showPlanningPicker, setShowPlanningPicker] = useState(false);

  /* Actuals month */
  const [actualsYear,  setActualsYear]  = useState(2026);
  const [actualsMonth, setActualsMonth] = useState(4); // May
  const [showActualsPicker, setShowActualsPicker] = useState(false);

  const grouped = useMemo(() => groupByCategory(PLANNING_DATA), []);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const planningLabel = `${MONTHS[planningMonth]} ${planningYear}`;
  const actualsLabel  = `${MONTHS[actualsMonth]}  ${actualsYear}`;

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Planning for */}
        <div className="relative flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Planning for</span>
          <button
            onClick={() => { setShowPlanningPicker(p => !p); setShowActualsPicker(false); }}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuCalendar size={12} />
            {planningLabel}
          </button>
          {showPlanningPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowPlanningPicker(false)} />
              <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setPlanningYear(y => y - 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={14} /></button>
                  <span className="text-sm font-semibold text-[#111928] dark:text-white">{planningYear}</span>
                  <button onClick={() => setPlanningYear(y => y + 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => { setPlanningMonth(i); setShowPlanningPicker(false); }}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        i === planningMonth ? "bg-[#5750F1] text-white" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actuals from */}
        <div className="relative flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Actuals from</span>
          <button
            onClick={() => { setShowActualsPicker(p => !p); setShowPlanningPicker(false); }}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuCalendar size={12} />
            {actualsLabel}
          </button>
          {showActualsPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowActualsPicker(false)} />
              <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setActualsYear(y => y - 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={14} /></button>
                  <span className="text-sm font-semibold text-[#111928] dark:text-white">{actualsYear}</span>
                  <button onClick={() => setActualsYear(y => y + 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => { setActualsMonth(i); setShowActualsPicker(false); }}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        i === actualsMonth ? "bg-[#5750F1] text-white" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Grid icon */}
        <button className="rounded-md border border-[#E6EBF1] dark:border-[#374151] p-1.5 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
          <LuLayoutGrid size={14} />
        </button>

        {/* VSL Dropdown */}
        <Dropdown value={vslFilter} options={["VSL", "Supplement", "E-Commerce", "All"]} onChange={setVslFilter} />

        {/* Plan Submission button */}
        <button
          onClick={() => setShowSubmitDrawer(true)}
          className="flex items-center gap-1.5 rounded-md border border-[#4B5563] dark:border-[#2563eb] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-[#2563eb] hover:bg-[#2563eb]/10 transition-colors"
        >
          <LuFileText size={13} />
          Plan Submission
        </button>
      </div>

      {/* Grouped Tables */}
      <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        {Array.from(grouped.entries()).map(([category, rows]) => (
          <CategoryTable key={category} category={category} rows={rows} />
        ))}

        {/* Grand Total */}
        <div className="border-t border-[#E6EBF1] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#0a0f1a]">
          <div className="flex items-center gap-6 px-4 py-3 overflow-x-auto">
            <span className="text-xs font-bold text-[#111928] dark:text-white shrink-0">Total</span>
            <div className="flex items-center gap-6 text-[11px]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Actuals <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.actuals)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Promise <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.promise)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Perf. Ceiling <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.perfCeiling)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Perf. Delta <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.perfDelta)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Delta Loss <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.deltaLoss)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Net Promise <span className="text-[#111928] dark:text-white font-medium">{fmt(TOTALS.netPromise)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Submission Drawer */}
      <PlanSubmissionDrawer
        open={showSubmitDrawer}
        onClose={() => setShowSubmitDrawer(false)}
      />
    </div>
  );
}