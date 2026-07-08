"use client";

import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import KBSidebar from "./KBSidebar";
import KBTabs from "./KBTabs";
import KBDocumentList from "./KBDocumentList";
import KBDocumentViewer from "./KBDocumentViewer";
import KbTest from "./kb-test";
import { KB_CATEGORIES, KB_DOCUMENTS, KB_TABS } from "./kb-data";
import type { KBDocument } from "./kb-data";

type TabId = typeof KB_TABS[number]["id"];

export default function KBLayout() {
  const [activeCategory, setActiveCategory] = useState("strategic");
  const [activeTab, setActiveTab] = useState<TabId>("project-unicorn");
  const [activeDoc, setActiveDoc] = useState<KBDocument | null>(KB_DOCUMENTS[0]);
  /** Unlocks all Project Unicorn documents once the user completes the test */
  const [testCompleted, setTestCompleted] = useState(false);

  // Filter documents by active tab (and optionally category)
  const visibleDocs = KB_DOCUMENTS.filter(
    (d) => d.tab === activeTab
  );

  const categoryLabel =
    KB_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "Strategic";

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    const firstDoc = KB_DOCUMENTS.find((d) => d.tab === id) ?? null;
    setActiveDoc(firstDoc);
  };

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 2xl:-m-10 overflow-hidden">
      {/* Top breadcrumb + tabs row */}
      <div className="bg-white dark:bg-[#0d1520] border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Documents</span>
          <LuChevronRight size={12} />
          <span className="font-semibold text-[#111928] dark:text-white">{categoryLabel}</span>
        </div>

        {/* Tab bar */}
        <KBTabs activeTab={activeTab} onSelect={handleTabChange} />
      </div>

      {/* ── TEST TAB ── full-area Start Test panel */}
      {activeTab === "test" ? (
        <TestStartPanel onComplete={() => setTestCompleted(true)} />
      ) : (
        /* Body — 3 columns */
        <div className="flex flex-1 overflow-hidden">
          {/* Col 1 — Category sidebar */}
          <KBSidebar
            categories={KB_CATEGORIES}
            activeCategory={activeCategory}
            onSelect={(id) => {
              setActiveCategory(id);
              const firstDoc = visibleDocs[0] ?? null;
              setActiveDoc(firstDoc);
            }}
          />

          {/* Col 2 — Document list */}
          <KBDocumentList
            documents={visibleDocs}
            activeDocId={activeDoc?.id ?? null}
            onSelect={setActiveDoc}
            lockAfterFirst={activeTab === "project-unicorn" && !testCompleted}
          />

          {/* Col 3 — Document viewer */}
          <KBDocumentViewer doc={activeDoc} />
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Start Test splash panel
──────────────────────────────────────────── */
function TestStartPanel({ onComplete }: { onComplete: () => void }) {
  const [testOpen, setTestOpen] = useState(false);

  /* Persist attempt count in localStorage */
  const [attempts, setAttempts] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("kb_test_attempts") ?? "0", 10);
  });

  const handleComplete = () => {
    const next = attempts + 1;
    setAttempts(next);
    localStorage.setItem("kb_test_attempts", String(next));
    onComplete(); // bubble up to KBLayout (setTestCompleted=true)
  };

  return (
    <>
      {/* Full-screen test overlay — rendered on top of everything */}
      {testOpen && <KbTest
        onClose={() => setTestOpen(false)}
        onComplete={handleComplete}
      />}

      {/* Splash panel always underneath */}
      <div className="relative flex flex-1 items-center justify-center bg-[#F9FAFB] dark:bg-[#080f1a]">

        {/* Attempt count — top right */}
        <div className="absolute top-4 right-5 flex items-center gap-1.5 text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
          <svg className="w-3 h-3 text-[#5750F1]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <span>
            <span className="font-semibold text-[#111928] dark:text-white">{attempts}</span>
            {" "}total attempt{attempts !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5750F1] to-[#7C6FF7] flex items-center justify-center shadow-lg shadow-[#5750F1]/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#111928] dark:text-white">Ready to Test?</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Click <span className="font-semibold text-[#5750F1]">Start Test</span> to begin your evaluation session.
              Make sure you&apos;ve reviewed all the relevant documents beforehand.
            </p>
          </div>

          {/* CTA */}
          <button
            id="kb-start-test-btn"
            onClick={() => setTestOpen(true)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#5750F1] to-[#7C6FF7] text-white text-sm font-semibold shadow-md shadow-[#5750F1]/40 hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            {attempts > 0 ? "Retake Test" : "Start Test"}
          </button>

          <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280]">
            Once started, your responses will be recorded.
          </p>
        </div>
      </div>
    </>
  );
}
