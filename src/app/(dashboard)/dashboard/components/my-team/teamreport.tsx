"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface ReportRow {
  id: string;
  meetingName: string;
  report: string;
  scorecard: number;
}

const REPORT_DATA: ReportRow[] = [
  { id: "1", meetingName: "Apollo : Leadgen Focused Area Meeting", report: "Weekly review on leads generated and conversion metrics.", scorecard: 8 },
  { id: "2", meetingName: "Apollo Strategic Area", report: "Discussed upcoming roadmap and strategic resource allocation.", scorecard: 9 },
  { id: "3", meetingName: "APOLLO- CM* Recorder", report: "Session recording review and feedback analysis.", scorecard: 7 },
  { id: "4", meetingName: "Board - Leadgen Weekly review", report: "High-level board update on marketing channel performance.", scorecard: 8.5 },
  { id: "5", meetingName: "Board Meeting Leadgen For Breakdown Resolution", report: "Resolved critical bottlenecks in the funnel.", scorecard: 9 },
  { id: "6", meetingName: "Branding Calendar- All Brands", report: "Aligned on brand messaging for Q3 rollout.", scorecard: 7.5 },
  { id: "7", meetingName: "Branding Reporting", report: "Reviewed social media reach and engagement analytics.", scorecard: 8 },
  { id: "8", meetingName: "Buddy meeting", report: "1-on-1 peer review and shadowing update.", scorecard: 9.5 },
  { id: "9", meetingName: "Chaos Strategic Meeting", report: "Evaluated experimental campaigns and creative testing.", scorecard: 8 },
  { id: "10", meetingName: "CMx CHAOS Recorder", report: "Analyzed experimental campaign outcomes and learning.", scorecard: 7 },
  { id: "11", meetingName: "Core Meeting", report: "General standup and cross-departmental alignment.", scorecard: 8.5 },
  { id: "12", meetingName: "Core team meeting for completing the Parked agend...", report: "Cleared backlog of parked decisions.", scorecard: 9 },
  { id: "13", meetingName: "Daily HOC F-com Scrum", report: "Daily check-in for e-commerce ops and inventory.", scorecard: 8 },
  { id: "14", meetingName: "Daily Huddle Meeting", report: "Quick daily sync for blockers and priorities.", scorecard: 7.5 },
  { id: "15", meetingName: "Ecom Board Meeting", report: "Monthly e-com revenue and margin analysis.", scorecard: 9 },
  { id: "16", meetingName: "Ecom Focus Area | Team shubham Gupta )", report: "Deep dive into performance optimization tactics.", scorecard: 8.5 },
];

const columnHelper = createColumnHelper<ReportRow>();

const columns = [
  columnHelper.accessor("meetingName", {
    header: "Meeting Name",
    cell: (info) => (
      <span className="text-[13px] font-medium text-[#111928] dark:text-white">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("report", {
    header: "Report",
    cell: (info) => (
      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("scorecard", {
    header: "Scorecard",
    cell: (info) => {
      const score = info.getValue();
      const color = score >= 9 ? "text-green-600 dark:text-green-400" : score >= 8 ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold bg-white dark:bg-black/20 ${color}`}>
          {score} / 10
        </span>
      );
    },
  }),
];

export default function TeamReport() {
  const [data] = useState<ReportRow[]>(REPORT_DATA);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#111928] dark:text-white">Team Reports</h2>
      </div>

      <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#F3F4F6] dark:bg-[#0a0f1a]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 border-b border-[#E6EBF1] dark:border-[#1F2A37] text-left text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#E6EBF1] dark:divide-[#1F2A37]">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors duration-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}