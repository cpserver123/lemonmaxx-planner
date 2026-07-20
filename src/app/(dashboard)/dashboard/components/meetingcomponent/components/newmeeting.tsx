"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  LuX, LuCalendar, LuClock, LuMapPin, LuFileText,
  LuChevronDown, LuListChecks, LuPaperclip, LuSparkles,
  LuVideo, LuRepeat, LuCheck,
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
  dueDate:         string;
  dueTime:         string;
  participants:    string;
  expectedOutcome: string;
  location:        string;
  description:     string;
  isExternal:      boolean;
  isPrivate:       boolean;
  reportScore?:    string;
}

export interface MeetingRow {
  id:          string;
  name:        string;
  type:        string;
  recurrence:  string;
  nextInstance: string;
  participants: number;
  duration:    string;
  createdBy:   string;
  status:      "Pending" | "Active" | "Completed";
  reportScore?: string;
}

export const BLANK: MeetingForm = {
  name:            "",
  intention:       "",
  type:            "Review",
  duration:        "",
  recurrence:      "One-time",
  dueDate:         "",
  dueTime:         "9:00 AM",
  participants:    "",
  expectedOutcome: "",
  location:        "",
  description:     "",
  isExternal:      false,
  isPrivate:       false,
};

export const MEETING_TYPES = ["Review", "Planning", "Standup", "1-on-1", "Retrospective", "Workshop", "Follow-up", "Other"];
export const RECURRENCES   = ["One-time", "Daily", "Weekly", "Bi-weekly", "Monthly"];

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

