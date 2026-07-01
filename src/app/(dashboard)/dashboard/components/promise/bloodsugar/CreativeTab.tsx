"use client";

import { useState, useCallback } from "react";
import ActionDrawer, { type DrawerRow } from "../../ActionDrawer";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuArrowUpDown, LuArrowUp, LuArrowDown } from "react-icons/lu";
import { RxDragHandleDots2 } from "react-icons/rx";

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

interface Pathway {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused";
  accountable: string;
  count: number;
  due: string;
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
  },
  {
    id: "p2",
    title: "HOC creative testing on Blood Sugar",
    description: "HOC new winner creative from spied winner & new winners from batches testing. (Blood Sugar)",
    status: "Active",
    accountable: "Yash Poonia",
    count: 1,
    due: "Jun 30",
  },
];

const INITIAL_PATHWAY_ACTIONS: Record<string, ActionRow[]> = {
  p1: [],
  p2: [
    {
      id: "p2-a1",
      action: "1 Winning Creative from in-house iteration",
      intendedOutcome: "Proven creative variant for scaling",
      status: "Done",
      due: "2026-06-06",
      accountable: "Mukesh Kumar",
      linkTo: "Sumedha",
      completed: false,
    },
  ],
};

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

/* --- Pathway Badge --------------------------------------------------- */
function PathwayBadge({ status }: { status: Pathway["status"] }) {
  const map = {
    Active: "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#2563eb]",
    Draft:  "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    Paused: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

/* --- Column definitions (module-level) ------------------------------ */
const colHelper = createColumnHelper<ActionRow>();

let openCreativeDrawer: ((row: ActionRow) => void) | null = null;

const columns = [
  colHelper.accessor("action", {
    header: "Action",
    size: 260,
    minSize: 120,
    cell: (info) => (
      <button
        onClick={() => openCreativeDrawer?.(info.row.original)}
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

/* --- Actions Table --------------------------------------------------- */
function ActionsTable({
  data,
  onAddAction,
}: {
  data: ActionRow[];
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

/* --- Pathway Card ---------------------------------------------------- */
function PathwayCard({
  pathway,
  actions,
  onActionsChange,
  onOpenDrawer,
}: {
  pathway: Pathway;
  actions: ActionRow[];
  onActionsChange: (pathwayId: string, actions: ActionRow[]) => void;
  onOpenDrawer: (row: DrawerRow) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleAddAction = () => {
    onOpenDrawer({
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
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] overflow-hidden">
      {/* Collapsed bar */}
      {collapsed && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer" onClick={() => setCollapsed(false)}>
          <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
              <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 border border-[#5750F1]/20">
            <span className="text-[#5750F1] text-xs">🎨</span>
          </div>
          <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{pathway.title}</span>
          <PathwayBadge status={pathway.status} />
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{pathway.description}</p>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span>👤 {pathway.accountable}</span>
            <span>📊 {pathway.count}</span>
            <span>📅 {pathway.due}</span>
          </div>
        </div>
      )}

      {/* Expanded header */}
      {!collapsed && (
        <>
          <div className="flex items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
            <button onClick={() => setCollapsed(true)} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white mt-1 transition-colors shrink-0" aria-label="Collapse">
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
              <span>👤 {pathway.accountable}</span>
              <span>📊 {pathway.count}</span>
              <span>📅 {pathway.due}</span>
            </div>
          </div>
          <ActionsTable data={actions} onAddAction={handleAddAction} />
        </>
      )}
    </div>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function CreativeTab() {
  const [pathwayActions, setPathwayActions] = useState<Record<string, ActionRow[]>>(INITIAL_PATHWAY_ACTIONS);
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);
  const [pendingPathwayId, setPendingPathwayId] = useState<string | null>(null);

  openCreativeDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             row.due,
    accountable:     row.accountable,
    linkTo:          row.linkTo,
  });

  const handleOpenDrawer = (pathwayId: string, row: DrawerRow) => {
    setPendingPathwayId(pathwayId);
    setSelectedAction(row);
  };

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4 flex flex-col gap-4">
      {PATHWAYS.map((pathway) => (
        <PathwayCard
          key={pathway.id}
          pathway={pathway}
          actions={pathwayActions[pathway.id] ?? []}
          onActionsChange={(id, actions) => setPathwayActions(prev => ({ ...prev, [id]: actions }))}
          onOpenDrawer={(row) => handleOpenDrawer(pathway.id, row)}
        />
      ))}

      {/* Add Pathway button */}
      <button
        onClick={() => {
          setPendingPathwayId(null);
          setSelectedAction({
            id: crypto.randomUUID(),
            action: "",
            intendedOutcome: "",
            status: "Planned",
            due: "",
            accountable: "",
            linkTo: "",
          });
        }}
        className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors w-fit"
      >
        + Add Pathway
      </button>

      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        onClose={() => { setSelectedAction(null); setPendingPathwayId(null); }}
        onSave={(updated) => {
          if (pendingPathwayId) {
            setPathwayActions(prev => {
              const existing = prev[pendingPathwayId] ?? [];
              const found = existing.some(r => r.id === updated.id);
              return {
                ...prev,
                [pendingPathwayId]: found
                  ? existing.map(r => r.id === updated.id ? { ...r, ...updated } : r)
                  : [...existing, { ...updated, completed: false }],
              };
            });
          }
          setSelectedAction(null);
          setPendingPathwayId(null);
        }}
        onDelete={(id) => {
          if (pendingPathwayId) {
            setPathwayActions(prev => ({
              ...prev,
              [pendingPathwayId]: (prev[pendingPathwayId] ?? []).filter(r => r.id !== id),
            }));
          }
          setSelectedAction(null);
          setPendingPathwayId(null);
        }}
      />
    </div>
  );
}
