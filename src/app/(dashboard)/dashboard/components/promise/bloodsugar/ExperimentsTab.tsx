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
import { LuFlipVertical2, LuShoppingBag, LuFilter, LuArrowUpDown, LuArrowUp, LuArrowDown } from "react-icons/lu";
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

interface Experiment {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused";
  accountable: string;
  count: number;
  due: string;
}

/* --- Tab types ------------------------------------------------------- */
type SubTab = "media-buying" | "funnel" | "offer";

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: "media-buying", label: "Media Buying", icon: <LuShoppingBag size={13} /> },
  { id: "funnel",       label: "Funnel",        icon: <LuFilter size={13} /> },
  { id: "offer",        label: "Offer",          icon: <LuFlipVertical2 size={13} /> },
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

function ExperimentBadge({ status }: { status: Experiment["status"] }) {
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

let openExpDrawer: ((row: ActionRow) => void) | null = null;

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

/* --- Create Experiment Modal ----------------------------------------- */
const TAB_LABELS: Record<SubTab, string> = {
  "media-buying": "Media Buying",
  funnel: "Funnel",
  offer: "Offer",
};

function CreateExperimentModal({ open, tab, onClose }: { open: boolean; tab: SubTab | null; onClose: () => void }) {
  const [statement, setStatement]   = useState("");
  const [nickname, setNickname]     = useState("");
  const [description, setDescription] = useState("");

  const label = tab ? TAB_LABELS[tab] : "";

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50" onClick={onClose} />}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white dark:bg-[#111928] shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-6 pt-7 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">⚙️</span>
              <h2 className="text-base font-bold text-[#111928] dark:text-white">Create {label} Experiment</h2>
            </div>
            <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">Create a {label.toLowerCase()} experiment</p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors mt-0.5 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">Statement <span className="text-red-500">*</span></label>
            <input type="text" value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="What will be achieved" className="w-full rounded-lg border border-[#2563eb] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:ring-1 focus:ring-[#2563eb]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">Nickname <span className="text-red-500">*</span></label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Short name for the pathway" className="w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">Description <span className="text-[#9CA3AF] font-normal">(Optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add additional context..." rows={4} className="w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:border-[#5750F1] resize-none transition-colors" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37]">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-medium text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 rounded-lg bg-[#5750F1] py-2.5 text-sm font-bold text-white hover:bg-[#4742d4] transition-colors">Create Pathway</button>
        </div>
      </div>
    </>
  );
}

/* --- Experiment Card -------------------------------------------------- */
function ExperimentCard({
  experiment,
  actions,
  onOpenDrawer,
}: {
  experiment: Experiment;
  actions: ActionRow[];
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
      {collapsed && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#111928] border-b border-[#E6EBF1] dark:border-transparent cursor-pointer" onClick={() => setCollapsed(false)}>
          <button className="text-[#9CA3AF] shrink-0" aria-label="Expand">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: "rotate(180deg)" }}>
              <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5750F1]/10 border border-[#5750F1]/20">
            <span className="text-[#5750F1] text-xs">🧪</span>
          </div>
          <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{experiment.title}</span>
          <ExperimentBadge status={experiment.status} />
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{experiment.description}</p>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span>👤 {experiment.accountable}</span>
            <span>📊 {experiment.count}</span>
            <span>📅 {experiment.due}</span>
          </div>
        </div>
      )}

      {!collapsed && (
        <>
          <div className="flex items-start gap-3 px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
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
                <h3 className="text-sm font-semibold text-[#111928] dark:text-white">{experiment.title}</h3>
                <ExperimentBadge status={experiment.status} />
              </div>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">{experiment.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
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
export default function ExperimentsTab() {
  const [openModal, setOpenModal] = useState<SubTab | null>(null);
  const [experimentActions, setExperimentActions] = useState<Record<string, ActionRow[]>>(INITIAL_EXPERIMENT_ACTIONS);
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);
  const [pendingExpId, setPendingExpId] = useState<string | null>(null);

  openExpDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             row.due,
    accountable:     row.accountable,
    linkTo:          row.linkTo,
  });

  const handleOpenDrawer = (expId: string, row: DrawerRow) => {
    setPendingExpId(expId);
    setSelectedAction(row);
  };

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setOpenModal(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-white dark:hover:bg-[#0d1520] border-b-2 border-transparent transition-colors"
          >
            <span className="text-[#9CA3AF]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Experiment cards */}
      <div className="p-4 flex flex-col gap-4">
        {EXPERIMENTS.map((exp) => (
          <ExperimentCard
            key={exp.id}
            experiment={exp}
            actions={experimentActions[exp.id] ?? []}
            onOpenDrawer={(row) => handleOpenDrawer(exp.id, row)}
          />
        ))}

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

      {/* Create Experiment Modal */}
      <CreateExperimentModal
        open={openModal !== null}
        tab={openModal}
        onClose={() => setOpenModal(null)}
      />

      {/* Action Drawer */}
      <ActionDrawer
        row={selectedAction}
        onClose={() => { setSelectedAction(null); setPendingExpId(null); }}
        onSave={(updated) => {
          if (pendingExpId) {
            setExperimentActions(prev => {
              const existing = prev[pendingExpId] ?? [];
              const found = existing.some(r => r.id === updated.id);
              return {
                ...prev,
                [pendingExpId]: found
                  ? existing.map(r => r.id === updated.id ? { ...r, ...updated } : r)
                  : [...existing, { ...updated, completed: false }],
              };
            });
          }
          setSelectedAction(null);
          setPendingExpId(null);
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
