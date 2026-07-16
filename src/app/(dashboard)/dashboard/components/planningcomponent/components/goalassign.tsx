"use client";

import { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";

/* --- Types ----------------------------------------------------------- */
export interface GoalRow {
  id: string;
  platform: string;
  promise: number | null;
  perfCeiling: number | null;
  perfDelta: number | null;
  deltaLoss: number | null;
  netPromise: number | null;
  resources: string;
}

interface UserGoal {
  username: string;
  promise: number;
  perfCeiling: number;
  perfDelta: number;
  deltaLoss: number;
  netPromise: number;
}

/* --- Helpers --------------------------------------------------------- */
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
  const neg = n < 0;
  const abs = Math.abs(n);
  // Show up to 2 decimal places only when needed
  const display = Number.isInteger(abs) ? abs.toLocaleString("en-US") : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const str = `$${display}`;
  return neg ? `-${str}` : str;
}

function distributeEqually(total: number | null, count: number): number {
  if (!total || count === 0) return 0;
  // Floor to 2 decimal places — ensures the per-user amount never causes
  // the column total to exceed the original value (safe side rounding)
  return Math.floor((total / count) * 100) / 100;
}

const NUM_FIELDS: (keyof Omit<UserGoal, "username">)[] = [
  "promise",
  "perfCeiling",
  "perfDelta",
  "deltaLoss",
  "netPromise",
];

const FIELD_LABELS: Record<string, string> = {
  promise: "Promise",
  perfCeiling: "Perf. Ceiling",
  perfDelta: "Perf. Delta",
  deltaLoss: "Delta Loss",
  netPromise: "Net Promise",
};

/* --- Main Component -------------------------------------------------- */
export default function GoalAssignModal({
  open,
  onClose,
  onSave,
  row,
}: {
  open: boolean;
  onClose: () => void;
  onSave?: (rowId: string) => void;
  row: GoalRow | null;
}) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!row) return;
    const users = row.resources
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const count = users.length;

    setGoals(
      users.map((username, idx) => {
        // For each numeric field, give every user the floored equal share.
        // The FIRST user gets the remainder so the column total is exact.
        const calcField = (total: number | null): number => {
          if (!total || count === 0) return 0;
          const base = Math.floor((total / count) * 100) / 100;
          if (idx === 0) {
            // remainder = total - base * count, rounded to 2dp
            const rest = Math.round((total - base * count) * 100) / 100;
            return Math.round((base + rest) * 100) / 100;
          }
          return base;
        };

        return {
          username,
          promise:      calcField(row.promise),
          perfCeiling:  calcField(row.perfCeiling),
          perfDelta:    calcField(row.perfDelta),
          deltaLoss:    calcField(row.deltaLoss),
          netPromise:   calcField(row.netPromise),
        };
      })
    );
    setErrors({});
  }, [row, open]);

  if (!open || !row) return null;

  const handleChange = (
    idx: number,
    field: keyof Omit<UserGoal, "username">,
    raw: string
  ) => {
    const val = parseFloat(raw.replace(/[$,]/g, ""));
    const num = isNaN(val) ? 0 : val;
    const newGoals = goals.map((g, i) =>
      i === idx ? { ...g, [field]: num } : g
    );
    const colTotal = Math.round(newGoals.reduce((s, g) => s + (g[field] ?? 0), 0) * 100) / 100;
    const max = row[field] ?? 0;
    if (colTotal > max) {
      setErrors((prev) => ({ ...prev, [`${idx}-${field}`]: `Total exceeds ${fmt(max)}` }));
    } else if (colTotal < max) {
      setErrors((prev) => ({ ...prev, [`${idx}-${field}`]: `Total under ${fmt(max)}` }));
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next[`${idx}-${field}`]; return next; });
    }
    setGoals(newGoals);
  };

  const columnTotal = (field: keyof Omit<UserGoal, "username">) =>
    goals.reduce((s, g) => s + (g[field] ?? 0), 0);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[90] -translate-x-1/2 -translate-y-1/2 w-[820px] max-w-[95vw] max-h-[90vh] flex flex-col rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#111928] dark:text-white">Assign Goals</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Platform: <span className="font-semibold text-[#5750F1]">{row.platform}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Row Totals (read-only)</p>
          <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] overflow-hidden mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] dark:bg-[#0a1018] border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                  {NUM_FIELDS.map((f) => (
                    <th key={f} className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                      {FIELD_LABELS[f]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {NUM_FIELDS.map((f) => (
                    <td key={f} className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-[#111928] dark:text-[#D1D5DB]">{fmt(row[f])}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Goal Allocation per User</p>
          {goals.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] italic">No team members assigned. Add resources first.</p>
          ) : (
            <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#0a1018] border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide w-32">Username</th>
                    {NUM_FIELDS.map((f) => (
                      <th key={f} className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{FIELD_LABELS[f]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g, idx) => (
                    <tr key={g.username} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018] transition-colors">
                      <td className="px-4 py-2">
                        <span className="text-xs font-semibold text-[#111928] dark:text-white">{g.username}</span>
                      </td>
                      {NUM_FIELDS.map((f) => {
                        const errKey = `${idx}-${f}`;
                        const hasErr = !!errors[errKey];
                        return (
                          <td key={f} className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={g[f] ?? 0}
                              onChange={(e) => handleChange(idx, f, e.target.value)}
                              className={`w-24 rounded-lg border px-2 py-1 text-xs text-[#111928] dark:text-white bg-[#F9FAFB] dark:bg-[#0a1018] outline-none transition-colors ${hasErr ? "border-red-400 focus:border-red-400" : "border-[#E6EBF1] dark:border-[#374151] focus:border-[#5750F1]"}`}
                            />
                            {hasErr && <p className="text-[9px] text-red-400 mt-0.5 leading-tight">{errors[errKey]}</p>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-[#F3F4F6] dark:bg-[#0a0f1a] border-t-2 border-[#E6EBF1] dark:border-[#374151]">
                    <td className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF]">Total</td>
                    {NUM_FIELDS.map((f) => {
                      const total = Math.round(columnTotal(f) * 100) / 100;
                      const max = row[f] ?? 0;
                      const over  = total > max;
                      const under = total < max;
                      return (
                        <td key={f} className="px-4 py-2">
                          <span className={`text-xs font-semibold ${
                            over  ? "text-red-500 dark:text-red-400" :
                            under ? "text-amber-500 dark:text-amber-400" :
                            "text-[#111928] dark:text-[#D1D5DB]"
                          }`}>
                            {fmt(total)}
                            {over  && <span className="ml-1 text-[9px]">({fmt(max)} max)</span>}
                            {under && <span className="ml-1 text-[9px]">(under {fmt(max)})</span>}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] shrink-0 bg-white dark:bg-[#0d1520]">
          <button onClick={onClose} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button
            onClick={() => { if (!hasErrors && row) { onSave?.(row.id); onClose(); } }}
            disabled={hasErrors}
            className="rounded-lg bg-[#5750F1] px-5 py-2 text-xs font-bold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Goals
          </button>
        </div>
      </div>
    </>
  );
}
