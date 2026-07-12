/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Sun,
  Moon,
  Sunrise
} from 'lucide-react'
import {
  BarChart,
  Bar,
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
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/teacher/Template/components/ui/dropdown-menu'
import { Skeleton } from '@/app/teacher/Template/components/ui/skeleton'
import { getTeacherDashboard, getTeacherProfile } from '../service'
import type { TeacherDashboardResponse, TeacherWidgetSettings } from '../types'
import { MOCK_TEACHER_DASHBOARD } from './teacherDashboardMock'

/* ─── Color Map for Schedule Cards (Fix 1) ─── */
const scheduleColorMap: Record<string, { bg: string; border: string; text: string }> = {
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-100',  text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-100',  text: 'text-orange-600' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    text: 'text-blue-600' },
  red:     { bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-600' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-600' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-100',    text: 'text-pink-600' },
};

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
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 min-w-[100px]">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[18px] font-extrabold">{payload[0].value} <span className="text-[12px] font-semibold text-slate-400">submissions</span></p>
      </div>
    )
  }
  return null
}

/* ─── Assignment Progress Tooltip ─── */
const ProgressTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-5 py-3 min-w-[140px]">
        <p className="text-[13px] font-bold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="text-[13px] font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

type TimeRange = 'Week' | 'Month' | 'Year';

const DEFAULT_WEEKLY_DATA = [
  { name: 'S', value: 0 },
  { name: 'M', value: 0 },
  { name: 'T', value: 0 },
  { name: 'W', value: 0 },
  { name: 'T', value: 0 },
  { name: 'F', value: 0 },
  { name: 'S', value: 0 },
];

/* ─── Greeting Helper ─── */
function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sunrise className="w-6 h-6 text-amber-500" /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <Sun className="w-6 h-6 text-orange-500" /> };
  return { text: 'Good Evening', icon: <Moon className="w-6 h-6 text-indigo-500" /> };
}

function getTaskStatusMeta(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Done', dot: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600', strike: true };
    case 'due_today':
      return { label: 'Due Today', dot: 'bg-orange-500', iconBg: 'bg-orange-50 text-orange-600', strike: false };
    case 'tomorrow':
      return { label: 'Due Tomorrow', dot: 'bg-blue-500', iconBg: 'bg-blue-50 text-blue-600', strike: false };
    default:
      return { label: 'Pending', dot: 'bg-slate-400', iconBg: 'bg-slate-50 text-slate-600', strike: false };
  }
}

function getSubmissionStatusLabel(status: string) {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Reviewed';
}

