'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/warden/Template/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
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

const ITEMS_PER_PAGE = 8;

type Category =
  | 'Food'
  | 'Utilities'
  | 'Medical'
  | 'Education'
  | 'Staff'
  | 'Maintenance'
  | 'Supplies'
  | 'Activities'
  | 'Transport'
  | 'Administration'
  | 'Emergency';

type Status = 'paid' | 'pending';

interface Expense {
  id: number;
  student: string;
  category: Category;
  amount: number;
  description: string;
  date: string;
  status: Status;
}

const categoryColors: Record<Category, string> = {
  Food: '#3b82f6',
  Utilities: '#8b5cf6',
  Medical: '#10b981',
  Education: '#06b6d4',
  Staff: '#db2777',
  Maintenance: '#f97316',
  Supplies: '#0ea5e9',
  Activities: '#e11d48',
  Transport: '#f59e0b',
  Administration: '#64748b',
  Emergency: '#ef4444',
};

const truncateWords = (value: string, wordCount = 4) => {
  const words = value.split(/\s+/).filter(Boolean);
  return words.length <= wordCount ? value : `${words.slice(0, wordCount).join(' ')}...`;
};

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Category>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [draftExpense, setDraftExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);

  const [data, setData] = useState<Expense[]>([
    {
      id: 1,
      student: 'Arjun Kumar',
      category: 'Food',
      amount: 500,
      description: 'Monthly meal charges for the hostel mess and cafeteria facilities.',
      date: '2026-04-12',
      status: 'paid',
    },
    {
      id: 2,
      student: 'Meera Patel',
      category: 'Education',
      amount: 1200,
      description: 'Books and stationery purchase for science and maths classes.',
      date: '2026-04-10',
      status: 'paid',
    },
    {
      id: 3,
      student: 'Rohan Verma',
      category: 'Medical',
      amount: 3200,
      description: 'First aid kit refill and consultation charges for the hostel clinic.',
      date: '2026-04-08',
      status: 'pending',
    },
    {
      id: 4,
      student: 'Priya Singh',
      category: 'Maintenance',
      amount: 750,
      description: 'Sports equipment repair and replacement for the activity center.',
      date: '2026-04-06',
      status: 'pending',
    },
    {
      id: 5,
      student: 'Ananya Gupta',
      category: 'Activities',
      amount: 420,
      description: 'Snacks and refreshment items for the weekend study hall.',
      date: '2026-04-04',
      status: 'paid',
    },
    {
      id: 6,
      student: 'Vikram Singh',
      category: 'Supplies',
      amount: 890,
      description: 'Online course subscription and digital library access for students.',
      date: '2026-04-02',
      status: 'pending',
    },
    {
      id: 7,
      student: 'Sara Khan',
      category: 'Medical',
      amount: 650,
      description: 'Doctor consultation and medicines for hostel health checkups.',
      date: '2026-03-29',
      status: 'paid',
    },
    {
      id: 8,
      student: 'Harsh Jain',
      category: 'Utilities',
      amount: 980,
      description: 'Housekeeping supplies purchase for dorm common areas and lounges.',
      date: '2026-03-26',
      status: 'pending',
    },
    {
      id: 9,
      student: 'Neha Reddy',
      category: 'Transport',
      amount: 640,
      description: 'Breakfast buffet charges and special diet meal requests.',
      date: '2026-03-22',
      status: 'paid',
    },
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const filteredData = useMemo(() => {
    return data.filter((expense) => {
      const matchesSearch =
        expense.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase());
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
    Staff: 0,
    Maintenance: 0,
    Supplies: 0,
    Activities: 0,
    Transport: 0,
    Administration: 0,
    Emergency: 0,
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
    return (Object.keys(categoryTotals) as Category[]).map((category) => ({
      name: category,
      value: categoryTotals[category],
      fill: categoryColors[category],
    }));
  }, [categoryTotals]);

  const highestCategory = (Object.keys(categoryTotals) as Category[]).reduce((best, key) =>
    categoryTotals[key] > categoryTotals[best] ? key : best,
    'Food'
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleAddExpense = () => {
    const nextId = Math.max(0, ...data.map((item) => item.id)) + 1;
    setSelectedExpense(null);
    setDraftExpense({
      id: nextId,
      student: '',
      category: 'Food',
      amount: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'pending',
    });
    setIsDetailOpen(true);
  };

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setDraftExpense(expense);
    setIsDetailOpen(true);
  };

  const handleDelete = () => {
    if (!draftExpense) return;
    setData((prev) => prev.filter((item) => item.id !== draftExpense.id));
    setSelectedExpense(null);
    setDraftExpense(null);
    setIsDetailOpen(false);
  };

  const handleMarkPaid = () => {
    if (!draftExpense) return;
    const updated = { ...draftExpense, status: 'paid' as Status };
    setDraftExpense(updated);
    setSelectedExpense(updated);
    setData((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  };

  const handleSaveExpense = () => {
    if (!draftExpense) return;
    setData((prev) => {
      const exists = prev.some((item) => item.id === draftExpense.id);
      if (exists) {
        return prev.map((item) => (item.id === draftExpense.id ? draftExpense : item));
      }
      return [draftExpense, ...prev];
    });
    setSelectedExpense(draftExpense);
    setIsDetailOpen(false);
  };

  const getStatusStyle = (status: Status) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses Tracking</h1>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
            <span>Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-500 font-semibold">Expenses</span>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95" onClick={handleAddExpense}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      <div className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border border-slate-200/70 rounded-3xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Total Expenses (This Month)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">₹{totalAmount.toLocaleString()}</p>
          <p className="mt-1 text-sm text-slate-500">{data.length} transactions</p>
        </Card>
        <Card className="border border-slate-200/70 rounded-3xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Highest Category</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{highestCategory}</p>
          <p className="mt-1 text-sm text-slate-500">₹{categoryTotals[highestCategory].toLocaleString()}</p>
        </Card>
        <Card className="border border-slate-200/70 rounded-3xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Pending Payments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-sm text-slate-500">₹{pendingAmount.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                  <Bar dataKey="amount" fill="#4f46e5" radius={[8, 8, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/70 rounded-3xl overflow-hidden">
        <CardHeader className="">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search student or description"
                  className="pl-9 h-8 rounded-2xl border-slate-200 bg-slate-50 text-xs w-full"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2 w-full lg:w-auto">
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as 'ALL' | Category)}>
                  <SelectTrigger className="h-8 rounded-2xl bg-slate-50 border-slate-200 px-3 text-xs text-slate-600"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Activities">Activities</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Status)}>
                  <SelectTrigger className="h-8 rounded-2xl bg-slate-50 border-slate-200 px-3 text-xs text-slate-600"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                {paginatedData.length > 0 ? (
                  paginatedData.map((expense) => (
                    <TableRow
                      key={expense.id}
                      onClick={() => handleRowClick(expense)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <TableCell className="py-3 px-4 text-sm font-semibold text-slate-900">{expense.date}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${categoryColors[expense.category]}20`, color: categoryColors[expense.category] }}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-slate-600 max-w-64 truncate">{truncateWords(expense.description)}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-semibold text-slate-900">₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(expense.status)}`}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-500 font-medium italic">
                      No expenses found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {filteredData.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} expenses
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? 'default' : 'ghost'}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold p-0 transition-all ${
                      currentPage === index + 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-lg hover:bg-slate-100"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
        <CardHeader 
          className="px-3 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsGuideExpanded(!isGuideExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Expense category guide</CardTitle>
            <span className={`text-slate-500 transition-transform text-sm ${isGuideExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </CardHeader>
        {isGuideExpanded && (
          <CardContent className="p-3 text-xs text-slate-600 space-y-2">
            <div>
              <p className="font-semibold text-slate-900 text-sm">Food: ₹{categoryTotals.Food.toLocaleString()} ({((categoryTotals.Food / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Meals, groceries, nutrition and snacks.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Utilities: ₹{categoryTotals.Utilities.toLocaleString()} ({((categoryTotals.Utilities / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Electricity, water, gas, internet and waste services.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Medical: ₹{categoryTotals.Medical.toLocaleString()} ({((categoryTotals.Medical / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Medicines, clinic visits and health supplies.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Education: ₹{categoryTotals.Education.toLocaleString()} ({((categoryTotals.Education / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Books, tuition, uniforms and learning materials.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Staff: ₹{categoryTotals.Staff.toLocaleString()} ({((categoryTotals.Staff / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Salaries and wages for warden, cooks, and support staff.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Maintenance: ₹{categoryTotals.Maintenance.toLocaleString()} ({((categoryTotals.Maintenance / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Repairs, cleaning and facilities upkeep.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Supplies: ₹{categoryTotals.Supplies.toLocaleString()} ({((categoryTotals.Supplies / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Bedding, toiletries, kitchen and school supplies.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Activities: ₹{categoryTotals.Activities.toLocaleString()} ({((categoryTotals.Activities / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Sports, events, outings and wellness programs.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Transport: ₹{categoryTotals.Transport.toLocaleString()} ({((categoryTotals.Transport / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>School trips, medical transport and deliveries.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Administration: ₹{categoryTotals.Administration.toLocaleString()} ({((categoryTotals.Administration / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Office costs, recordkeeping and transaction fees.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Emergency: ₹{categoryTotals.Emergency.toLocaleString()} ({((categoryTotals.Emergency / totalExpenses) * 100).toFixed(1)}%)</p>
              <p>Contingency expenses. Unexpected repairs, emergency medical or relocation costs.</p>
            </div>
          </CardContent>
        )}
      </Card>

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
                    <SelectTrigger className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-slate-600"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Activities">Activities</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Amount</p>
                  <Input
                    type="number"
                    value={draftExpense.amount}
                    onChange={(event) => setDraftExpense({ ...draftExpense, amount: Number(event.target.value) })}
                    placeholder="Amount"
                    className="mt-2"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Date</p>
                  <Input
                    type="date"
                    value={draftExpense.date}
                    onChange={(event) => setDraftExpense({ ...draftExpense, date: event.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Description</p>
                <Textarea
                  value={draftExpense.description}
                  onChange={(event) => setDraftExpense({ ...draftExpense, description: event.target.value })}
                  placeholder="Add a short description"
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Status</p>
                <Select
                  value={draftExpense.status}
                  onValueChange={(value) => setDraftExpense({ ...draftExpense, status: value as Status })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-2xl bg-slate-50 border-slate-200 px-4 text-sm text-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Select a row or click Add Expense to create a new entry.</div>
          )}
          <DialogFooter className="p-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-xl h-10 px-6 text-xs font-bold">Close</Button>
            <Button onClick={handleSaveExpense} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 text-xs font-bold">Save</Button>
            {selectedExpense && (
              <Button variant="destructive" onClick={handleDelete} className="rounded-xl h-10 px-6 text-xs font-bold">Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
