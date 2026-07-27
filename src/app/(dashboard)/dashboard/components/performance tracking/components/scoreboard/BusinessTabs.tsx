"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { LuChevronDown, LuChevronRight, LuCheck, LuX, LuLoader } from "react-icons/lu";
import FilterBar from "./FilterBar";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

/* --- API Types --------------------------------------------------------- */
interface BreakdownItem {
  key:          number;
  label:        string;
  spend:        number;
  revenue:      number;
  margin:       number;
  roi_pct:      number;
  share_pct:    number;
  promise:      number;
  progress_pct: number;
}
interface GroupItem extends BreakdownItem {
  breakdown: BreakdownItem[];
}
interface Summary {
  total_spend:   number;
  total_revenue: number;
  roi_pct:       number;
  gross_margin:  number;
}

/* --- Formatters -------------------------------------------------------- */
function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const str = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(1)}M`
    : `$${Math.round(abs).toLocaleString("en-US")}`;
  return n < 0 ? `-${str}` : str;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

/* --- Pagination -------------------------------------------------------- */
const ROW_OPTIONS = [10, 25, 50, 100];

function PaginationFooter({
  rowsPerPage, currentPage, totalRows, onRowsPerPageChange, onPageChange,
}: {
  rowsPerPage: number; currentPage: number; totalRows: number;
  onRowsPerPageChange: (v: number) => void; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const maxV = 5, half = Math.floor(maxV / 2);
  let s = Math.max(1, currentPage - half);
  let e = s + maxV - 1;
  if (e > totalPages) { e = totalPages; s = Math.max(1, e - maxV + 1); }
  const pages = Array.from({ length: Math.max(0, e - s + 1) }, (_, i) => s + i);
  const display: Array<number | "ellipsis"> = [];
  if (totalPages <= maxV + 2) { for (let p = 1; p <= totalPages; p++) display.push(p); }
  else {
    display.push(1);
    if (s > 2) display.push("ellipsis");
    for (const p of pages) if (p !== 1 && p !== totalPages) display.push(p);
    if (e < totalPages - 1) display.push("ellipsis");
    display.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between gap-1 border-t border-[#E6EBF1] dark:border-[#1F2A37] px-4 py-3 text-xs">
      <div className="flex items-center gap-2">
        <select value={rowsPerPage} onChange={e => onRowsPerPageChange(Number(e.target.value))}
          className="rounded-md border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0a0f1a] px-3 py-1.5 text-xs text-[#374151] dark:text-[#9CA3AF] shadow-sm focus:border-[#5750F1] focus:outline-none focus:ring-1 focus:ring-[#5750F1]">
          {ROW_OPTIONS.map(o => <option key={o} value={o}>{o} Rows</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-2 py-1 text-[#6B7280] hover:text-[#111928] dark:text-[#9CA3AF] dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors">«</button>
        {display.map((p, i) => p === "ellipsis"
          ? <span key={`e${i}`} className="flex h-7 w-7 items-center justify-center text-[#6B7280] dark:text-[#9CA3AF]">...</span>
          : <button key={p} type="button" onClick={() => onPageChange(p)}
              className={p === currentPage ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#5750F1] text-white text-xs font-semibold" : "flex h-7 w-7 items-center justify-center rounded-full text-[#374151] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2A37] transition-colors"}>{p}</button>
        )}
        <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="px-2 py-1 text-[#6B7280] hover:text-[#111928] dark:text-[#9CA3AF] dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors">»</button>
      </div>
    </div>
  );
}

/* --- Dropdown option → API param map ----------------------------------- */
const OPTION_TO_PARAM: Record<string, string> = {
  "None":        "none",
  "Vertical":    "vertical",
  "Member":      "member",
  "offer ":      "offer",
  "Team Leader": "team",
  "Platform":    "platform",
  "Week":        "week",
  "Date":        "date",
};

/* --- Group-By Dropdown ------------------------------------------------- */
const GROUP_BY_OPTIONS = ["None", "Vertical", "Member", "offer ", "Team Leader", "Platform", "Week", "Date"] as const;
type GroupByOption = typeof GROUP_BY_OPTIONS[number];

function GroupByDropdown({
  value,
  onChange,
  exclude,
}: {
  value: GroupByOption;
  onChange: (v: GroupByOption) => void;
  exclude?: GroupByOption;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("mousedown", (e) => {
      // Close only if click is outside both button and panel
      const panel = document.getElementById("groupby-panel");
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        (!panel || !panel.contains(e.target as Node))
      ) close();
    });
    window.addEventListener("scroll",  close, true);
    window.addEventListener("resize",  close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll",  close, true);
      window.removeEventListener("resize",  close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
      >
        {value} <LuChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && typeof window !== "undefined" && (
        <div
          id="groupby-panel"
          style={{
            position: "fixed",
            top:  coords.top,
            left: coords.left,
            minWidth: Math.max(coords.width, 160),
            zIndex: 99999,
          }}
          className="rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#111927] shadow-xl py-1 overflow-hidden"
        >
          {GROUP_BY_OPTIONS.filter(opt => opt !== exclude).map(opt => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors text-left ${
                  isSelected
                    ? "bg-[#CCFF00] text-black"
                    : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                }`}
              >
                {isSelected ? <LuCheck size={12} className="shrink-0" /> : <span className="w-3 shrink-0" />}
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* --- Progress Ring ----------------------------------------------------- */
function ProgressRing({ pct, neg }: { pct: number; neg: boolean }) {
  const r    = 9;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(Math.abs(pct), 100);
  const dash  = (clamped / 100) * circ;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className="shrink-0">
      <circle cx="11" cy="11" r={r} fill="none" stroke="#1F2A37" strokeWidth="2.5" />
      <circle
        cx="11" cy="11" r={r} fill="none"
        stroke={neg ? "#ef4444" : "#2563eb"}
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 11 11)"
      />
    </svg>
  );
}

