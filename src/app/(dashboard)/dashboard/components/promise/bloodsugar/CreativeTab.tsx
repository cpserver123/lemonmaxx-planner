"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import ActionDrawer, { type DrawerRow, type Category, type Platform } from "../../ActionDrawer";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuFlipVertical2, LuShoppingBag, LuFilter, LuArrowUpDown, LuArrowUp, LuArrowDown, LuLoader, LuTrash2 } from "react-icons/lu";
import { RxDragHandleDots2 } from "react-icons/rx";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

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
  category?: Category;
  platform?: Platform;
}

interface Pathway {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused" | "Done";
  accountable: string;
  accountableId?: number;
  count: number;
  due: string;
  note?: string;
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
function StatusDropdown({ id, status }: { id: string, status: string }) {
  const OPTIONS = [
    "Planned",
    "Done",
    "Not Done",
    "Partially Done",
    "Cancelled",
    "On Hold",
    "In Progress"
  ];
  const styles: Record<string, string> = {
    "Done":           "bg-green-500/10 text-green-500 border-green-500/20",
    "In Progress":    "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Todo":           "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
    "Planned":        "bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20",
    "Not Done":       "bg-red-500/10 text-red-500 border-red-500/20",
    "Partially Done": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    "Cancelled":      "bg-red-500/10 text-red-500 border-red-500/20",
    "On Hold":        "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => updateCreativeStatus?.(id, e.target.value)}
        className={`appearance-none cursor-pointer inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold outline-none ${styles[status] ?? styles["Todo"]}`}
      >
        {!OPTIONS.includes(status) && <option value={status} className="text-black bg-white">{status}</option>}
        {OPTIONS.map(opt => (
          <option key={opt} value={opt} className="text-black bg-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* --- Pathway Badge --------------------------------------------------- */
function PathwayBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#2563eb]",
    Draft:  "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    Paused: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    Done:   "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? map["Active"]}`}>
      {status}
    </span>
  );
}

/* --- Column definitions (module-level) ------------------------------ */
const colHelper = createColumnHelper<ActionRow>();

let openCreativeDrawer: ((row: ActionRow) => void) | null = null;
let updateCreativeStatus: ((id: string, status: string) => void) | null = null;

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
    cell: (info) => <StatusDropdown id={info.row.original.id} status={info.getValue()} />,
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
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] truncate whitespace-nowrap block" title={info.getValue() || ""}>
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
  onEditTitle,
  onDelete,
}: {
  pathway: Pathway;
  actions: ActionRow[];
  onActionsChange: (pathwayId: string, actions: ActionRow[]) => void;
  onOpenDrawer: (row: ActionRow) => void;
  onEditTitle: () => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive pathway status: "Done" only if every action row is "Done", else "Active"
  const derivedStatus = actions.length > 0 && actions.every(a => a.status?.toLowerCase() === "done")
    ? "Done"
    : "Active";

  const handleAddAction = () => {
    onOpenDrawer({
      id: crypto.randomUUID(),
      action: "",
      intendedOutcome: "",
      status: "Todo",
      due: "",
      accountable: "",
      linkTo: "",
      completed: false,
    });
  };

  return (
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] overflow-hidden">
      {/* Collapsed bar */}
      {collapsed && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer" onClick={() => setCollapsed(false)}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 border border-[#5750F1]/20">
              <span className="text-[#5750F1] text-xs">🎨</span>
            </div>
            <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{pathway.title}</span>
            <PathwayBadge status={derivedStatus} />
          </div>
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{pathway.description}</p>
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pl-10 sm:pl-0 sm:shrink-0">
            <span>👤 {pathway.accountable}</span>
            <span>📊 {pathway.count}</span>
            <span>📅 {pathway.due}</span>
          </div>
        </div>
      )}

      {/* Expanded header */}
      {!collapsed && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
            <div className="flex items-start gap-3 w-full sm:flex-1 min-w-0">
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
                  <h3
                    className="text-sm font-semibold text-[#111928] dark:text-white cursor-pointer hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors break-words"
                    onClick={onEditTitle}
                    title="Click to edit pathway name"
                  >
                    {pathway.title}
                  </h3>
                  <PathwayBadge status={derivedStatus} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                    title="Delete pathway"
                    className="ml-1 flex items-center justify-center rounded p-1 text-[#9CA3AF] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">{pathway.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pl-11 sm:pl-0 sm:shrink-0">
              <span>👤 {pathway.accountable}</span>
              <span>📊 {pathway.count}</span>
              <span>📅 {pathway.due}</span>
            </div>
          </div>
          <ActionsTable data={actions} onAddAction={handleAddAction} />
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111928] rounded-2xl shadow-2xl border border-[#E6EBF1] dark:border-[#1F2A37] w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                <LuTrash2 size={22} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-[#111928] dark:text-white text-center mb-2">Delete Pathway</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] text-center mb-6">
              Are you really want to delete the pathway? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-4 py-2.5 text-sm font-medium text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => { setIsDeleting(true); await onDelete(); setIsDeleting(false); setShowDeleteModal(false); }}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? <><LuLoader size={14} className="animate-spin" /> Deleting…</> : <><LuTrash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function CreativeTab({ ownOfferId, selectedMonth, selectedYear }: { ownOfferId?: string | null; selectedMonth?: number; selectedYear?: number }) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [pathwayActions, setPathwayActions] = useState<Record<string, ActionRow[]>>({});
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);
  const [pendingPathwayId, setPendingPathwayId] = useState<string | null>(null);
  const [editingPathwayId, setEditingPathwayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(ownOfferId));

  const fetchPathways = useCallback(async () => {
    if (!ownOfferId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {
        workspace_id: workspaceId,
        own_offer_id: ownOfferId,
        category: "creative"
      };
      if (selectedMonth != null) params.month = String(selectedMonth).padStart(2, "0");
      if (selectedYear != null) params.year = String(selectedYear);
      const res = await api.get("/api/v1/planner/pathways", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        const categories = res.data.data.categories;
        const pathwaysData = categories.creative || [];
        
        const newPathways: Pathway[] = pathwaysData.map((p: any) => ({
          id: String(p.id),
          title: p.name,
          description: p.description || "",
          status: p.status === "active" ? "Active" : p.status,
          accountable: p.accountable_name || p.to_whom_name || "Unassigned",
          accountableId: p.accountable_id,
          count: p.actions?.length || 0,
          due: p.due_date || "-",
          note: p.note,
        }));

        const newActions: Record<string, ActionRow[]> = {};
        pathwaysData.forEach((p: any) => {
          newActions[String(p.id)] = (p.actions || []).map((a: any) => ({
            id: String(a.id),
            action: a.title,
            intendedOutcome: a.intended_outcome,
            status: a.status === "todo" ? "Todo" : a.status,
            due: p.due_date || "-",
            accountable: p.accountable_name || p.to_whom_name || "Unassigned",
            linkTo: p.to_whom_name || "Unassigned",
            completed: false,
            category: a.category || "",
            platform: a.platform || ""
          }));
        });

        setPathways(newPathways);
        setPathwayActions(newActions);
        toast.success(res.data?.message ?? "Pathways loaded successfully");
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch pathways";
      console.error("Failed to fetch pathways:", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, ownOfferId, token, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPathways();
  }, [fetchPathways]);

  openCreativeDrawer = (row: ActionRow) => {
    let foundPathwayId = null;
    for (const [pId, actions] of Object.entries(pathwayActions)) {
      if (actions.some(a => a.id === row.id)) {
        foundPathwayId = pId;
        break;
      }
    }
    setPendingPathwayId(foundPathwayId);
    setSelectedAction({
      id:              row.id,
      action:          row.action,
      intendedOutcome: row.intendedOutcome,
      status:          row.status,
      due:             row.due,
      accountable:     row.accountable,
      linkTo:          row.linkTo,
      category:        row.category,
      platform:        row.platform,
    });
  };

  updateCreativeStatus = async (id: string, status: string) => {
     setPathwayActions(prev => {
       const next = { ...prev };
       for (const pId of Object.keys(next)) {
         if (next[pId].some(a => a.id === id)) {
           next[pId] = next[pId].map(a => a.id === id ? { ...a, status } : a);
         }
       }
       return next;
     });

    if (/^\d+$/.test(id)) {
      let foundPathwayId: string | null = null;
      let targetActionsList: ActionRow[] = [];
      for (const [pId, actions] of Object.entries(pathwayActions)) {
        if (actions.some(a => a.id === id)) {
          foundPathwayId = pId;
          targetActionsList = actions;
          break;
        }
      }

      if (foundPathwayId) {
        const updatedActions = targetActionsList.map(a => a.id === id ? { ...a, status } : a);
        const allDone = updatedActions.length > 0 && updatedActions.every(a => a.status.toLowerCase() === "done");
        const newPathwayStatus = allDone ? "done" : "active";

        try {
          const targetAction = targetActionsList.find(a => a.id === id);
          if (targetAction) {
            const payload = {
              title: targetAction.action || "Untitled Action",
              intended_outcome: targetAction.intendedOutcome || "",
              category: (targetAction.category || "breakdowns").toLowerCase(),
              platform: targetAction.platform || "Meta",
              status: status.toLowerCase()
            };

            await api.put(`/api/v1/planner/pathways/actions/${id}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }

          // Get current pathway details from state to update status if changed
          const pathwayObj = pathways.find(p => p.id === foundPathwayId);
          if (pathwayObj) {
            const currentPathwayStatus = (pathwayObj.status || "").toLowerCase();
            if (currentPathwayStatus !== newPathwayStatus) {
              const metadataPayload = {
                workspace_id: workspaceId,
                own_offer_id: Number(ownOfferId) || 0,
                name: pathwayObj.title,
                description: pathwayObj.description || "",
                category: "creative",
                status: newPathwayStatus,
                due_date: pathwayObj.due || "-",
                accountable_id: pathwayObj.accountableId || 0,
                note: pathwayObj.note || ""
              };

              await api.put(`/api/v1/planner/pathways/${foundPathwayId}`, metadataPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              setPathways(prev => prev.map(p => p.id === foundPathwayId ? { ...p, status: allDone ? "Done" : "Active" } : p));
            }
          }
        } catch (err) {
          const msg = (err as any)?.response?.data?.message ?? "Failed to update action status";
          console.error("Failed to update action/pathway status:", err);
          toast.error(msg);
        }
      }
    }
  };

