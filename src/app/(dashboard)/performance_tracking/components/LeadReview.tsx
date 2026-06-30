"use client";

import { LuClipboardList } from "react-icons/lu";

export default function LeadReview() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="h-14 w-14 rounded-2xl bg-[#F3F4F6] dark:bg-[#1a2332] flex items-center justify-center">
        <LuClipboardList size={26} className="text-[#2563eb]" />
      </div>
      <p className="text-base font-semibold text-[#111928] dark:text-white">Lead Review</p>
      <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Lead review data will appear here.</p>
    </div>
  );
}
