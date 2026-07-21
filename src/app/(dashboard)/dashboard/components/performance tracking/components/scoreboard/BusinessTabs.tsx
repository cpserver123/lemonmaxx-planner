"use client";

import { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuChevronRight, LuRefreshCw, LuDownload, LuCheck } from "react-icons/lu";
import { TbRefresh } from "react-icons/tb";
import FilterBar from "./FilterBar";

/* --- Data ------------------------------------------------------------ */
interface Row {
  id:        string;
  label:     string;
  spend:     string;
  revenue:   string;
  xRevenue:  string;
  margin:    string;
  marginPct: string;
  roi:       string;
  roiNeg:    boolean;
  promise:   string;
  progress:  string;
  progNeg:   boolean;
  children?: Row[];
}

const TABLE_DATA: Row[] = [
  {
    id: "telehealth",
    label: "Telehealth",
    spend: "$53,702", revenue: "$34,181", xRevenue: "$0",
    margin: "-$19,521", marginPct: "", roi: "-36.4%", roiNeg: true,
    promise: "$20,000", progress: "-97.6%", progNeg: true,
  },
  {
    id: "vsl",
    label: "VSL",
    spend: "$194,946", revenue: "$273,694", xRevenue: "$1,660",
    margin: "$80,428", marginPct: "", roi: "41.3%", roiNeg: false,
    promise: "$180,000", progress: "44.7%", progNeg: false,
    children: [
      {
        id: "bloodsugar",
        label: "Blood Sugar",
        spend: "$1,877", revenue: "$1,720", xRevenue: "$0",
        margin: "-$157", marginPct: "", roi: "-8.4%", roiNeg: true,
        promise: "$30,000", progress: "-0.5%", progNeg: true,
      },
      {
        id: "memory",
        label: "Memory",
        spend: "$23,809", revenue: "$28,170", xRevenue: "$1,680",
        margin: "$6,041", marginPct: "", roi: "25.4%", roiNeg: false,
        promise: "$110,000", progress: "5.5%", progNeg: false,
      },
      {
        id: "weightloss",
        label: "Weight Loss",
        spend: "$169,260", revenue: "$243,804", xRevenue: "$0",
        margin: "$74,544", marginPct: "", roi: "44.0%", roiNeg: false,
        promise: "$40,000", progress: "186.4%", progNeg: false,
      },
    ],
  },
];

const TOTAL_ROW: Row = {
  id: "total",
  label: "Total",
  spend: "$248,649", revenue: "$307,875", xRevenue: "$1,680",
  margin: "$60,906", marginPct: "", roi: "24.5%", roiNeg: false,
  promise: "$200,000", progress: "30.5%", progNeg: false,
};

/* --- Group-By Dropdown ----------------------------------------------- */
const GROUP_BY_OPTIONS = ["None", "Vertical", "Member", "offer ", "Team Leader", "Platform", "Week", "Date"] as const;
type GroupByOption = typeof GROUP_BY_OPTIONS[number];

