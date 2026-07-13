"use client";
import FilterBar from "./FilterBar";
import { LuCalendarDays } from "react-icons/lu";
export default function WeekTab() {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar />
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520]">
        <div className="h-14 w-14 rounded-2xl bg-[#F3F4F6] dark:bg-[#1a2332] flex items-center justify-center"><LuCalendarDays size={26} className="text-[#2563eb]" /></div>
        <p className="text-base font-semibold text-[#111928] dark:text-white">Week</p>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Weekly performance data will appear here.</p>
      </div>
    </div>
  );
}
