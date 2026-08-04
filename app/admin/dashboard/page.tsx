/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { adminAPI } from "../lib/api";
import {
  DollarSign,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  Sunrise,
  Activity,
  FileText,
  ShieldAlert,
} from 'lucide-react';


import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/warden/Template/components/ui/dropdown-menu';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Greeting Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-8 w-64 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-80 rounded-lg ml-9 mt-1 opacity-70" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-8 flex flex-col gap-8 min-w-0">
            {/* Financial Tracker Card */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-auto md:h-[420px] border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-7 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-72 rounded-lg opacity-80" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-full shrink-0" />
              </div>
              <div className="flex-1 flex flex-col md:flex-row md:items-center mt-4">
                <div className="w-full md:w-[200px] flex-shrink-0 mb-4 md:mb-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-12 w-32 rounded-xl" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 rounded-lg opacity-80" />
                </div>
                <div className="flex-1 h-[240px] px-2 flex items-end">
                  <Skeleton className="w-full h-[80%] rounded-t-3xl rounded-b-xl opacity-50" />
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                <Skeleton className="h-6 w-44 rounded-xl mb-4 self-start" />
                <div className="w-[180px] h-[180px] relative mt-2">
                  <Skeleton className="absolute inset-0 rounded-full" />
                  <div className="absolute inset-[30px] rounded-full bg-white" />
                </div>
              </div>
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <Skeleton className="h-6 w-36 rounded-xl mb-5" />
                <div className="space-y-4 mt-8">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-4 w-8 rounded-md" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 flex flex-col gap-8 min-w-0">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 h-full min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-36 rounded-xl" />
                <Skeleton className="h-4 w-16 rounded-lg" />
              </div>
              <div className="flex flex-col gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md opacity-60" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
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

/* ─── Animation variants ─── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

/* ─── Tracker Tooltip ─── */
const TrackerTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 min-w-[100px]">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[18px] font-extrabold">₹{payload[0].value.toLocaleString('en-IN')} <span className="text-[12px] font-semibold text-slate-400">spent</span></p>
      </div>
    )
  }
  return null
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