function DashboardSkeleton() {
  return (
    <main className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen font-sans">
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
          <div className="xl:col-span-8 flex flex-col gap-8">

            {/* Assignment Tracker Card */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-auto md:h-[420px] border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-7 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-72 rounded-lg opacity-80" />
                  </div>
                </div>
                <Skeleton className="h-10 w-24 rounded-full shrink-0" />
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

            {/* Assignment Progress + Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assignment Progress Skeleton */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-44 rounded-xl" />
                  <Skeleton className="h-4 w-14 rounded-lg" />
                </div>
                <div className="flex-1 h-[200px] flex items-end justify-between gap-3 px-1 mt-4">
                  {[40, 55, 48, 62, 50, 68].map((h, i) => (
                    <div key={i} className="flex-1 h-[200px] flex gap-1 items-end justify-center">
                      <Skeleton className="w-4 rounded-t-md" style={{ height: `${h}%` }} />
                      <Skeleton className="w-4 rounded-t-md opacity-60" style={{ height: `${h * 0.5}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <Skeleton className="h-6 w-36 rounded-xl mb-5" />
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[90px] rounded-3xl" />
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Schedule Skeleton */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40 rounded-xl" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
              </div>
              <div className="flex gap-4 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-1 min-w-[200px] h-[130px] rounded-3xl p-5 space-y-3 border border-slate-100">
                    <Skeleton className="h-4 w-24 rounded-md opacity-80" />
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded-md opacity-80" />
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Tasks Skeleton */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-36 rounded-xl" />
                <Skeleton className="h-4 w-16 rounded-lg" />
              </div>
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-[24px] border border-slate-100">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-[16px] shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-44 rounded-lg" />
                        <Skeleton className="h-4 w-24 rounded-md opacity-70" />
                      </div>
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 flex flex-col gap-8">

            {/* Recent Submissions Skeleton */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <Skeleton className="h-6 w-52 rounded-xl" />
                <Skeleton className="h-4 w-14 rounded-lg" />
              </div>
              <div className="space-y-5 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-2 pt-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-3/4 max-w-[144px] rounded-lg" />
                          <Skeleton className="h-4 w-16 rounded-full shrink-0" />
                        </div>
                        <Skeleton className="h-4 w-32 rounded-md opacity-70" />
                      </div>
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Class Progress Skeleton */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[200px]">
              <div className="flex justify-between items-start gap-2 mb-6">
                <Skeleton className="h-6 w-36 rounded-xl" />
                <Skeleton className="h-4 w-28 rounded-lg" />
              </div>
              <div className="flex justify-between items-end mb-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 text-center">
                    <Skeleton className="h-3 w-16 rounded-md mx-auto opacity-70" />
                    <Skeleton className="h-8 w-12 rounded-xl mx-auto" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 h-8 mt-6">
                {Array.from({ length: 40 }).map((_, i) => (
                  <Skeleton key={i} className={`flex-1 h-full rounded-[2px] ${i % 3 === 0 ? 'opacity-100' : i % 3 === 1 ? 'opacity-60' : 'opacity-30'}`} />
                ))}
              </div>
            </div>

            {/* Class Mood Skeleton */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col items-center">
              <Skeleton className="h-6 w-28 rounded-xl mb-5 self-start" />
              <div className="w-[180px] h-[180px] relative mt-2">
                <Skeleton className="absolute inset-0 rounded-full" />
                <div className="absolute inset-[30px] rounded-full bg-white" />
              </div>
              <div className="flex justify-center gap-6 mt-6 w-full">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}


export default function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboardResponse | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<TeacherWidgetSettings | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('Week');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const [dashboard, profile] = await Promise.all([
          getTeacherDashboard(),
          getTeacherProfile(),
        ]);

        if (cancelled) return;

        setData(dashboard);
        setWidgetSettings(profile.widgetSettings ?? { stats: true, schedule: true, tasks: true, progress: true });
        setTeacherName(profile.name || 'Teacher');
      } catch (err) {
        console.error('Failed to load live data, using mock', err);
        if (cancelled) return;
        setData(MOCK_TEACHER_DASHBOARD);
        setWidgetSettings({ stats: true, schedule: true, tasks: true, progress: true });
        setTeacherName('Teacher');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  const greeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const weeklyData = useMemo(
    () => data?.trackerData?.length ? data.trackerData : DEFAULT_WEEKLY_DATA,
    [data?.trackerData]
  );

  const progressData = useMemo(
    () => data?.assignmentProgressData ?? [],
    [data?.assignmentProgressData]
  );

  const studentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    data?.students?.forEach((student) => {
      map[student.auth_id] = student.name;
    });
    return map;
  }, [data?.students]);

  const completionRate = useMemo(() => {
    const completed = progressData.reduce((acc, curr) => acc + curr.completed, 0);
    const pending = progressData.reduce((acc, curr) => acc + curr.pending, 0);
    const total = completed + pending;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [progressData]);

  const chartData = useMemo(() => {
    if (timeRange === 'Week') return weeklyData;
    return progressData.map((month) => ({
      name: month.month,
      value: month.completed + month.pending,
    }));
  }, [timeRange, weeklyData, progressData]);

  const trackerStats = useMemo(() => {
    if (timeRange === 'Week') {
      const total = weeklyData.reduce((sum, day) => sum + day.value, 0);
      const midpoint = Math.ceil(weeklyData.length / 2);
      const firstHalf = weeklyData.slice(0, midpoint).reduce((sum, day) => sum + day.value, 0);
      const secondHalf = weeklyData.slice(midpoint).reduce((sum, day) => sum + day.value, 0);

      return {
        display: String(total),
        suffix: '',
        label: 'submissions this week',
        trending: secondHalf >= firstHalf,
      };
    }

    const label =
      timeRange === 'Year'
        ? `completion rate (${progressData.length} months)`
        : `completion rate (this month)`;

    return {
      display: String(completionRate),
      suffix: '%',
      label,
      trending: completionRate >= 50,
    };
  }, [timeRange, weeklyData, completionRate, progressData.length]);

  const moodHasData = useMemo(
    () => (data?.moodBreakdown ?? []).some((mood) => mood.value > 0),
    [data?.moodBreakdown]
  );

  const recentSubmissions = useMemo(
    () => (data?.pendingSubmissions ?? []).slice(0, 3),
    [data?.pendingSubmissions]
  );

  if (isLoading || !data) return <DashboardSkeleton />;

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        
        {/* Fix 6: Welcome Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            {greeting.icon}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {greeting.text}{teacherName ? `, ${teacherName}` : ''}
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
            
            {/* Assignment Tracker Card (Performance Stats) */}
            {widgetSettings?.stats !== false && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-auto md:h-[420px] relative">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Assignment Tracker</h2>
                    <p className="text-[15px] text-slate-500 mt-1.5 max-w-[400px] leading-snug">
                      Track changes in student submissions over time and access detailed data on each assignment received
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-5 py-2 border border-slate-200 rounded-full text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors shrink-0">
                      {timeRange} <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px] rounded-2xl p-2">
                    <DropdownMenuItem className="cursor-pointer font-medium text-[13px] py-2 rounded-xl focus:bg-slate-100" onSelect={() => setTimeRange('Week')}>Week</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-medium text-[13px] py-2 rounded-xl focus:bg-slate-100" onSelect={() => setTimeRange('Month')}>Month</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-medium text-[13px] py-2 rounded-xl focus:bg-slate-100" onSelect={() => setTimeRange('Year')}>Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center mt-4">
                {/* Left Stats area — Fix 5: Real percentage */}
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
                
                {/* Chart area */}
                <div className="w-full min-w-0 h-[240px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart 
                      data={chartData} 
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="trackerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                        dy={8}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#cbd5e1' }}
                        width={35}
                      />
                      <Tooltip content={<TrackerTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fill="url(#trackerGradient)" 
                        dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
            )}

            {/* Bottom Row — Fix 8 & 9: Replace duplicate submissions with Assignment Progress Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Assignment Progress Chart (6-month) — Fix 9 */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Assignment Progress</h3>
                  <Link href="/teacher/submissions" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800">See all</Link>
                </div>
                
                {progressData.length > 0 ? (
                  <div className="w-full min-w-0 h-[200px]">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
                        <Tooltip content={<ProgressTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                        <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
                        <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-[14px]">
                    No progress data available yet.
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-semibold text-slate-500">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[12px] font-semibold text-slate-500">Pending</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <h3 className="text-[19px] font-bold text-slate-900 mb-4 tracking-tight">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/teacher/activities" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-indigo-600 gap-2 cursor-pointer border border-indigo-100">
                    <Plus className="w-6 h-6" />
                    <span className="text-[13px] font-bold">New Task</span>
                  </Link>
                  <Link href="/teacher/schedule" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-600 gap-2 cursor-pointer border border-emerald-100">
                    <Calendar className="w-6 h-6" />
                    <span className="text-[13px] font-bold">Schedule</span>
                  </Link>
                  <Link href="/teacher/submissions" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-orange-50 hover:bg-orange-100 transition-colors text-orange-600 gap-2 cursor-pointer border border-orange-100">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-[13px] font-bold">Grade</span>
                  </Link>
                  <Link href="/teacher/students" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600 gap-2 cursor-pointer border border-blue-100">
                    <Users className="w-6 h-6" />
                    <span className="text-[13px] font-bold">Students</span>
                  </Link>
                </div>
              </motion.div>

            </div>

            {/* Upcoming Schedule — Fix 1 & 3 */}
            {widgetSettings?.schedule !== false && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Today&apos;s Schedule</h3>
                {/* Fix 3: Wire the button to /teacher/schedule */}
                <Link href="/teacher/schedule" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  View Calendar
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                {data.todaySchedule && data.todaySchedule.length > 0 ? (
                  data.todaySchedule.map((schedule, idx) => {
                    /* Fix 1: Use color map instead of dynamic Tailwind classes */
                    const colors = scheduleColorMap[schedule.color] || scheduleColorMap.indigo;
                    return (
                      <div key={idx} className={`min-w-[200px] flex-1 ${colors.bg} border ${colors.border} p-5 rounded-3xl`}>
                        <span className={`${colors.text} font-bold text-[12px] uppercase tracking-wider flex items-center gap-1.5 mb-2`}>
                          <Clock className="w-3.5 h-3.5" /> {schedule.time}
                        </span>
                        <h4 className="text-[16px] font-bold text-slate-900">{schedule.title}</h4>
                        <p className="text-[13.5px] font-medium text-slate-600 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {schedule.location}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-8 text-slate-400 font-medium text-[14px]">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No classes scheduled for today.
                  </div>
                )}
              </div>
            </motion.div>
            )}

            {/* Daily Tasks */}
            {widgetSettings?.tasks !== false && data.dailyTasks && data.dailyTasks.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Your Daily Tasks</h3>
                <Link href="/teacher/activities" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800">View All</Link>
              </div>
              <div className="flex flex-col gap-4">
                {data.dailyTasks.map((task) => {
                  const statusMeta = getTaskStatusMeta(task.status);
                  const StatusIcon = task.status === 'completed' ? CheckCircle2 : Clock;

                  return (
                  <Link key={task.id} href="/teacher/activities" className="group flex items-center justify-between p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 transition-colors ${statusMeta.iconBg}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-[16px] tracking-tight transition-colors ${statusMeta.strike ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 group-hover:text-indigo-600'}`}>{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                          <span className="text-[13px] font-semibold text-slate-500">{statusMeta.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shrink-0">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Link>
                  );
                })}
              </div>
            </motion.div>
            )}

          </div>

          {/* Right Column (Spans 4) */}
          <div className="xl:col-span-4 flex flex-col gap-8 min-w-0">
            
            {/* Recent Submissions List */}
            <motion.div variants={itemVariants} className="flex flex-col gap-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Your Recent Submissions</h3>
                <Link href="/teacher/submissions" className="text-[14px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2">See all</Link>
              </div>
              
              <div className="space-y-3">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((sub, i) => {
                    const studentLabel = studentNameMap[sub.student_auth_id] || sub.student_id?.name || 'Student';
                    const subjectLabel = sub.assignment_id?.subject || 'General';

                    return (
                    <div key={sub._id} className="relative">
                      <div className="flex items-start justify-between py-1">
                        <div className="flex gap-4 flex-1 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 ${i === 0 ? 'bg-[#FF5A36]' : i === 1 ? 'bg-[#4B93DF]' : 'bg-violet-500'}`}>
                            {sub.status === 'pending' ? <AlertCircle className="w-[22px] h-[22px]" /> : <CheckCircle2 className="w-[22px] h-[22px]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">{sub.assignment_id?.title || 'Assignment'}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sub.status === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {getSubmissionStatusLabel(sub.status)}
                              </span>
                            </div>
                            <p className="text-[14px] text-slate-500 font-medium mb-3">
                              {studentLabel} • {subjectLabel} • {sub.status === 'pending' ? 'Needs grading' : 'Reviewed'}
                            </p>
                            
                            {expandedSubId === sub._id && (
                              <>
                                <div className="flex gap-2 mb-3 flex-wrap">
                                  <span className="px-3 py-1 bg-slate-200 rounded-full text-[12px] font-semibold text-slate-600">{subjectLabel}</span>
                                  {sub.assignment_id?.dueDate && (
                                    <span className="px-3 py-1 bg-slate-200 rounded-full text-[12px] font-semibold text-slate-600">
                                      Due {new Date(sub.assignment_id.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[14px] text-slate-500 leading-relaxed pr-6">
                                  {sub.submissionText || 'Student submitted this assignment. Please review and provide feedback.'}
                                </p>

                                <div className="flex items-center gap-5 mt-4 text-[13px] font-medium text-slate-400">
                                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {studentLabel}</span>
                                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {subjectLabel}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedSubId(expandedSubId === sub._id ? null : sub._id)}
                          className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors flex-shrink-0 mt-1 cursor-pointer z-10"
                          aria-label={expandedSubId === sub._id ? 'Collapse submission details' : 'Expand submission details'}
                        >
                          {expandedSubId === sub._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      {i < recentSubmissions.length - 1 && <div className="absolute -bottom-1.5 left-0 right-0 h-px bg-slate-200"></div>}
                    </div>
                    );
                  })
                ) : (
                  <div className="bg-white p-6 rounded-[28px] shadow-sm text-center text-slate-500 font-medium">
                    No pending submissions.
                  </div>
                )}
              </div>
            </motion.div>


            {/* Class Progress Card — Fix 4: Dynamic date */}
            {widgetSettings?.progress !== false && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[200px]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Class Progress</h3>
                <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-600">
                  <Clock className="w-4 h-4" /> {todayFormatted}
                </span>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-[13px] font-semibold text-slate-500 mb-1">Assignments</p>
                  <p className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-slate-900 leading-none">{data.classProgress?.assignments || 0}</p>
                </div>
                <div className="h-10 w-px bg-slate-200 mb-1"></div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-500 mb-1">Reviewed</p>
                  <p className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-slate-900 leading-none">{data.classProgress?.reviewed || 0}</p>
                </div>
                <div className="h-10 w-px bg-slate-200 mb-1"></div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-500 mb-1">Passed</p>
                  <p className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-slate-900 leading-none">{data.classProgress?.passed || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 h-8 mt-6">
                {[...Array(40)].map((_, i) => {
                  const total = Math.max(data.classProgress?.assignments || 1, 1);
                  const passed = data.classProgress?.passed || 0;
                  const reviewed = data.classProgress?.reviewed || 0;
                  
                  const passedCount = Math.round((passed / total) * 40);
                  const reviewedNotPassedCount = Math.round(((reviewed - passed) / total) * 40);

                  let bgColor = 'bg-slate-200';
                  if (i < passedCount) {
                    bgColor = 'bg-slate-800';
                  } else if (i < passedCount + reviewedNotPassedCount) {
                    bgColor = 'bg-[#FF5A36]';
                  }

                  return (
                    <div 
                      key={i} 
                      className={`flex-1 h-full rounded-[2px] ${bgColor}`}
                    />
                  );
                })}
              </div>
            </motion.div>
            )}

            {/* Mood Breakdown */}
            {data.moodBreakdown && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col items-center">
              <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4 w-full text-left">Class Mood</h3>
              {moodHasData ? (
                <>
                  <div className="w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={data.moodBreakdown} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {data.moodBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 w-full flex-wrap">
                    {data.moodBreakdown.map(mood => (
                      <div key={mood.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mood.fill }}></div>
                        <span className="text-[13px] font-semibold text-slate-600">{mood.name} ({mood.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full py-10 text-center text-slate-400 font-medium text-[14px]">
                  No mood data recorded yet.
                </div>
              )}
            </motion.div>
            )}



          </div>
        </motion.div>

      </div>
    </div>
  )
}