function GroupByDropdown({ value, onChange }: { value: GroupByOption; onChange: (v: GroupByOption) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
      >
        {value} <LuChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 z-[9999] min-w-[160px] rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#111927] shadow-xl py-1 overflow-hidden">
          {GROUP_BY_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors text-left ${
                opt === value
                  ? "bg-[#CCFF00] text-black"
                  : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
              }`}
            >
              {opt === value ? <LuCheck size={12} className="shrink-0" /> : <span className="w-3 shrink-0" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Progress Ring --------------------------------------------------- */
function ProgressRing({ pct, neg }: { pct: number; neg: boolean }) {
  const r   = 9;
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

/* --- Table Row ------------------------------------------------------- */
function TableRow({ row, depth = 0, expanded, onToggle }: {
  row: Row; depth?: number; expanded: Set<string>; onToggle: (id: string) => void;
}) {
  const hasChildren = !!row.children?.length;
  const isExpanded  = expanded.has(row.id);
  const pctNum      = parseFloat(row.progress);

  return (
    <>
      <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
        {/* Group */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => onToggle(row.id)} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white">
                {isExpanded ? <LuChevronDown size={13} /> : <LuChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-[13px]" />
            )}
            <span className={`text-xs ${depth === 0 ? "font-semibold text-[#111928] dark:text-white" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>
              {row.label}
            </span>
          </div>
        </td>
        {/* Dots menu */}
        <td className="px-2 py-2.5 w-6">
          <button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button>
        </td>
        {/* Spend */}
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{row.spend}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* Revenue */}
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{row.revenue}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* X-Revenue */}
        <td className="px-3 py-2.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">{row.xRevenue}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* Gross Margin */}
        <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${row.roiNeg ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{row.margin}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* ROI */}
        <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${row.roiNeg ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{row.roi}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* Promise */}
        <td className="px-3 py-2.5 text-xs text-[#111928] dark:text-[#D1D5DB] whitespace-nowrap">{row.promise}</td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
        {/* Progress */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <ProgressRing pct={pctNum} neg={row.progNeg} />
            <span className={`text-xs font-semibold whitespace-nowrap ${row.progNeg ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>
              {row.progress}
            </span>
          </div>
        </td>
        <td className="px-2 py-2.5 w-6"><button className="text-[#D1D5DB] dark:text-[#374151] hover:text-[#6B7280]"><LuRefreshCw size={13} /></button></td>
      </tr>
      {/* Children */}
      {hasChildren && isExpanded && row.children!.map((child) => (
        <TableRow key={child.id} row={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
      ))}
    </>
  );
}

/* --- Business Tab ---------------------------------------------------- */
export default function BusinessTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["vsl"]));
  const [groupBy1, setGroupBy1] = useState<GroupByOption>("Vertical");
  const [groupBy2, setGroupBy2] = useState<GroupByOption>("Member");

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPct = parseFloat(TOTAL_ROW.progress);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Dropdowns */}
        <GroupByDropdown value={groupBy1} onChange={setGroupBy1} />
        <GroupByDropdown value={groupBy2} onChange={setGroupBy2} />
        {/* Action icons */}
        <div className="flex items-center gap-1.5 ml-1">
          <button className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><TbRefresh size={14} /></button>
          <button className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuRefreshCw size={14} /></button>
          <button className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuDownload size={14} /></button>
        </div>
        {/* FilterBar handles search + date */}
        <div className="flex-1 min-w-0">
          <FilterBar />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Group</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Spend</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Revenue</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">X-Revenue</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Gross Margin</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">ROI</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Promise</th>
              <th className="w-6" />
              <th className="px-3 py-2.5 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">Progress</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {TABLE_DATA.map((row) => (
              <TableRow key={row.id} row={row} expanded={expanded} onToggle={toggle} />
            ))}
            {/* Total */}
            <tr className="border-t-2 border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018]">
              <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">Total</td>
              <td />
              <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">{TOTAL_ROW.spend}</td>
              <td />
              <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">{TOTAL_ROW.revenue}</td>
              <td />
              <td className="px-3 py-2.5 text-xs text-[#6B7280] dark:text-[#9CA3AF]">{TOTAL_ROW.xRevenue}</td>
              <td />
              <td className="px-3 py-2.5 text-xs font-bold text-[#2563eb]">{TOTAL_ROW.margin}</td>
              <td />
              <td className="px-3 py-2.5 text-xs font-bold text-[#2563eb]">{TOTAL_ROW.roi}</td>
              <td />
              <td className="px-3 py-2.5 text-xs font-bold text-[#111928] dark:text-white">{TOTAL_ROW.promise}</td>
              <td />
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <ProgressRing pct={totalPct} neg={TOTAL_ROW.progNeg} />
                  <span className="text-xs font-bold text-[#2563eb]">{TOTAL_ROW.progress}</span>
                </div>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
