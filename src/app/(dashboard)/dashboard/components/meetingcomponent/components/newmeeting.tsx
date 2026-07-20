"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  LuX, LuCalendar, LuClock, LuMapPin, LuFileText,
  LuChevronDown, LuListChecks, LuPaperclip, LuSparkles,
  LuVideo, LuRepeat, LuCheck, LuUsers, LuInfo, LuLayoutGrid,
  LuCloudUpload, LuFile, LuCircleX,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";

/* --- Types -------------------------------------------------------------- */
export interface MeetingForm {
  name:            string;
  intention:       string;
  type:            string;
  duration:        string;
  recurrence:      string;
  startDateTime:   string;
  repeatTime:      string;
  dueInDays:       string;
  dueDate:         string;
  dueTime:         string;
  participants:    string;
  expectedOutcome: string;
  location:        string;
  description:     string;
  isExternal:      boolean;
  isPrivate:       boolean;
  reportScore?:    string;
  agenda?:         string;
  prework?:        string;
  report?:         string;
  summary?:        string;
}

export interface MeetingRow {
  id:            string;
  name:          string;
  type:          string;
  recurrence:    string;
  nextInstance:  string;
  participants:  number;
  duration:      string;
  createdBy:     string;
  status:        "Pending" | "Active" | "Completed";
  reportScore?:  string;
  // Extended detail fields (shown in KPI view)
  intention?:       string;
  startDateTime?:   string;
  repeatTime?:      string;
  dueDate?:         string;
  expectedOutcome?: string;
  description?:     string;
  agenda?:          string;
  prework?:         string;
  report?:          string;
  summary?:         string;
  /** Pre-populated participants for edit mode */
  participantsList?: { id: number; name: string }[];
}

export const BLANK: MeetingForm = {
  name:            "",
  intention:       "",
  type:            "Review",
  duration:        "",
  recurrence:      "One-time",
  startDateTime:   "",
  repeatTime:      "",
  dueInDays:       "",
  dueDate:         "",
  dueTime:         "9:00 AM",
  participants:    "",
  expectedOutcome: "",
  location:        "",
  description:     "",
  isExternal:      false,
  isPrivate:       false,
  agenda:          "",
  prework:         "",
};

export const MEETING_TYPES = ["Review", "Planning", "Standup", "1-to-1", "Retrospective", "Workshop", "Follow-up", "Other"];
export const RECURRENCES   = ["One-time", "Daily", "Weekly", "Monthly"];

/* --- Shared input class ------------------------------------------------- */
const inputCls =
  "w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] " +
  "bg-[#F9FAFB] dark:bg-[#0a1628] " +
  "px-3 py-2.5 text-sm " +
  "text-[#111928] dark:text-white " +
  "placeholder:text-[#9CA3AF] " +
  "outline-none focus:border-[#2563eb] dark:focus:border-[#2563eb] transition-colors";

