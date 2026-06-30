"use client";

import { useState } from "react";
import ActionDrawer, { type DrawerRow } from "../../ActionDrawer";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnResizeMode,
} from "@tanstack/react-table";

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
  due: string;
  estHrs: number | null;
  actual: string;
}

interface Pathway {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused";
  accountable: string;
  count: number;
  due: string;
  actions: ActionRow[];
}

/* --- Dummy data ------------------------------------------------------- */
const PATHWAYS: Pathway[] = [
  {
    id: "p1",
    title: "BIFI/BRUNO/VINCE batches",
    description: "Identify winning creatives by testing BIFI/BRUNO/VINCE batches, achieving ≥1 winner at ≥30% ROI at ≥$5K spend",
    status: "Active",
    accountable: "Yash Poonia",
    count: 2,
    due: "Jun 30",
    actions: [],
  },
  {
    id: "p2",
    title: "HOC creative testing on Blood Sugar",
    description: "HOC new winner creative from spied winner & new winners from batches testing. (Blood Sugar)",
    status: "Active",
    accountable: "Yash Poonia",
    count: 1,
    due: "Jun 30",
    actions: [
      {
        id: "a1", num: 1,
        action: "1 Winning Creative from in-house iteration",
        intendedOutcome: "",
        status: "DONE",
        signal: "",
        crossTeam: "Creative",
        accountable: "Mukesh K.",
        toWhom: "Sumedha",
        due: "6th Jun, 20",
        estHrs: null,
        actual: "",
      },
    ],
  },
];

/* --- Helpers ---------------------------------------------------------- */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DONE:          "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#65a30d] dark:text-[#2563eb]",
    "IN PROGRESS":  "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    OBSERVATION:   "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#65a30d] dark:text-[#2563eb]",
    BLOCKED:       "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  };
  const cls = map[status.toUpperCase()] ?? "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase whitespace-nowrap ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

/* --- Column definition (module-level) -------------------------------- */
const colHelper = createColumnHelper<ActionRow>();

const columns = [
  colHelper.accessor("num", {
    header: "#",
    size: 32,
    minSize: 28,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor("action", {
    header: "Action",
    size: 260,
    minSize: 140,
    cell: (info) => (
      <button
        onClick={() => openCreativeDrawer?.(info.row.original)}
        className="flex items-center gap-1 text-left w-full hover:text-[#5750F1] transition-colors"
      >
        <span className="text-[#9CA3AF]">›</span>
        <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3]">{info.getValue()}</span>
      </button>
    ),
  }),
  colHelper.accessor("intendedOutcome", {
    header: "Intended Outcome",
    size: 160,
    minSize: 80,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor("status", {
    header: "Status",
    size: 110,
    minSize: 80,
    cell: (info) => info.getValue() ? <StatusBadge status={info.getValue()} /> : null,
  }),
  colHelper.accessor("signal", {
    header: "Signal",
    size: 70,
    minSize: 50,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor("crossTeam", {
    header: "Cross T...",
    size: 80,
    minSize: 60,
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor("accountable", {
    header: "Accountable",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return null;
      return (
        <div className="flex items-center gap-1.5">
          <Avatar name={v} color="bg-[#2563eb]" />
          <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] truncate">{v}</span>
        </div>
      );
    },
  }),
  colHelper.accessor("toWhom", {
    header: "To Whom",
    size: 110,
    minSize: 80,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return null;
      return (
        <div className="flex items-center gap-1.5">
          <Avatar name={v} color="bg-[#ec4899]" />
          <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] truncate">{v}</span>
        </div>
      );
    },
  }),
  colHelper.accessor("due", {
    header: "Due",
    size: 90,
    minSize: 60,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor("estHrs", {
    header: "Est (hrs)",
    size: 70,
    minSize: 50,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue() ?? ""}</span>
    ),
  }),
  colHelper.accessor("actual", {
    header: "Actual C...",
    size: 90,
    minSize: 60,
    cell: (info) => (
      <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
];

const coreModel = getCoreRowModel();

/* --- Module-level drawer callback ----------------------------------- */
let openCreativeDrawer: ((row: ActionRow) => void) | null = null;

/* --- Pathway Badge --------------------------------------------------- */
function PathwayBadge({ status }: { status: Pathway["status"] }) {
  const map = {
    Active: "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#65a30d] dark:text-[#2563eb]",
    Draft:  "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    Paused: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

/* --- Single Pathway Card --------------------------------------------- */
function PathwayCard({ pathway }: { pathway: Pathway }) {
  const [collapsed, setCollapsed] = useState(false);

  const table = useReactTable({
    data: pathway.actions,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    getCoreRowModel: coreModel,
  });

  return (
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] overflow-hidden">

      {/* Collapsed bar */}
      {collapsed && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer"
          onClick={() => setCollapsed(false)}
        >
          <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
              <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 dark:bg-[#5750F1]/20 border border-[#5750F1]/20 dark:border-[#5750F1]/30">
            <span className="text-[#5750F1] text-xs">🎨</span>
          </div>
          <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{pathway.title}</span>
          <PathwayBadge status={pathway.status} />
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{pathway.description}</p>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="flex items-center gap-1">👤 {pathway.accountable}</span>
            <span>📊 {pathway.count}</span>
            <span>📅 {pathway.due}</span>
            <span className="text-[#9CA3AF] dark:text-[#6B7280]">›</span>
          </div>
        </div>
      )}

      {/* Expanded header */}
      {!collapsed && (
        <>
          <div className="flex items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white mt-1 transition-colors shrink-0"
              aria-label="Collapse"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5750F1]/10 border border-[#5750F1]/20">
              <span className="text-[#5750F1] text-sm">🎨</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#111928] dark:text-white">{pathway.title}</h3>
                <PathwayBadge status={pathway.status} />
              </div>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">{pathway.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              <span className="flex items-center gap-1">👤 {pathway.accountable}</span>
              <span>📊 {pathway.count}</span>
              <span>📅 {pathway.due}</span>
              <span>🎙</span>
              <button className="hover:text-[#111928] dark:hover:text-white">›</button>
            </div>
          </div>

          {/* Actions Table */}
          <div className="overflow-x-auto">
            <table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }} className="border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    <th className="w-8 px-3 py-1.5" />
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize(), position: "relative" }}
                        className="px-2 py-1.5 text-left"
                      >
                        <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
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
                  <tr
                    key={row.id}
                    className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                  >
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
                {/* Add action */}
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
  );
}

/* --- Main Component -------------------------------------------------- */
export default function CreativeTab() {
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);

  openCreativeDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             row.due,
    accountable:     row.accountable,
    linkTo:          "",
  });

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4 flex flex-col gap-4">
      {PATHWAYS.map((pathway) => (
        <PathwayCard key={pathway.id} pathway={pathway} />
      ))}

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
