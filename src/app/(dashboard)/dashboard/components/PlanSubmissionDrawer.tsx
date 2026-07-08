"use client";

import { useState, useRef, useEffect } from "react";
import { LuX, LuSend, LuTriangleAlert, LuPlus, LuCalendar, LuChevronLeft, LuChevronRight, LuChevronDown } from "react-icons/lu";

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
  { id: "bs-meta",      category: "Blood Sugar", platform: "Meta",      actuals: 34185,  promise: 30000,  perfCeiling: 20000, perfDelta: 10000, deltaLoss: 10000, netPromise: 40000,  resources: "Arun, Satish, Kapil, Nityashish, Yash, Sahil...", hasExpand: true },
  { id: "bs-meta-note", category: "Blood Sugar", platform: "",          actuals: null,   promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Drive Blood Sugar revenue on Meta by scaling the top 2 proven angles across 10 hook/visual/script variants, hitting ≥$20K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026." },
  { id: "bs-sub",       category: "Blood Sugar", platform: "Sub Total", actuals: 34185,  promise: 30000,  perfCeiling: 20000, perfDelta: 10000, deltaLoss: 10000, netPromise: 40000,  resources: "", isSubTotal: true },

  // Memory
  { id: "mem-tab",       category: "Memory", platform: "Taboola",    actuals: 1744,    promise: 10000,  perfCeiling: null,  perfDelta: 10000, deltaLoss: 5000,  netPromise: 15000,  resources: "komal", hasExpand: true },
  { id: "mem-note",      category: "Memory", platform: "",           actuals: null,    promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "I will establish \"MediaGo\" as a validated platform by completing testing → platform setup → baseline test campaign → Go/No-Go decision, with documented learnings to inform July scale-or-kill decision, by June 30, 2026." },
  { id: "mem-meta",      category: "Memory", platform: "Meta",      actuals: 101182,  promise: 106000, perfCeiling: 70000, perfDelta: 30000, deltaLoss: 20000, netPromise: 120000, resources: "Arun, Satish, Kapil, Nityashish, Yash, Sahil", hasExpand: true },
  { id: "mem-meta-note", category: "Memory", platform: "",           actuals: null,    promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Scale Memory on Meta by testing 3 proven VSL angles across catalog and standard placements, achieving ≥$70K spend at ≥30% ROI with 5-day consistency by Jun 30, 2026." },
  { id: "mem-sub",       category: "Memory", platform: "Sub Total", actuals: 152926,  promise: 116000, perfCeiling: 70000, perfDelta: 40000, deltaLoss: 25000, netPromise: 135000, resources: "", isSubTotal: true },

  // Weight Loss
  { id: "wl-tab",      category: "Weight Loss", platform: "Taboola",    actuals: null,   promise: 10000,  perfCeiling: null,  perfDelta: 10000, deltaLoss: 5000,  netPromise: 15000,  resources: "Yash, komal", hasExpand: true },
  { id: "wl-tab-note", category: "Weight Loss", platform: "",           actuals: null,   promise: null,   perfCeiling: null,  perfDelta: null,  deltaLoss: null,  netPromise: null,   resources: "", isNote: true, note: "Establish Weight Loss on Taboola by completing platform onboarding, launching baseline test campaign, and delivering a Go/No-Go decision with documented learnings to guide July scale-or-kill decision, by Jun 30, 2026." },
  { id: "wl-meta",     category: "Weight Loss", platform: "Meta",       actuals: -82943, promise: 30000,  perfCeiling: null,  perfDelta: 30000, deltaLoss: 10000, netPromise: 40000,  resources: "Arun, Satish, Kapil, komal", hasExpand: true },
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

  // Close on outside click — use 'click' so item clicks fire before close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 rounded border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2 py-1 text-left w-36 hover:border-[#5750F1]/50 transition-colors"
      >
        <span className="flex-1 truncate leading-none">{label}</span>
        <LuChevronDown size={11} className="shrink-0 text-[#9CA3AF]" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1 max-h-52 overflow-y-auto">
          {TEAM_MEMBERS.map(name => (
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
          ))}
        </div>
      )}
    </div>
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
  const [rows, setRows] = useState<PlanRow[]>(INITIAL_ROWS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
  const [verticals, setVerticals] = useState(["VSL", "Supplement", "E-Commerce"]);
  const [selectedVertical, setSelectedVertical] = useState("VSL");
  const [showVerticalDrop, setShowVerticalDrop] = useState(false);

  /* --- Planning month picker ---- */
  const [planYear,  setPlanYear]  = useState(2026);
  const [planMonth, setPlanMonth] = useState(5); // June
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  /* --- Actuals month picker ---- */
  const [actYear,  setActYear]  = useState(2026);
  const [actMonth, setActMonth] = useState(4); // May
  const [showActPicker, setShowActPicker] = useState(false);

  /* --- Add Vertical modal ---- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVertical, setNewVertical] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showAddModal) setTimeout(() => addInputRef.current?.focus(), 50); }, [showAddModal]);

  const saveVertical = () => {
    const v = newVertical.trim();
    if (v && !verticals.includes(v)) {
      setVerticals(prev => [...prev, v]);
      setSelectedVertical(v);
    }
    setNewVertical("");
    setShowAddModal(false);
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
            <h2 className="text-sm font-bold text-[#111928] dark:text-white">Plan Submission</h2>
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
              {selectedVertical}
              <LuChevronDown size={12} />
            </button>
            {showVerticalDrop && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowVerticalDrop(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 min-w-[140px] rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1">
                  {verticals.map(v => (
                    <button key={v} onClick={() => { setSelectedVertical(v); setShowVerticalDrop(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        v === selectedVertical ? "bg-[#5750F1]/10 text-[#5750F1] font-medium" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}>{v}</button>
                  ))}
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuPlus size={13} />
            Add Vertical
          </button>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              {categories.map(cat => {
                const catRows = rows.filter(r => r.category === cat);
                return (
                  <tbody key={cat}>
                    {/* Category header */}
                    <tr>
                      <td colSpan={COLS.length + 1} className="pt-5 pb-1">
                        <span className="text-xs font-bold text-[#5750F1] uppercase tracking-wide">{cat}</span>
                      </td>
                    </tr>

                    {/* Column headers */}
                    <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide w-28">Platform</th>
                      {COLS.map(c => (
                        <th key={String(c.key)} className={`text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${c.key === "actuals" ? "text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#0a0f1a]" : "text-[#9CA3AF]"} ${c.w}`}>
                          {c.label}
                          {c.readOnly && <span className="ml-1 text-[8px] text-[#6B7280] normal-case">(locked)</span>}
                        </th>
                      ))}
                    </tr>

                    {catRows.map((row, rowIdx) => {
                      // Note rows: only show when parent hasExpand row is expanded
                      if (row.isNote) {
                        const prevRow = rowIdx > 0 ? catRows[rowIdx - 1] : null;
                        const parentId = prevRow?.hasExpand ? prevRow.id : null;
                        if (!parentId || !expandedRows.has(parentId)) return null;
                        return (
                          <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                            <td colSpan={COLS.length + 1} className="px-3 py-2 bg-[#FFFBEB] dark:bg-[#1a1500]">
                              <div className="flex items-start gap-2 text-[10px] text-[#92400E] dark:text-[#FCD34D]">
                                <LuTriangleAlert size={11} className="mt-0.5 shrink-0" />
                                <span className="leading-relaxed">{row.note}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      if (row.isSubTotal) {
                        // Compute totals live from the editable data rows in this category
                        const dataRows = catRows.filter(r => !r.isSubTotal && !r.isNote);
                        const sumOf = (key: keyof PlanRow) =>
                          dataRows.reduce((acc, r) => acc + (typeof r[key] === "number" ? (r[key] as number) : 0), 0);

                        return (
                          <tr key={row.id} className="border-b-2 border-[#E6EBF1] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#0a0f1a]">
                            <td className="px-3 py-2 text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF]">Sub Total</td>
                            {COLS.map(c => {
                              const isNumeric = c.key !== "resources";
                              const total = isNumeric ? sumOf(c.key) : null;
                              return (
                                <td key={String(c.key)} className={`px-3 py-2 ${c.key === "actuals" ? "bg-[#EDEEF0] dark:bg-[#060a10]" : ""}`}>
                                  {isNumeric ? (
                                    <span className={`text-xs font-semibold ${total !== null && total < 0 ? "text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>
                                      {fmt(total)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#9CA3AF]">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018] transition-colors">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {row.hasExpand && (
                                <button
                                  onClick={() => toggleExpand(row.id)}
                                  className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors shrink-0"
                                  aria-label={expandedRows.has(row.id) ? "Collapse" : "Expand"}
                                >
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path
                                      d={expandedRows.has(row.id) ? "M2 4L5 7L8 4" : "M4 2L7 5L4 8"}
                                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              )}
                              <span className="text-xs text-[#111928] dark:text-[#D1D5DB]">{row.platform}</span>
                            </div>
                          </td>
                          {COLS.map(c => (
                            <td key={String(c.key)} className={`px-3 py-2 ${c.key === "actuals" ? "bg-[#F3F4F6]/50 dark:bg-[#060a10]" : ""}`}>
                              {c.key === "resources" ? (
                                <ResourceCell
                                  value={row.resources}
                                  onChange={v => update(row.id, "resources", v)}
                                />
                              ) : (
                                <NumCell
                                  value={row[c.key] as number | null}
                                  onChange={v => update(row.id, c.key, v)}
                                  readOnly={c.readOnly}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shrink-0">
          <p className="text-[11px] text-[#9CA3AF]">Click any editable cell to modify the value. Press Enter or click away to confirm.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-5 py-2 text-xs font-bold text-[#111928] hover:opacity-90 transition-opacity"
            >
              <LuSend size={12} />
              Submit Plan
            </button>
          </div>
        </div>
      </div>

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
              onKeyDown={e => { if (e.key === "Enter") saveVertical(); if (e.key === "Escape") setShowAddModal(false); }}
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
                onClick={saveVertical}
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