function RichNoteEditor({ placeholder = "Write Content", readOnly = false, className = "" }: { placeholder?: string, readOnly?: boolean, className?: string }) {
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

  const saveSnapshot = useCallback(() => {
    if (readOnly) return;
    const content = editorRef.current?.innerHTML ?? "";
    const stack   = historyRef.current;
    if (stack[historyIdxRef.current] === content) return;
    historyRef.current    = [...stack.slice(0, historyIdxRef.current + 1), content];
    historyIdxRef.current = historyRef.current.length - 1;
  }, [readOnly]);

  const handleUndo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (readOnly || historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    if (editorRef.current)
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
    syncState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  const handleRedo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (readOnly || historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    if (editorRef.current)
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
    syncState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

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

function FilesSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...selected.filter(f => !existing.has(f.name + f.size))];
    });
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles(prev => prev.filter((_, i) => i !== index));

  const fmtSize = (bytes: number) => {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <RightHeading icon={<LuPaperclip size={13} />} label="Files" />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0a1628] px-4 py-3 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/60 hover:text-[#2563eb] dark:hover:text-[#2563eb] transition-colors group">
        <LuPaperclip size={13} className="shrink-0 group-hover:text-[#2563eb] transition-colors" />
        Upload Files
      </button>
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${i}`} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] px-3 py-2 group">
              <LuPaperclip size={12} className="shrink-0 text-[#9CA3AF]" />
              <span className="flex-1 truncate text-xs text-[#111928] dark:text-white">{file.name}</span>
              <span className="text-[10px] text-[#9CA3AF] shrink-0">{fmtSize(file.size)}</span>
              <button onClick={() => removeFile(i)} className="shrink-0 text-[#9CA3AF] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remove">
                <LuX size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
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

type ModalTab = "design" | "reports" | "ai-summary";

/* --- Create Meeting Modal ----------------------------------------------- */
export default function CreateMeetingModal({
  open,
  onClose,
  onCreated,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (form: MeetingForm) => void;
  initialData?: MeetingRow | null;
}) {
  const [tab, setTab] = useState<ModalTab>("design");
  const [form, setForm] = useState<MeetingForm>(BLANK);
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
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
      let next;
      if (exists) {
        next = prev.filter(u => u.id !== user.id);
      } else {
        next = [...prev, user];
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
    if (open) {
      if (initialData) {
        setForm({
          ...BLANK,
          name: initialData.name,
          type: initialData.type,
          recurrence: initialData.recurrence,
          participants: String(initialData.participants || ""),
          duration: initialData.duration === "—" ? "" : initialData.duration.replace(" min", ""),
          reportScore: initialData.reportScore || "",
        });
        setSelectedUsers([]);
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

  const handleCreate = () => {
    if (form.name.trim() && !isReadOnly) onCreated?.(form);
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
          <div className="flex flex-1 overflow-hidden">
            <div className={`flex-1 overflow-y-auto border-r ${borderColor}`}>
              <div className={`px-6 py-5 flex flex-col gap-5 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}>
                <div><Label text="Name" /><MInput placeholder="e.g., Weekly Sprint Planning" value={form.name} onChange={set("name")} /></div>
                <div><Label text="Intention" optional /><textarea value={form.intention} onChange={e => set("intention")(e.target.value)} placeholder="What is the purpose of this meeting?" rows={3} className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-3 gap-4">
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
                      initialCount={initialData?.participants}
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label text="Due Date" />
                    <div className="relative"><input type="date" value={form.dueDate} onChange={e => set("dueDate")(e.target.value)} className={`${inputCls} cursor-pointer dark:[color-scheme:dark]`} /><LuCalendar size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" /></div>
                  </div>
                  <div>
                    <Label text="Due Time" />
                    <div className="relative"><input type="time" value={form.dueTime} onChange={e => set("dueTime")(e.target.value)} className={`${inputCls} cursor-pointer dark:[color-scheme:dark]`} /><LuClock size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" /></div>
                  </div>
                </div>
                <div><Label text="Expected Outcome" /><textarea value={form.expectedOutcome} onChange={e => set("expectedOutcome")(e.target.value)} placeholder="What should be achieved in this meeting?" rows={3} className={`${inputCls} resize-none`} /></div>
                <div><Label text="Location" optional /><IconInput placeholder="Room name or address" value={form.location} onChange={set("location")} icon={<LuMapPin size={14} />} /></div>
                <div><Label text="Description / Notes" optional /><textarea value={form.description} onChange={e => set("description")(e.target.value)} placeholder="Paste a Zoom / Google Meet link or any notes for participants" rows={4} className={`${inputCls} resize-none`} /></div>
                <div className="flex flex-col gap-3">
                  <Checkbox checked={form.isExternal} onChange={v => set("isExternal")(v)} label="External meeting (with external participants)" />
                  <Checkbox checked={form.isPrivate} onChange={v => set("isPrivate")(v)} label="Private meeting (only participants can see it)" />
                </div>
              </div>
            </div>
            <div className="w-[550px] shrink-0 overflow-y-auto bg-[#F9FAFB] dark:bg-[#080f1a]">
              <div className={`px-5 py-5 flex flex-col gap-6 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}>
                <div><RightHeading icon={<LuListChecks size={13} />} label="Agenda" /><RichNoteEditor placeholder="Write agenda items..." readOnly={isReadOnly} /></div>
                <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2A37]" />
                <div><RightHeading icon={<LuRepeat size={13} />} label="Prework" /><RichNoteEditor placeholder="Write prework actions..." readOnly={isReadOnly} /></div>
                <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2A37]" />
                <FilesSection />
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">Report Notes</p>
              {form.type === "Review" && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#111928] dark:text-[#E5E7EB]">Report Score (1-10):</label>
                  <input type="number" min="1" max="10" value={form.reportScore || ""} onChange={e => set("reportScore")(e.target.value)} className="w-16 rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1628] px-2 py-1 text-sm text-[#111928] dark:text-white outline-none focus:border-[#2563eb]" />
                </div>
              )}
            </div>
            <RichNoteEditor placeholder="Write your meeting report..." className="flex-1" />
          </div>
        )}

        {tab === "ai-summary" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-1">Summary Notes</p>
            <RichNoteEditor placeholder="Write your meeting summary..." className="flex-1" />
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
