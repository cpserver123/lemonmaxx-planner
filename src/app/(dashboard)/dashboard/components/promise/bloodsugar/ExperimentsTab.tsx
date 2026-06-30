"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { LuFlipVertical2, LuShoppingBag, LuFilter, LuX, LuUser, LuCalendar, LuChevronDown } from "react-icons/lu";
import ActionDrawer, { type DrawerRow } from "../../ActionDrawer";

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
}

interface Experiment {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Draft" | "Paused";
  accountable: string;
  count: number;
  due: string;
  actions: ActionRow[];
}

/* --- Tab types ------------------------------------------------------- */
type SubTab = "media-buying" | "funnel" | "offer";

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: "media-buying", label: "Media Buying", icon: <LuShoppingBag size={13} /> },
  { id: "funnel",       label: "Funnel",        icon: <LuFilter size={13} /> },
  { id: "offer",        label: "Offer",          icon: <LuFlipVertical2 size={13} /> },
];

/* --- Always-visible experiments data --------------------------------- */
const EXPERIMENTS: Experiment[] = [
  {
    id: "e1",
    title: "Experiment offer",
    description: "Test BRUNO, BIFI, VINCE offers head-to-head to identify the highest-converting Blood Sugar VSL offer.",
    status: "Active",
    accountable: "Yash Poonia",
    count: 3,
    due: "Jun 30",
    actions: [
      {
        id: "a1", num: 1,
        action: "All 3 offers (BRUNO / BIFI / VINCE) launched with existing ...",
        intendedOutcome: "", status: "OBSERVATION", signal: "", crossTeam: "",
        accountable: "Yash Poonia", toWhom: "Mukesh Kumar", due: "",
      },
      {
        id: "a2", num: 2,
        action: "1 Winning Offer identified from 3-way comparison",
        intendedOutcome: "", status: "OBSERVATION", signal: "", crossTeam: "",
        accountable: "Yash Poonia", toWhom: "Mukesh Kumar", due: "",
      },
      {
        id: "a3", num: 3,
        action: "Winning offer scaled and locked for July",
        intendedOutcome: "", status: "OBSERVATION", signal: "", crossTeam: "",
        accountable: "Yash Poonia", toWhom: "Mukesh Kumar", due: "",
      },
    ],
  },
];

/* --- Helpers ---------------------------------------------------------- */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DONE:        "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#65a30d] dark:text-[#2563eb]",
    OBSERVATION: "bg-[#2563eb]/10 border-[#2563eb]/20 text-[#65a30d] dark:text-[#2563eb]",
    "IN PROGRESS": "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    BLOCKED:     "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
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
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function ExperimentBadge({ status }: { status: Experiment["status"] }) {
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

/* --- Columns ---------------------------------------------------------- */
const colHelper = createColumnHelper<ActionRow>();

const columns = [
  colHelper.accessor("num", {
    header: "#",
    size: 32, minSize: 28,
    cell: (info) => <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>,
  }),
  colHelper.accessor("action", {
    header: "Action",
    size: 260, minSize: 140,
    cell: (info) => (
      <button
        onClick={() => openExpDrawer?.(info.row.original)}
        className="flex items-center gap-1 text-left w-full hover:text-[#5750F1] transition-colors"
      >
        <span className="text-[#9CA3AF]">›</span>
        <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3]">{info.getValue()}</span>
      </button>
    ),
  }),
  colHelper.accessor("intendedOutcome", {
    header: "Intended Outcome",
    size: 160, minSize: 80,
    cell: (info) => <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>,
  }),
  colHelper.accessor("status", {
    header: "Status",
    size: 120, minSize: 80,
    cell: (info) => info.getValue() ? <StatusBadge status={info.getValue()} /> : null,
  }),
  colHelper.accessor("signal", {
    header: "Signal",
    size: 70, minSize: 50,
    cell: (info) => <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>,
  }),
  colHelper.accessor("crossTeam", {
    header: "Cross Team",
    size: 90, minSize: 60,
    cell: (info) => <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>,
  }),
  colHelper.accessor("accountable", {
    header: "Accountable",
    size: 120, minSize: 80,
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
    size: 120, minSize: 80,
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
    size: 80, minSize: 60,
    cell: (info) => <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{info.getValue()}</span>,
  }),
];

const coreModel = getCoreRowModel();

/* --- Module-level drawer callback ----------------------------------- */
let openExpDrawer: ((row: ActionRow) => void) | null = null;

