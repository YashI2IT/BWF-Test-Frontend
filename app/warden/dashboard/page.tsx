/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton'
import {
  Users,
  Calendar,
  AlertCircle,
  DollarSign,
  Sun,
  Moon,
  Sunrise,
  Wallet
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { PremiumCalendar } from '@/app/warden/Template/components/premium-calendar'
import { PremiumInbox } from '@/app/warden/Template/components/premium-inbox'
import api from '@/app/lib/api'

// Dummy data replaced by backend API

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-5 py-3 min-w-[140px]">
        <p className="text-[13px] font-bold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}
            </span>
            <span className="text-[13px] font-bold text-slate-900">
              {entry.name === 'Actual' || entry.name === 'Budget' || entry.name.includes('Amount') ? `₹${entry.value}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sunrise className="w-6 h-6 text-amber-500" /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <Sun className="w-6 h-6 text-orange-500" /> };
  return { text: 'Good Evening', icon: <Moon className="w-6 h-6 text-indigo-500" /> };
}

function DashboardSkeleton() {
  return (
    <main className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-8 w-64 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-80 rounded-lg ml-9 mt-1 opacity-70" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px] rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 flex flex-col gap-8">
            <Skeleton className="h-[420px] rounded-[32px]" />
            <Skeleton className="h-[380px] rounded-[32px]" />
          </div>
          <div className="xl:col-span-4 flex flex-col gap-8">
            <Skeleton className="h-[380px] rounded-[32px]" />
            <Skeleton className="h-[380px] rounded-[32px]" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function WardenDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, dashboardRes] = await Promise.all([
          api.get('/warden/profile'),
          api.get('/warden/dashboard')
        ]);
        setProfile(profileRes.data);
        setDashboardData(dashboardRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
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
              {greeting.text}{profile ? `, ${profile.name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <p className="text-[15px] text-slate-500 ml-9">
            Here's your hostel dashboard overview for today, {todayFormatted}.
          </p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show">
          
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900">{dashboardData?.quickStats?.totalStudents || 0}</h3>
                  <p className="text-[14px] font-semibold text-slate-500 mt-1">Total Students</p>
                </div>
              </motion.div>
  
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900">{dashboardData?.quickStats?.activeEvents || 0}</h3>
                  <p className="text-[14px] font-semibold text-slate-500 mt-1">Active Events</p>
                </div>
              </motion.div>
  
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900">{dashboardData?.quickStats?.pendingComplaints || 0}</h3>
                  <p className="text-[14px] font-semibold text-slate-500 mt-1">Pending Complaints</p>
                </div>
              </motion.div>
  
              <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900">₹{(dashboardData?.quickStats?.monthlyExpenses || 0).toLocaleString()}</h3>
                  <p className="text-[14px] font-semibold text-slate-500 mt-1">Monthly Expenses</p>
                </div>
              </motion.div>
            </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="xl:col-span-8 flex flex-col gap-8 min-w-0">
              
              {/* Expense Tracker Card */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-auto md:h-[420px] relative border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Expense Tracker</h2>
                      <p className="text-[15px] text-slate-500 mt-1.5 max-w-[400px] leading-snug">
                        Track monthly spending versus budget allocations to manage hostel finances
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center mt-4">
                  {/* Left Stats area */}
                  <div className="w-full md:w-[200px] flex-shrink-0 mb-4 md:mb-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl sm:text-[36px] md:text-[44px] font-extrabold text-slate-900 leading-none">
                        ₹{(dashboardData?.quickStats?.monthlyExpenses || 0).toLocaleString()}
                      </h2>
                    </div>
                    <p className="text-[15px] text-slate-500 mt-3 leading-relaxed pr-4">
                      spent this month, slightly over budget
                    </p>
                  </div>
                  
                  {/* Chart area */}
                  <div className="w-full min-w-0 h-[240px]">
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart 
                        data={dashboardData?.expenseTrendData || []} 
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
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                          dy={8}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: '#cbd5e1' }}
                          width={45}
                          tickFormatter={(val) => `₹${val / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          name="Actual"
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          fill="url(#trackerGradient)" 
                          dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="budget" 
                          name="Budget"
                          stroke="#94a3b8" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          fill="none" 
                          dot={false}
                          activeDot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Complaints Status Chart */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Complaints Resolution</h3>
                </div>
                
                <div className="w-full min-w-0 h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dashboardData?.complaintData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                      <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-semibold text-slate-500">Resolved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[12px] font-semibold text-slate-500">Pending</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 overflow-hidden">
                  <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">Inbox</h3>
                  <PremiumInbox messages={dashboardData?.inboxMessages || []} />
                </div>
              </motion.div>

            </div>

            {/* Right Column */}
            <div className="xl:col-span-4 flex flex-col gap-8 min-w-0">
              
              {/* Expense Breakdown (Pie Chart) */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                <h3 className="text-[19px] font-bold text-slate-900 mb-2 self-start tracking-tight">Expense Breakdown</h3>
                <p className="text-xs text-slate-500 self-start mb-4">By category</p>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={dashboardData?.expenseBreakdown || []} 
                        dataKey="value" 
                        cx="50%" 
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {(dashboardData?.expenseBreakdown || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 mt-2">
                  {(dashboardData?.expenseBreakdown || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 leading-tight">{item.name}</p>
                        <p className="text-[13px] font-bold text-slate-900">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Premium Calendar */}
              <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">Calendar</h3>
                <PremiumCalendar events={dashboardData?.calendarEvents || []} />
              </motion.div>

            </div>
          </div>

        </motion.div>
      </div>
    </main>
  )
}