  const handleOpenDrawer = (pathwayId: string, row: ActionRow) => {
    setPendingPathwayId(pathwayId);
    setEditingPathwayId(null);
    setSelectedAction({
      id:              row.id,
      action:          row.action,
      intendedOutcome: row.intendedOutcome,
      status:          row.status,
      due:             row.due,
      accountable:     row.accountable,
      linkTo:          row.linkTo,
      category:        row.category,
      platform:        row.platform,
    });
  };

  const handleEditTitle = (pathwayId: string) => {
    const p = pathways.find(p => p.id === pathwayId);
    if (!p) return;
    setEditingPathwayId(pathwayId);
    setPendingPathwayId(null);
    setSelectedAction({
      id: p.id,
      action: "",
      intendedOutcome: "",
      status: p.status,
      due: p.due,
      accountable: p.accountable,
      linkTo: "",
      pathwayTitle: p.title,
      pathwayDesc: p.description,
    });
  };

  const deletePathway = async (pathwayId: string) => {
    try {
      const res = await api.delete(`/api/v1/planner/pathways/${pathwayId}`, {
        params: { workspace_id: workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success((res.data as any)?.message ?? "Pathway deleted successfully");
      await fetchPathways();
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to delete pathway";
      console.error("Failed to delete pathway:", err);
      toast.error(msg);
    }
  };

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-4 pt-4 pb-3 flex flex-col gap-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LuLoader className="animate-spin text-[#5750F1]" size={24} />
          <p className="mt-2 text-sm text-[#9CA3AF]">Loading pathways...</p>
        </div>
      ) : (
        <>
          {pathways.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] dark:text-[#6B7280] py-4 text-center">There are no pathways</p>
          ) : (
            pathways.map((pathway) => (
              <PathwayCard
                key={pathway.id}
                pathway={pathway}
                actions={pathwayActions[pathway.id] ?? []}
                onActionsChange={(id, actions) => setPathwayActions(prev => ({ ...prev, [id]: actions }))}
                onOpenDrawer={(row) => handleOpenDrawer(pathway.id, row)}
                onEditTitle={() => handleEditTitle(pathway.id)}
                onDelete={() => deletePathway(pathway.id)}
              />
            ))
          )}

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
        </>
      )}

      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        performance="creatives"
        isPathway={editingPathwayId !== null || (selectedAction !== null && !pendingPathwayId)}
        hideAddAnother={Boolean(pendingPathwayId)}
        title={pendingPathwayId ? pathways.find(p => p.id === pendingPathwayId)?.title : undefined}
        onClose={() => { setSelectedAction(null); setPendingPathwayId(null); setEditingPathwayId(null); }}
        pathwayId={editingPathwayId || pendingPathwayId}
        onSave={async (updated) => {
          // Case 1: editing an existing pathway title
          if (editingPathwayId) {
            const metadataPayload = {
              workspace_id: workspaceId,
              own_offer_id: Number(ownOfferId) || 0,
              name: updated.pathwayTitle || "",
              description: updated.pathwayDesc || "",
              category: "creative",
              status: (updated.status || "planned").toLowerCase(),
              due_date: updated.due || "-",
              accountable_id: updated.accountableId || 0,
              note: updated.note || ""
            };

            try {
              // 1. Update pathway metadata
              await api.put(`/api/v1/planner/pathways/${editingPathwayId}`, metadataPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              // 2. Update primary action if exists
              if (updated.actionId && /^\d+$/.test(updated.actionId)) {
                const primaryActionPayload = {
                  title: updated.action,
                  intended_outcome: updated.intendedOutcome || "",
                  category: (updated.category || "breakdowns").toLowerCase(),
                  platform: updated.platform || "Meta",
                  status: (updated.status || "planned").toLowerCase()
                };
                await api.put(`/api/v1/planner/pathways/actions/${updated.actionId}`, primaryActionPayload, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }

              // 3. Update or create additional actions
              if (updated.additionalActions) {
                for (const a of updated.additionalActions) {
                  const isNewAction = !/^\d+$/.test(a.id);
                  const actionPayload = {
                    pathway_id: Number(editingPathwayId),
                    title: a.action,
                    intended_outcome: a.intendedOutcome || "",
                    category: (a.category || "breakdowns").toLowerCase(),
                    platform: a.platform || "Meta",
                    status: (updated.status || "planned").toLowerCase()
                  };

                  if (isNewAction) {
                    if (a.action.trim()) {
                      await api.post(
                        `/api/v1/planner/pathways/${editingPathwayId}/actions?workspace_id=${workspaceId}`,
                        actionPayload,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }
                  } else {
                    await api.put(`/api/v1/planner/pathways/actions/${a.id}`, actionPayload, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  }
                }
              }

              await fetchPathways();
              toast.success("Pathway updated successfully");
            } catch (error) {
              const msg = (error as any)?.response?.data?.message ?? "Failed to update pathway";
              console.error("Failed to update pathway/actions:", error);
              toast.error(msg);
            }
            return editingPathwayId;
          }

          if (pendingPathwayId) {
            const isNewAction = !/^\d+$/.test(updated.id);
            const actionPayload = {
              pathway_id: Number(pendingPathwayId),
              title: updated.action,
              intended_outcome: updated.intendedOutcome || "",
              category: (updated.category || "breakdowns").toLowerCase(),
              platform: updated.platform || "Meta",
              status: (updated.status || "planned").toLowerCase()
            };

            try {
              if (isNewAction) {
                if (updated.action.trim()) {
                  await api.post(
                    `/api/v1/planner/pathways/${pendingPathwayId}/actions?workspace_id=${workspaceId}`,
                    actionPayload,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                }
              } else {
                await api.put(`/api/v1/planner/pathways/actions/${updated.id}`, actionPayload, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }

              // Check if all actions of this pathway are now 'done'
              const currentActions = pathwayActions[pendingPathwayId] || [];
              const otherActions = currentActions.filter(a => a.id !== updated.id);
              const allActions = [...otherActions];
              if (updated.action.trim()) {
                allActions.push({ ...updated, status: updated.status, completed: false });
              }
              const allDone = allActions.length > 0 && allActions.every(a => a.status.toLowerCase() === "done");
              const newPathwayStatus = allDone ? "done" : "active";

              const pathwayObj = pathways.find(p => p.id === pendingPathwayId);
              if (pathwayObj) {
                const currentPathwayStatus = (pathwayObj.status || "").toLowerCase();
                if (currentPathwayStatus !== newPathwayStatus) {
                  const metadataPayload = {
                    workspace_id: workspaceId,
                    own_offer_id: Number(ownOfferId) || 0,
                    name: pathwayObj.title,
                    description: pathwayObj.description || "",
                    category: "creative",
                    status: newPathwayStatus,
                    due_date: pathwayObj.due || "-",
                    accountable_id: pathwayObj.accountableId || 0,
                    note: pathwayObj.note || ""
                  };
                  await api.put(`/api/v1/planner/pathways/${pendingPathwayId}`, metadataPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                }
              }

              await fetchPathways();
              toast.success("Action saved successfully");
            } catch (error) {
              const msg = (error as any)?.response?.data?.message ?? "Failed to save action";
              console.error("Failed to save action/pathway:", error);
              toast.error(msg);
            }
            return pendingPathwayId;
          } else {
            const primaryAction = updated.action && updated.action.trim() !== "" ? {
              title: updated.action,
              intended_outcome: updated.intendedOutcome || "",
              category: (updated.category || "breakdowns").toLowerCase(),
              platform: updated.platform || "Meta"
            } : null;

            const extraActions = (updated.additionalActions || [])
              .filter(a => a.action.trim())
              .map(a => ({
                title: a.action,
                intended_outcome: a.intendedOutcome || "",
                category: (a.category || "breakdowns").toLowerCase(),
                platform: a.platform || "Meta"
              }));
              
            const actionsPayload = [];
            if (primaryAction) actionsPayload.push(primaryAction);
            actionsPayload.push(...extraActions);

            const payload = {
              workspace_id: workspaceId,
              own_offer_id: Number(ownOfferId) || 0,
              name: updated.pathwayTitle || "Untitled Pathway",
              description: updated.pathwayDesc || "",
              category: "creative",
              status: (updated.status || "active").toLowerCase(),
              due_date: updated.due || "-",
              accountable_id: updated.accountableId || 0,
              note: updated.note || "",
              actions: actionsPayload
            };

            try {
              const res = await api.post("/api/v1/planner/pathways", payload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (res.data?.success) {
                await fetchPathways();
                toast.success(res.data?.message ?? "Pathway created successfully");
                return res.data.data.id;
              }
            } catch (error) {
              const msg = (error as any)?.response?.data?.message ?? "Failed to create pathway";
              console.error("Failed to create creative pathway:", error);
              toast.error(msg);
            }
          }
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