/* ─── Greeting Helper ─── */
function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sunrise className="w-6 h-6 text-amber-500" /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <Sun className="w-6 h-6 text-orange-500" /> };
  return { text: 'Good Evening', icon: <Moon className="w-6 h-6 text-indigo-500" /> };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getOverview()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const greeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Default empty data if API fails
  const monthlyData = useMemo(() => stats?.monthlyTrend || [
    { month: 'Jan', total: 0 }, { month: 'Feb', total: 0 }, { month: 'Mar', total: 0 }
  ], [stats]);

  const homeDistData = useMemo(() => stats?.homeDistribution || [], [stats]);
  const statusData = useMemo(() => stats?.statusBreakdown || [], [stats]);

  // Calculations for Tracker Header
  const trackerStats = useMemo(() => {
    const expensesThisMonth = stats?.expensesThisMonth || 0;
    return {
      display: `₹${expensesThisMonth >= 100000 ? (expensesThisMonth/100000).toFixed(1) : (expensesThisMonth/1000).toFixed(1)}`,
      suffix: expensesThisMonth >= 100000 ? 'L' : 'k',
      label: 'spent this month',
      trending: true,
    };
  }, [stats]);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        
        {/* Welcome Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            {greeting.icon}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {greeting.text}, Admin
            </h1>
          </div>
          <p className="text-[15px] text-slate-500 ml-9">
            Here&apos;s your dashboard overview for today, {todayFormatted}.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 xl:grid-cols-12 gap-8"
        >
          
          {/* Left Column (Spans 8) */}
          <div className="xl:col-span-8 flex flex-col gap-8 min-w-0">
            
            {/* Financial Tracker Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-auto md:h-[420px] relative border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Financial Tracker</h2>
                    <p className="text-[15px] text-slate-500 mt-1.5 max-w-[400px] leading-snug">
                      Track changes in operational expenses over time and access detailed data on budgets across homes.
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-5 py-2 border border-slate-200 rounded-full text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors shrink-0">
                      Last 6 Months <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px] rounded-2xl p-2 shadow-lg border border-slate-100">
                    <DropdownMenuItem className="cursor-pointer font-medium text-[13px] py-2 rounded-xl focus:bg-slate-100">Last 6 Months</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-medium text-[13px] py-2 rounded-xl focus:bg-slate-100">This Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center mt-4">
                <div className="w-full md:w-[200px] flex-shrink-0 mb-4 md:mb-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl sm:text-[36px] md:text-[44px] font-extrabold text-slate-900 leading-none">
                      {trackerStats.display}{trackerStats.suffix}
                    </h2>
                    {trackerStats.trending ? (
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-orange-500" />
                    )}
                  </div>
                  <p className="text-[15px] text-slate-500 mt-3 leading-relaxed pr-4">
                    {trackerStats.label}
                  </p>
                </div>
                
                <div className="w-full min-w-0 h-[240px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="trackerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 700, fill: '#94a3b8' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} width={40} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<TrackerTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fill="url(#trackerGradient)" dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Home Demographics Chart */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Home Demographics</h3>
                  <Link href="/admin/students" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800">See all</Link>
                </div>
                
                {homeDistData.length > 0 ? (
                  <div className="w-full min-w-0 h-[200px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={homeDistData} dataKey="count" nameKey="home" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2}>
                          {homeDistData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-900">{stats.totalStudents}</span>
                      <span className="text-[11px] font-semibold text-slate-400">Total</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-[14px]">
                    No demographic data available.
                  </div>
                )}
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <h3 className="text-[19px] font-bold text-slate-900 mb-4 tracking-tight">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/reports" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-indigo-600 gap-2 cursor-pointer border border-indigo-100">
                    <FileText className="w-6 h-6" />
                    <span className="text-[13px] font-bold text-center">Reports</span>
                  </Link>
                  <Link href="/admin/finance" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-600 gap-2 cursor-pointer border border-emerald-100">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-[13px] font-bold text-center">Approve</span>
                  </Link>
                  <Link href="/admin/staff" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-orange-50 hover:bg-orange-100 transition-colors text-orange-600 gap-2 cursor-pointer border border-orange-100">
                    <Users className="w-6 h-6" />
                    <span className="text-[13px] font-bold text-center">Staff</span>
                  </Link>
                  <Link href="/admin/grievances" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-red-50 hover:bg-red-100 transition-colors text-red-600 gap-2 cursor-pointer border border-red-100">
                    <ShieldAlert className="w-6 h-6" />
                    <span className="text-[13px] font-bold text-center">SOS</span>
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Right Column (Spans 4) */}
          <div className="xl:col-span-4 flex flex-col gap-8 min-w-0">
            
            {/* Action Items List */}
            <motion.div variants={itemVariants} className="flex flex-col gap-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">System Action Items</h3>
                <Link href="/admin/activities" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2">See all</Link>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex items-start justify-between py-1">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 bg-[#FF5A36]">
                        <AlertCircle className="w-[22px] h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">Pending Expenses</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-white">Action Required</span>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium truncate pr-4">You have {stats.pendingExpenses || 0} expenses awaiting approval.</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-[22px] top-[48px] bottom-[-16px] w-[2px] bg-slate-200 rounded-full" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between py-1">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 bg-[#4B93DF]">
                        <Activity className="w-[22px] h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">Community Posts</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-600">Pending</span>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium truncate pr-4">{stats.pendingPosts || 0} posts awaiting moderation.</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-[22px] top-[48px] bottom-[-16px] w-[2px] bg-slate-200 rounded-full" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between py-1">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 bg-violet-500">
                        <Calendar className="w-[22px] h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">Staff Certifications</h4>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium truncate pr-4">{stats.certAlerts || 0} expiring in next 30 days.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* System Health (Class Progress Style) */}
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">System Health</h3>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[13px]">
                  <Activity className="w-4 h-4" /> Live
                </div>
              </div>
              
              <div className="flex items-center justify-between px-2 mb-8 relative z-10">
                <div className="text-center">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Students</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalStudents || 0}</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div className="text-center">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Staff</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.activeStaff || 0}</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div className="text-center">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">SOS</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.openSoS || 0}</p>
                </div>
              </div>

              {/* Decorative progress bars at bottom */}
              <div className="flex gap-[6px] h-10 items-end absolute bottom-4 left-6 right-6 opacity-60">
                {Array.from({length: 24}).map((_, i) => (
                  <div key={i} className="flex-1 bg-slate-100 rounded-full" style={{ height: `${20 + [40, 75, 30, 90, 55, 80, 25, 60, 85, 45, 95, 35, 65, 50, 20][i % 15]}%` }} />
                ))}
              </div>
            </motion.div>

            {/* Status Breakdown (Class Mood Style) */}
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col flex-1 min-h-[220px]">
              <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">Student Status</h3>
              {statusData.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  {statusData.map((s: any, idx: number) => (
                    <div key={s.name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <span className="text-[14px] font-semibold text-slate-700 capitalize">{s.name}</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-900">{s.value}</span>
                    </div>
                  ))}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden flex">
                    {statusData.map((s: any, idx: number) => (
                      <div 
                        key={s.name}
                        style={{ width: `${(s.value / stats.totalStudents) * 100}%` }}
                        className={`h-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-orange-500' : 'bg-blue-500'}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-[14px]">
                  No status data recorded yet.
                </div>
              )}
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