/* --- Field helpers ------------------------------------------------------ */
function Label({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[#111928] dark:text-[#E5E7EB] mb-1.5">
      {text}
      {!optional && <span className="text-[#2563eb] ml-0.5">*</span>}
      {optional && <span className="text-[#9CA3AF] font-normal ml-1 text-xs">(optional)</span>}
    </label>
  );
}

function MInput({ placeholder, value, onChange, type = "text" }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function SelectField({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none cursor-pointer`}
      >
        {options.map(o => <option key={o} className="bg-white dark:bg-[#0a1628]">{o}</option>)}
      </select>
      <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex items-center justify-center rounded border transition-colors ${
          checked
            ? "border-[#2563eb] bg-[#2563eb]/10"
            : "border-[#D1D5DB] dark:border-[#374151] bg-transparent"
        }`}
        style={{ width: 18, height: 18, minWidth: 18 }}
      >
        {checked && <span className="block h-2 w-2 rounded-sm bg-[#2563eb]" />}
      </button>
      <span className="text-sm font-medium text-[#374151] dark:text-[#D1D5DB]">{label}</span>
    </label>
  );
}

function IconInput({ placeholder, value, onChange, icon }: {
  placeholder: string; value: string; onChange: (v: string) => void; icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-9`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
    </div>
  );
}

function RightHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#6B7280] dark:text-[#9CA3AF]">{icon}</span>
      <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">{label}</p>
    </div>
  );
}

/* --- Rich Note Editor --------------------------------------------------- */
const FONT_FAMILIES = ["System Default", "Georgia", "Courier New", "Helvetica Neue", "Times New Roman"];
const FONT_SIZES    = ["12px", "13px", "14px", "15px", "16px", "18px", "20px", "24px"];

function RichNoteEditor({
  placeholder = "Write Content",
  readOnly = false,
  className = "",
  value = "",
  onChange,
}: {
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  value?: string;
  onChange?: (val: string) => void;
}) {
  const editorRef      = useRef<HTMLDivElement>(null);
  const [bold, setBold]           = useState(false);
  const [italic, setItalic]       = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike]       = useState(false);
  const [fontFamily, setFontFamily] = useState("System Default");
  const [fontSize, setFontSize]     = useState("15px");
  const [showFont, setShowFont]   = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const fontRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const historyRef    = useRef<string[]>([""]);
  const historyIdxRef = useRef(0);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const saveSnapshot = useCallback(() => {
    if (readOnly) return;
    const content = editorRef.current?.innerHTML ?? "";
    const stack   = historyRef.current;
    if (stack[historyIdxRef.current] === content) return;
    historyRef.current    = [...stack.slice(0, historyIdxRef.current + 1), content];
    historyIdxRef.current = historyRef.current.length - 1;
    onChange?.(content);
  }, [readOnly, onChange]);

  const handleUndo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (readOnly || historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    if (editorRef.current) {
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
      onChange?.(editorRef.current.innerHTML);
    }
    syncState();
  }, [readOnly, onChange]);

  const handleRedo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (readOnly || historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    if (editorRef.current) {
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
      onChange?.(editorRef.current.innerHTML);
    }
    syncState();
  }, [readOnly, onChange]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFont(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const syncState = useCallback(() => {
    if (readOnly) return;
    setBold(document.queryCommandState("bold"));
    setItalic(document.queryCommandState("italic"));
    setUnderline(document.queryCommandState("underline"));
    setStrike(document.queryCommandState("strikeThrough"));
  }, [readOnly]);

  const exec = useCallback((cmd: string, value?: string) => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? "");
    syncState();
  }, [syncState, readOnly]);

  const applyFont = (family: string) => {
    if (readOnly) return;
    setFontFamily(family);
    setShowFont(false);
    editorRef.current?.focus();
    if (family !== "System Default") document.execCommand("fontName", false, family);
  };

  const applySize = (size: string) => {
    if (readOnly) return;
    setFontSize(size);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = size;
      try { range.surroundContents(span); } catch { /* partial selection */ }
    }
  };

  const insertDate = () => {
    if (readOnly) return;
    exec("insertText", new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  };

  const insertDivider = () => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, "<hr style='border:none;border-top:1px solid #374151;margin:8px 0'/><br/>");
  };

  const btnCls = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition-colors ${
      active
        ? "bg-[#2563eb]/20 text-[#2563eb]"
        : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2A37] hover:text-[#111928] dark:hover:text-white"
    }`;

  return (
    <div className={`rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] flex flex-col bg-white dark:bg-[#111928] ${readOnly ? "opacity-80" : ""} ${className}`}>
      {!readOnly && (
        <div className="relative flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E7EB] dark:border-[#1F2A37] flex-wrap bg-[#F9FAFB] dark:bg-[#1a2332] rounded-t-lg">
          <button onMouseDown={handleUndo} title="Undo" className={btnCls(false)}>←</button>
          <button onMouseDown={handleRedo} title="Redo" className={btnCls(false)}>→</button>
          <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
          <button onMouseDown={e => { e.preventDefault(); exec("bold"); }} className={btnCls(bold)}><strong>B</strong></button>
          <button onMouseDown={e => { e.preventDefault(); exec("italic"); }} className={btnCls(italic)}><em>I</em></button>
          <button onMouseDown={e => { e.preventDefault(); exec("underline"); }} className={btnCls(underline)}><u>U</u></button>
          <button onMouseDown={e => { e.preventDefault(); exec("strikeThrough"); }} className={btnCls(strike)}><s>S</s></button>
          <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
          <button onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} className={btnCls(false)}>• List</button>
          <button onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} className={btnCls(false)}>1. List</button>
          <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
          <div ref={fontRef} className="relative">
            <button onClick={() => { setShowFont(o => !o); setShowMore(false); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors">
              Font {showFont ? "▲" : "▼"}
            </button>
            {showFont && (
              <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1a2332] shadow-2xl py-2">
                <p className="px-3 py-1 text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Font Family</p>
                {FONT_FAMILIES.map(f => (
                  <button key={f} onClick={() => applyFont(f)} className={`flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#0d1520] transition-colors ${fontFamily === f ? "text-[#2563eb] font-bold bg-[#F9FAFB] dark:bg-[#0a1018]" : "text-[#111928] dark:text-white font-medium"}`}>
                    <span style={{ fontFamily: f === "System Default" ? undefined : f }}>{f}</span>
                    {fontFamily === f && <span>✓</span>}
                  </button>
                ))}
                <div className="h-px bg-[#E5E7EB] dark:bg-[#374151] my-1" />
                <p className="px-3 py-1 text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Font Size</p>
                <div className="grid grid-cols-4 gap-1 px-3">
                  {FONT_SIZES.map(s => (
                    <button key={s} onClick={() => applySize(s)} className={`py-1 rounded text-[10px] font-medium transition-colors ${fontSize === s ? "bg-[#2563eb] text-white" : "bg-[#F3F4F6] dark:bg-[#0d1520] text-[#111928] dark:text-white hover:border-[#2563eb]/40 border border-[#E5E7EB] dark:border-[#374151]"}`}>
                      {s.replace("px", "")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
          <div ref={moreRef} className="relative">
            <button onClick={() => { setShowMore(o => !o); setShowFont(false); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors">
              More {showMore ? "▲" : "▼"}
            </button>
            {showMore && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1a2332] shadow-2xl p-3 flex flex-col gap-3">
                <div>
                  <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Align</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Left", "Center", "Right", "Full"].map(align => (
                      <button key={align} onMouseDown={e => { e.preventDefault(); exec("justify" + align); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors">
                        <span className="text-base">≡</span>{align}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Insert</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onMouseDown={e => { e.preventDefault(); insertDivider(); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors"><span>╌╌╌╌</span>Divider</button>
                    <button onMouseDown={e => { e.preventDefault(); insertDate(); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors"><span>📅</span>Date</button>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Indent</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onMouseDown={e => { e.preventDefault(); exec("indent"); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors"><span>⇥</span>Indents<span className="text-[8px] text-[#9CA3AF]">Tab</span></button>
                    <button onMouseDown={e => { e.preventDefault(); exec("outdent"); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors"><span>⇤</span>Outdent<span className="text-[8px] text-[#9CA3AF]">⇧Tab</span></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={saveSnapshot}
        onKeyUp={syncState}
        onMouseUp={syncState}
        onSelect={syncState}
        data-placeholder={placeholder}
        style={{ fontFamily: fontFamily === "System Default" ? undefined : fontFamily, fontSize }}
        className={[
          "flex-1 min-h-[140px] px-4 py-3 text-sm text-[#111928] dark:text-white outline-none",
          readOnly ? "cursor-not-allowed select-none" : "",
          "[&_ul]:list-disc [&_ul]:pl-4",
          "[&_ol]:list-decimal [&_ol]:pl-4",
          "[&_h1]:text-xl [&_h1]:font-bold",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-[#2563eb] [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_hr]:border-[#E5E7EB] dark:[&_hr]:border-[#374151] [&_hr]:my-2",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-[#9CA3AF] empty:before:pointer-events-none",
        ].join(" ")}
      />
    </div>
  );
}


/* --- Meeting KPI Dashboard View ----------------------------------------- */
function MeetingKPIView({
  data, repeatDays, users, selectedUsers, onToggle, onClear,
}: {
  data: any;
  repeatDays: Set<string>;
  users: { id: number; name: string }[];
  selectedUsers: { id: number; name: string }[];
  onToggle: (user: { id: number; name: string }) => void;
  onClear: () => void;
}) {
  const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const TYPE_COLOR: Record<string, string> = {
    Strategic: "#8b5cf6", Review: "#f59e0b", Business: "#06b6d4",
    Planning: "#2563eb", Standup: "#10b981", "1-to-1": "#ec4899", Other: "#6B7280",
  };
  const typeColor = TYPE_COLOR[data.type] ?? "#6B7280";
  const [showParticipants, setShowParticipants] = useState(false);

  // Parse nextInstance into readable date + time range
  const rawNext = data.nextInstance ?? "";
  const [datePart, timePart] = rawNext.split("\u00b7").map((s: string) => s.trim());
  const durationNum = parseInt(data.duration?.replace(" min", "") ?? "0", 10);

  // KPI tiles (non-participants)
  const kpis = [
    { icon: <LuLayoutGrid size={14} />, label: "Type",       value: data.type,                               sub: "" },
    { icon: <LuClock      size={14} />, label: "Duration",   value: data.duration?.replace(" min", "") || "\u2014", sub: "minutes" },
    { icon: <LuRepeat     size={14} />, label: "Recurrence", value: data.recurrence,                         sub: "" },
  ];

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* Header card */}
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-[#F8FAFF] dark:bg-[#0a1628] p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-[#EEF2FF] dark:bg-[#1a2545] flex items-center justify-center shrink-0">
            <LuCalendar size={24} className="text-[#2563eb]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111928] dark:text-white leading-tight">{data.name}</h2>
            <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: typeColor, background: typeColor + "20" }}>{data.type}</span>
            {data.intention && <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">{data.intention}</p>}
          </div>
        </div>
        {datePart && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111928] dark:text-white justify-end">
              <LuCalendar size={14} className="text-[#2563eb]" />{datePart}
            </div>
            {timePart && (
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 justify-end">
                <LuClock size={12} />{timePart}{durationNum > 0 && ` – (${data.duration})`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI tiles row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Regular kpi tiles */}
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#2563eb] mb-1">{k.icon}<span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">{k.label}</span></div>
            <p className="text-xl font-bold text-[#111928] dark:text-white">{k.value || "—"}</p>
            {k.sub && <p className="text-[11px] text-[#9CA3AF]">{k.sub}</p>}
          </div>
        ))}

        {/* Participants — clickable tile with dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowParticipants(p => !p)}
            className="w-full text-left rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] p-4 flex flex-col gap-1 hover:border-[#2563eb]/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[#2563eb] mb-1">
              <LuUsers size={14} />
              <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">Participants</span>
              <span className="ml-auto text-[10px] text-[#2563eb] font-semibold">Edit</span>
            </div>
            <p className="text-xl font-bold text-[#111928] dark:text-white">
              {selectedUsers.length > 0 ? selectedUsers.length : (data.participants ?? 0)}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              {selectedUsers.length > 0
                ? selectedUsers.slice(0, 2).map(u => u.name.split(" ")[0]).join(", ") + (selectedUsers.length > 2 ? ` +${selectedUsers.length - 2}` : "")
                : "Participants"}
            </p>
          </button>
          {showParticipants && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowParticipants(false)} />
              <div className="absolute top-full right-0 mt-2 z-50 w-72">
                <ParticipantsDropdown
                  selectedUsers={selectedUsers}
                  onToggle={onToggle}
                  onClear={onClear}
                  users={users}
                  isReadOnly={false}
                  initialCount={data.participants}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Repeat Days tile (only for Weekly) */}
      {data.recurrence === "Weekly" && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] p-4">
          <div className="flex items-center gap-1.5 text-[#2563eb] mb-3">
            <LuCalendar size={14} />
            <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">Repeat Days</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ALL_DAYS.map(d => (
              <span key={d} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                repeatDays.has(d)
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#F3F4F6] dark:bg-[#122031] text-[#374151] dark:text-[#9CA3AF]"
              }`}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Two-column detail sections */}
      <div className="grid grid-cols-2 gap-4">
        {/* Meeting Details */}
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] p-4 flex flex-col gap-0">
          <div className="flex items-center gap-2 mb-3">
            <LuFileText size={14} className="text-[#2563eb]" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">Meeting Details</p>
          </div>
          {[
            { icon: <LuInfo size={13} />,     label: "Intention",       val: data.intention || "—" },
            { icon: <LuCalendar size={13} />, label: "Start Date & Time", val: data.startDateTime || "—" },
            { icon: <LuClock size={13} />,    label: "Repeat Time",      val: data.repeatTime || "—" },
            { icon: <LuCalendar size={13} />, label: "Due Date & Time",   val: data.dueDate || "—" },
            { icon: <LuCheck size={13} />,    label: "Expected Outcome",  val: data.expectedOutcome || "—" },
          ].map(row => (
            <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-[#F3F4F6] dark:border-[#1F2A37] last:border-0">
              <span className="text-[#2563eb] mt-0.5 shrink-0">{row.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{row.label}</p>
                <p className="text-sm text-[#111928] dark:text-white mt-0.5 break-words">{row.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* About This Meeting */}
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] p-4">
          <div className="flex items-center gap-2 mb-4">
            <LuInfo size={14} className="text-[#2563eb]" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">About This Meeting</p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-[#2563eb] mb-1">Purpose / Intention</p>
              <p className="text-sm text-[#374151] dark:text-[#D1D5DB]">{data.intention || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#2563eb] mb-1">Expected Outcome</p>
              <p className="text-sm text-[#374151] dark:text-[#D1D5DB]">{data.expectedOutcome || "—"}</p>
            </div>
            {data.description && (
              <div>
                <p className="text-xs font-bold text-[#2563eb] mb-1">Description / Notes</p>
                <p className="text-sm text-[#374151] dark:text-[#D1D5DB]">{data.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ParticipantsDropdownProps {
  selectedUsers: { id: number; name: string }[];
  onToggle: (user: { id: number; name: string }) => void;
  onClear: () => void;
  users: { id: number; name: string }[];
  isReadOnly: boolean;
  initialCount?: number;
}

const initials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

function ParticipantsDropdown({
  selectedUsers,
  onToggle,
  onClear,
  users,
  isReadOnly,
  initialCount,
}: ParticipantsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const renderTriggerContent = () => {
    if (isReadOnly) {
      if (selectedUsers.length > 0) {
        return selectedUsers.map(u => u.name).join(", ");
      }
      return initialCount !== undefined ? `${initialCount} Participants` : "0 Participants";
    }

    if (selectedUsers.length === 0) {
      return <span className="text-[#9CA3AF]">Select participants</span>;
    }

    if (selectedUsers.length <= 2) {
      return selectedUsers.map(u => u.name).join(", ");
    }

    return `${selectedUsers.slice(0, 2).map(u => u.name).join(", ")} +${selectedUsers.length - 2} more`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={isReadOnly}
        onClick={() => setOpen(!open)}
        className={`${inputCls} flex items-center justify-between text-left cursor-pointer disabled:cursor-not-allowed`}
      >
        <span className="truncate pr-4">{renderTriggerContent()}</span>
        <LuChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 z-50 w-full min-w-[240px] rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] shadow-2xl p-2">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] dark:border-[#1F2A37] mb-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#9CA3AF] shrink-0">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
              >
                <LuX size={12} />
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map(user => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onToggle(user)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors text-left cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // managed by button's onClick
                      className="h-3.5 w-3.5 rounded border-[#D1D5DB] dark:border-[#374151] text-[#2563eb] accent-[#2563eb] cursor-pointer shrink-0"
                    />
                    <div className="h-5 w-5 rounded-full bg-[#2563eb] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                      {initials(user.name)}
                    </div>
                    <span className="flex-1 truncate text-[#111928] dark:text-[#D1D5DB] font-medium">{user.name}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-xs text-[#9CA3AF] text-center">No workspace users found</p>
            )}
          </div>

          {/* Footer Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#1F2A37] mt-1 pt-2 px-1">
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] text-[#9CA3AF] hover:text-red-500 font-medium transition-colors"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded bg-[#2563eb] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Files Upload Section ----------------------------------------------- */
interface UploadingFile {
  id:       string;
  file:     File;
  progress: number;         // 0-100
  done:     boolean;
  error?:   string;
}
interface UploadedFile {
  filename:     string;
  size:         number;
  content_type: string;
  url:          string;
}

function FilesSection({
  meetingId,
  workspaceId,
  token,
}: {
  meetingId?: string | null;
  workspaceId: number;
  token: string;
}) {
  const inputRef                                          = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]                         = useState<UploadingFile[]>([]);
  const [uploaded, setUploaded]                           = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging]                       = useState(false);

  const canUpload = !!meetingId;

  const formatBytes = (b: number) =>
    b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!canUpload) return;
    const list = Array.from(files);
    if (!list.length) return;

    // Add entries to the uploading queue
    const entries: UploadingFile[] = list.map(f => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      progress: 0,
      done: false,
    }));
    setUploading(prev => [...prev, ...entries]);

    const formData = new FormData();
    list.forEach(f => formData.append("files", f));

    const ids = entries.map(e => e.id);

    // Use XMLHttpRequest for real upload progress
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.lemonmaxx.com/api/v1/planner/meetings/${meetingId}/files?workspace_id=${workspaceId}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploading(prev => prev.map(u => ids.includes(u.id) ? { ...u, progress: pct } : u));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploading(prev => prev.map(u => ids.includes(u.id) ? { ...u, progress: 100, done: true } : u));
          try {
            const res = JSON.parse(xhr.responseText);
            const newFiles: UploadedFile[] = res?.data?.uploaded ?? [];
            setUploaded(prev => [...prev, ...newFiles]);
          } catch { /* ignore parse errors */ }
          setTimeout(() => setUploading(prev => prev.filter(u => !ids.includes(u.id))), 1200);
        } else {
          setUploading(prev => prev.map(u => ids.includes(u.id) ? { ...u, error: "Upload failed" } : u));
        }
        resolve();
      };
      xhr.onerror = () => {
        setUploading(prev => prev.map(u => ids.includes(u.id) ? { ...u, error: "Network error" } : u));
        resolve();
      };
      xhr.send(formData);
    });
  }, [canUpload, meetingId, workspaceId, token]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <LuPaperclip size={13} className="text-[#6B7280] dark:text-[#9CA3AF]" />
        <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">Files</span>
      </div>

      {/* Drop zone */}
      {canUpload ? (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-6 ${
            isDragging
              ? "border-[#2563eb] bg-[#EFF6FF] dark:bg-[#0d1a2e]"
              : "border-[#D1D5DB] dark:border-[#374151] hover:border-[#2563eb]/60 hover:bg-[#F9FAFB] dark:hover:bg-[#0d1520]"
          }`}
        >
          <LuCloudUpload size={22} className={isDragging ? "text-[#2563eb]" : "text-[#9CA3AF]"} />
          <p className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[#2563eb] font-bold">Click to upload</span> or drag &amp; drop
          </p>
          <p className="text-[10px] text-[#9CA3AF]">Any file type · Multiple files supported</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      ) : (
        <p className="text-xs text-[#9CA3AF] italic">Save the meeting first to attach files.</p>
      )}

      {/* Uploading queue with progress bars */}
      {uploading.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {uploading.map(u => (
            <div key={u.id} className="rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#111928] dark:text-white truncate max-w-[200px]">{u.file.name}</span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {u.error ? <span className="text-red-500">{u.error}</span> : u.done ? "✓ Done" : `${u.progress}%`}
                </span>
              </div>
              {!u.error && (
                <div className="h-1.5 rounded-full bg-[#E5E7EB] dark:bg-[#1F2A37] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${u.progress}%`,
                      backgroundColor: u.done ? "#22c55e" : "#2563eb",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files list */}
      {uploaded.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {uploaded.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2">
              <LuFile size={14} className="shrink-0 text-[#6B7280] dark:text-[#9CA3AF]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#111928] dark:text-white truncate">{f.filename}</p>
                <p className="text-[10px] text-[#9CA3AF]">{formatBytes(f.size)} · {f.content_type}</p>
              </div>
              <button
                type="button"
                onClick={() => setUploaded(prev => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-[#9CA3AF] hover:text-red-500 transition-colors"
              >
                <LuCircleX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ModalTab = "design" | "reports" | "ai-summary";

/* --- Create Meeting Modal ----------------------------------------------- */
export default function CreateMeetingModal({
  open,
  onClose,
  onCreated,
  onSaved,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (form: MeetingForm) => void;
  onSaved?: () => void;
  initialData?: MeetingRow | null;
}) {
  const [tab, setTab] = useState<ModalTab>("design");
  const [form, setForm] = useState<MeetingForm>(BLANK);
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  // Recurrence sub-fields
  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const [repeatDays, setRepeatDays] = useState<Set<string>>(new Set());
  const [monthlyDates, setMonthlyDates] = useState<Set<number>>(new Set());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  useEffect(() => {
    if (!open) return;
    if (users.length > 0) return;
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/api/v1/user-management/workspaces/${workspaceId}/users`, {
          params: { only_active: false, full_data: true },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setUsers(res.data.data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch users in modal:", error);
      }
    };
    fetchUsers();
  }, [open, workspaceId, token, users.length]);

  const handleUserToggle = (user: { id: number; name: string }) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      let next: { id: number; name: string }[];
      if (form.type === "1-to-1") {
        if (exists) {
          next = [];
        } else {
          next = [user];
        }
      } else {
        if (exists) {
          next = prev.filter(u => u.id !== user.id);
        } else {
          next = [...prev, user];
        }
      }
      setForm(f => ({ ...f, participants: String(next.length) }));
      return next;
    });
  };

  const handleClearUsers = () => {
    setSelectedUsers([]);
    setForm(f => ({ ...f, participants: "0" }));
  };

  useEffect(() => {
    if (form.type === "1-to-1" && selectedUsers.length > 1) {
      const next = selectedUsers.slice(0, 1);
      setSelectedUsers(next);
      setForm(f => ({ ...f, participants: String(next.length) }));
    }
  }, [form.type, selectedUsers.length]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          ...BLANK,
          name:            initialData.name,
          type:            initialData.type,
          recurrence:      initialData.recurrence,
          participants:    String(initialData.participants || ""),
          duration:        initialData.duration === "—" ? "" : initialData.duration.replace(" min", ""),
          reportScore:     initialData.reportScore || "",
          // Populate extended fields if available
          intention:       initialData.intention      ?? "",
          startDateTime:   initialData.startDateTime  ?? "",
          repeatTime:      initialData.repeatTime     ?? "",
          dueDate:         initialData.dueDate        ?? "",
          expectedOutcome: initialData.expectedOutcome ?? "",
          description:     initialData.description    ?? "",
          agenda:          initialData.agenda         ?? "",
          prework:         initialData.prework        ?? "",
          report:          initialData.report         ?? "",
          summary:         initialData.summary        ?? "",
        });
        setSelectedUsers(initialData.participantsList ?? []);

      } else {
        setForm(BLANK);
        setSelectedUsers([]);
      }
      setTab("design");
    }
  }, [open, initialData]);

  const isReadOnly = !!initialData;
  const set = (field: keyof MeetingForm) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (isReadOnly) {
      // ---- UPDATE existing meeting via PUT ----
      const typeMapping: Record<string, string> = { "1-to-1": "one_to_one" };
      const meetingType = typeMapping[form.type] ?? form.type.toLowerCase();

      const recurrenceMapping: Record<string, string> = {
        "One-time": "once", "Daily": "daily", "Weekly": "weekly", "Monthly": "monthly",
      };
      const recurrence = recurrenceMapping[form.recurrence] || "once";

      const updatePayload = {
        workspace_id:     workspaceId,
        name:             form.name.trim(),
        intention:        form.intention.trim(),
        type:             meetingType,
        due_date_time:    form.dueDate ? new Date(form.dueDate).toISOString() : "",
        start_date_time:  form.startDateTime ? new Date(form.startDateTime).toISOString() : null,
        repeat_time:      form.repeatTime || null,
        duration:         parseInt(form.duration, 10) || 30,
        recurrence,
        weekly_days:      recurrence === "weekly" ? Array.from(repeatDays).map(d => d.toLowerCase()) : [],
        participants:     selectedUsers.map(u => u.id),
        expected_outcome: form.expectedOutcome.trim(),
        note:             form.description.trim(),
        agenda:           form.agenda   || "",
        prework:          form.prework  || "",
        report:           form.report   || "",
        summary:          form.summary  || "",
        link:             form.location.trim() || "",
        score:            form.reportScore ? parseFloat(form.reportScore) : 0,
      };

      try {
        await api.put(`/api/v1/planner/meetings/${initialData!.id}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onSaved?.();
      } catch (err) {
        console.error("Failed to update meeting via API:", err);
      }

      onClose();
      setForm(BLANK);
      return;
    }

    if (!form.name.trim()) return;

    const typeMapping: Record<string, string> = {
      "1-to-1": "one_to_one",
    };
    const meetingType = typeMapping[form.type] ?? form.type.toLowerCase();

    const recurrenceMapping: Record<string, string> = {
      "One-time": "once",
      "Daily": "daily",
      "Weekly": "weekly",
      "Monthly": "monthly"
    };
    const recurrence = recurrenceMapping[form.recurrence] || "once";

    const payload = {
      workspace_id:     workspaceId,
      name:             form.name.trim(),
      intention:        form.intention.trim(),
      type:             meetingType,
      due_date_time:    form.dueDate ? new Date(form.dueDate).toISOString() : "",
      start_date_time:  form.startDateTime ? new Date(form.startDateTime).toISOString() : null,
      repeat_time:      form.repeatTime || null,
      duration:         parseInt(form.duration, 10) || 30,
      recurrence,
      weekly_days:      recurrence === "weekly" ? Array.from(repeatDays).map(d => d.toLowerCase()) : [],
      participants:     selectedUsers.map(u => u.id),
      expected_outcome: form.expectedOutcome.trim(),
      note:             form.description.trim(),
      agenda:           form.agenda || "",
      prework:          form.prework || "",
      link:             form.location.trim() || "",
      status:           "pending"
    };

    try {
      await api.post("/api/v1/planner/meetings", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onCreated?.(form);
    } catch (err) {
      console.error("Failed to create meeting via API:", err);
    }

    onClose();
    setForm(BLANK);
  };

  const ALL_TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: "design",     label: "Design",  icon: <LuListChecks size={13} /> },
    { id: "reports",    label: "Reports", icon: <LuFileText size={13} /> },
    { id: "ai-summary", label: "Summary", icon: <LuSparkles size={13} /> },
  ];
  const TABS = isReadOnly ? ALL_TABS : ALL_TABS.filter(t => t.id === "design");

  const panelBg     = "bg-white dark:bg-[#0d1520]";
  const borderColor = "border-[#E5E7EB] dark:border-[#1F2A37]";

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[1300px] ${panelBg} border-l ${borderColor} flex flex-col shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${borderColor} shrink-0`}>
          <button onClick={onClose} className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuX size={16} /></button>
          <LuVideo size={16} className="text-[#2563eb]" />
          <span className="text-sm font-bold text-[#111928] dark:text-white">{isReadOnly ? initialData.name : "New Meeting"}</span>
        </div>

        {/* Tab bar */}
        <div className={`flex border-b ${borderColor} shrink-0`}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${tab === t.id ? "border-[#2563eb] text-[#2563eb]" : `border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white`}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Body — Design tab */}
        {tab === "design" && (
          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
            {/* Left panel: KPI view when read-only, form when creating */}
            <div className={`flex-1 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r ${borderColor}`}>
              {isReadOnly ? (
                <MeetingKPIView
                  data={{ ...initialData, ...form }}
                  repeatDays={repeatDays}
                  users={users}
                  selectedUsers={selectedUsers}
                  onToggle={handleUserToggle}
                  onClear={handleClearUsers}
                />
              ) : (
                <div className="px-6 py-5 flex flex-col gap-5">
                <div><Label text="Name" /><MInput placeholder="e.g., Weekly Sprint Planning" value={form.name} onChange={set("name")} /></div>
                <div><Label text="Intention" optional /><textarea value={form.intention} onChange={e => set("intention")(e.target.value)} placeholder="What is the purpose of this meeting?" rows={3} className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><Label text="Type" /><SelectField value={form.type} onChange={set("type")} options={MEETING_TYPES} /></div>
                  <div><Label text="Duration (min)" /><MInput placeholder="--" value={form.duration} onChange={set("duration")} type="number" /></div>
                  <div className="relative">
                    <Label text="Participants" optional />
                    <ParticipantsDropdown
                      selectedUsers={selectedUsers}
                      onToggle={handleUserToggle}
                      onClear={handleClearUsers}
                      users={users}
                      isReadOnly={isReadOnly}
                      initialCount={(initialData as MeetingRow | null | undefined)?.participants}
                    />
                  </div>
                </div>
                <div>
                  <Label text="Recurrence" />
                  <div className="relative">
                    <select value={form.recurrence} onChange={e => set("recurrence")(e.target.value)} className={`${inputCls} appearance-none cursor-pointer border-2 border-[#2563eb] focus:border-[#2563eb]`}>
                      {RECURRENCES.map(r => <option key={r} className="bg-white dark:bg-[#0a1628]">{r}</option>)}
                    </select>
                    <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                  </div>

                  {/* Weekly: day-of-week pills */}
                  {form.recurrence === "Weekly" && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">Repeat on these days</p>
                      <div className="flex gap-2 flex-wrap">
                        {WEEK_DAYS.map(day => {
                          const active = repeatDays.has(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setRepeatDays(prev => {
                                const next = new Set(prev);
                                if (next.has(day)) next.delete(day); else next.add(day);
                                return next;
                              })}
                              className={`flex-1 min-w-[40px] rounded-lg py-2 text-xs font-semibold transition-colors ${
                                active
                                  ? "bg-[#2563eb] text-white border border-[#2563eb]"
                                  : "bg-[#F3F4F6] dark:bg-[#0d1520] text-[#374151] dark:text-[#D1D5DB] border border-[#D1D5DB] dark:border-[#374151] hover:border-[#2563eb]/50"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Monthly: select dates button + modal */}
                  {form.recurrence === "Monthly" && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowMonthPicker(true)}
                        className="w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#0d1520] py-2.5 text-sm font-semibold text-[#374151] dark:text-[#D1D5DB] hover:border-[#2563eb]/60 transition-colors"
                      >
                        {monthlyDates.size > 0
                          ? `Days: ${[...monthlyDates].sort((a,b)=>a-b).join(", ")}`
                          : "Select Dates"}
                      </button>

                      {/* Date-grid modal */}
                      {showMonthPicker && (
                        <>
                          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowMonthPicker(false)} />
                          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl bg-white dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#1F2A37] shadow-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm font-bold text-[#111928] dark:text-white">Select Repeat Dates</p>
                              <button type="button" onClick={() => setShowMonthPicker(false)} className="text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white"><LuX size={16} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5 mb-4">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                                const sel = monthlyDates.has(d);
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setMonthlyDates(prev => {
                                      const next = new Set(prev);
                                      if (next.has(d)) next.delete(d); else next.add(d);
                                      return next;
                                    })}
                                    className={`h-9 w-9 rounded-lg text-xs font-semibold transition-colors ${
                                      sel
                                        ? "bg-[#2563eb] text-white"
                                        : "bg-[#F3F4F6] dark:bg-[#122031] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#2563eb]/20"
                                    }`}
                                  >
                                    {d}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowMonthPicker(false)}
                              className="w-full rounded-lg bg-[#2563eb] py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8] transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Recurrence extra fields: shown for all recurring types */}
                {form.recurrence !== "One-time" && (
                  <>
                    {/* Start Date & Time */}
                    <div>
                      <Label text="Start Date & Time" />
                      <div className="relative flex items-center">
                        <LuCalendar size={14} className="absolute left-3 text-[#9CA3AF] pointer-events-none" />
                        <input
                          type="datetime-local"
                          value={form.startDateTime}
                          onChange={e => set("startDateTime")(e.target.value)}
                          className={`${inputCls} pl-8 cursor-pointer dark:[color-scheme:dark]`}
                        />
                      </div>
                    </div>

                    {/* Repeat Time */}
                    <div>
                      <Label text="Repeat Time" />
                      <div className="relative flex items-center">
                        <LuClock size={14} className="absolute left-3 text-[#9CA3AF] pointer-events-none" />
                        <input
                          type="time"
                          value={form.repeatTime}
                          onChange={e => set("repeatTime")(e.target.value)}
                          className={`${inputCls} pl-8 cursor-pointer dark:[color-scheme:dark]`}
                        />
                      </div>
                    </div>

                    {/* Due in Days */}
                    {/* <div>
                      <Label text="Due in Days (1 – 31 days)" />
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={form.dueInDays}
                        onChange={e => set("dueInDays")(e.target.value)}
                        placeholder="Enter number of days"
                        className={inputCls}
                      />
                    </div> */}
                  </>
                )}
                <div>
                  <Label text="Due Date & Time" />
                  <div className="relative flex items-center">
                    <LuCalendar size={14} className="absolute left-3 text-[#9CA3AF] pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={e => set("dueDate")(e.target.value)}
                      className={`${inputCls} pl-8 cursor-pointer dark:[color-scheme:dark]`}
                    />
                  </div>
                </div>
                <div><Label text="Expected Outcome" /><textarea value={form.expectedOutcome} onChange={e => set("expectedOutcome")(e.target.value)} placeholder="What should be achieved in this meeting?" rows={3} className={`${inputCls} resize-none`} /></div>
                {/* <div><Label text="Location" optional /><IconInput placeholder="Room name or address" value={form.location} onChange={set("location")} icon={<LuMapPin size={14} />} /></div> */}
                <div><Label text="Description / Notes" optional /><textarea value={form.description} onChange={e => set("description")(e.target.value)} placeholder="Paste a Zoom / Google Meet link or any notes for participants" rows={4} className={`${inputCls} resize-none`} /></div>
              
                </div>
              )}
            </div>
            {/* Right panel: always editable (Agenda, Prework, Files) */}
            <div className="w-full lg:w-[550px] shrink-0 lg:overflow-y-auto bg-[#F9FAFB] dark:bg-[#080f1a]">
              <div className="px-5 py-5 flex flex-col gap-6">
                <div><RightHeading icon={<LuListChecks size={13} />} label="Agenda" /><RichNoteEditor placeholder="Write agenda items..." readOnly={false} value={form.agenda} onChange={set("agenda")} /></div>
                <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2A37]" />
                <div><RightHeading icon={<LuRepeat size={13} />} label="Prework" /><RichNoteEditor placeholder="Write prework actions..." readOnly={false} value={form.prework} onChange={set("prework")} /></div>
                <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2A37]" />
                <FilesSection
                  meetingId={initialData?.id ?? null}
                  workspaceId={Number(workspaceId)}
                  token={token ?? ""}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

            {/* Score picker — shown for 1-to-1 meetings */}
            {form.type === "1-to-1" && (
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1628] p-4">
                <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-3">Report Score</p>
                <div className="flex items-center gap-4">
                  {/* Decrement */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(form.reportScore || "1", 10);
                      if (cur > 1) set("reportScore")(String(cur - 1));
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors text-lg font-bold select-none"
                  >−</button>

                  {/* Score display */}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-4xl font-extrabold text-[#111928] dark:text-white leading-none">
                      {form.reportScore || "—"}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] mt-1">out of 10</span>
                  </div>

                  {/* Increment */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(form.reportScore || "0", 10);
                      if (cur < 10) set("reportScore")(String(cur + 1));
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors text-lg font-bold select-none"
                  >+</button>
                </div>

                {/* Segmented bar 1–10 */}
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                    const active = parseInt(form.reportScore || "0", 10) >= n;
                    const color = n <= 3 ? "#ef4444" : n <= 6 ? "#f59e0b" : "#22c55e";
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set("reportScore")(String(n))}
                        style={{ backgroundColor: active ? color : undefined }}
                        className={`flex-1 h-2 rounded-full transition-all ${active ? "" : "bg-[#E5E7EB] dark:bg-[#1F2A37]"}`}
                        title={String(n)}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 px-0.5">
                  <span className="text-[9px] text-[#EF4444] font-semibold">Low</span>
                  <span className="text-[9px] text-[#F59E0B] font-semibold">Mid</span>
                  <span className="text-[9px] text-[#22C55E] font-semibold">High</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-2">Report Notes</p>
              <RichNoteEditor placeholder="Write your meeting report..." className="flex-1" value={form.report} onChange={set("report")} />
            </div>
          </div>
        )}

        {tab === "ai-summary" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-1">Summary Notes</p>
            <RichNoteEditor placeholder="Write your meeting summary..." className="flex-1" value={form.summary} onChange={set("summary")} />
          </div>
        )}

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t ${borderColor} shrink-0 ${panelBg}`}>
          <button onClick={onClose} className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-3 text-sm font-semibold text-[#374151] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={!form.name.trim()} className="flex-1 rounded-lg bg-[#2563eb] py-3 text-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {isReadOnly ? "Save Changes" : "Create Meeting"}
          </button>
        </div>
      </div>
    </>
  );
}
