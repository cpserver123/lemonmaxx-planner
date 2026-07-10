"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LuX, LuSave, LuChevronDown } from "react-icons/lu";

/* ---------- Types ---------------------------------------------------- */
export interface PlanningRow {
  id: string;
  category: string;
  platform: string;
  actuals: number | null;
  promise: number | null;
  perfCeiling: number | null;
  perfDelta: number | null;
  deltaLoss: number | null;
  netPromise: number | null;
  resources: string;
  isSubTotal?: boolean;
  isPromiseNote?: boolean;
  promiseNote?: string;
  promiseDate?: string;
  hasExpand?: boolean;
  expandCount?: number;
}

/* ---------- Helpers -------------------------------------------------- */
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
  const neg = n < 0;
  const abs = Math.abs(n);
  const str = abs >= 1000 ? `$${abs.toLocaleString("en-US")}` : `$${abs}`;
  return neg ? `-${str}` : str;
}

/* ---------- Inline number cell --------------------------------------- */
function NumCell({ value, onChange, readOnly }: {
  value: number | null;
  onChange: (v: number | null) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  if (readOnly) {
    return (
      <span className={`text-xs ${value !== null && value < 0 ? "text-red-500 dark:text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"}`}>
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
        className="w-24 rounded border border-[#5750F1] bg-[#EEF2FF] dark:bg-[#1a1f4e] px-1.5 py-0.5 text-xs text-[#111928] dark:text-white outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => { setRaw(value !== null ? String(value) : ""); setEditing(true); }}
      className={`text-xs text-left hover:text-[#5750F1] transition-colors underline-offset-2 hover:underline ${
        value !== null && value < 0 ? "text-red-500 dark:text-red-400" : "text-[#111928] dark:text-[#D1D5DB]"
      }`}
    >
      {fmt(value)}
    </button>
  );
}

/* ---------- Platform dropdown ---------------------------------------- */
const PLATFORM_OPTIONS = ["Facebook", "Newsbreak", "Bigo", "TikTok", "Meta", "Taboola"];

function PlatformCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(p => !p);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-medium text-[#111928] dark:text-[#D1D5DB] hover:text-[#5750F1] transition-colors"
      >
        {value || "—"}
        <LuChevronDown size={10} className="text-[#9CA3AF] shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] w-36 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1"
            style={{ top: pos.top, left: pos.left }}>
            {PLATFORM_OPTIONS.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  opt === value ? "bg-[#5750F1]/10 text-[#5750F1] font-semibold" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                }`}>{opt}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Resource multi-select ------------------------------------ */
const TEAM_MEMBERS = ["Arun", "Satish", "Kapil", "Nityashish", "Yash", "Sahil", "Komal", "Chris", "Sarah", "Lisa", "Raj", "Manish"];

function ResourceCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = new Set(value.split(",").map(s => s.trim()).filter(Boolean));

  const toggle = (name: string) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange([...next].join(", "));
  };

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(p => !p);
  };

  return (
    <div className="relative inline-block">
      <button ref={btnRef} onClick={handleOpen}
        className="flex items-center gap-1 rounded border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2 py-1 text-left w-36 hover:border-[#5750F1]/50 transition-colors">
        <span className="flex-1 truncate leading-none text-[10px] text-[#5750F1] font-medium">
          {selected.size === 0 ? <span className="text-[#9CA3AF]">Select…</span> : [...selected].join(", ")}
        </span>
        <LuChevronDown size={11} className="shrink-0 text-[#9CA3AF]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] w-44 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1 max-h-52 overflow-y-auto"
            style={{ top: pos.top, left: pos.left }}>
            {TEAM_MEMBERS.map(name => (
              <label key={name} onClick={e => { e.stopPropagation(); toggle(name); }}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${selected.has(name) ? "border-[#5750F1] bg-[#5750F1]" : "border-[#D1D5DB] dark:border-[#374151]"}`}>
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
        </>
      )}
    </div>
  );
}

/* ---------- Edit Plan Drawer ---------------------------------------- */
export interface EditPlanDrawerProps {
  open: boolean;
  data: PlanningRow[];
  onClose: () => void;
  onUpdate: (updatedData: PlanningRow[]) => void;
}

