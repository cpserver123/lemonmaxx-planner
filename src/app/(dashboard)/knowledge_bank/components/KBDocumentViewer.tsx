"use client";

import { LuDownload, LuPencil, LuUser, LuFileText } from "react-icons/lu";
import type { KBDocument } from "./kb-data";

interface KBDocumentViewerProps {
  doc: KBDocument | null;
}

export default function KBDocumentViewer({ doc }: KBDocumentViewerProps) {
  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0d1520]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6] dark:bg-[#1a2332]">
          <LuFileText size={28} className="text-[#9CA3AF]" />
        </div>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Select a document to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0d1520]">
      {/* Doc header */}
      <div className="px-8 py-5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-[#111928] dark:text-white leading-snug flex-1">
            {doc.title}
          </h1>
          <button className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors shrink-0">
            <LuPencil size={15} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span className="flex items-center gap-1">
            <span className="h-5 w-5 rounded-full bg-[#5750F1] flex items-center justify-center text-[9px] font-bold text-white">
              {doc.author.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </span>
            {doc.author}
          </span>
          <span>·</span>
          <span>Created {doc.createdAt}</span>
          <span>·</span>
          <span>Last updated {doc.updatedAt}</span>
        </div>
      </div>

      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-8 py-2.5 border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#080f1a]">
        <span className="text-xs text-[#9CA3AF]">{doc.pages} {doc.pages === 1 ? "page" : "pages"}</span>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors">
          <LuDownload size={13} />
          Download
        </button>
      </div>

      {/* Document body preview */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Document card mimicking a page */}
          <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#FAFAFA] dark:bg-[#0a1628] overflow-hidden shadow-sm">
            {/* Document top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] space-y-0.5">
                <p>Created by: {doc.author}</p>
                <p>Created: {doc.createdAt}</p>
                <p>Last updated: {doc.updatedAt}</p>
              </div>
              {/* Placeholder logo area */}
              <div className="flex flex-col items-end">
                <div className="text-lg font-black tracking-wider text-[#111928] dark:text-white">VG</div>
                <div className="text-[8px] font-bold text-[#9CA3AF] tracking-widest">VANTO GROUP</div>
              </div>
            </div>

            {/* Document content */}
            <div className="p-8">
              <h2 className="text-lg font-bold text-[#111928] dark:text-white text-center mb-6">
                {doc.title}
              </h2>

              <p className="text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed mb-6">
                {doc.content}
              </p>

              {/* Org chart placeholder (for breakthrough project doc) */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  "Project Manager",
                  "Core Team",
                  "Strategic Team Captain(s)",
                  "Overall Conversation Manager",
                  "Strategic Team Recorder",
                  "Strategic Team Members",
                ].map((role) => (
                  <div
                    key={role}
                    className="rounded-lg border-2 border-[#2563eb]/40 dark:border-[#2563eb]/30 bg-white dark:bg-[#0d1520] px-4 py-3 text-center"
                  >
                    <p className="text-xs font-semibold text-[#111928] dark:text-white">{role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
