"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LuX, LuSend, LuTriangleAlert, LuPlus, LuCalendar, LuChevronLeft, LuChevronRight, LuChevronDown, LuTarget, LuLoader, LuSearch } from "react-icons/lu";
import GoalAssignModal, { type GoalRow, type ApiUserGoal, type ApiPlanTotals } from "./goalassign";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";

/* --- Types ----------------------------------------------------------- */
interface PlanRow {
  id:          string;
  category:    string;
  platform:    string;
  actuals:     number | null;   // READ-ONLY
  promise:     number | null;
  perfCeiling: number | null;
  perfDelta:   number | null;
  deltaLoss:   number | null;
  netPromise:  number | null;
  resources:   string;
  isSubTotal?: boolean;
  isNote?:     boolean;
  note?:       string;
  hasExpand?:  boolean;
}

/* --- Initial data (mirrors PLANNING_DATA) ---------------------------- */
const INITIAL_ROWS: PlanRow[] = [
  // Blood Sugar
  { id: "bs-meta",      category: "Blood Sugar", platform: "Meta",      actuals: 34185,  promise: 30000,  perfCeiling: 20000, perfDelta: 10000, deltaLoss: 10000, netPromise: 40000,  resources: "", hasExpand: true },
  { id: "bs-meta-note", category: "Blood Sugar", platform: "",          actuals: null,   promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Drive Blood Sugar revenue on Meta by scaling the top 2 proven angles across 10 hook/visual/script variants, hitting ≥$20K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026." },
  { id: "bs-sub",       category: "Blood Sugar", platform: "Sub Total", actuals: 34185,  promise: 30000,  perfCeiling: 20000, perfDelta: 10000, deltaLoss: 10000, netPromise: 40000,  resources: "", isSubTotal: true },

  // Memory
  { id: "mem-tab",       category: "Memory", platform: "facebook",    actuals: 1744,    promise: 10000,  perfCeiling: null,  perfDelta: 10000, deltaLoss: 5000,  netPromise: 15000,  resources: "", hasExpand: true },
  { id: "mem-note",      category: "Memory", platform: "",           actuals: null,    promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "I will establish \"MediaGo\" as a validated platform by completing testing → platform setup → baseline test campaign → Go/No-Go decision, with documented learnings to inform July scale-or-kill decision, by June 30, 2026." },
  { id: "mem-meta",      category: "Memory", platform: "Meta",      actuals: 101182,  promise: 106000, perfCeiling: 70000, perfDelta: 30000, deltaLoss: 20000, netPromise: 120000, resources: "", hasExpand: true },
  { id: "mem-meta-note", category: "Memory", platform: "",           actuals: null,    promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Scale Memory on Meta by testing 3 proven VSL angles across catalog and standard placements, achieving ≥$70K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026." },
  { id: "mem-sub",       category: "Memory", platform: "Sub Total", actuals: 152926,  promise: 116000, perfCeiling: 70000, perfDelta: 40000, deltaLoss: 25000, netPromise: 135000, resources: "", isSubTotal: true },

  // Weight Loss
  { id: "wl-tab",      category: "Weight Loss", platform: "google",    actuals: null,   promise: 10000,  perfCeiling: null,  perfDelta: 10000, deltaLoss: 5000,  netPromise: 15000,  resources: "", hasExpand: true },
  { id: "wl-tab-note", category: "Weight Loss", platform: "",           actuals: null,   promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Establish Weight Loss on Taboola by completing platform onboarding, launching baseline test campaign, and delivering a Go/No-Go decision with documented learnings to guide July scale-or-kill decision, by Jun 30, 2026." },
  { id: "wl-meta",     category: "Weight Loss", platform: "Meta",       actuals: -82943, promise: 30000,  perfCeiling: null,  perfDelta: 30000, deltaLoss: 10000, netPromise: 40000,  resources: "", hasExpand: true },
  { id: "wl-note",     category: "Weight Loss", platform: "",           actuals: null,   promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Promise: I will make catalog testing profitable on Weight Loss / Meta by delivering 2 winning creatives through catalog distribution, achieving ≥30% ROI at ≥$10K spend with 5-day consistency, generating $10K additional GM..." },
  { id: "wl-sub",      category: "Weight Loss", platform: "Sub Total",  actuals: -82943, promise: 40000,  perfCeiling: null,  perfDelta: 40000, deltaLoss: 15000, netPromise: 55000,  resources: "", isSubTotal: true },
];

/* --- Helpers --------------------------------------------------------- */
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
  const neg = n < 0;
  const abs = Math.abs(n);
  const str = abs >= 1000 ? `$${abs.toLocaleString("en-US")}` : `$${abs}`;
  return neg ? `-${str}` : str;
}

/* --- Editable number cell -------------------------------------------- */
function NumCell({
  value, onChange, readOnly,
}: { value: number | null; onChange: (v: number | null) => void; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  if (readOnly) {
    return (
      <span className={`text-xs font-medium ${value !== null && value < 0 ? "text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>
        {fmt(value)}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          const n = parseFloat(raw.replace(/[$,]/g, ""));
          onChange(isNaN(n) ? value : n);
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 rounded border border-[#5750F1] bg-[#EEF2FF] dark:bg-[#1a1f4e] px-1 py-0.5 text-xs text-[#111928] dark:text-white outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => { setRaw(value !== null ? String(value) : ""); setEditing(true); }}
      className={`text-xs font-medium text-left hover:text-[#5750F1] transition-colors ${value !== null && value < 0 ? "text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}
    >
      {fmt(value)}
    </button>
  );
}

/* --- Resource multi-select dropdown cell ----------------------------- */
const TEAM_MEMBERS = [
  "Arun", "Satish", "Kapil", "Nityashish", "Yash", "Sahil", "Komal", "Chris", "Sarah", "Lisa", "Raj", "Manish",
];

function ResourceCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Parse comma-separated string into a Set
  const selected = new Set(
    value.split(",").map(s => s.trim()).filter(Boolean)
  );

  const toggle = (name: string) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange([...next].join(", "));
  };

  const filteredMembers = TEAM_MEMBERS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click — use 'click' so item clicks fire before close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    // small delay so the item's onClick fires first
    const tid = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(tid); document.removeEventListener("click", handler); };
  }, [open]);

  const label = selected.size === 0
    ? <span className="text-[#9CA3AF] text-[10px]">Select...</span>
    : <span className="text-[10px] text-[#5750F1] font-medium">{[...selected].join(", ")}</span>;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(p => !p); setSearch(""); }}
        className="flex items-center gap-1 rounded border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2 py-1 text-left w-36 hover:border-[#5750F1]/50 transition-colors"
      >
        <span className="flex-1 truncate leading-none">{label}</span>
        <LuChevronDown size={11} className="shrink-0 text-[#9CA3AF]" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#9CA3AF] shrink-0">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
              onClick={e => e.stopPropagation()}
            />
          </div>
          {/* List */}
          <div className="max-h-44 overflow-y-auto py-1">
            {filteredMembers.length > 0 ? filteredMembers.map(name => (
              <label
                key={name}
                onClick={() => toggle(name)}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${
                    selected.has(name)
                      ? "border-[#5750F1] bg-[#5750F1]"
                      : "border-[#D1D5DB] dark:border-[#374151]"
                  }`}
                >
                  {selected.has(name) && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{name}</span>
              </label>
            )) : (
              <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Platform dropdown cell ------------------------------------------ */
const PLATFORM_OPTIONS = ["Google", "Facebook", "Newsbreak", "TikTok", "Bigo"];

function PlatformCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const tid = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(tid); document.removeEventListener("click", handler); };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 group text-xs text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#818CF8] transition-colors"
      >
        <span className="font-medium">{value || "—"}</span>
        <LuChevronDown size={11} className="text-[#9CA3AF] group-hover:text-[#5750F1] transition-colors shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-36 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1">
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

/* --- Plan Resource Cell -------------------------------------------- */
function PlanResourceCell({
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
      await api.put(`/api/v1/planner/plans/${planId}/resources`, {
        workspace_id: Number(workspaceId),
        user_ids: [...ids],
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to sync resources", err);
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


/* --- EditField type -------------------------------------------------- */
type EditField = "platform" | "promise" | "perf_ceiling" | "perf_delta" | "delta_loss" | "net_promise";
type EditingCell = { planId: number; field: EditField; value: string } | null;

/* --- Editable number/text cell (outside parent to preserve cursor) --- */
function EditableCell({
  planId, field, value, isText = false, bold = false,
  editingCell, setEditingCell, onCommit,
}: {
  planId: number;
  field: EditField;
  value: number | string;
  isText?: boolean;
  bold?: boolean;
  editingCell: EditingCell;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell>>;
  onCommit: () => void;
}) {
  const isEditing = editingCell?.planId === planId && editingCell?.field === field;
  const displayVal = isText ? String(value) : `$${Number(value).toLocaleString()}`;

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={editingCell!.value}
        onChange={e => setEditingCell(c => c ? { ...c, value: e.target.value } : c)}
        onBlur={onCommit}
        onKeyDown={e => { if (e.key === "Enter") onCommit(); if (e.key === "Escape") setEditingCell(null); }}
        className="w-20 rounded border border-[#5750F1] bg-[#EEF2FF] dark:bg-[#1e2a44] px-1.5 py-0.5 text-xs text-[#111928] dark:text-white outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => setEditingCell({ planId, field, value: String(value) })}
      title="Click to edit"
      className={`cursor-pointer rounded px-1 py-0.5 hover:bg-[#EEF2FF] dark:hover:bg-[#1e2a44] transition-colors ${
        bold ? "font-medium text-[#111928] dark:text-[#D1D5DB]" : "text-[#111928] dark:text-[#D1D5DB]"
      } text-xs`}
    >
      {displayVal}
    </span>
  );
}

/* --- PlanSubmissionDrawer -------------------------------------------- */
export default function PlanSubmissionDrawer({
  open,
  onClose,
}: {
  open:    boolean;
  onClose: () => void;
}) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  const [rows, setRows] = useState<PlanRow[]>(INITIAL_ROWS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [goalRow, setGoalRow] = useState<GoalRow | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalInitialGoals, setGoalInitialGoals] = useState<ApiUserGoal[] | undefined>(undefined);
  const [goalPlanTotals, setGoalPlanTotals] = useState<ApiPlanTotals | undefined>(undefined);
  const [savedGoalRowIds, setSavedGoalRowIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchAndOpenGoalModal = async (planId: number, row: GoalRow) => {
    setGoalRow(row);
    setGoalInitialGoals(undefined);
    setGoalPlanTotals(undefined);
    setGoalLoading(true);
    setShowGoalModal(true);
    try {
      const res = await api.get(`/api/v1/planner/plans/${planId}/user-goals`, {
        params: { workspace_id: Number(workspaceId) },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data?.plan_totals) setGoalPlanTotals(data.plan_totals as ApiPlanTotals);
      if (data?.user_goals)  setGoalInitialGoals(data.user_goals as ApiUserGoal[]);
    } catch (err) {
      console.error("Failed to fetch user goals", err);
    } finally {
      setGoalLoading(false);
    }
  };

  const handleGoalSave = (rowId: string) => {
    setSavedGoalRowIds(prev => new Set(prev).add(rowId));
    if (selectedVertical) {
      fetchPlans(selectedVertical.id, planYear, planMonth);
    }
  };

  const handleSubmit = () => {
    // Flatten all platforms from plansByOffer
    const allPlatforms = Object.entries(plansByOffer).flatMap(([offerId, platforms]) => 
      platforms.map(p => ({
        ...p,
        offerName: ownOffers.find(o => o.id === Number(offerId))?.name || "Unknown Offer"
      }))
    );

    // Step 1: check all data rows have resources selected
    const noResources = allPlatforms.filter(p => !p.resources || p.resources.filter(r => r.is_assigned).length === 0);
    if (noResources.length > 0) {
      setSubmitError(
        `Please select resources for: ${noResources.map(p => `${p.platform} (${p.offerName})`).join(", ")}`
      );
      return;
    }

    // Step 2: check all rows with resources have goals assigned
    const noGoals = allPlatforms.filter(p => !savedGoalRowIds.has(String(p.id)));
    if (noGoals.length > 0) {
      setSubmitError(
        `Please assign goals for: ${noGoals.map(p => `${p.platform} (${p.offerName})`).join(", ")}`
      );
      return;
    }

    setSubmitError(null);
    onClose();
  };

  const toggleExpand = (id: string) =>
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const update = (id: string, field: keyof PlanRow, value: unknown) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const categories = Array.from(new Set(rows.map(r => r.category)));

  const COLS: { key: keyof PlanRow; label: string; readOnly?: boolean; w?: string }[] = [
    { key: "promise",     label: "Promise",                             w: "w-24" },
    { key: "perfCeiling", label: "Perf. Ceiling",                       w: "w-28" },
    { key: "perfDelta",   label: "Perf. Delta",                         w: "w-24" },
    { key: "deltaLoss",   label: "Delta Loss",                          w: "w-24" },
    { key: "netPromise",  label: "Net Promise",                         w: "w-24" },
    { key: "resources",   label: "Resources",                           w: "w-36" },
  ];

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* --- Vertical dropdown ---- */
  const [verticals, setVerticals] = useState<{ id: number; name: string }[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<{ id: number; name: string } | null>(null);
  const [showVerticalDrop, setShowVerticalDrop] = useState(false);
  const [loadingVerticals, setLoadingVerticals] = useState(false);
  const [verticalSearch, setVerticalSearch] = useState("");

  const filteredVerticals = verticals.filter(v => v.name.toLowerCase().includes(verticalSearch.toLowerCase()));

  useEffect(() => {
    if (open) {
      const fetchVerticals = async () => {
        setLoadingVerticals(true);
        try {
          const res = await api.get("/api/v1/planner/verticals", {
            params: { workspace_id: workspaceId, with_own_offers: false },
            headers: { Authorization: `Bearer ${token}` }
          });
          const verts: { id: number; name: string }[] = res.data?.data?.verticals || [];
          setVerticals(verts);
          setSelectedVertical(null);
          setOwnOffers([]);
        } catch (err) {
          console.error("Failed to fetch verticals", err);
        } finally {
          setLoadingVerticals(false);
        }
      };
      fetchVerticals();
    }
  }, [open, workspaceId, token]);

  /* --- Own Offers ---- */
  interface OwnOffer { id: number; name: string; vertical_id: number; vertical_name: string; }
  const [ownOffers, setOwnOffers] = useState<OwnOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    if (!selectedVertical) { setOwnOffers([]); return; }
    const fetchOffers = async () => {
      setLoadingOffers(true);
      try {
        const res = await api.get("/api/v1/planner/own-offers", {
          params: { workspace_id: workspaceId, vertical_id: selectedVertical.id },
          headers: { Authorization: `Bearer ${token}` }
        });
        setOwnOffers(res.data?.data?.own_offers || []);
      } catch (err) {
        console.error("Failed to fetch own offers", err);
        setOwnOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };
    fetchOffers();
  }, [selectedVertical, workspaceId, token]);

  /* --- Plans fetched from API, grouped by own_offer_id ---- */
  interface PlanResource { user_id: number; user_name: string; is_assigned: boolean; }
  interface PlanPlatform {
    id: number;
    platform: string;
    promise: number;
    perf_ceiling: number;
    perf_delta: number;
    delta_loss: number;
    net_promise: number;
    resources: PlanResource[];
  }
  const [plansByOffer, setPlansByOffer] = useState<Record<number, PlanPlatform[]>>({});
  const [planYear,  setPlanYear]  = useState(2026);
  const [planMonth, setPlanMonth] = useState(5); // June
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  /* --- Fetch plans from API ---- */
  const fetchPlans = async (verticalId: number, year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await api.get("/api/v1/planner/plans", {
        params: { workspace_id: workspaceId, vertical_id: verticalId, month_year: monthStr },
        headers: { Authorization: `Bearer ${token}` }
      });
      const offers: { own_offer_id: number; platforms: PlanPlatform[] }[] = res.data?.data?.own_offers || [];
      const byOffer: Record<number, PlanPlatform[]> = {};
      offers.forEach(o => { byOffer[o.own_offer_id] = o.platforms || []; });
      setPlansByOffer(byOffer);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };

  // Auto-fetch plans when vertical or month changes
  useEffect(() => {
    if (selectedVertical) {
      fetchPlans(selectedVertical.id, planYear, planMonth);
    } else {
      setPlansByOffer({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVertical, planYear, planMonth]);

  /* --- Actuals month picker ---- */
  const [actYear,  setActYear]  = useState(2026);
  const [actMonth, setActMonth] = useState(4); // May
  const [showActPicker, setShowActPicker] = useState(false);

  /* --- Add Vertical modal ---- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVertical, setNewVertical] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showAddModal) setTimeout(() => addInputRef.current?.focus(), 50); }, [showAddModal]);

  /* --- Add Platform modal ---- */
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [addPlatformOffer, setAddPlatformOffer] = useState<OwnOffer | null>(null);
  const [newPlatformForm, setNewPlatformForm] = useState({
    platform: "",
    promise: "",
    perfCeiling: "",
    perfDelta: "",
    deltaLoss: "",
    netPromise: "",
  });
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformSaveError, setPlatformSaveError] = useState<string | null>(null);

  const openAddPlatform = (offer: OwnOffer) => {
    setAddPlatformOffer(offer);
    setNewPlatformForm({ platform: "", promise: "", perfCeiling: "", perfDelta: "", deltaLoss: "", netPromise: "" });
    setPlatformSaveError(null);
    setShowAddPlatform(true);
  };

  /* --- Inline cell editing ---- */
  const [editingCell, setEditingCell] = useState<EditingCell>(null);

  const startEdit = (planId: number, field: EditField, currentVal: string | number) => {
    setEditingCell({ planId, field, value: String(currentVal) });
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const { planId, field, value } = editingCell;
    setEditingCell(null);

    // Optimistically update local state
    const numVal = field !== "platform" ? (parseFloat(value) || 0) : undefined;
    setPlansByOffer(prev => {
      const next = { ...prev };
      for (const offerId of Object.keys(next)) {
        next[Number(offerId)] = next[Number(offerId)].map(p => {
          if (p.id !== planId) return p;
          return { ...p, [field]: numVal !== undefined ? numVal : value };
        });
      }
      return next;
    });

    // Find current platform row for full payload
    let current: PlanPlatform | undefined;
    for (const platforms of Object.values(plansByOffer)) {
      current = platforms.find(p => p.id === planId);
      if (current) break;
    }
    if (!current) return;

    try {
      await api.put(`/api/v1/planner/plans/${planId}`, {
        workspace_id: workspaceId,
        platform: field === "platform" ? value : current.platform,
        promise: field === "promise" ? numVal : current.promise,
        perf_ceiling: field === "perf_ceiling" ? numVal : current.perf_ceiling,
        perf_delta: field === "perf_delta" ? numVal : current.perf_delta,
        delta_loss: field === "delta_loss" ? numVal : current.delta_loss,
        net_promise: field === "net_promise" ? numVal : current.net_promise,
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to update plan", err);
      // Re-fetch to restore correct data on error
      if (selectedVertical) fetchPlans(selectedVertical.id, planYear, planMonth);
    }
  };

  /* --- Inline platform dropdown cell for plan table rows -------------- */
  const PlanPlatformCell = ({ planId, value }: { planId: number; value: string }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      const tid = setTimeout(() => document.addEventListener("click", handler), 0);
      return () => { clearTimeout(tid); document.removeEventListener("click", handler); };
    }, [open]);

    const handleSelect = async (opt: string) => {
      setOpen(false);
      if (opt === value) return;

      // Optimistically update local state
      setPlansByOffer(prev => {
        const next = { ...prev };
        for (const offerId of Object.keys(next)) {
          next[Number(offerId)] = next[Number(offerId)].map(p =>
            p.id !== planId ? p : { ...p, platform: opt }
          );
        }
        return next;
      });

      // Find current row for full payload
      let current: PlanPlatform | undefined;
      for (const platforms of Object.values(plansByOffer)) {
        current = platforms.find(p => p.id === planId);
        if (current) break;
      }
      if (!current) return;

      try {
        await api.put(`/api/v1/planner/plans/${planId}`, {
          workspace_id: workspaceId,
          platform: opt,
          promise: current.promise,
          perf_ceiling: current.perf_ceiling,
          perf_delta: current.perf_delta,
          delta_loss: current.delta_loss,
          net_promise: current.net_promise,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error("Failed to update platform", err);
        if (selectedVertical) fetchPlans(selectedVertical.id, planYear, planMonth);
      }
    };

    return (
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen(p => !p)}
          title="Click to change platform"
          className="flex items-center gap-1 group text-xs font-semibold text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#818CF8] transition-colors rounded px-1 py-0.5 hover:bg-[#EEF2FF] dark:hover:bg-[#1e2a44]"
        >
          <span>{value || "—"}</span>
          <LuChevronDown size={11} className="text-[#9CA3AF] group-hover:text-[#5750F1] transition-colors shrink-0" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-40 w-36 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1 overflow-hidden">
              {PLATFORM_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    opt.toLowerCase() === value.toLowerCase()
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
  };

  const saveAddPlatform = async () => {
    const p = newPlatformForm.platform.trim();
    if (!p || !addPlatformOffer || !selectedVertical) return;
    const parseNum = (s: string) => { const n = parseFloat(s.replace(/[$,]/g, "")); return isNaN(n) ? 0 : n; };
    const monthStr = `${planYear}-${String(planMonth + 1).padStart(2, "0")}`;

    setPlatformSaving(true);
    setPlatformSaveError(null);
    try {
      const res = await api.post("/api/v1/planner/plans", {
        workspace_id: workspaceId,
        own_offer_id: addPlatformOffer.id,
        vertical_id: selectedVertical.id,
        platform: p,
        month_year: monthStr,
        promise: parseNum(newPlatformForm.promise),
        perf_ceiling: parseNum(newPlatformForm.perfCeiling),
        perf_delta: parseNum(newPlatformForm.perfDelta),
        delta_loss: parseNum(newPlatformForm.deltaLoss),
        net_promise: parseNum(newPlatformForm.netPromise),
      }, { headers: { Authorization: `Bearer ${token}` } });


      setShowAddPlatform(false);
      // Re-fetch plans to get server data with users
      if (selectedVertical) fetchPlans(selectedVertical.id, planYear, planMonth);

    } catch (err: any) {
      setPlatformSaveError(err.response?.data?.message || "Failed to save plan");
    } finally {
      setPlatformSaving(false);
    }
  };



  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[1400px] bg-white dark:bg-[#0d1520] border-l border-[#E6EBF1] dark:border-[#1F2A37] flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header row 1: title + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[#E6EBF1] dark:border-[#1F2A37] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#111928] dark:text-white">Plan Creation</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Review and edit your plan before submitting. Actuals are read-only.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            <LuX size={15} />
          </button>
        </div>

        {/* Header row 2: filter bar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-[#E6EBF1] dark:border-[#1F2A37] shrink-0 bg-[#F9FAFB] dark:bg-[#0a1018]">

          {/* Vertical dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowVerticalDrop(p => !p); setShowPlanPicker(false); setShowActPicker(false); }}
              className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
            >
              {loadingVerticals ? (
                <><LuLoader size={12} className="animate-spin text-[#9CA3AF]" /> Loading...</>
              ) : (
                <>
                  {selectedVertical?.name || "Select vertical"}
                  <LuChevronDown size={12} className="text-[#9CA3AF]" />
                </>
              )}
            </button>
            {showVerticalDrop && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowVerticalDrop(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-56 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
                    <LuSearch size={13} className="text-[#9CA3AF] shrink-0" />
                    <input
                      autoFocus
                      value={verticalSearch}
                      onChange={e => setVerticalSearch(e.target.value)}
                      placeholder="Search verticals..."
                      className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto py-1">
                    {filteredVerticals.length > 0 ? filteredVerticals.map(v => (
                      <button key={v.id} onClick={() => { setSelectedVertical(v); setShowVerticalDrop(false); setVerticalSearch(""); }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          selectedVertical?.id === v.id ? "bg-[#5750F1]/10 text-[#5750F1] font-medium" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}>{v.name}</button>
                    )) : (
                      <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-[#E6EBF1] dark:bg-[#374151]" />

          {/* Planning for month picker */}
          <div className="relative flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <span>Planning for</span>
            <button
              onClick={() => { setShowPlanPicker(p => !p); setShowActPicker(false); setShowVerticalDrop(false); }}
              className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
            >
              <LuCalendar size={12} />
              {MONTHS[planMonth]} {planYear}
            </button>
            {showPlanPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPlanPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-56 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setPlanYear(y => y - 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuChevronLeft size={13} /></button>
                    <span className="text-xs font-semibold text-[#111928] dark:text-white">{planYear}</span>
                    <button onClick={() => setPlanYear(y => y + 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuChevronRight size={13} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => { setPlanMonth(i); setShowPlanPicker(false); }}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          i === planMonth ? "bg-[#5750F1] text-white" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actuals from month picker */}
          {/* <div className="relative flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <span>Actuals from</span>
            <button
              onClick={() => { setShowActPicker(p => !p); setShowPlanPicker(false); setShowVerticalDrop(false); }}
              className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
            >
              <LuCalendar size={12} />
              {MONTHS[actMonth]} {actYear}
            </button>
            {showActPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-56 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setActYear(y => y - 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuChevronLeft size={13} /></button>
                    <span className="text-xs font-semibold text-[#111928] dark:text-white">{actYear}</span>
                    <button onClick={() => setActYear(y => y + 1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuChevronRight size={13} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => { setActMonth(i); setShowActPicker(false); }}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          i === actMonth ? "bg-[#5750F1] text-white" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div> */}

          <div className="flex-1" />

          {/* Add Vertical button */}
          {/* <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuPlus size={13} />
            Add Vertical
          </button> */}
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {!selectedVertical ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-20">
              <div className="w-12 h-12 rounded-full bg-[#5750F1]/10 flex items-center justify-center">
                <LuTarget size={22} className="text-[#5750F1]" />
              </div>
              <p className="text-sm font-semibold text-[#111928] dark:text-white">Select a Vertical</p>
              <p className="text-xs text-[#9CA3AF] max-w-xs">Choose a vertical from the dropdown above to load its offers and begin planning.</p>
            </div>
          ) : loadingOffers ? (
            <div className="flex items-center justify-center h-full gap-2 py-20">
              <LuLoader size={16} className="animate-spin text-[#5750F1]" />
              <span className="text-xs text-[#9CA3AF]">Loading offers...</span>
            </div>
          ) : ownOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-20">
              <p className="text-sm font-semibold text-[#111928] dark:text-white">No Offers Found</p>
              <p className="text-xs text-[#9CA3AF]">No own offers have been created for <span className="text-[#5750F1] font-medium">{selectedVertical.name}</span> yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                {ownOffers.map(offer => (
                  <tbody key={offer.id}>
                    {/* Offer name header */}
                    <tr>
                      <td colSpan={COLS.length + 2} className="pt-5 pb-1">
                        <span className="text-xs font-bold text-[#5750F1] uppercase tracking-wide">{offer.name}</span>
                      </td>
                    </tr>

                    {/* Column headers only */}
                    <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide w-28">
                        <span className="flex items-center gap-1.5">
                          Platform
                          <button
                            onClick={() => openAddPlatform(offer)}
                            className="flex items-center justify-center h-4 w-4 rounded border border-[#5750F1]/40 text-[#5750F1] hover:bg-[#5750F1]/10 transition-colors"
                            title="Add platform row"
                          >
                            <LuPlus size={9} />
                          </button>
                        </span>
                      </th>
                      {COLS.map(c => (
                        <th key={String(c.key)} className={`text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF] ${c.w}`}>
                          {c.label}
                        </th>
                      ))}
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide w-20">Assign Goal</th>
                    </tr>

                    {/* Plan rows for this offer */}
                    {(plansByOffer[offer.id] ?? []).map(platform => (
                      <tr key={platform.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018] transition-colors">
                        <td className="px-3 py-2">
                          <PlanPlatformCell planId={platform.id} value={platform.platform} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell planId={platform.id} field="promise" value={platform.promise} editingCell={editingCell} setEditingCell={setEditingCell} onCommit={commitEdit} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell planId={platform.id} field="perf_ceiling" value={platform.perf_ceiling} editingCell={editingCell} setEditingCell={setEditingCell} onCommit={commitEdit} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell planId={platform.id} field="perf_delta" value={platform.perf_delta} editingCell={editingCell} setEditingCell={setEditingCell} onCommit={commitEdit} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell planId={platform.id} field="delta_loss" value={platform.delta_loss} editingCell={editingCell} setEditingCell={setEditingCell} onCommit={commitEdit} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell planId={platform.id} field="net_promise" value={platform.net_promise} editingCell={editingCell} setEditingCell={setEditingCell} onCommit={commitEdit} />
                        </td>
                        <td className="px-3 py-2">
                          <PlanResourceCell planId={platform.id} resources={platform.resources} workspaceId={workspaceId} token={token} />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              fetchAndOpenGoalModal(platform.id, {
                                id: String(platform.id),
                                platform: platform.platform,
                                promise: platform.promise,
                                perfCeiling: platform.perf_ceiling,
                                perfDelta: platform.perf_delta,
                                deltaLoss: platform.delta_loss,
                                netPromise: platform.net_promise,
                                resources: platform.resources
                                  .filter(r => r.is_assigned)
                                  .map(r => r.user_name)
                                  .join(", "),
                              });
                            }}
                            title="Assign Goal"
                            className={`flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
                              savedGoalRowIds.has(String(platform.id))
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                : "border-[#E6EBF1] dark:border-[#374151] text-[#9CA3AF] hover:border-[#5750F1]/50 hover:text-[#5750F1] hover:bg-[#5750F1]/5"
                            }`}
                          >
                            <LuTarget size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shrink-0">
          <div className="flex-1">
            {submitError ? (
              <p className="text-[11px] text-red-500 dark:text-red-400 flex items-start gap-1.5">
                <LuTriangleAlert size={12} className="mt-0.5 shrink-0" />
                {submitError}
              </p>
            ) : (
              <p className="text-[11px] text-[#9CA3AF]">Click any editable cell to modify the value. Press Enter or click away to confirm.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              <LuSend size={12} />
              Submit Plan
            </button>
          </div>
        </div>
      </div>

      {/* Goal Assign Modal */}
      <GoalAssignModal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleGoalSave}
        row={goalRow}
        loading={goalLoading}
        initialGoals={goalInitialGoals}
        planTotals={goalPlanTotals}
        planId={goalRow ? Number(goalRow.id) : undefined}
        workspaceId={workspaceId}
        token={token}
      />

      {/* Add Platform modal */}
      {showAddPlatform && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowAddPlatform(false)} />
          <div className="fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#111928] dark:text-white">Add Platform</h3>
              <button onClick={() => setShowAddPlatform(false)} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuX size={15} /></button>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mb-4">Adding to <span className="font-semibold text-[#5750F1]">{addPlatformOffer?.name}</span>. Duplicate platforms are not allowed.</p>

            {/* Platform dropdown */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1">Platform <span className="text-[#5750F1]">*</span></label>
              <div className="relative">
                <select
                  value={newPlatformForm.platform}
                  onChange={e => setNewPlatformForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white outline-none focus:border-[#5750F1] transition-colors cursor-pointer"
                >
                  <option value="" disabled hidden>Select platform...</option>
                  {PLATFORM_OPTIONS
                    .filter(opt => !(plansByOffer[addPlatformOffer?.id ?? -1] ?? []).some(r => r.platform.toLowerCase() === opt.toLowerCase()))
                    .map(opt => <option key={opt} value={opt}>{opt}</option>)
                  }
                </select>
                <LuChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>

            {/* Numeric fields grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                { key: "promise",     label: "Promise" },
                { key: "perfCeiling", label: "Perf. Ceiling" },
                { key: "perfDelta",   label: "Perf. Delta" },
                { key: "deltaLoss",   label: "Delta Loss" },
                { key: "netPromise",  label: "Net Promise" },
              ] as { key: keyof typeof newPlatformForm; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1">{label}</label>
                  <input
                    type="number"
                    value={newPlatformForm[key]}
                    onChange={e => setNewPlatformForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="e.g. 10000"
                    className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-1">
              {platformSaveError && <span className="text-[11px] text-red-400 mr-2">{platformSaveError}</span>}
              <button onClick={() => setShowAddPlatform(false)} disabled={platformSaving} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50">Cancel</button>
              <button
                onClick={saveAddPlatform}
                disabled={!newPlatformForm.platform.trim() || platformSaving}
                className="flex items-center gap-2 rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {platformSaving ? <><LuLoader size={13} className="animate-spin" /> Saving...</> : "Save"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Vertical modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl p-6">
            <h3 className="text-sm font-bold text-[#111928] dark:text-white mb-1">Add Vertical</h3>
            <p className="text-[11px] text-[#9CA3AF] mb-4">Enter a name for the new vertical. It will appear in the dropdown.</p>
            <input
              ref={addInputRef}
              value={newVertical}
              onChange={e => setNewVertical(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") setShowAddModal(false); }}
              placeholder="e.g. Weight Management"
              className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={!newVertical.trim()}
                className="rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Save Vertical
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