/* --- Experiment Card -------------------------------------------------- */
function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const [collapsed, setCollapsed] = useState(false);

  const table = useReactTable({
    data: experiment.actions,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    getCoreRowModel: coreModel,
  });

  return (
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] overflow-hidden">
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
            <span className="text-[#5750F1] text-xs">🧪</span>
          </div>
          <span className="text-sm font-semibold text-[#111928] dark:text-white truncate">{experiment.title}</span>
          <ExperimentBadge status={experiment.status} />
          <p className="flex-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:block">{experiment.description}</p>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="flex items-center gap-1">👤 {experiment.accountable}</span>
            <span>📊 {experiment.count}</span>
            <span>📅 {experiment.due}</span>
            <span>›</span>
          </div>
        </div>
      )}

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
              <span className="flex items-center gap-1">👤 {experiment.accountable}</span>
              <span>📊 {experiment.count}</span>
              <span>📅 {experiment.due}</span>
              <span>🎙</span>
              <button className="hover:text-[#111928] dark:hover:text-white">›</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }} className="border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    <th className="w-8 px-3 py-1.5">
                      <div className="h-4 w-4 rounded border border-[#D1D5DB] dark:border-[#374151]" />
                    </th>
                    {hg.headers.map((header) => (
                      <th key={header.id} style={{ width: header.getSize(), position: "relative" }} className="px-2 py-1.5 text-left">
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
                  <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
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
  const [clientCommitment, setClientCommitment] = useState(false);
  const [status, setStatus]         = useState("Active");

  const label = tab ? TAB_LABELS[tab] : "";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white dark:bg-[#111928] shadow-2xl flex flex-col transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-7 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">⚙️</span>
              <h2 className="text-base font-bold text-[#111928] dark:text-white">
                Create {label} Experiment
              </h2>
            </div>
            <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
              Create a {label.toLowerCase()} experiment for Experiments
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors mt-0.5">
            <LuX size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Statement */}
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">
              Statement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="What will be achieved"
              className="w-full rounded-lg border border-[#2563eb] dark:border-[#2563eb] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Client Commitment toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setClientCommitment(!clientCommitment)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                clientCommitment ? "bg-[#5750F1]" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
              role="switch"
              aria-checked={clientCommitment}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                clientCommitment ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
            <span className="text-sm font-medium text-[#111928] dark:text-white">Client Commitment</span>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">
              Nickname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Short name for the pathway"
              className="w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:border-[#5750F1] focus:ring-1 focus:ring-[#5750F1] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">
              Description <span className="text-[#9CA3AF] font-normal">(Optional)</span>
            </label>
            {/* Toolbar */}
            <div className="flex items-center gap-1 flex-wrap px-3 py-2 rounded-t-lg border border-b-0 border-[#D1D5DB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1a2332]">
              {["H1","H2","B","I","S","~","≡","≡","\"\"","⊞","↺","↻"].map((icon, i) => (
                <button key={i} className="px-1.5 py-0.5 text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white rounded hover:bg-[#E6EBF1] dark:hover:bg-[#374151] transition-colors">
                  {icon}
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context about this pathway..."
              rows={4}
              className="w-full rounded-b-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white placeholder-[#9CA3AF] outline-none focus:border-[#5750F1] focus:ring-1 focus:ring-[#5750F1] resize-none transition-colors"
            />
          </div>

          {/* Accountable / Start Date / Due Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">
                Accountable Person <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-2.5 py-2">
                <LuUser size={13} className="text-[#9CA3AF] shrink-0" />
                <span className="text-xs text-[#9CA3AF] flex-1">Select person</span>
                <LuChevronDown size={12} className="text-[#9CA3AF] shrink-0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Start Date</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-2.5 py-2">
                <LuCalendar size={13} className="text-[#9CA3AF] shrink-0" />
                <span className="text-xs text-[#9CA3AF]">Start date</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Due Date</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-2.5 py-2">
                <LuCalendar size={13} className="text-[#9CA3AF] shrink-0" />
                <span className="text-xs text-[#9CA3AF]">Due date</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-[#111928] dark:text-white mb-1.5">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#1a2332] px-3 py-2.5 text-sm text-[#111928] dark:text-white outline-none focus:border-[#5750F1] transition-colors cursor-pointer"
              >
                <option>Active</option>
                <option>Draft</option>
                <option>Paused</option>
              </select>
              <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-2.5 text-sm font-medium text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-[#2563eb] py-2.5 text-sm font-bold text-black hover:bg-[#b5f03f] transition-colors"
          >
            Create Pathway
          </button>
        </div>
      </div>
    </>
  );
}

/* --- Main Component -------------------------------------------------- */
export default function ExperimentsTab() {
  const [openModal, setOpenModal] = useState<SubTab | null>(null);
  const [selectedAction, setSelectedAction] = useState<DrawerRow | null>(null);

  openExpDrawer = (row: ActionRow) => setSelectedAction({
    id:              row.id,
    action:          row.action,
    intendedOutcome: row.intendedOutcome,
    status:          row.status,
    due:             row.due,
    accountable:     row.accountable,
    linkTo:          "",
  });

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">

      {/* Sub-tab bar — clicking opens modal */}
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

      {/* Always-visible experiment cards */}
      <div className="p-4 flex flex-col gap-4">
        {EXPERIMENTS.map((exp) => (
          <ExperimentCard key={exp.id} experiment={exp} />
        ))}

        <button className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors w-fit">
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
        onClose={() => setSelectedAction(null)}
        onSave={() => setSelectedAction(null)}
        onDelete={() => setSelectedAction(null)}
      />
    </div>
  );
}
