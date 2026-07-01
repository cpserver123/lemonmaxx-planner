"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  LuPlus, LuX, LuCalendar, LuClock, LuMapPin, LuFileText,
  LuChevronDown, LuUsers, LuListChecks, LuPaperclip, LuSparkles,
  LuVideo, LuRepeat, LuChevronLeft, LuChevronRight,
  LuSearch, LuUpload, LuEllipsisVertical, LuLayoutList,
} from "react-icons/lu";

/* --- Types -------------------------------------------------------------- */
interface MeetingForm {
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
}

const BLANK: MeetingForm = {
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

const MEETING_TYPES = ["Review", "Planning", "Standup", "1-on-1", "Retrospective", "Workshop","Follow-up", "Other"];
const RECURRENCES   = ["One-time", "Daily", "Weekly", "Bi-weekly", "Monthly"];

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

/* --- Inline field with icon --------------------------------------------- */
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

/* --- Section heading (right panel) -------------------------------------- */
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

function RichNoteEditor({ placeholder = "Write Content" }: { placeholder?: string }) {
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

  /* ---- Per-instance undo/redo history (isolated from other editors) ---- */
  const historyRef    = useRef<string[]>([""]);   // snapshots of innerHTML
  const historyIdxRef = useRef(0);                // current position in stack

  const saveSnapshot = useCallback(() => {
    const content = editorRef.current?.innerHTML ?? "";
    const stack   = historyRef.current;
    // Don't push duplicates
    if (stack[historyIdxRef.current] === content) return;
    // Truncate any forward history before pushing
    historyRef.current    = [...stack.slice(0, historyIdxRef.current + 1), content];
    historyIdxRef.current = historyRef.current.length - 1;
  }, []);

  const handleUndo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    if (editorRef.current)
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
    syncState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    if (editorRef.current)
      editorRef.current.innerHTML = historyRef.current[historyIdxRef.current];
    syncState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* ---------------------------------------------------------------------- */

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFont(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const syncState = useCallback(() => {
    setBold(document.queryCommandState("bold"));
    setItalic(document.queryCommandState("italic"));
    setUnderline(document.queryCommandState("underline"));
    setStrike(document.queryCommandState("strikeThrough"));
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? "");
    syncState();
  }, [syncState]);

  const applyFont = (family: string) => {
    setFontFamily(family);
    setShowFont(false);
    editorRef.current?.focus();
    if (family !== "System Default") document.execCommand("fontName", false, family);
  };

  const applySize = (size: string) => {
    setFontSize(size);
    editorRef.current?.focus();
    /* execCommand fontsize uses 1-7 index; use inline style instead */
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = size;
      try { range.surroundContents(span); } catch { /* partial selection — skip */ }
    }
  };

  const insertDate = () => {
    exec("insertText", new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  };

  const insertDivider = () => {
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
    <div className="rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] flex flex-col bg-white dark:bg-[#111928]">
      {/* Toolbar */}
      <div className="relative flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E7EB] dark:border-[#1F2A37] flex-wrap bg-[#F9FAFB] dark:bg-[#1a2332] rounded-t-lg">
        {/* Undo / Redo — per-instance isolated history */}
        <button onMouseDown={handleUndo} title="Undo" className={btnCls(false)}>←</button>
        <button onMouseDown={handleRedo} title="Redo" className={btnCls(false)}>→</button>

        <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />

        {/* Bold */}
        <button onMouseDown={e => { e.preventDefault(); exec("bold"); }} title="Bold" className={btnCls(bold)}><strong>B</strong></button>
        {/* Italic */}
        <button onMouseDown={e => { e.preventDefault(); exec("italic"); }} title="Italic" className={btnCls(italic)}><em>I</em></button>
        {/* Underline */}
        <button onMouseDown={e => { e.preventDefault(); exec("underline"); }} title="Underline" className={btnCls(underline)}><u>U</u></button>
        {/* Strikethrough */}
        <button onMouseDown={e => { e.preventDefault(); exec("strikeThrough"); }} title="Strikethrough" className={btnCls(strike)}><s>S</s></button>

        <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />

        {/* Bullet List */}
        <button onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} title="Bullet List" className={btnCls(false)}>• List</button>
        {/* Numbered List */}
        <button onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} title="Numbered List" className={btnCls(false)}>1. List</button>

        <span className="mx-1 h-3.5 w-px bg-[#E5E7EB] dark:bg-[#374151]" />

        {/* Font Family */}
        <div ref={fontRef} className="relative">
          <button
            onClick={() => { setShowFont(o => !o); setShowMore(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
          >
            Font {showFont ? "▲" : "▼"}
          </button>
          {showFont && (
            <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1a2332] shadow-2xl py-2">
              <p className="px-3 py-1 text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Font Family</p>
              {FONT_FAMILIES.map(f => (
                <button
                  key={f}
                  onClick={() => applyFont(f)}
                  className={`flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#0d1520] transition-colors ${
                    fontFamily === f ? "text-[#111928] dark:text-white font-medium" : "text-[#6B7280] dark:text-[#9CA3AF]"
                  }`}
                  style={{ fontFamily: f === "System Default" ? undefined : f }}
                >
                  {f}
                  {fontFamily === f && <span className="text-[#2563eb] text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="relative">
          <select
            value={fontSize}
            onChange={e => applySize(e.target.value)}
            className="px-2 py-1 rounded text-xs font-bold bg-[#2563eb] text-white border-none outline-none cursor-pointer appearance-none pr-5"
          >
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-white pointer-events-none">▼</span>
        </div>

        {/* More */}
        <div ref={moreRef} className="relative ml-auto">
          <button
            onClick={() => { setShowMore(o => !o); setShowFont(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
          >
            More {showMore ? "▲" : "▼"}
          </button>
          {showMore && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1a2332] shadow-2xl p-3 flex flex-col gap-3">
              {/* Alignment */}
              <div>
                <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Alignment</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Left", "Center", "Right"] as const).map(align => (
                    <button
                      key={align}
                      onMouseDown={e => { e.preventDefault(); exec("justify" + align); setShowMore(false); }}
                      className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors"
                    >
                      <span className="text-base">≡</span>
                      {align}
                    </button>
                  ))}
                </div>
              </div>
              {/* Insert */}
              <div>
                <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Insert</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onMouseDown={e => { e.preventDefault(); insertDivider(); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors">
                    <span>╌╌╌╌</span>Divider
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); insertDate(); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors">
                    <span>📅</span>Date
                  </button>
                </div>
              </div>
              {/* Indent */}
              <div>
                <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Indent</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onMouseDown={e => { e.preventDefault(); exec("indent"); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors">
                    <span>⇥</span>Indent<span className="text-[8px] text-[#9CA3AF]">Tab</span>
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); exec("outdent"); setShowMore(false); }} className="flex flex-col items-center gap-1 rounded-lg bg-[#F3F4F6] dark:bg-[#0d1520] border border-[#E5E7EB] dark:border-[#374151] py-2 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:border-[#2563eb]/40 transition-colors">
                    <span>⇤</span>Outdent<span className="text-[8px] text-[#9CA3AF]">⇧Tab</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={saveSnapshot}
        onKeyUp={syncState}
        onMouseUp={syncState}
        onSelect={syncState}
        data-placeholder={placeholder}
        style={{ fontFamily: fontFamily === "System Default" ? undefined : fontFamily, fontSize }}
        className={[
          "flex-1 min-h-[140px] px-4 py-3 text-sm text-[#111928] dark:text-white outline-none",
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0a1628] px-4 py-3 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/60 hover:text-[#2563eb] dark:hover:text-[#2563eb] transition-colors group"
      >
        <LuPaperclip size={13} className="shrink-0 group-hover:text-[#2563eb] transition-colors" />
        Upload Files
      </button>

      {/* Attached file list */}
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#1F2A37] bg-white dark:bg-[#0a1628] px-3 py-2 group"
            >
              <LuPaperclip size={12} className="shrink-0 text-[#9CA3AF]" />
              <span className="flex-1 truncate text-xs text-[#111928] dark:text-white">{file.name}</span>
              <span className="text-[10px] text-[#9CA3AF] shrink-0">{fmtSize(file.size)}</span>
              <button
                onClick={() => removeFile(i)}
                className="shrink-0 text-[#9CA3AF] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <LuX size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ModalTab = "design" | "reports" | "ai-summary";

function CreateMeetingModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (form: MeetingForm) => void }) {
  const [tab, setTab] = useState<ModalTab>("design");
  const [form, setForm] = useState<MeetingForm>(BLANK);

  const set = (field: keyof MeetingForm) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = () => {
    if (form.name.trim()) onCreated?.(form);
    onClose();
    setForm(BLANK);
  };

  const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: "design",     label: "Design",     icon: <LuListChecks size={13} /> },
    { id: "reports",    label: "Reports",    icon: <LuFileText size={13} /> },
    { id: "ai-summary", label: "Summary", icon: <LuSparkles size={13} /> },
  ];

  /* Panel bg + border tokens that work in both modes */
  const panelBg     = "bg-white dark:bg-[#0d1520]";
  const borderColor = "border-[#E5E7EB] dark:border-[#1F2A37]";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[1300px] ${panelBg} border-l ${borderColor} flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${borderColor} shrink-0`}>
          <button onClick={onClose} className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuX size={16} />
          </button>
          <LuVideo size={16} className="text-[#2563eb]" />
          <span className="text-sm font-bold text-[#111928] dark:text-white">New Meeting</span>
        </div>

        {/* Tab bar */}
        <div className={`flex border-b ${borderColor} shrink-0`}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : `border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white`
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        {tab === "design" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left form panel */}
            <div className={`flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 border-r ${borderColor}`}>

              {/* Name */}
              <div>
                <Label text="Name" />
                <MInput placeholder="e.g., Weekly Sprint Planning" value={form.name} onChange={set("name")} />
              </div>

              {/* Intention */}
              <div>
                <Label text="Intention" optional />
                <textarea
                  value={form.intention}
                  onChange={e => set("intention")(e.target.value)}
                  placeholder="What is the purpose of this meeting?"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Type, Duration & Participants */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label text="Type" />
                  <SelectField value={form.type} onChange={set("type")} options={MEETING_TYPES} />
                </div>
                <div>
                  <Label text="Duration (min)" />
                  <MInput placeholder="--" value={form.duration} onChange={set("duration")} type="number" />
                </div>
                <div>
                  <Label text="Participants" optional />
                  <MInput placeholder="0" value={form.participants} onChange={set("participants")} type="number" />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <Label text="Recurrence" />
                <div className="relative">
                  <select
                    value={form.recurrence}
                    onChange={e => set("recurrence")(e.target.value)}
                    className={`${inputCls} appearance-none cursor-pointer border-2 border-[#2563eb] focus:border-[#2563eb]`}
                  >
                    {RECURRENCES.map(r => <option key={r} className="bg-white dark:bg-[#0a1628]">{r}</option>)}
                  </select>
                  <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Due Date" />
                  <div className="relative">
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => set("dueDate")(e.target.value)}
                      className={`${inputCls} cursor-pointer dark:[color-scheme:dark]`}
                    />
                    <LuCalendar size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>
                <div>
                  <Label text="Due Time" />
                  <div className="relative">
                    <input
                      type="time"
                      value={form.dueTime}
                      onChange={e => set("dueTime")(e.target.value)}
                      className={`${inputCls} cursor-pointer dark:[color-scheme:dark]`}
                    />
                    <LuClock size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>
              </div>

              {/* Expected Outcome */}
              <div>
                <Label text="Expected Outcome" />
                <textarea
                  value={form.expectedOutcome}
                  onChange={e => set("expectedOutcome")(e.target.value)}
                  placeholder="What should be achieved in this meeting?"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Location */}
              <div>
                <Label text="Location" optional />
                <IconInput
                  placeholder="Room name or address"
                  value={form.location}
                  onChange={set("location")}
                  icon={<LuMapPin size={14} />}
                />
              </div>

              {/* Description / Notes */}
              <div>
                <Label text="Description / Notes" optional />
                <textarea
                  value={form.description}
                  onChange={e => set("description")(e.target.value)}
                  placeholder="Paste a Zoom / Google Meet link or any notes for participants"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <Checkbox
                  checked={form.isExternal}
                  onChange={v => set("isExternal")(v)}
                  label="External meeting (with external participants)"
                />
                <Checkbox
                  checked={form.isPrivate}
                  onChange={v => set("isPrivate")(v)}
                  label="Private meeting (only participants can see it)"
                />
              </div>

            </div>

            {/* Right info panel */}
            <div className={`w-[550px] shrink-0 overflow-y-auto px-5 py-5 flex flex-col gap-6 bg-[#F9FAFB] dark:bg-[#080f1a]`}>

              {/* Agenda */}
              <div>
                <RightHeading icon={<LuListChecks size={13} />} label="Agenda" />
                <RichNoteEditor placeholder="Write agenda items..." />
              </div>

              <div className={`h-px bg-[#E5E7EB] dark:bg-[#1F2A37]`} />

              {/* Prework */}
              <div>
                <RightHeading icon={<LuRepeat size={13} />} label="Prework" />
                <RichNoteEditor placeholder="Write prework actions..." />
              </div>

              <div className={`h-px bg-[#E5E7EB] dark:bg-[#1F2A37]`} />

              {/* Files */}
              <FilesSection />
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-1">Report Notes</p>
            <div className="flex-1">
              <RichNoteEditor placeholder="Write your meeting report..." />
            </div>
          </div>
        )}

        {tab === "ai-summary" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-1">Summary Notes</p>
            <div className="flex-1">
              <RichNoteEditor placeholder="Write your meeting summary..." />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t ${borderColor} shrink-0 ${panelBg}`}>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-3 text-sm font-semibold text-[#374151] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name.trim()}
            className="flex-1 rounded-lg bg-[#2563eb] py-3 text-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Meeting
          </button>
        </div>
      </div>
    </>
  );
}

/* --- Table types & data ------------------------------------------------- */
type MeetingStatus = "Pending" | "Active" | "Completed";

interface MeetingRow {
  id:          string;
  name:        string;
  type:        string;
  recurrence:  string;
  nextInstance: string;
  participants: number;
  duration:    string;
  createdBy:   string;
  status:      MeetingStatus;
}

const DUMMY_ROWS: MeetingRow[] = [
  { id: "r1",  name: "Apollo : Leadgen Focused Area Meeting",          type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:00", participants: 11, duration: "120 min", createdBy: "Gagan Brar",     status: "Active" },
  { id: "r2",  name: "Apollo Strategic Area",                          type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 16:00", participants: 14, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r3",  name: "APOLLO- CM* Recorder",                           type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:15", participants: 2,  duration: "15 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r4",  name: "Board - Leadgen Weekly review",                   type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 23:00", participants: 1,  duration: "60 min",  createdBy: "Devinder",        status: "Active" },
  { id: "r5",  name: "Board Meeting Leadgen For Breakdown Resolution",  type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 6, 2026 · 14:30", participants: 3,  duration: "—",       createdBy: "Devinder",        status: "Active" },
  { id: "r6",  name: "Branding Calendar- All Brands",                  type: "Review",    recurrence: "Daily",             nextInstance: "Jul 1, 2026 · 09:00", participants: 4,  duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r7",  name: "Branding Reporting",                             type: "Review",    recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 12:30", participants: 4,  duration: "-",       createdBy: "—",             status: "Active" },
  { id: "r8",  name: "Buddy meeting",                                  type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 15:00", participants: 2,  duration: "15 min",  createdBy: "—",             status: "Active" },
  { id: "r9",  name: "Chaos Strategic Meeting",                        type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 1, 2026 · 16:00", participants: 11, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r10", name: "CMx CHAOS Recorder",                             type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 3, 2026 · 15:30", participants: 2,  duration: "15 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r11", name: "Core Meeting",                                   type: "Strategic", recurrence: "Weekly",            nextInstance: "Jul 2, 2026 · 17:30", participants: 13, duration: "120 min", createdBy: "—",             status: "Active" },
  { id: "r12", name: "Core team meeting for completing the Parked agend...", type: "Strategic", recurrence: "Weekly",     nextInstance: "Jul 3, 2026 · 14:15", participants: 13, duration: "60 min",  createdBy: "Pankhuri Sharma", status: "Active" },
  { id: "r13", name: "Daily HOC F-com Scrum",                          type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 · 12:00", participants: 6,  duration: "30 min",  createdBy: "Sumedha Sharma",  status: "Active" },
  { id: "r14", name: "Daily Huddle Meeting",                           type: "Review",    recurrence: "Weekdays (Mon-Fri)", nextInstance: "Jul 1, 2026 · 13:00", participants: 8,  duration: "45 min",  createdBy: "—",             status: "Active" },
  { id: "r15", name: "Ecom Board Meeting",                             type: "Business",  recurrence: "Custom...",          nextInstance: "Jul 17, 2026 · 09:00",participants: 4,  duration: "-",       createdBy: "—",             status: "Active" },
  { id: "r16", name: "Ecom Focus Area | Team shubham Gupta )",          type: "Business",  recurrence: "Monthly",           nextInstance: "Jul 3, 2026 · 14:15", participants: 11, duration: "120 min", createdBy: "—",             status: "Active" },
];

const TYPE_COLOR: Record<string, string> = {
  Strategic: "#8b5cf6",
  Review:    "#f59e0b",
  Business:  "#06b6d4",
  Planning:  "#2563eb",
  Standup:   "#10b981",
  "1-on-1":  "#ec4899",
};

/* --- Meeting Table Component -------------------------------------------- */
function MeetingTable({
  rows, onAddMeeting, showCompleted, onToggleShowCompleted,
}: {
  rows: MeetingRow[];
  onAddMeeting: () => void;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
}) {
  const [search, setSearch] = useState("");
  const [meMode, setMeMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [rowStatuses, setRowStatuses] = useState<Record<string, MeetingStatus>>(
    () => Object.fromEntries(rows.map(r => [r.id, r.status]))
  );

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked = filtered.length > 0 && filtered.every(r => selectedRows.has(r.id));
  const someChecked = filtered.some(r => selectedRows.has(r.id));

  const toggleAll = () => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allChecked) { filtered.forEach(r => next.delete(r.id)); }
      else            { filtered.forEach(r => next.add(r.id)); }
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const STATUS_STYLE: Record<MeetingStatus, { color: string; bg: string; border: string }> = {
    Pending:   { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
    Active:    { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
    Completed: { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" },
  };

  const cols = [
    { key: "name",         label: "Name",          w: "min-w-[220px] flex-1" },
    { key: "type",         label: "Type",          w: "w-[110px] shrink-0" },
    { key: "recurrence",   label: "Recurrence",    w: "w-[160px] shrink-0" },
    { key: "nextInstance", label: "Next Instance", w: "w-[170px] shrink-0" },
    { key: "participants", label: "Participants",  w: "w-[110px] shrink-0" },
    { key: "duration",     label: "Duration",      w: "w-[100px] shrink-0" },
    { key: "createdBy",    label: "Created By",    w: "w-[140px] shrink-0" },
    { key: "status",       label: "Status",        w: "w-[120px] shrink-0" },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] pl-9 pr-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#2563eb] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Me mode */}
          <button
            onClick={() => setMeMode(p => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              meMode
                ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]"
                : "border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40"
            }`}
          >
            <LuUsers size={13} />
            Me mode
          </button>

          {/* Show completed toggle */}
          <button
            onClick={onToggleShowCompleted}
            className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#2563eb]/40 transition-colors"
          >
            <span
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                showCompleted ? "bg-[#2563eb]" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${
                  showCompleted ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
            Show completed
          </button>

       

          {/* Add Meeting */}
          <button
            onClick={onAddMeeting}
            className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors"
          >
            <LuPlus size={13} />
            Add Meeting
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018]">
                {/* Checkbox col */}
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563eb] accent-[#2563eb] cursor-pointer"
                  />
                </th>
                {/* Row number */}
                <th className="w-10 px-2 py-3 text-[11px] font-semibold text-[#9CA3AF] text-center">#</th>
                {cols.map(c => (
                  <th
                    key={c.key}
                    className={`px-3 py-3 text-left ${c.w}`}
                  >
                    <div className="flex items-center gap-1 group">
                      <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">{c.label}</span>
                      <LuEllipsisVertical size={11} className="text-[#D1D5DB] dark:text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F3F4F6] dark:border-[#1F2A37]/60 hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018]/60 transition-colors group cursor-pointer"
                >
                  {/* Checkbox */}
                  <td className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      onClick={e => e.stopPropagation()}
                      className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563eb] accent-[#2563eb] cursor-pointer"
                    />
                  </td>
                  {/* Row number */}
                  <td className="w-10 px-2 py-2.5 text-xs text-[#9CA3AF] text-center">{i + 1}</td>
                  {/* Name */}
                  <td className="px-3 py-2.5 min-w-[220px] flex-1">
                    <span className="text-sm font-medium text-[#111928] dark:text-white truncate block max-w-[260px]">{row.name}</span>
                  </td>
                  {/* Type */}
                  <td className="px-3 py-2.5 w-[110px] shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        color: TYPE_COLOR[row.type] ?? "#6B7280",
                        background: (TYPE_COLOR[row.type] ?? "#6B7280") + "18",
                      }}
                    >
                      {row.type}
                    </span>
                  </td>
                  {/* Recurrence */}
                  <td className="px-3 py-2.5 w-[160px] shrink-0">
                    <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.recurrence}</span>
                  </td>
                  {/* Next Instance */}
                  <td className="px-3 py-2.5 w-[170px] shrink-0">
                    <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.nextInstance}</span>
                  </td>
                  {/* Participants */}
                  <td className="px-3 py-2.5 w-[110px] shrink-0">
                    <div className="flex items-center gap-1 text-sm text-[#374151] dark:text-[#D1D5DB]">
                      <LuUsers size={13} className="text-[#9CA3AF]" />
                      {row.participants}
                    </div>
                  </td>
                  {/* Duration */}
                  <td className="px-3 py-2.5 w-[100px] shrink-0">
                    <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.duration}</span>
                  </td>
                  {/* Created By */}
                  <td className="px-3 py-2.5 w-[140px] shrink-0">
                    <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">{row.createdBy}</span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-2.5 w-[130px] shrink-0" onClick={e => e.stopPropagation()}>
                    {(() => {
                      const s = rowStatuses[row.id] ?? "Active";
                      const st = STATUS_STYLE[s];
                      return (
                        <div className="relative inline-block">
                          <select
                            value={s}
                            onChange={e => setRowStatuses(prev => ({ ...prev, [row.id]: e.target.value as MeetingStatus }))}
                            className="appearance-none rounded-md border pl-2.5 pr-6 py-1 text-xs font-semibold cursor-pointer outline-none transition-colors"
                            style={{ color: st.color, background: st.bg, borderColor: st.border }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <LuChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: st.color }} />
                        </div>
                      );
                    })()}
                  </td>
                  {/* Row action */}
                  <td className="w-10 px-2 py-2.5">
                    <LuEllipsisVertical size={14} className="text-[#D1D5DB] dark:text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* --- Calendar types & helpers ------------------------------------------- */
interface MeetingEvent {
  id:       string;
  title:    string;
  dayOfWeek: number;   // 0=Mon ... 6=Sun
  startHr:  number;
  startMin: number;
  endHr:    number;
  endMin:   number;
  color:    string;
}

const EVENT_COLORS = ["#2563eb", "#7c3aed", "#065f46", "#5750F1", "#f59e0b", "#ec4899", "#06b6d4"];

const DUMMY_EVENTS: MeetingEvent[] = [
  { id: "e1", title: "Weekly Sprint Planning",  dayOfWeek: 0, startHr: 9,  startMin: 0,  endHr: 10, endMin: 0,  color: "#2563eb" },
  { id: "e2", title: "VSL Daily Standup",        dayOfWeek: 0, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#065f46" },
  { id: "e3", title: "1-on-1 with Arun",         dayOfWeek: 1, startHr: 10, startMin: 30, endHr: 11, endMin: 0,  color: "#7c3aed" },
  { id: "e4", title: "Team Retrospective",       dayOfWeek: 2, startHr: 14, startMin: 0,  endHr: 15, endMin: 0,  color: "#f59e0b" },
  { id: "e5", title: "performance",          dayOfWeek: 3, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#5750F1" },
  { id: "e6", title: "Onboarding Session",       dayOfWeek: 3, startHr: 9,  startMin: 0,  endHr: 10, endMin: 30, color: "#06b6d4" },
  { id: "e7", title: "KPI Review",               dayOfWeek: 4, startHr: 13, startMin: 0,  endHr: 14, endMin: 0,  color: "#ec4899" },
];

const HOURS_CAL = [6,7,8,9,10,11,12,13,14,15,16,17,18];
const PX_PER_HOUR_CAL = 64;
const DAY_COL_W = 130;
const TIME_COL_W = 56;
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const LONG_MONTHS_CAL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAMES_CAL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function calTop(hr: number, min: number) {
  return ((hr - HOURS_CAL[0]) + min / 60) * PX_PER_HOUR_CAL;
}
function calHeight(sHr: number, sMin: number, eHr: number, eMin: number) {
  return Math.max(((eHr - sHr) + (eMin - sMin) / 60) * PX_PER_HOUR_CAL, 20);
}

/** Get Monday of the week containing `date` */
function getMonday(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}

/* --- Meeting Calendar --------------------------------------------------- */
function MeetingCalendar({ events }: { events: MeetingEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()-7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()+7); return n; });
  const goToday  = () => setWeekStart(getMonday(today));

  // Label = month(s) + year of the displayed week
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const label = weekStart.getMonth() === weekEnd.getMonth()
    ? `${LONG_MONTHS_CAL[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTH_NAMES_CAL[weekStart.getMonth()]} - ${MONTH_NAMES_CAL[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // Day header dates (Mon-Sun)
  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });

  const totalH = HOURS_CAL.length * PX_PER_HOUR_CAL;
  const allEvents = [...DUMMY_EVENTS, ...events];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronLeft size={14} />
          </button>

          {/* Month picker */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors"
            >
              <LuCalendar size={12} className="text-[#9CA3AF]" />
              {label}
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPickerYear(y => y-1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={13}/></button>
                    <span className="text-sm font-semibold text-[#111928] dark:text-white">{pickerYear}</span>
                    <button onClick={() => setPickerYear(y => y+1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={13}/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES_CAL.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => {
                          const target = new Date(pickerYear, i, 1);
                          setWeekStart(getMonday(target));
                          setPickerMonth(i);
                          setShowPicker(false);
                        }}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          i === pickerMonth && pickerYear === weekStart.getFullYear()
                            ? "bg-[#2563eb] text-white"
                            : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}
                      >{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={nextWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronRight size={14} />
          </button>
          <button onClick={goToday} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors">
            This Week
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="w-full">

            {/* Day header */}
            <div
              className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] sticky top-0 z-20"
              style={{ paddingLeft: TIME_COL_W }}
            >
              {dayDates.map((d, di) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div
                    key={di}
                    className="flex flex-1 flex-col items-center justify-center py-2.5 border-l border-[#E6EBF1] dark:border-[#1F2A37]"
                  >
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{DAYS_SHORT[di]}</span>
                    <span className={`text-sm font-bold mt-0.5 ${
                      isToday ? "text-[#2563eb]" : "text-[#111928] dark:text-white"
                    }`}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="flex" style={{ height: totalH }}>
              {/* Time labels */}
              <div className="shrink-0 relative" style={{ width: TIME_COL_W, height: totalH }}>
                {HOURS_CAL.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[9px] text-[#9CA3AF] font-medium"
                    style={{ top: i * PX_PER_HOUR_CAL - 6 }}
                  >
                    {String(h).padStart(2,"0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayDates.map((_, di) => {
                const colEvents = allEvents.filter(e => e.dayOfWeek === di);
                return (
                  <div
                    key={di}
                    className="flex-1 border-l border-[#E6EBF1] dark:border-[#1F2A37] relative"
                    style={{ height: totalH }}
                  >
                    {/* Hour lines */}
                    {HOURS_CAL.map((_, hi) => (
                      <div
                        key={hi}
                        className="absolute left-0 right-0 border-t border-[#E6EBF1] dark:border-[#1F2A37]"
                        style={{ top: hi * PX_PER_HOUR_CAL }}
                      />
                    ))}
                    {/* Events */}
                    {colEvents.map((ev) => {
                      const top    = calTop(ev.startHr, ev.startMin);
                      const height = calHeight(ev.startHr, ev.startMin, ev.endHr, ev.endMin);
                      return (
                        <div
                          key={ev.id}
                          className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            top:        top + 1,
                            height:     height - 2,
                            background: ev.color + "cc",
                            borderLeft: `3px solid ${ev.color}`,
                          }}
                        >
                          <p className="text-[9px] font-semibold text-white leading-tight line-clamp-3">{ev.title}</p>
                          <p className="text-[8px] text-white/70 mt-0.5">
                            {String(ev.startHr).padStart(2,"0")}:{String(ev.startMin).padStart(2,"0")}-{String(ev.endHr).padStart(2,"0")}:{String(ev.endMin).padStart(2,"0")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

type ViewTab = "table" | "calendar";

export default function MeetingSection() {
  const [showModal, setShowModal]   = useState(false);
  const [calEvents, setCalEvents]   = useState<MeetingEvent[]>([]);
  const [viewTab, setViewTab]       = useState<ViewTab>("table");
  const [showCompleted, setShowCompleted] = useState(false);
  const [tableRows, setTableRows]   = useState<MeetingRow[]>(DUMMY_ROWS);
  const colorIdx = { current: 0 };

  const handleCreated = (form: MeetingForm) => {
    // ── Add to calendar ──
    const color = EVENT_COLORS[colorIdx.current % EVENT_COLORS.length];
    colorIdx.current++;
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    setCalEvents(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: form.name.trim(), dayOfWeek, startHr: 9, startMin: 0, endHr: 10, endMin: 0, color },
    ]);

    // ── Add to table ──
    const durationLabel = form.duration ? `${form.duration} min` : "—";
    const nextInstance  = form.dueDate
      ? `${form.dueDate}${form.dueTime ? " · " + form.dueTime : ""}`
      : "—";
    const newRow: MeetingRow = {
      id:           crypto.randomUUID(),
      name:         form.name.trim(),
      type:         form.type,
      recurrence:   form.recurrence,
      nextInstance,
      participants: form.participants ? parseInt(form.participants, 10) : 0,
      duration:     durationLabel,
      createdBy:    "—",
      status:       "Active",
    };
    setTableRows(prev => [newRow, ...prev]);
  };

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "table",    label: "Table",    icon: <LuLayoutList size={13} /> },
    { id: "calendar", label: "Calendar", icon: <LuCalendar   size={13} /> },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#111928] dark:text-white">Meetings</h2>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Schedule and manage your team meetings</p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] p-1">
          {VIEW_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setViewTab(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewTab === t.id
                  ? "bg-white dark:bg-[#0d1520] text-[#111928] dark:text-white shadow-sm border border-[#E6EBF1] dark:border-[#1F2A37]"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {viewTab === "table" && (
        <MeetingTable
          rows={tableRows}
          onAddMeeting={() => setShowModal(true)}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => setShowCompleted(p => !p)}
        />
      )}

      {/* Calendar view */}
      {viewTab === "calendar" && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors"
            >
              <LuPlus size={13} />
              Add Meeting
            </button>
          </div>
          <MeetingCalendar events={calEvents} />
        </div>
      )}

      {/* Modal */}
      <CreateMeetingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}