/* --- Table Row (renders group + its breakdown children) --------------- */
function GroupRow({ group, depth = 0, expanded, onToggle }: {
  group: GroupItem | BreakdownItem;
  depth?: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const id         = String((group as GroupItem).key);
  const breakdown  = (group as GroupItem).breakdown ?? [];
  const hasChildren = breakdown.length > 0;
  const isExpanded  = expanded.has(id);
  const neg         = group.margin < 0 || group.roi_pct < 0;
  const progNeg     = group.progress_pct < 0;

  return (
    <>
      <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
        {/* Group */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => onToggle(id)} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white">
                {isExpanded ? <LuChevronDown size={13} /> : <LuChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-[13px]" />
            )}
            <span className={`text-xs ${depth === 0 ? "font-semibold text-[#111928] dark:text-white" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>
              {group.label}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{fmtMoney(group.spend)}</td>
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{fmtMoney(group.revenue)}</td>
        <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${group.margin < 0 ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>
          {fmtMoney(group.margin)}
        </td>
        <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${group.roi_pct < 0 ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>
          {fmtPct(group.roi_pct)}
        </td>
        <td className="px-3 py-2.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">{fmtPct(group.share_pct)}</td>
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{fmtMoney(group.promise)}</td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <ProgressRing pct={group.progress_pct} neg={progNeg} />
            <span className={`text-xs font-semibold whitespace-nowrap ${progNeg ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>
              {fmtPct(group.progress_pct)}
            </span>
          </div>
        </td>
      </tr>
      {/* Breakdown children */}
      {hasChildren && isExpanded && breakdown.map(child => (
        <GroupRow
          key={child.key}
          group={{ ...child, breakdown: [] } as GroupItem}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

/* --- Business Tab ------------------------------------------------------ */
export default function BusinessTab() {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token }   = useAuth();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [groupBy1, setGroupBy1] = useState<GroupByOption>("Vertical");
  const [groupBy2, setGroupBy2] = useState<GroupByOption>("Member");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Committed month state (only updates on FilterBar "Done")
  const today = new Date();
  const [committedYear,   setCommittedYear]   = useState(today.getFullYear());
  const [committedMonths, setCommittedMonths] = useState<Set<number>>(new Set([today.getMonth()]));

  // API data
  const [groups,  setGroups]  = useState<GroupItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (
    year    = committedYear,
    months  = committedMonths,
    dim1    = groupBy1,
    dim2    = groupBy2,
  ) => {
    if (months.size === 0) return;
    const sorted     = [...months].sort((a, b) => a - b);
    const pad        = (n: number) => String(n + 1).padStart(2, "0");
    const startMonth = `${year}-${pad(sorted[0])}`;
    const endMonth   = `${year}-${pad(sorted[sorted.length - 1])}`;

    setLoading(true);
    try {
      const res = await api.get("/api/v1/planner/scoreboard/dimensions", {
        params: {
          workspace_id:        workspaceId,
          primary_dimension:   OPTION_TO_PARAM[dim1] ?? "vertical",
          secondary_dimension: OPTION_TO_PARAM[dim2] ?? "member",
          start_month:         startMonth,
          end_month:           endMonth,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data?.data;
      if (d) {
        setGroups(d.groups ?? []);
        setSummary(d.summary ?? null);

      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch scoreboard dimensions";
      console.error("Failed to fetch scoreboard dimensions:", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, token]);




  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return groups.slice(start, start + rowsPerPage);
  }, [groups, currentPage, rowsPerPage]);

  // Reset to page 1 when data or rowsPerPage changes
  useEffect(() => { setCurrentPage(1); }, [groups, rowsPerPage]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar — relative + z-50 ensures dropdowns render above the table */}
      <div className="relative z-50 flex items-center gap-2 flex-wrap">
        <GroupByDropdown value={groupBy1} onChange={setGroupBy1} exclude={groupBy2} />
        <GroupByDropdown value={groupBy2} onChange={setGroupBy2} exclude={groupBy1} />

        {/* Apply button */}
        <button
          type="button"
          onClick={() => fetchData(committedYear, committedMonths, groupBy1, groupBy2)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-[#5750F1] hover:bg-[#4540D0] disabled:opacity-60 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors"
        >
          Apply
        </button>

        {/* FilterBar: month picker + refresh */}
        <div className="flex-1 min-w-0">
          <FilterBar
            defaultYear={committedYear}
            defaultMonths={committedMonths}
            isRefreshing={loading}
            onCommit={(year, months) => {
              setCommittedYear(year);
              setCommittedMonths(months);
              fetchData(year, months, groupBy1, groupBy2);
            }}
            onRefresh={() => fetchData(committedYear, committedMonths, groupBy1, groupBy2)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Group</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Spend</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Revenue</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Margin</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">ROI</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Share %</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Promise</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Progress</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <LuLoader size={16} className="animate-spin text-[#5750F1]" />
                    <span className="text-xs text-[#9CA3AF]">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-[#9CA3AF]">No data available (click on Apply button to get the data)</td>
              </tr>
            ) : (
              paginatedGroups.map(group => (
                <GroupRow key={group.key} group={group} expanded={expanded} onToggle={toggle} />
              ))
            )}

            {/* Summary / Total row */}
            {!loading && summary && (
              <tr className="border-t-2 border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018]">
                <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">Total</td>
                <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">{fmtMoney(summary.total_spend)}</td>
                <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">{fmtMoney(summary.total_revenue)}</td>
                <td className={`px-3 py-2.5 text-xs font-bold ${summary.gross_margin < 0 ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{fmtMoney(summary.gross_margin)}</td>
                <td className={`px-3 py-2.5 text-xs font-bold ${summary.roi_pct < 0 ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{fmtPct(summary.roi_pct)}</td>
                <td className="px-3 py-2.5 text-xs text-[#9CA3AF]">100.0%</td>
                <td className="px-3 py-2.5 text-xs text-[#9CA3AF]">—</td>
                <td className="px-3 py-2.5 text-xs text-[#9CA3AF]">—</td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationFooter
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalRows={groups.length}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
