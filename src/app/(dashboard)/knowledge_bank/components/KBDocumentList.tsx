"use client";

import { LuPlus, LuFileText } from "react-icons/lu";
import type { KBDocument } from "./kb-data";

interface KBDocumentListProps {
  documents: KBDocument[];
  activeDocId: string | null;
  onSelect: (doc: KBDocument) => void;
}

export default function KBDocumentList({ documents, activeDocId, onSelect }: KBDocumentListProps) {
  return (
    <div className="w-52 shrink-0 flex flex-col border-r border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#080f1a] overflow-y-auto">
      {/* New document button */}
      <div className="p-3 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <button className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D1D5DB] dark:border-[#374151] py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#5750F1] hover:text-[#5750F1] transition-colors">
          <LuPlus size={13} />
          New Document
        </button>
      </div>

      {/* Document items */}
      <div className="flex-1 py-1">
        {documents.length === 0 ? (
          <p className="px-4 py-6 text-xs text-[#9CA3AF] text-center">No documents yet</p>
        ) : (
          documents.map((doc) => {
            const active = doc.id === activeDocId;
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  active
                    ? "bg-[#EEF2FF] dark:bg-[#1a1f4e]"
                    : "hover:bg-[#F3F4F6] dark:hover:bg-[#0a1628]"
                }`}
              >
                <LuFileText size={13} className={active ? "text-[#5750F1] shrink-0" : "text-[#9CA3AF] shrink-0"} />
                <span className={`text-xs truncate ${active ? "text-[#5750F1] font-semibold" : "text-[#374151] dark:text-[#D1D5DB]"}`}>
                  {doc.title}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
