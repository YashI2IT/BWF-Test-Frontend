/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Search, Plus, ChevronDown, CalendarIcon, Upload } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/warden/Template/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';
import api from '@/app/lib/api';
import { Calendar } from '@/app/warden/Template/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/warden/Template/components/ui/popover';
import { format } from 'date-fns';
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
  Legend,
} from 'recharts';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};



type Category =
  | 'Food'
  | 'Education'
  | 'Medical'
  | 'Cosmetics'
  | 'Utilities'
  | 'Maintenance'
  | 'Events'
  | 'Other';

type Status = 'pending' | 'approved' | 'rejected' | 'paid';
type Home = 'Jammu' | 'Anantnag' | 'Kupwara' | 'Beerwah' | 'All';

interface Expense {
  _id: string;
  title: string;
  category: Category;
  amount: number;
  notes: string;
  date: string;
  home: Home;
  status: Status;
}

const categoryColors: Record<Category, string> = {
  Food: '#3b82f6',
  Utilities: '#8b5cf6',
  Medical: '#10b981',
  Education: '#06b6d4',
  Maintenance: '#f97316',
  Cosmetics: '#db2777',
  Events: '#e11d48',
  Other: '#64748b',
};


export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Category>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL');
  const [, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [draftExpense, setDraftExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      // Skip header, parse rest
      const newExpenses = lines.slice(1).map((line) => {
        const [title, category, amount, notes, date, status, home] = line.split(',');
        // Basic validation for CSV fields
        const validCategories = ['Food', 'Education', 'Medical', 'Cosmetics', 'Utilities', 'Maintenance', 'Events', 'Other'];
        const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
        const validHomes = ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah', 'All'];
        
        return {
          title: title?.trim() || 'Unknown',
          category: (validCategories.includes(category?.trim()) ? category.trim() : 'Food') as Category,
          amount: parseFloat(amount?.trim()) || 0,
          notes: notes?.trim() || 'Imported from CSV',
          date: date?.trim() || new Date().toISOString().slice(0, 10),
          status: (validStatuses.includes(status?.trim().toLowerCase()) ? status.trim().toLowerCase() : 'pending') as Status,
          home: (validHomes.includes(home?.trim()) ? home.trim() : 'All') as Home,
        };
      });

      try {
        const promises = newExpenses.map(exp => api.post('/warden/expenses', exp));
        const results = await Promise.all(promises);
        const savedExpenses = results.map(res => res.data);
        setData((prev) => [...savedExpenses, ...prev]);
      } catch (error) {
        console.error("Failed to upload all expenses via CSV:", error);
        alert("Some or all CSV imports failed");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [data, setData] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/warden/expenses');
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);


  const filteredData = useMemo(() => {
    return data.filter((expense) => {
      const matchesSearch =
        (expense.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || expense.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, searchTerm, categoryFilter, statusFilter]);

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = data.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = data.filter((item) => item.status !== 'paid').length;

  const categoryTotals = data.reduce((acc: Record<Category, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {
    Food: 0,
    Utilities: 0,
    Medical: 0,
    Education: 0,
    Cosmetics: 0,
    Maintenance: 0,
    Events: 0,
    Other: 0,
  });

  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  const expenseTrendData = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    data.forEach((item) => {
      const month = new Date(item.date).toLocaleString('default', { month: 'short' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + item.amount;
    });
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return date.toLocaleString('default', { month: 'short' });
    });
    return months.map((month) => ({ month, amount: monthlyTotals[month] || 0 }));
  }, [data]);

  const expenseBreakdown = useMemo(() => {
    return (Object.keys(categoryTotals) as Category[])
      .filter((category) => categoryTotals[category] > 0)
      .map((category) => ({
        name: category,
        value: categoryTotals[category],
        fill: categoryColors[category],
      }));
  }, [categoryTotals]);

  const highestCategory = (Object.keys(categoryTotals) as Category[]).reduce((best, key) =>
    categoryTotals[key] > categoryTotals[best] ? key : best,
    'Food'
  );



  const handleAddExpense = () => {
    setSelectedExpense(null);
    setDraftExpense({
      _id: '',
      title: '',
      category: 'Food',
      amount: 0,
      notes: '',
      date: new Date().toISOString().slice(0, 10),
      home: 'All',
      status: 'pending',
    });
    setIsDetailOpen(true);
  };

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setDraftExpense(expense);
    setIsDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!draftExpense || !draftExpense._id) return;
    try {
      await api.delete(`/warden/expenses/${draftExpense._id}`);
      setData((prev) => prev.filter((item) => item._id !== draftExpense._id));
      setSelectedExpense(null);
      setDraftExpense(null);
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense");
    }
  };



  const handleSaveExpense = async () => {
    if (!draftExpense) return;
    try {
      const payload = {
        title: draftExpense.title,
        category: draftExpense.category,
        amount: draftExpense.amount,
        notes: draftExpense.notes,
        date: draftExpense.date,
        home: draftExpense.home,
        status: draftExpense.status
      };

      if (draftExpense._id) {
        // Update
        const res = await api.put(`/warden/expenses/${draftExpense._id}`, payload);
        setData((prev) => prev.map((item) => (item._id === res.data._id ? res.data : item)));
        setSelectedExpense(res.data);
      } else {
        // Create
        const res = await api.post('/warden/expenses', payload);
        setData((prev) => [res.data, ...prev]);
        setSelectedExpense(res.data);
      }
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Failed to save expense");
    }
  };

  const getStatusStyle = (status: Status) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg opacity-70" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-[350px] rounded-3xl" />
          <Skeleton className="h-[350px] rounded-3xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-4xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
            >
              Expenses Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2 font-medium"
            >
              Track and manage hostel expenses and budgets.
            </motion.p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-10 px-6 text-xs font-bold shadow-sm transition-all active:scale-95 text-slate-700 bg-white hover:bg-slate-50 border-slate-200">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={handleAddExpense} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border border-slate-200/70 rounded-3xl p-5 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Total Expenses (This Month)</p>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">₹{totalAmount.toLocaleString()}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{data.length} transactions</p>
              </div>
            </div>
          </Card>
          <Card className="border border-slate-200/70 rounded-3xl p-5 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Highest Category</p>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{highestCategory}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">₹{categoryTotals[highestCategory].toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-slate-200/70 rounded-3xl p-5 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Pending Payments</p>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{pendingCount}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">₹{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div variants={itemVariants}>
            <Card className="border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">Expense Breakdown</CardTitle>
                  <CardDescription className="text-xs">Pie chart for all categories.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry: any) => `${entry.name}: ${Math.round((entry.percent ?? 0) * 100)}%`}
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">Monthly Trends</CardTitle>
                  <CardDescription className="text-xs">Last 6 months overall expense</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseTrendData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#0f172a" radius={[8, 8, 0, 0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mb-6">
          <Card className="border border-slate-200/70 rounded-3xl overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Expense Records</CardTitle>
                  <CardDescription className="text-xs">Recent expense entries for your hostel</CardDescription>
                </div>
                <p className="text-xs text-slate-500">Showing {filteredData.length} records</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-3">
              <div className="flex flex-col gap-1 mb-3 -mt-1">
                <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search student or description..."
                      className="pl-9 h-10 rounded-full border-slate-200 bg-slate-50 text-sm w-full focus-visible:ring-1 focus-visible:ring-slate-300"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2 w-full lg:w-auto">
                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as 'ALL' | Category)}>
                      <SelectTrigger className="h-10 rounded-full bg-slate-50 border-slate-200 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue placeholder="All Categories" /></SelectTrigger>
                      <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                        <SelectItem value="ALL" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">All Categories</SelectItem>
                        <SelectItem value="Food" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Food</SelectItem>
                        <SelectItem value="Utilities" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Utilities</SelectItem>
                        <SelectItem value="Medical" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Medical</SelectItem>
                        <SelectItem value="Education" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Education</SelectItem>
                        <SelectItem value="Maintenance" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Maintenance</SelectItem>
                        <SelectItem value="Cosmetics" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Cosmetics</SelectItem>
                        <SelectItem value="Events" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Events</SelectItem>
                        <SelectItem value="Other" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Status)}>
                      <SelectTrigger className="h-10 rounded-full bg-slate-50 border-slate-200 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                        <SelectItem value="ALL" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">All Status</SelectItem>
                        <SelectItem value="paid" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Paid</SelectItem>
                        <SelectItem value="pending" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-3 px-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 border-none">Date</TableHead>
                      <TableHead className="py-3 px-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 border-none">Category</TableHead>
                      <TableHead className="py-3 px-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 border-none">Description</TableHead>
                      <TableHead className="py-3 px-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 border-none">Amount</TableHead>
                      <TableHead className="py-3 px-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 border-none">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-slate-500">No expenses found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((expense) => (
                        <TableRow 
                          key={expense._id}
                          className="border-b border-slate-50/50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(expense)}
                        >
                          <TableCell className="py-4 px-4 text-xs text-slate-600">{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-4 px-4 text-xs font-medium text-slate-900">{expense.category}</TableCell>
                          <TableCell className="py-4 px-4 text-xs text-slate-600">
                            <div><span className="font-semibold text-slate-800">{expense.title}</span> - {expense.notes}</div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-xs font-bold text-slate-900">₹{expense.amount.toLocaleString()}</TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className={`rounded-full px-3 py-1 font-bold tracking-tight text-[10px] uppercase ${getStatusStyle(expense.status)}`}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card 
            className="border border-slate-200/70 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow group bg-white" 
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
          >
            <CardHeader className="bg-white group-hover:bg-slate-50/50 p-6 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100" data-expanded={isGuideExpanded}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">Expense Category Guide</CardTitle>
                  <CardDescription className="text-xs">Learn how expenses are categorized</CardDescription>
                </div>
                <div className="bg-slate-50 p-2 rounded-full border border-slate-100 shadow-sm">
                  <ChevronDown 
                    className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isGuideExpanded ? 'rotate-180' : ''}`} 
                  />
                </div>
              </div>
            </CardHeader>
            {isGuideExpanded && (
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/30">
                {Object.entries(categoryTotals).map(([key, value]) => {
                  const categoryName = key as Category;
                  const percentage = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0.0";
                  
                  let description = "";
                  switch (categoryName) {
                    case 'Food': description = "Meals, groceries, nutrition and snacks."; break;
                    case 'Utilities': description = "Electricity, water, gas, internet and waste services."; break;
                    case 'Medical': description = "Medicines, clinic visits and health supplies."; break;
                    case 'Education': description = "Books, tuition, uniforms and learning materials."; break;
                    case 'Maintenance': description = "Repairs, cleaning and facilities upkeep."; break;
                    case 'Cosmetics': description = "Personal care and cosmetic items."; break;
                    case 'Events': description = "Special occasions and gatherings."; break;
                    case 'Other': description = "Miscellaneous operational expenses."; break;
                  }

                  return (
                    <div key={categoryName} className="space-y-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-slate-800 text-sm">{categoryName}</p>
                        <Badge variant="secondary" className="bg-slate-50 text-slate-600 font-semibold">{percentage}%</Badge>
                      </div>
                      <p className="font-semibold text-slate-900 text-xs">₹{value.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{description}</p>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
      </motion.div>
      </motion.div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-4xl border-none shadow-2xl p-0 bg-white">
          <div className="p-6 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Expense details</DialogTitle>
              <DialogDescription className="text-slate-500">Review, edit, or save expense information.</DialogDescription>
            </DialogHeader>
          </div>
          {draftExpense ? (
            <div className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Category</p>
                  <Select
                    value={draftExpense.category}
                    onValueChange={(value) => setDraftExpense({ ...draftExpense, category: value as Category })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                      <SelectItem value="Food" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Food</SelectItem>
                      <SelectItem value="Utilities" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Utilities</SelectItem>
                      <SelectItem value="Medical" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Medical</SelectItem>
                      <SelectItem value="Education" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Education</SelectItem>
                      <SelectItem value="Maintenance" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Maintenance</SelectItem>
                      <SelectItem value="Cosmetics" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Cosmetics</SelectItem>
                      <SelectItem value="Events" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Events</SelectItem>
                      <SelectItem value="Other" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Title</p>
                  <Input
                    type="text"
                    value={draftExpense.title}
                    onChange={(event) => setDraftExpense({ ...draftExpense, title: event.target.value })}
                    placeholder="Expense title"
                    className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Amount</p>
                  <Input
                    type="number"
                    value={draftExpense.amount || ''}
                    onChange={(event) => setDraftExpense({ ...draftExpense, amount: Number(event.target.value) })}
                    placeholder="Amount"
                    className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-left font-normal w-full justify-start ${!draftExpense.date ? "text-slate-400" : "text-slate-900"} hover:bg-slate-100/50 focus-visible:ring-1 focus-visible:ring-slate-300 shadow-none`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                        {draftExpense.date ? format(new Date(draftExpense.date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl shadow-xl border-slate-100 overflow-hidden" align="start">
                      <Calendar
                        mode="single"
                        selected={draftExpense.date ? new Date(draftExpense.date) : undefined}
                        onSelect={(date) => setDraftExpense({ ...draftExpense, date: date ? date.toISOString() : '' })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Home</p>
                  <Select
                    value={draftExpense.home}
                    onValueChange={(value) => setDraftExpense({ ...draftExpense, home: value as Home })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                      <SelectItem value="All" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">All Homes</SelectItem>
                      <SelectItem value="Jammu" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Jammu</SelectItem>
                      <SelectItem value="Anantnag" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Anantnag</SelectItem>
                      <SelectItem value="Kupwara" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Kupwara</SelectItem>
                      <SelectItem value="Beerwah" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Beerwah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Notes / Description</p>
                <Textarea
                  value={draftExpense.notes}
                  onChange={(event) => setDraftExpense({ ...draftExpense, notes: event.target.value })}
                  placeholder="Add a short description"
                  className="mt-2 rounded-2xl bg-slate-50 border-slate-200 p-4 text-sm focus-visible:ring-1 focus-visible:ring-slate-300 w-full resize-none"
                  rows={4}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Status</p>
                <Select
                  value={draftExpense.status}
                  onValueChange={(value) => setDraftExpense({ ...draftExpense, status: value as Status })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                    <SelectItem value="paid" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Paid</SelectItem>
                    <SelectItem value="pending" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Pending</SelectItem>
                    <SelectItem value="approved" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Approved</SelectItem>
                    <SelectItem value="rejected" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Select a row or click Add Expense to create a new entry.</div>
          )}
          <DialogFooter className="p-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95">Close</Button>
            <Button onClick={handleSaveExpense} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md h-10 px-6 text-xs font-bold transition-all active:scale-95">Save</Button>
            {selectedExpense && (
              <Button variant="destructive" onClick={handleDelete} className="rounded-full h-10 px-6 text-xs font-bold shadow-md transition-all active:scale-95">Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
