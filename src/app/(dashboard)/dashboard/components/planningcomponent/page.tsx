"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
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
import { LuArrowUpDown, LuArrowUp, LuArrowDown, LuChevronRight, LuChevronDown, LuChevronLeft, LuLayoutGrid, LuCalendar, LuFileText, LuPencil, LuPlus, LuTarget, LuSearch, LuLoader, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import GoalAssignModal, { type GoalRow } from "./components/goalassign";
import PlanSubmissionDrawer from "./components/PlanSubmissionDrawer";
import EditPlanDrawer from "../promise/editplan";
import type { PlanningRow as EditPlanRow } from "../promise/editplan";
import { CreateVerticalModal, CreateOfferModal } from "../promise/VerticalGrid";
import { toast } from "react-toastify";

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
  planId?: number;
  ownOfferId?: number;        // for actuals merge
  rawResources?: { user_id: number; user_name: string; is_assigned: boolean }[];
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
  { id: "bs-meta",    category: "Blood Sugar", platform: "Meta",      actuals: 34185,   promise: 30000,  perfCeiling: 20000,  perfDelta: 10000,  deltaLoss: 10000,  netPromise: 40000,  resources: "Arun, Satish, Kapil, Nityashish, Yash", hasExpand: true, expandCount: 1 },
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
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-2 rounded-md border border-[#4B5563] dark:border-[#2563eb] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-[#2563eb] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
      >
        {value}
        <LuChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] rounded-md border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-lg flex flex-col max-h-[300px] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#27303E] shrink-0">
              <LuSearch size={12} className="text-[#9CA3AF] shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto py-1">
              {filtered.length > 0 ? filtered.map((opt) => (
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
              )) : (
                <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* --- Platform Dropdown Cell ----------------------------------------- */
const PLATFORM_OPTIONS = ["Facebook", "Newsbreak", "Bigo", "TikTok"];

function PlatformDropdownCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(p => !p);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 group text-xs text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#818CF8] transition-colors"
      >
        <span className="font-medium">{value || "—"}</span>
        <LuChevronDown size={10} className="text-[#9CA3AF] group-hover:text-[#5750F1] transition-colors shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] w-36 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1"
            style={{ top: pos.top, left: pos.left }}
          >
            {PLATFORM_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  opt === value
                    ? "bg-[#5750F1]/10 text-[#5750F1] font-semibold"
                    : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
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

/* --- Resource multi-select dropdown cell ------------- */
function ResourceDropdownCell({
  planId, resources, workspaceId, token,
}: {
  planId: number;
  resources: { user_id: number; user_name: string; is_assigned: boolean; promise?: number }[];
  workspaceId: number | string;
  token: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(resources.filter(r => r.is_assigned).map(r => r.user_id))
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Sync API call
  const syncResources = async (ids: Set<number>) => {
    try {
      const res = await api.put(`/api/v1/planner/plans/${planId}/resources`, {
        workspace_id: Number(workspaceId),
        user_ids: [...ids],
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success((res.data as any)?.message ?? "Resources updated");
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to sync resources";
      console.error("Failed to sync resources", err);
      toast.error(msg);
    }
  };

  // Close on outside click — checks both trigger button and dropdown portal
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedBtn  = btnRef.current?.contains(target);
      const clickedDrop = dropRef.current?.contains(target);
      if (!clickedBtn && !clickedDrop) {
        setOpen(false);
        syncResources(selected);
      }
    };
    const tid = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(tid); document.removeEventListener("click", handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(p => !p);
  };

  const toggle = (userId: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const selectedNames = resources.filter(r => selected.has(r.user_id)).map(r => r.user_name);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 rounded border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2 py-1 text-left w-36 hover:border-[#5750F1]/50 transition-colors"
      >
        <span className="flex-1 truncate leading-none text-[10px]">
          {selected.size === 0
            ? <span className="text-[#9CA3AF]">Select...</span>
            : <span className="text-[#5750F1] font-medium">{selectedNames.join(", ")}</span>}
        </span>
        <LuChevronDown size={11} className="shrink-0 text-[#9CA3AF]" />
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
          className="w-52 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden"
        >
          <div className="max-h-44 overflow-y-auto py-1">
            {resources.length > 0 ? resources.map(r => (
              <div
                key={r.user_id}
                onClick={e => { e.stopPropagation(); toggle(r.user_id); }}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors select-none"
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                  selected.has(r.user_id) ? "border-[#5750F1] bg-[#5750F1]" : "border-[#D1D5DB] dark:border-[#374151]"
                }`}>
                  {selected.has(r.user_id) && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">
                  {r.user_name}
                  {r.is_assigned && (r.promise ?? 0) > 0 && (
                    <span className="ml-1.5 font-medium text-[#5750F1]">
                      (${r.promise?.toLocaleString()})
                    </span>
                  )}
                </span>
              </div>
            )) : (
              <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No users</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

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
      return (
        <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">
          {row.platform || "—"}
        </span>
      );
    },
  }),
  columnHelper.accessor("actuals", {
    header: (info) => {
      const meta = info.table.options.meta as any;
      const label = meta?.actualsLabel ?? "May 2026";
      const loading = meta?.actualsLoading ?? false;
      return (
        <span className="flex items-center gap-1">
          {loading && <LuLoader size={9} className="animate-spin text-[#5750F1] shrink-0" />}
          {`Actuals (${label})`}
        </span>
      );
    },
    size: 140,
    minSize: 100,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => {
            const n = r.original.actuals;
            return n === null ? acc : (acc ?? 0) + n;
          }, null);
        return <span className={`text-xs font-medium ${v !== null && v < 0 ? "text-red-500 dark:text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>{fmt(v)}</span>;
      }
      const v = info.getValue();
      return (
        <span className={`text-xs ${v !== null && v < 0 ? "text-red-500 dark:text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>
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
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => { const n = r.original.promise; return n === null ? acc : (acc ?? 0) + n; }, null);
        return <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(v)}</span>;
      }
      return <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("perfCeiling", {
    header: "Perf. Ceiling",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => { const n = r.original.perfCeiling; return n === null ? acc : (acc ?? 0) + n; }, null);
        return <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(v)}</span>;
      }
      return <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("perfDelta", {
    header: "Perf. Delta",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => { const n = r.original.perfDelta; return n === null ? acc : (acc ?? 0) + n; }, null);
        return <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(v)}</span>;
      }
      return <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("deltaLoss", {
    header: "Delta Loss",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => { const n = r.original.deltaLoss; return n === null ? acc : (acc ?? 0) + n; }, null);
        return <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(v)}</span>;
      }
      return <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("netPromise", {
    header: "Net Promise",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote) return null;
      if (row.isSubTotal) {
        const v = info.table.getRowModel().rows
          .filter(r => !r.original.isSubTotal && !r.original.isPromiseNote)
          .reduce<number | null>((acc, r) => { const n = r.original.netPromise; return n === null ? acc : (acc ?? 0) + n; }, null);
        return <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(v)}</span>;
      }
      return <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{fmt(info.getValue())}</span>;
    },
  }),
  columnHelper.accessor("resources", {
    header: "Resources",
    size: 200,
    minSize: 100,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote || row.isSubTotal || !row.planId || !row.rawResources) return null;
      
      const meta = info.table.options.meta as any;
      const workspaceId = meta?.workspaceId ?? 1;
      const token = meta?.token ?? null;
      
      return (
        <ResourceDropdownCell
          planId={row.planId}
          resources={row.rawResources}
          workspaceId={workspaceId}
          token={token}
        />
      );
    },
  }),
  // Assign Goal column — button rendered via meta callbacks
  columnHelper.display({
    id: "assignGoal",
    header: "Assign Goal",
    size: 100,
    minSize: 80,
    cell: (info) => {
      const row = info.row.original;
      if (row.isPromiseNote || row.isSubTotal) return null;
      const meta = info.table.options.meta as {
        openGoalModal?: (row: GoalRow) => void;
        savedGoalRowIds?: Set<string>;
      } | undefined;
      const saved = meta?.savedGoalRowIds?.has(row.id) ?? false;
      return (
        <button
          onClick={() => meta?.openGoalModal?.(row as GoalRow)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
            saved
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              : "border-[#5750F1]/40 bg-[#5750F1]/5 text-[#5750F1] hover:bg-[#5750F1]/15"
          }`}
        >
          <LuTarget size={10} />
          {saved ? "Assigned" : "Goal"}
        </button>
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
function CategoryTable({ category, rows, actualsLabel, actualsLoading, workspaceId, token, onRefresh }: { category: string; rows: PlanningRow[]; actualsLabel: string; actualsLoading: boolean; workspaceId: number | string; token: string | null; onRefresh: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  /** Tracks which hasExpand row IDs are currently open */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  /** Tracks per-row platform overrides */
  const [platformOverrides, setPlatformOverrides] = useState<Map<string, string>>(new Map());
  /** Tracks per-row resource overrides */
  const [resourceOverrides, setResourceOverrides] = useState<Map<string, string>>(new Map());
  /** Goal assign modal state */
  const [goalRow, setGoalRow] = useState<GoalRow | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savedGoalRowIds, setSavedGoalRowIds] = useState<Set<string>>(new Set());

  const [goalLoading, setGoalLoading] = useState(false);
  const [goalInitialGoals, setGoalInitialGoals] = useState<any[] | undefined>(undefined);
  const [goalPlanTotals, setGoalPlanTotals] = useState<any | undefined>(undefined);

  /** IDs pending delete confirmation */
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openGoalModal = async (row: GoalRow & { planId?: number }) => {
    setGoalRow(row);
    if (!row.planId) {
      setShowGoalModal(true);
      return;
    }
    setGoalInitialGoals(undefined);
    setGoalPlanTotals(undefined);
    setGoalLoading(true);
    setShowGoalModal(true);
    try {
      const res = await api.get(`/api/v1/planner/plans/${row.planId}/user-goals`, {
        params: { workspace_id: Number(workspaceId) },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data?.plan_totals) setGoalPlanTotals(data.plan_totals);
      if (data?.user_goals)  setGoalInitialGoals(data.user_goals);
      toast.success(res.data?.message ?? "Goals loaded successfully");
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch user goals";
      console.error("Failed to fetch user goals", err);
      toast.error(msg);
    } finally {
      setGoalLoading(false);
    }
  };
  const handleGoalSave = (rowId: string) => {
    setSavedGoalRowIds(prev => new Set(prev).add(rowId));
    onRefresh();
  };

  const deletePlan = async (planId: number) => {
    try {
      const res = await api.delete(`/api/v1/planner/plans/${planId}`, {
        params: { workspace_id: workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success((res.data as any)?.message ?? "Plan deleted successfully");
      onRefresh();
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to delete plan";
      console.error("Failed to delete plan", err);
      toast.error(msg);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds || pendingDeleteIds.length === 0) return;
    setIsDeleting(true);
    for (const planId of pendingDeleteIds) {
      await deletePlan(planId);
    }
    setIsDeleting(false);
    setPendingDeleteIds(null);
  };

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const updatePlatform = (id: string, v: string) =>
    setPlatformOverrides(prev => new Map(prev).set(id, v));

  const updateResources = (id: string, v: string) =>
    setResourceOverrides(prev => new Map(prev).set(id, v));

  const table = useReactTable({
    data: rows,
    columns: planColumns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: coreModel,
    getSortedRowModel: sortedModel,
    getExpandedRowModel: expandedModel,
    meta: { toggleRow, expandedRows, updatePlatform, platformOverrides, updateResources, resourceOverrides, actualsLabel, actualsLoading, openGoalModal, savedGoalRowIds, workspaceId, token },
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

    // Flatten: each group = [head, ...notes]
    const ordered: typeof allRows = [];
    for (const g of groups) {
      ordered.push(g.head);
      ordered.push(...g.notes);
    }

    return [...ordered, ...subTotalRows];
  }, [table.getRowModel().rows]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
    <div className="mb-1">
      {/* Category header */}
      <div className="px-4 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#2563eb] dark:text-[#2563eb]">{category}</h3>
        <button
          onClick={() => {
            const planIds = rows.filter(r => !r.isSubTotal && !r.isPromiseNote && r.planId).map(r => r.planId!);
            if (planIds.length === 0) return;
            setPendingDeleteIds(planIds);
          }}
          title="Delete all plans in this group"
          className="flex items-center justify-center rounded p-1 text-[#9CA3AF] hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LuTrash2 size={14} />
        </button>
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

              /* - Promise Note Row: hidden - */
              if (orig.isPromiseNote) return null;

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

    <GoalAssignModal
      open={showGoalModal}
      onClose={() => setShowGoalModal(false)}
      onSave={handleGoalSave}
      row={goalRow}
      initialGoals={goalInitialGoals}
      planTotals={goalPlanTotals}
      loading={goalLoading}
      planId={(goalRow as any)?.planId}
      workspaceId={workspaceId}
      token={token}
    />

    {/* Delete confirmation modal */}
    {pendingDeleteIds && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#111928] rounded-2xl shadow-2xl border border-[#E6EBF1] dark:border-[#1F2A37] w-full max-w-sm mx-4 p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
              <LuTrash2 size={22} className="text-red-500" />
            </div>
          </div>
          {/* Title */}
          <h3 className="text-base font-semibold text-[#111928] dark:text-white text-center mb-2">
            Delete Plan
          </h3>
          {/* Message */}
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] text-center mb-6">
            Are you really want to delete the plan? This action cannot be undone.
          </p>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPendingDeleteIds(null)}
              disabled={isDeleting}
              className="flex-1 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-4 py-2.5 text-sm font-medium text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <><LuLoader size={14} className="animate-spin" /> Deleting…</>
              ) : (
                <><LuTrash2 size={14} /> Delete</>
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function PlanningSection() {
  const { user, token } = useAuth();
  const isUser = user?.role === "user";
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showCreateVertical, setShowCreateVertical] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [verticalRefreshKey, setVerticalRefreshKey] = useState(0);
  
  const [rawVerticals, setRawVerticals] = useState<{ id: number; name: string }[]>([]);
  const [verticalsList, setVerticalsList] = useState<string[]>(["VSL", "Supplement", "E-Commerce", "All"]);
  const [vslFilter, setVslFilter] = useState("VSL");

  /* Planning month */
  const [planningYear,  setPlanningYear]  = useState(() => new Date().getFullYear());
  const [planningMonth, setPlanningMonth] = useState(() => new Date().getMonth()); // 0-indexed, current month
  const [showPlanningPicker, setShowPlanningPicker] = useState(false);
  // Pending (not-yet-applied) selection inside the Planning picker
  const [pendingPlanningYear,  setPendingPlanningYear]  = useState(() => new Date().getFullYear());
  const [pendingPlanningMonth, setPendingPlanningMonth] = useState(() => new Date().getMonth());

  const fetchPageVerticals = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/planner/verticals", {
        params: { workspace_id: workspaceId, with_own_offers: false },
        headers: { Authorization: `Bearer ${token}` }
      });
      const verts = res.data?.data?.verticals || [];
      setRawVerticals(verts);
      const names = verts.map((v: { name: string }) => v.name);
      
      if (names.length > 0) {
        setVerticalsList(names);
        // Only set default if current filter is no longer valid
        setVslFilter(prev => names.includes(prev) ? prev : names[0]);
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch verticals";
      console.error("Failed to fetch verticals", err);
      toast.error(msg);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    if (token) fetchPageVerticals();
  }, [token, workspaceId, fetchPageVerticals]);

  /** Live planning data */
  const [planningData, setPlanningData] = useState<PlanningRow[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [refreshToggle, setRefreshToggle] = useState(0);

  /* Actuals month + loading state */
  const [actualsYear,  setActualsYear]  = useState(() => new Date().getFullYear());
  const [actualsMonth, setActualsMonth] = useState(() => new Date().getMonth()); // 0-indexed, current month
  const [showActualsPicker, setShowActualsPicker] = useState(false);
  const [actualsLoading, setActualsLoading] = useState(false);
  // Pending (not-yet-applied) selection inside the Actuals picker
  const [pendingActualsYear,  setPendingActualsYear]  = useState(() => new Date().getFullYear());
  const [pendingActualsMonth, setPendingActualsMonth] = useState(() => new Date().getMonth());

  // Fetch actuals and merge into planningData
  const fetchAndMergeActuals = useCallback(async (
    rows: PlanningRow[],
    verticalId: number,
    aYear: number,
    aMonth: number,
    pYear: number,
    pMonth: number
  ) => {
    if (!token || rows.length === 0) return;
    const monthYear     = `${aYear}-${String(aMonth + 1).padStart(2, "0")}`;
    const planMonthYear = `${pYear}-${String(pMonth + 1).padStart(2, "0")}`;
    setActualsLoading(true);
    try {
      const res = await api.get("/api/v1/planner/plan-actuals", {
        params: { workspace_id: workspaceId, vertical_id: verticalId, month_year: monthYear, plan_month_year: planMonthYear },
        headers: { Authorization: `Bearer ${token}` },
      });
      const ownOffers: any[] = res.data?.data?.own_offers || [];

      // Build lookup: `${own_offer_id}:${platform_lowercase}` -> actual_promise
      const map = new Map<string, number | null>();
      ownOffers.forEach((offer: any) => {
        (offer.platforms || []).forEach((p: any) => {
          const key = `${offer.own_offer_id}:${(p.platform || "").toLowerCase()}`;
          map.set(key, p.actual_promise ?? null);
        });
      });

      // Merge actuals into rows
      setPlanningData(prev => prev.map(row => {
        if (row.isSubTotal || row.isPromiseNote || !row.ownOfferId) return row;
        const key = `${row.ownOfferId}:${(row.platform || "").toLowerCase()}`;
        return { ...row, actuals: map.has(key) ? map.get(key)! : null };
      }));
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch actuals";
      console.error("Failed to fetch actuals", err);
      toast.error(msg);
    } finally {
      setActualsLoading(false);
    }
  }, [token, workspaceId]);

  // Fetch plans when vertical or date changes
  useEffect(() => {
    const vertical = rawVerticals.find(v => v.name === vslFilter);
    if (!vertical || !token) return;

    const fetchPlans = async () => {
      const monthStr = `${planningYear}-${String(planningMonth + 1).padStart(2, "0")}`;
      setIsLoadingPlans(true);
      try {
        const res = await api.get("/api/v1/planner/plans", {
          params: { workspace_id: workspaceId, vertical_id: vertical.id, month_year: monthStr },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const offers = res.data?.data?.own_offers || [];
        const rows: PlanningRow[] = [];
        
        offers.forEach((offer: any) => {
          const category = offer.own_offer_name || "Unknown";
          const platforms = offer.platforms || [];
          
          let catPromise = 0, catPerfCeiling = 0, catPerfDelta = 0, catDeltaLoss = 0, catNetPromise = 0;
          
          platforms.forEach((p: any) => {
             const assigned = (p.resources || [])
               .filter((r: any) => r.is_assigned)
               .map((r: any) => r.user_name)
               .join(", ");
               
             rows.push({
               id: `${category}-${p.id}`,
               planId: p.id,
               ownOfferId: offer.own_offer_id,
               category,
               platform: p.platform,
               actuals: null,
               promise: p.promise ?? null,
               perfCeiling: p.perf_ceiling ?? null,
               perfDelta: p.perf_delta ?? null,
               deltaLoss: p.delta_loss ?? null,
               netPromise: p.net_promise ?? null,
               resources: assigned,
               rawResources: p.resources || [],
               hasExpand: true,
               expandCount: 1,
             });
             
             catPromise += p.promise || 0;
             catPerfCeiling += p.perf_ceiling || 0;
             catPerfDelta += p.perf_delta || 0;
             catDeltaLoss += p.delta_loss || 0;
             catNetPromise += p.net_promise || 0;
          });
          
          if (platforms.length > 0) {
            rows.push({
               id: `${category}-sub`,
               category,
               platform: "Sub Total",
               actuals: null,
               promise: catPromise,
               perfCeiling: catPerfCeiling,
               perfDelta: catPerfDelta,
               deltaLoss: catDeltaLoss,
               netPromise: catNetPromise,
               resources: "",
               isSubTotal: true
            });
          }
        });
        
        setPlanningData(rows);

        // After plans are loaded, also fetch actuals (if we have a vertical)
        fetchAndMergeActuals(rows, vertical.id, actualsYear, actualsMonth, planningYear, planningMonth);
        toast.success(res.data?.message ?? "Plans loaded successfully");
      } catch (err) {
        const msg = (err as any)?.response?.data?.message ?? "Failed to fetch plans";
        console.error("Failed to fetch plans", err);
        toast.error(msg);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [rawVerticals, vslFilter, planningYear, planningMonth, workspaceId, token, refreshToggle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch actuals when actuals month changes (without re-fetching the full plan)
  useEffect(() => {
    const vertical = rawVerticals.find(v => v.name === vslFilter);
    if (!vertical || !token || planningData.length === 0) return;
    fetchAndMergeActuals(planningData, vertical.id, actualsYear, actualsMonth, planningYear, planningMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualsYear, actualsMonth]);

  const grouped = useMemo(() => groupByCategory(planningData), [planningData]);

  const grandTotals = useMemo(() => {
    let actuals = 0, promise = 0, perfCeiling = 0, perfDelta = 0, deltaLoss = 0, netPromise = 0;
    for (const r of planningData) {
      if (!r.isSubTotal && !r.isPromiseNote) {
        actuals += r.actuals || 0;
        promise += r.promise || 0;
        perfCeiling += r.perfCeiling || 0;
        perfDelta += r.perfDelta || 0;
        deltaLoss += r.deltaLoss || 0;
        netPromise += r.netPromise || 0;
      }
    }
    return { actuals, promise, perfCeiling, perfDelta, deltaLoss, netPromise };
  }, [planningData]);

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
            onClick={() => {
              // Sync pending to current committed when opening
              setPendingPlanningYear(planningYear);
              setPendingPlanningMonth(planningMonth);
              setShowPlanningPicker(p => !p);
              setShowActualsPicker(false);
            }}
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
                  <button onClick={() => setPendingPlanningYear(y => y - 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={14} /></button>
                  <span className="text-sm font-semibold text-[#111928] dark:text-white">{pendingPlanningYear}</span>
                  <button onClick={() => setPendingPlanningYear(y => y + 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MONTHS.map((m, i) => (
                    <button key={m}
                      onClick={() => setPendingPlanningMonth(i)}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        i === pendingPlanningMonth
                          ? "bg-[#5750F1] text-white"
                          : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}>{m}</button>
                  ))}
                </div>
                {/* Apply button */}
                <button
                  onClick={() => {
                    setPlanningYear(pendingPlanningYear);
                    setPlanningMonth(pendingPlanningMonth);
                    setShowPlanningPicker(false);
                  }}
                  className="w-full rounded-lg bg-[#5750F1] text-white py-1.5 text-xs font-semibold hover:bg-[#4742d4] transition-colors"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>

        {/* Actuals from */}
        <div className="relative flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Actuals from</span>
          <button
            onClick={() => {
              // Sync pending to current committed when opening
              setPendingActualsYear(actualsYear);
              setPendingActualsMonth(actualsMonth);
              setShowActualsPicker(p => !p);
              setShowPlanningPicker(false);
            }}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuCalendar size={12} />
            {actualsLabel}
          </button>
          {showActualsPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowActualsPicker(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setPendingActualsYear(y => y - 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={14} /></button>
                  <span className="text-sm font-semibold text-[#111928] dark:text-white">{pendingActualsYear}</span>
                  <button onClick={() => setPendingActualsYear(y => y + 1)} className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MONTHS.map((m, i) => (
                    <button key={m}
                      onClick={() => setPendingActualsMonth(i)}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        i === pendingActualsMonth
                          ? "bg-[#5750F1] text-white"
                          : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}>{m}</button>
                  ))}
                </div>
                {/* Apply button */}
                <button
                  onClick={() => {
                    setActualsYear(pendingActualsYear);
                    setActualsMonth(pendingActualsMonth);
                    setShowActualsPicker(false);
                  }}
                  className="w-full rounded-lg bg-[#5750F1] text-white py-1.5 text-xs font-semibold hover:bg-[#4742d4] transition-colors"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Refresh Button */}
        <button
          onClick={() => setRefreshToggle(p => p + 1)}
          className="flex items-center justify-center rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] p-1.5 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#5750F1]/40 transition-colors"
          title="Refresh Plans"
        >
          <LuRefreshCw size={15} className={isLoadingPlans ? "animate-spin text-[#5750F1]" : ""} />
        </button>

        {/* Create Vertical / Create Offer buttons */}
        <button
          onClick={() => setShowCreateVertical(true)}
          className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuPlus size={13} />
          Create Vertical
        </button>
        <button
          onClick={() => setShowCreateOffer(true)}
          className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuPlus size={13} />
          Create Offer
        </button>

        {/* VSL Dropdown */}
        <Dropdown value={vslFilter} options={verticalsList} onChange={setVslFilter} />

        {/* Edit button */}
        <button
          onClick={() => setShowEditPlan(true)}
          className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
        >
          <LuPencil size={13} />
          Edit
        </button>

        {/* Plan Creation button — hidden for role=user */}
        {!isUser && (
          <button
            onClick={() => setShowSubmitDrawer(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#4B5563] dark:border-[#2563eb] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-[#2563eb] hover:bg-[#2563eb]/10 transition-colors"
          >
            <LuFileText size={13} />
            Plan Creation
          </button>
        )}
      </div>

      {/* Grouped Tables */}
      <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        {isLoadingPlans ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <LuLoader size={24} className="animate-spin text-[#5750F1] mb-3" />
            <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Loading plans...</span>
          </div>
        ) : planningData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">No plans for this vertical</span>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, rows]) => (
            <CategoryTable key={category} category={category} rows={rows} actualsLabel={actualsLabel.replace("  ", " ")} actualsLoading={actualsLoading} workspaceId={workspaceId} token={token} onRefresh={() => setRefreshToggle(p => p + 1)} />
          ))
        )}

        {/* Grand Total */}
        <div className="border-t border-[#E6EBF1] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#0a0f1a]">
          <div className="flex items-center gap-6 px-4 py-3 overflow-x-auto">
            <span className="text-xs font-bold text-[#111928] dark:text-white shrink-0">Total</span>
            <div className="flex items-center gap-6 text-[11px]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Actuals <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.actuals)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Promise <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.promise)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Perf. Ceiling <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.perfCeiling)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Perf. Delta <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.perfDelta)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Delta Loss <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.deltaLoss)}</span></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Net Promise <span className="text-[#111928] dark:text-white font-medium">{fmt(grandTotals.netPromise)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Submission Drawer */}
      <PlanSubmissionDrawer
        open={showSubmitDrawer}
        onClose={() => setShowSubmitDrawer(false)}
        onSubmit={() => setRefreshToggle(prev => prev + 1)}
      />

      {/* Edit Plan Drawer */}
      <EditPlanDrawer
        open={showEditPlan}
        data={planningData as EditPlanRow[]}
        onClose={() => setShowEditPlan(false)}
        onUpdate={(updated) => setPlanningData(updated as typeof PLANNING_DATA)}
      />

      {/* Create Vertical / Offer Modals */}
      <CreateVerticalModal
        open={showCreateVertical}
        onClose={() => setShowCreateVertical(false)}
        onSave={() => {
          setShowCreateVertical(false);
          setVerticalRefreshKey(k => k + 1);
          fetchPageVerticals();
        }}
      />
      <CreateOfferModal
        open={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
        onSave={() => setShowCreateOffer(false)}
        verticals={Array.from(new Set(planningData.map(r => r.category)))}
        verticalRefreshKey={verticalRefreshKey}
      />
    </div>
  );
}