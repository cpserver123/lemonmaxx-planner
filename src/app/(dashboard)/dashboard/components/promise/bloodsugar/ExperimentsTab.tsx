"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuFlipVertical2, LuShoppingBag, LuFilter, LuArrowUpDown, LuArrowUp, LuArrowDown, LuLoader } from "react-icons/lu";
import { RxDragHandleDots2 } from "react-icons/rx";
import ActionDrawer, { type DrawerRow, type Category, type Platform } from "../../ActionDrawer";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";

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

interface Experiment {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused" | "Done";
  accountable: string;
  accountableId?: number;
  count: number;
  due: string;
  tabId?: SubTab;
  note?: string;
}

/* --- Tab types ------------------------------------------------------- */
type SubTab = "offer";

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: "offer", label: "Offer", icon: <LuFlipVertical2 size={13} /> },
];

/* --- Experiments data ------------------------------------------------ */
const EXPERIMENTS: Experiment[] = [
  {
    id: "e1",
    title: "Experiment offer",
    description: "Test BRUNO, BIFI, VINCE offers head-to-head to identify the highest-converting Blood Sugar VSL offer.",
    status: "Active",
    accountable: "Yash Poonia",
    count: 3,
    due: "Jun 30",
    tabId: "offer",
  },
];

const INITIAL_EXPERIMENT_ACTIONS: Record<string, ActionRow[]> = {
  e1: [
    {
      id: "a1",
      action: "All 3 offers (BRUNO / BIFI / VINCE) launched with existing ...",
      intendedOutcome: "Head-to-head comparison baseline",
      status: "In Progress",
      due: "2026-06-20",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
    {
      id: "a2",
      action: "1 Winning Offer identified from 3-way comparison",
      intendedOutcome: "Single top-converting offer confirmed",
      status: "Todo",
      due: "2026-06-25",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
    {
      id: "a3",
      action: "Winning offer scaled and locked for July",
      intendedOutcome: "Budget shifted to winner at scale",
      status: "Todo",
      due: "2026-06-30",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
  ],
  e2: [
    {
      id: "a4",
      action: "Launch broad audience test",
      intendedOutcome: "Identify top performing demographics",
      status: "Todo",
      due: "2026-07-05",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
    {
      id: "a5",
      action: "Test manual vs auto bidding",
      intendedOutcome: "Find lowest CPA configuration",
      status: "Planned",
      due: "2026-07-10",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
  ],
  e3: [
    {
      id: "a6",
      action: "A/B test simplified checkout form",
      intendedOutcome: "Increase checkout completion rate",
      status: "In Progress",
      due: "2026-07-20",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
      completed: false,
    },
    {
      id: "a7",
      action: "Add 1-click upsell after purchase",
      intendedOutcome: "Increase average order value",
      status: "Todo",
      due: "2026-07-25",
      accountable: "Yash Poonia",
      linkTo: "Mukesh Kumar",
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
        onChange={(e) => updateExpStatus?.(id, e.target.value)}
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

function ExperimentBadge({ status }: { status: string }) {
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

let openExpDrawer: ((row: ActionRow) => void) | null = null;
let updateExpStatus: ((id: string, status: string) => void) | null = null;

const columns = [
  colHelper.accessor("action", {
    header: "Action",
    size: 260,
    minSize: 120,
    cell: (info) => (
      <button
        onClick={() => openExpDrawer?.(info.row.original)}
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

/* --- Experiment Card -------------------------------------------------- */
function ExperimentCard({
  experiment,
  actions,
  onOpenDrawer,
  onEditTitle,
}: {
  experiment: Experiment;
  actions: ActionRow[];
  onOpenDrawer: (row: ActionRow) => void;
  onEditTitle: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

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
      {collapsed && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer" onClick={() => setCollapsed(false)}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 border border-[#5750F1]/20">
              <span className="text-[#5750F1] text-xs">🧪</span>
            </div>
            <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{experiment.title}</span>
            <ExperimentBadge status={derivedStatus} />
          </div>
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{experiment.description}</p>
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pl-10 sm:pl-0 sm:shrink-0">
            <span>👤 {experiment.accountable}</span>
            <span>📊 {experiment.count}</span>
            <span>📅 {experiment.due}</span>
          </div>
        </div>
      )}

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
                <span className="text-[#5750F1] text-sm">🧪</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="text-sm font-semibold text-[#111928] dark:text-white cursor-pointer hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors break-words"
                    onClick={onEditTitle}
                    title="Click to edit pathway name"
                  >
                    {experiment.title}
                  </h3>
                  <ExperimentBadge status={derivedStatus} />
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">{experiment.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pl-11 sm:pl-0 sm:shrink-0">
              <span>👤 {experiment.accountable}</span>
              <span>📊 {experiment.count}</span>
              <span>📅 {experiment.due}</span>
            </div>
          </div>
          <ActionsTable data={actions} onAddAction={handleAddAction} />
        </>
      )}
    </div>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function ExperimentsTab({ ownOfferId, selectedMonth, selectedYear }: { ownOfferId?: string | null; selectedMonth?: number; selectedYear?: number }) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>("offer");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentActions, setExperimentActions] = useState<Record<string, ActionRow[]>>({});
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);
  const [pendingExpId, setPendingExpId] = useState<string | null>(null);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(ownOfferId));

  const fetchPathways = useCallback(async () => {
    if (!ownOfferId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {
        workspace_id: workspaceId,
        own_offer_id: ownOfferId,
        category: "experiments"
      };
      if (selectedMonth != null) params.month = String(selectedMonth).padStart(2, "0");
      if (selectedYear != null) params.year = String(selectedYear);
      const res = await api.get("/api/v1/planner/pathways", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        const categories = res.data.data.categories;
        const pathwaysData = categories.experiments || [];
        
        const newExperiments: Experiment[] = pathwaysData.map((p: any) => ({
          id: String(p.id),
          title: p.name,
          description: p.description || "",
          status: p.status === "active" ? "Active" : p.status,
          accountable: p.accountable_name || p.to_whom_name || "Unassigned",
          accountableId: p.accountable_id,
          count: p.actions?.length || 0,
          due: p.due_date || "-",
          tabId: activeTab,
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

        setExperiments(newExperiments);
        setExperimentActions(newActions);
      }
    } catch (err) {
      console.error("Failed to fetch pathways:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, ownOfferId, token, activeTab, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPathways();
  }, [fetchPathways]);

  openExpDrawer = (row: ActionRow) => {
    let foundExpId = null;
    for (const [eId, actions] of Object.entries(experimentActions)) {
      if (actions.some(a => a.id === row.id)) {
        foundExpId = eId;
        break;
      }
    }
    setPendingExpId(foundExpId);
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

  updateExpStatus = async (id: string, status: string) => {
    setExperimentActions(prev => {
      const next = { ...prev };
      for (const eId of Object.keys(next)) {
        if (next[eId].some(a => a.id === id)) {
          next[eId] = next[eId].map(a => a.id === id ? { ...a, status } : a);
        }
      }
      return next;
    });

    if (/^\d+$/.test(id)) {
      let foundPathwayId: string | null = null;
      let targetActionsList: ActionRow[] = [];
      for (const [eId, actions] of Object.entries(experimentActions)) {
        if (actions.some(a => a.id === id)) {
          foundPathwayId = eId;
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
          const pathwayObj = experiments.find(e => e.id === foundPathwayId);
          if (pathwayObj) {
            const currentPathwayStatus = (pathwayObj.status || "").toLowerCase();
            if (currentPathwayStatus !== newPathwayStatus) {
              const metadataPayload = {
                workspace_id: workspaceId,
                own_offer_id: Number(ownOfferId) || 0,
                name: pathwayObj.title,
                description: pathwayObj.description || "",
                category: "experiments",
                status: newPathwayStatus,
                due_date: pathwayObj.due || "-",
                accountable_id: pathwayObj.accountableId || 0,
                note: pathwayObj.note || ""
              };

              await api.put(`/api/v1/planner/pathways/${foundPathwayId}`, metadataPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              setExperiments(prev => prev.map(e => e.id === foundPathwayId ? { ...e, status: allDone ? "Done" : "Active" } : e));
            }
          }
        } catch (err) {
          console.error("Failed to update action/pathway status:", err);
        }
      }
    }
  };

  const handleOpenDrawer = (expId: string, row: ActionRow) => {
    setPendingExpId(expId);
    setEditingExpId(null);
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

  const handleEditTitle = (expId: string) => {
    const e = experiments.find(e => e.id === expId);
    if (!e) return;
    setEditingExpId(expId);
    setPendingExpId(null);
    setSelectedAction({
      id: e.id,
      action: "",
      intendedOutcome: "",
      status: e.status,
      due: e.due,
      accountable: e.accountable,
      linkTo: "",
      pathwayTitle: e.title,
      pathwayDesc: e.description,
    });
  };

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
      {loading ? (
        <div className="p-4 flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0d1520]">
          <LuLoader className="animate-spin text-[#5750F1]" size={24} />
          <p className="mt-2 text-sm text-[#9CA3AF]">Loading pathways...</p>
        </div>
      ) : (
        /* Experiment cards */
        <div className="px-4 pt-4 pb-3 flex flex-col gap-4">
          {experiments.filter(e => e.tabId === "offer" || !e.tabId).length === 0 ? (
            <p className="text-sm text-[#9CA3AF] dark:text-[#6B7280] py-4 text-center">There are no pathways</p>
          ) : (
            experiments.filter(e => e.tabId === "offer" || !e.tabId).map((exp) => (
              <ExperimentCard
                key={exp.id}
                experiment={exp}
                actions={experimentActions[exp.id] ?? []}
                onOpenDrawer={(row) => handleOpenDrawer(exp.id, row)}
                onEditTitle={() => handleEditTitle(exp.id)}
              />
            ))
          )}

          {/* Add Pathway button */}
          <button
            onClick={() => {
              setPendingExpId(null);
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
        </div>
      )}

      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        performance="experiments"
        isPathway={editingExpId !== null || (selectedAction !== null && !pendingExpId)}
        hideAddAnother={Boolean(pendingExpId)}
        title={pendingExpId ? experiments.find(e => e.id === pendingExpId)?.title : undefined}
        onClose={() => { setSelectedAction(null); setPendingExpId(null); setEditingExpId(null); }}
        pathwayId={editingExpId || pendingExpId}
        onSave={async (updated) => {
          // Case 1: editing an existing experiment title
          if (editingExpId) {
            const metadataPayload = {
              workspace_id: workspaceId,
              own_offer_id: Number(ownOfferId) || 0,
              name: updated.pathwayTitle || "",
              description: updated.pathwayDesc || "",
              category: "experiments",
              status: (updated.status || "planned").toLowerCase(),
              due_date: updated.due || "-",
              accountable_id: updated.accountableId || 0,
              note: updated.note || ""
            };

            try {
              // 1. Update pathway metadata
              await api.put(`/api/v1/planner/pathways/${editingExpId}`, metadataPayload, {
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
                    pathway_id: Number(editingExpId),
                    title: a.action,
                    intended_outcome: a.intendedOutcome || "",
                    category: (a.category || "breakdowns").toLowerCase(),
                    platform: a.platform || "Meta",
                    status: (updated.status || "planned").toLowerCase()
                  };

                  if (isNewAction) {
                    if (a.action.trim()) {
                      await api.post(
                        `/api/v1/planner/pathways/${editingExpId}/actions?workspace_id=${workspaceId}`,
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
            } catch (error) {
              console.error("Failed to update pathway/actions:", error);
            }
            return editingExpId;
          }
          
          if (pendingExpId) {
            const isNewAction = !/^\d+$/.test(updated.id);
            const actionPayload = {
              pathway_id: Number(pendingExpId),
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
                    `/api/v1/planner/pathways/${pendingExpId}/actions?workspace_id=${workspaceId}`,
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
              const currentActions = experimentActions[pendingExpId] || [];
              const otherActions = currentActions.filter(a => a.id !== updated.id);
              const allActions = [...otherActions];
              if (updated.action.trim()) {
                allActions.push({ ...updated, status: updated.status, completed: false });
              }
              const allDone = allActions.length > 0 && allActions.every(a => a.status.toLowerCase() === "done");
              const newPathwayStatus = allDone ? "done" : "active";

              const pathwayObj = experiments.find(e => e.id === pendingExpId);
              if (pathwayObj) {
                const currentPathwayStatus = (pathwayObj.status || "").toLowerCase();
                if (currentPathwayStatus !== newPathwayStatus) {
                  const metadataPayload = {
                    workspace_id: workspaceId,
                    own_offer_id: Number(ownOfferId) || 0,
                    name: pathwayObj.title,
                    description: pathwayObj.description || "",
                    category: "experiments",
                    status: newPathwayStatus,
                    due_date: pathwayObj.due || "-",
                    accountable_id: pathwayObj.accountableId || 0,
                    note: pathwayObj.note || ""
                  };
                  await api.put(`/api/v1/planner/pathways/${pendingExpId}`, metadataPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                }
              }

              await fetchPathways();
            } catch (error) {
              console.error("Failed to save action/pathway:", error);
            }
            return pendingExpId;
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
              name: updated.pathwayTitle || "Untitled Experiment",
              description: updated.pathwayDesc || "",
              category: "experiments",
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
                return res.data.data.id;
              }
            } catch (error) {
              console.error("Failed to create experiment pathway:", error);
            }
          }
        }}
        onDelete={(id) => {
          if (pendingExpId) {
            setExperimentActions(prev => ({
              ...prev,
              [pendingExpId]: (prev[pendingExpId] ?? []).filter(r => r.id !== id),
            }));
          }
          setSelectedAction(null);
          setPendingExpId(null);
        }}
      />
    </div>
  );
}
