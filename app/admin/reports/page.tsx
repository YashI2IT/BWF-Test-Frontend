/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminAPI } from "../lib/api";
import PageSkeleton from "../components/PageSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/warden/Template/components/ui/card";
import { Button } from "@/app/warden/Template/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/warden/Template/components/ui/select";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, PieChart as PieChartIcon, Users, MessageSquareHeart, Wallet, CheckCircle2, BarChart2 } from "lucide-react";

interface ReportData {
  year: number; totalStudents: number; activeStaff: number; totalExpenses: number;
  byCategory: { name: string; value: number }[];
  byHome: { name: string; value: number }[];
  byMonth: { month: string; total: number }[];
  byStatus: { name: string; count: number }[];
  feedbackCount: number; grievanceCount: number;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];
const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];
const YEARS = [2024, 2025, 2026];

function exportCSV(data: ReportData) {
  const rows = [
    ["BWF Annual Report", data.year],
    ["Total Students", data.totalStudents],
    ["Active Staff", data.activeStaff],
    ["Total Expenses (INR)", data.totalExpenses],
    [""],
    ["Monthly Expenses"],
    ["Month", "Amount"],
    ...data.byMonth.map(m => [m.month, m.total]),
    [""],
    ["Expenses by Category"],
    ["Category", "Amount"],
    ...data.byCategory.map(c => [c.name, c.value]),
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `BWF_Report_${data.year}.csv`;
  a.click();
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [home, setHome] = useState("all");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = { year: String(year) };
    if (home && home !== "all") p.home = home;
    adminAPI.getReportSummary(p)
      .then(d => { setData(d as unknown as ReportData); setLoading(false); })
      .catch(e => { flash(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [year, home]);

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Admin Reports
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Review operational efficiency, expenses, and demographic trends.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px] h-11 bg-white border-slate-200 rounded-full shadow-sm px-4">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={home} onValueChange={setHome}>
            <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white border-slate-200 rounded-full shadow-sm px-4">
              <SelectValue placeholder="All Homes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
          {data && (
            <Button onClick={() => exportCSV(data)} className="h-11 rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </motion.div>
      )}

      {data && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Students", value: data.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Active Staff", value: data.activeStaff, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Total Expenses", value: `₹${data.totalExpenses.toLocaleString("en-IN")}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Feedback Received", value: data.feedbackCount, icon: MessageSquareHeart, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="rounded-[32px] border-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 relative group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{k.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{k.value}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${k.bg} ${k.color}`}>
                        <k.icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly Trend (2/3 on Desktop) */}
            <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm bg-white overflow-hidden relative group">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" /> Monthly Expense Trend ({data.year})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {data.byMonth.every(m => m.total === 0) ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">No expense data available for this year.</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={data.byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Expenses"]} 
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Statuses (1/3 on Desktop) */}
            <Card className="lg:col-span-1 rounded-[32px] border-none shadow-sm bg-white overflow-hidden relative group">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-500" /> Requests Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {data.byStatus.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">No data.</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={data.byStatus} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} width={80} />
                        <Tooltip 
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={32}>
                          {data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Expenses By Category (1/2) */}
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden relative group">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-amber-500" /> By Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {data.byCategory.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">No data.</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.byCategory} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={70} outerRadius={95} paddingAngle={2}>
                          {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} 
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px", color: "#64748b", paddingTop: "20px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses By Home (1/2) */}
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden relative group">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-500" /> Allocation By Home
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {data.byHome.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">No data.</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.byHome} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={70} outerRadius={95} paddingAngle={2}>
                          {data.byHome.map((_, i) => <Cell key={i} fill={COLORS[(i+3) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} 
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px", color: "#64748b", paddingTop: "20px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </>
      )}
      </div>
    </div>
  );
}
