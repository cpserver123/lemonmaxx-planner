"use client";

import { LuTrendingDown, LuTrendingUp } from "react-icons/lu";
import FilterBar from "./FilterBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from "recharts";

/* --- KPI Cards ------------------------------------------------------- */
const KPI_DATA = [
  { label: "Total Spend",   value: "$248,649", change: "-74.2% vs last month", up: false, icon: "📅" },
  { label: "Total Revenue", value: "$309,555", change: "-73.2% vs last month", up: false, icon: "$" },
  { label: "ROI",           value: "24.5%",    change: "+23.8% vs last month", up: true,  icon: "~" },
  { label: "Gross Margin",  value: "$60,906",  change: "-68.1% vs last month", up: false, icon: "◎" },
];

function KPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_DATA.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">{kpi.label}</span>
            <span className="text-[#9CA3AF] text-xs">{kpi.icon}</span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${["ROI","Gross Margin"].includes(kpi.label) ? "text-[#2563eb]" : "text-[#111928] dark:text-white"}`}>
            {kpi.value}
          </p>
          <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.up ? "text-[#2563eb]" : "text-red-500 dark:text-red-400"}`}>
            {kpi.up ? <LuTrendingUp size={11} /> : <LuTrendingDown size={11} />}
            {kpi.change}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Business Contribution ------------------------------------------- */
const BAR_DATA = [
  { name: "VSL",        value: 80000  },
  { name: "Telehealth", value: -10000 },
];

function BusinessContribution() {
  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-4">Business Contribution</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={BAR_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2A37" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} domain={[-30000,90000]} ticks={[-30000,0,30000,60000,90000]} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} width={70} />
          <Tooltip formatter={((v: unknown) => { const n = typeof v==="number"?v:0; return [`$${Math.abs(n).toLocaleString()}`,""] }) as any} contentStyle={{ background:"#0d1520", border:"1px solid #1F2A37", borderRadius:8, fontSize:11 }} />
          <Bar dataKey="value" radius={[0,4,4,0]} barSize={28}>
            {BAR_DATA.map((entry, i) => <Cell key={i} fill={entry.value>=0?"#2563eb":"#ef4444"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --- VSL Table ------------------------------------------------------- */
const VSL_ROWS = [
  { vertical:"Weight Loss", spend:"$169,260", revenue:"$243,804", roi:"44.0%",  margin:"$74,544", share:"52.7%",  roiNeg:false },
  { vertical:"Memory",      spend:"$23,809",  revenue:"$25,850",  roi:"25.4%",  margin:"$6,041",  share:"7.5%",   roiNeg:false },
  { vertical:"Blood Sugar", spend:"$1,877",   revenue:"$1,720",   roi:"-8.4%",  margin:"-$157",   share:"-0.2%",  roiNeg:true  },
  { vertical:"Total",       spend:"$194,946", revenue:"$275,374", roi:"41.3%",  margin:"$80,428", share:"100.0%", roiNeg:false, bold:true },
];

function VSLTable() {
  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <span className="text-xs font-semibold text-[#111928] dark:text-white">VSL</span>
        <span className="text-xs font-semibold text-[#111928] dark:text-white">Telehealth</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
            {["Vertical","Spend","Revenue","ROI","Margin","Share"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VSL_ROWS.map((row) => (
            <tr key={row.vertical} className={`border-b border-[#E6EBF1] dark:border-[#1F2A37] last:border-0 hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors ${row.bold ? "bg-[#F9FAFB] dark:bg-[#122031]":""}`}>
              <td className={`px-3 py-2 ${row.bold?"font-bold text-[#111928] dark:text-white":"text-[#111928] dark:text-[#D1D5DB]"}`}>{row.vertical}</td>
              <td className={`px-3 py-2 ${row.bold?"font-bold text-[#111928] dark:text-white":"text-[#6B7280] dark:text-[#9CA3AF]"}`}>{row.spend}</td>
              <td className={`px-3 py-2 ${row.bold?"font-bold text-[#111928] dark:text-white":"text-[#6B7280] dark:text-[#9CA3AF]"}`}>{row.revenue}</td>
              <td className={`px-3 py-2 font-semibold ${row.roiNeg?"text-red-500 dark:text-red-400":"text-[#2563eb]"}`}>{row.roi}</td>
              <td className={`px-3 py-2 ${row.bold?"font-bold text-[#111928] dark:text-white":row.roiNeg?"text-red-500 dark:text-red-400":"text-[#6B7280] dark:text-[#9CA3AF]"}`}>{row.margin}</td>
              <td className={`px-3 py-2 ${row.bold?"font-bold text-[#111928] dark:text-white":"text-[#6B7280] dark:text-[#9CA3AF]"}`}>{row.share}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- Daily Trend ----------------------------------------------------- */
function generateTrendData() {
  const data = [];
  for (let d = 1; d <= 30; d++) {
    data.push({
      day: `Jun ${d}`,
      spend:   Math.round(5000  + Math.sin(d*0.5)*8000  + Math.random()*3000),
      revenue: Math.round(8000  + Math.sin(d*0.4+1)*10000 + Math.random()*4000),
      roi:     Math.round(20    + Math.sin(d*0.6)*40    + Math.random()*20),
    });
  }
  return data;
}
const TREND_DATA = generateTrendData();

function DailyTrend() {
  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-4">Daily Performance Trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={TREND_DATA} margin={{ left:0, right:30, top:4, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2A37" />
          <XAxis dataKey="day" tick={{ fontSize:9, fill:"#6B7280" }} interval={4} />
          <YAxis yAxisId="left"  tick={{ fontSize:9, fill:"#6B7280" }} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}k`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize:9, fill:"#6B7280" }} tickFormatter={(v)=>`${v}%`} />
          <Tooltip contentStyle={{ background:"#0d1520", border:"1px solid #1F2A37", borderRadius:8, fontSize:11 }} labelStyle={{ color:"#9CA3AF" }} />
          <Legend wrapperStyle={{ fontSize:11, color:"#9CA3AF" }} />
          <Line yAxisId="left"  type="monotone" dataKey="spend"   stroke="#2563eb" strokeWidth={2} dot={false} name="Spend" />
          <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" strokeDasharray="4 2" />
          <Line yAxisId="right" type="monotone" dataKey="roi"     stroke="#f0ffd4" strokeWidth={1.5} dot={false} name="ROI %" strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --- Dashboard Tab --------------------------------------------------- */
export default function DashboardTab() {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar />
      <KPICards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusinessContribution />
        <VSLTable />
      </div>
      <DailyTrend />
    </div>
  );
}