export default function EditPlanDrawer({ open, data, onClose, onUpdate }: EditPlanDrawerProps) {
  const [rows, setRows] = useState<PlanningRow[]>([]);

  // Reset to a fresh copy of data every time the drawer opens
  useEffect(() => {
    if (open) setRows(data.map(r => ({ ...r })));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = useCallback((id: string, field: keyof PlanningRow, value: unknown) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleUpdate = () => {
    onUpdate(rows);
    onClose();
  };

  // Group rows by category for display
  const grouped = new Map<string, PlanningRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.category)) grouped.set(row.category, []);
    grouped.get(row.category)!.push(row);
  }

  const COLS = [
    { key: "platform",    label: "",               w: 150 },
    { key: "actuals",     label: "Actuals",        w: 120 },
    { key: "promise",     label: "Promise",        w: 110 },
    { key: "perfCeiling", label: "Perf. Ceiling",  w: 110 },
    { key: "perfDelta",   label: "Perf. Delta",    w: 110 },
    { key: "deltaLoss",   label: "Delta Loss",     w: 110 },
    { key: "netPromise",  label: "Net Promise",    w: 110 },
    { key: "resources",   label: "Resources",      w: 180 },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />

      {/* Slide-in panel */}
      <div
        style={{ right: open ? 0 : "-100%" }}
        className="fixed top-0 z-50 h-full w-[85vw] max-w-[1100px] bg-white dark:bg-[#0d1520] shadow-2xl border-l border-[#E6EBF1] dark:border-[#1F2A37] flex flex-col transition-[right] duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#111928] dark:text-white">Edit Plan</h2>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Click any value (except Actuals) to edit inline. Changes apply on Update.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1.5 rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] transition-colors"
            >
              <LuSave size={13} />
              Update
            </button>
            <button
              onClick={handleClose}
              className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors p-1.5"
            >
              <LuX size={16} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
            {Array.from(grouped.entries()).map(([category, catRows]) => (
              <div key={category} className="mb-1">
                {/* Category heading */}
                <div className="px-4 py-2 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                  <h3 className="text-sm font-semibold text-[#2563eb]">{category}</h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                        {COLS.map(col => (
                          <th key={col.key} style={{ width: col.w, minWidth: col.w }} className="px-3 py-1.5 text-left">
                            <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">{col.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catRows.filter(r => !r.isPromiseNote).map(row => {
                        if (row.isSubTotal) {
                          // Compute live sums from the editable rows in this category
                          const dataRows = catRows.filter(r => !r.isSubTotal && !r.isPromiseNote);
                          const sum = (f: "actuals" | "promise" | "perfCeiling" | "perfDelta" | "deltaLoss" | "netPromise") =>
                            dataRows.reduce<number | null>((acc, r) => {
                              const v = r[f] as number | null;
                              if (v === null) return acc;
                              return (acc ?? 0) + v;
                            }, null);

                          return (
                            <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0d1520]/60">
                              <td className="px-3 py-2"><span className="text-xs font-medium text-[#4B5563] dark:text-[#9CA3AF]">Sub Total</span></td>
                              {(["actuals","promise","perfCeiling","perfDelta","deltaLoss","netPromise"] as const).map(f => (
                                <td key={f} className="px-3 py-2">
                                  <span className="text-xs font-medium text-[#111928] dark:text-[#D1D5DB]">{fmt(sum(f))}</span>
                                </td>
                              ))}
                              <td className="px-3 py-2" />
                            </tr>
                          );
                        }

                        return (
                          <tr key={row.id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                            {/* Platform */}
                            <td className="px-3 py-2">
                              <PlatformCell
                                value={row.platform}
                                onChange={v => updateRow(row.id, "platform", v)}
                              />
                            </td>
                            {/* Actuals — read only */}
                            <td className="px-3 py-2">
                              <NumCell value={row.actuals} onChange={() => {}} readOnly />
                            </td>
                            {/* Editable numerics */}
                            {(["promise","perfCeiling","perfDelta","deltaLoss","netPromise"] as const).map(f => (
                              <td key={f} className="px-3 py-2">
                                <NumCell
                                  value={row[f] as number | null}
                                  onChange={v => updateRow(row.id, f, v)}
                                />
                              </td>
                            ))}
                            {/* Resources */}
                            <td className="px-3 py-2">
                              <ResourceCell
                                value={row.resources}
                                onChange={v => updateRow(row.id, "resources", v)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
