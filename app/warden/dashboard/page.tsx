'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { PremiumStatCard } from '@/app/warden/Template/components/premium-stat-card'
import { PremiumCalendar } from '@/app/warden/Template/components/premium-calendar'
import { PremiumInbox } from '@/app/warden/Template/components/premium-inbox'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/warden/Template/components/ui/card'

// Sample data exactly from NewLayout to match user's screenshot
const expenseTrendData = [
  { month: 'Jan', amount: 45000, budget: 50000 },
  { month: 'Feb', amount: 52000, budget: 50000 },
  { month: 'Mar', amount: 48000, budget: 50000 },
  { month: 'Apr', amount: 61000, budget: 50000 },
  { month: 'May', amount: 55000, budget: 50000 },
  { month: 'Jun', amount: 68500, budget: 50000 },
]

const expenseBreakdown = [
  { name: 'Food & Mess', value: 35, fill: '#7851ff' },
  { name: 'Utilities', value: 25, fill: '#6366f1' },
  { name: 'Maintenance', value: 20, fill: '#8b5cf6' },
  { name: 'Other', value: 20, fill: '#a78bfa' },
]

const complaintData = [
  { month: 'Jan', resolved: 12, pending: 3 },
  { month: 'Feb', resolved: 18, pending: 2 },
  { month: 'Mar', resolved: 15, pending: 4 },
  { month: 'Apr', resolved: 22, pending: 3 },
  { month: 'May', resolved: 19, pending: 5 },
  { month: 'Jun', resolved: 25, pending: 6 },
]

const calendarEvents = [
  {
    date: 15,
    title: 'Staff Meeting',
    time: '10:00 AM',
    type: 'meeting' as const,
  },
  {
    date: 15,
    title: 'Expense Review',
    time: '2:30 PM',
    type: 'expense' as const,
  },
  {
    date: 18,
    title: 'Student Feedback',
    time: '11:00 AM',
    type: 'activity' as const,
  },
  {
    date: 22,
    title: 'Maintenance Check',
    time: '9:00 AM',
    type: 'complaint' as const,
  },
  {
    date: 25,
    title: 'Monthly Review',
    time: '3:00 PM',
    type: 'meeting' as const,
  },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-foreground text-background px-3 py-2 rounded-lg shadow-lg text-xs font-medium border-none outline-none">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function WardenDashboard() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch('http://localhost:5000/api/warden/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-background/95 min-h-screen">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back{profile ? `, ${profile.name.split(' ')[0]}` : ''}! Here's your hostel overview !!!.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PremiumStatCard
            icon={Users}
            label="Total Students"
            value="245"
            change={{ value: 12, direction: 'up' }}
            color="primary"
          />
          <PremiumStatCard
            icon={Calendar}
            label="Active Events"
            value="8"
            change={{ value: 5, direction: 'up' }}
            color="success"
          />
          <PremiumStatCard
            icon={AlertCircle}
            label="Pending Complaints"
            value="6"
            change={{ value: 8, direction: 'down' }}
            color="warning"
          />
          <PremiumStatCard
            icon={DollarSign}
            label="Monthly Expenses"
            value="₹68,500"
            change={{ value: 37, direction: 'up' }}
            color="danger"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Trend */}
          <Card className="lg:col-span-2 card-hover-primary">
            <CardHeader className="pb-3 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Expense Trends
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly spending vs budget
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expenseTrendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7851ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7851ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(0,0,0,0.3)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="rgba(0,0,0,0.3)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#7851ff"
                    strokeWidth={2.5}
                    dot={{ fill: '#7851ff', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="#d4a5ff"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Budget"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="card-hover-primary">
            <CardHeader className="pb-3 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Expense Breakdown
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    By category
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Complaints and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Complaints Chart */}
          <Card className="lg:col-span-1 card-hover-primary h-fit">
            <CardHeader className="pb-3 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Complaints Status
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolution rate
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 scrollable-hide overflow-y-auto">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={complaintData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(0,0,0,0.3)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="rgba(0,0,0,0.3)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="resolved"
                    fill="#7851ff"
                    radius={[8, 8, 0, 0]}
                    name="Resolved"
                  />
                  <Bar
                    dataKey="pending"
                    fill="#d4a5ff"
                    radius={[8, 8, 0, 0]}
                    name="Pending"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calendar */}
          <div className="lg:col-span-2 h-fit">
            <PremiumCalendar events={calendarEvents} />
          </div>
        </div>

        {/* Inbox */}
        <div className="mb-8 animate-slide-in-up">
          <PremiumInbox />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover-primary">
            <CardHeader className="pb-3 border-none">
              <CardTitle className="text-sm font-semibold">
                Occupancy Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">92%</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ↑ 5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-primary">
            <CardHeader className="pb-3 border-none">
              <CardTitle className="text-sm font-semibold">
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">18</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active staff
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-primary">
            <CardHeader className="pb-3 border-none">
              <CardTitle className="text-sm font-semibold">
                This Month&apos;s Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">12</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    5 upcoming
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
