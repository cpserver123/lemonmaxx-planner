"use client";

import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import KBSidebar from "./KBSidebar";
import KBTabs from "./KBTabs";
import KBDocumentList from "./KBDocumentList";
import KBDocumentViewer from "./KBDocumentViewer";
import { KB_CATEGORIES, KB_DOCUMENTS, KB_TABS } from "./kb-data";
import type { KBDocument } from "./kb-data";

type TabId = typeof KB_TABS[number]["id"];

export default function KBLayout() {
  const [activeCategory, setActiveCategory] = useState("strategic");
  const [activeTab, setActiveTab] = useState<TabId>("project-unicorn");
  const [activeDoc, setActiveDoc] = useState<KBDocument | null>(KB_DOCUMENTS[0]);

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

      {/* Body — 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Col 1 — Category sidebar */}
        <KBSidebar
          categories={KB_CATEGORIES}
          activeCategory={activeCategory}
          onSelect={(id) => {
            setActiveCategory(id);
            // Optionally reset doc selection
            const firstDoc = visibleDocs[0] ?? null;
            setActiveDoc(firstDoc);
          }}
        />

        {/* Col 2 — Document list */}
        <KBDocumentList
          documents={visibleDocs}
          activeDocId={activeDoc?.id ?? null}
          onSelect={setActiveDoc}
        />

        {/* Col 3 — Document viewer */}
        <KBDocumentViewer doc={activeDoc} />
      </div>
    </div>
  );
}
