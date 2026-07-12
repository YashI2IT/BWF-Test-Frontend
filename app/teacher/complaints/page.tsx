'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { toast } from '@/app/teacher/Template/components/ui/use-toast';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { Badge } from '@/app/teacher/Template/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/teacher/Template/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Input } from '@/app/teacher/Template/components/ui/input';
import { Textarea } from '@/app/teacher/Template/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/teacher/Template/components/ui/alert-dialog';
import api from '@/app/lib/api';

type Status = 'OPEN' | 'RESOLVED' | 'ESCALATED';
type ReporterRole = 'Student' | 'Teacher';

interface ComplaintTimeline {
  reported: string;
  resolved?: string;
  resolvedReason?: string;
  escalated?: string;
  escalatedReason?: string;
}

interface RawComplaint {
  _id: string;
  title: string;
  description: string;
  reporter: string;
  role: string;
  date: string;
  time?: string;
  location: string;
  priority: string;
  status: string;
  timeline?: {
    reportedDate?: string;
    resolvedDate?: string;
    resolvedReason?: string;
    escalatedDate?: string;
    escalatedReason?: string;
  };
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  reporter: string;
  role: ReporterRole;
  dateTime: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: Status;
  timeline: ComplaintTimeline;
}

const STATUS_OPTIONS = ['All', 'OPEN', 'RESOLVED', 'ESCALATED'];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High'];
const ROLE_OPTIONS = ['All', 'Student', 'Teacher'];

const formatDate = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const formatTime = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Low':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'OPEN':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'ESCALATED':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getRoleColor = (role: string) => {
  return role.toLowerCase() === 'teacher'
    ? 'bg-purple-50 text-purple-600 border-purple-200'
    : 'bg-indigo-50 text-indigo-600 border-indigo-200';
};

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function ComplaintsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [resolutionNote, setResolutionNote] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [data, setData] = useState<Complaint[]>([]);
  const [historyData, setHistoryData] = useState<Complaint[]>([]);

  const getReporterDisplay = (reporter: string) => {
    if (reporter?.startsWith('Student ')) {
      const num = reporter.split(' ')[1];
      return `STU00${num}`;
    }
    return reporter;
  };

  const normalizeComplaint = (item: RawComplaint): Complaint => {
    let dateTime = item.date;
    if (item.date && item.time) {
      const d = new Date(item.date);
      const [hours, minutes] = item.time.split(':');
      d.setHours(parseInt(hours), parseInt(minutes));
      dateTime = d.toISOString();
    }

    return {
      id: item._id,
      title: item.title,
      description: item.description,
      reporter: getReporterDisplay(item.reporter),
      role: item.role as ReporterRole,
      dateTime: dateTime,
      location: item.location,
      priority: item.priority as any,
      status: item.status as any,
      timeline: {
        reported: item.timeline?.reportedDate || item.date,
        resolved: item.timeline?.resolvedDate,
        resolvedReason: item.timeline?.resolvedReason,
        escalated: item.timeline?.escalatedDate,
        escalatedReason: item.timeline?.escalatedReason,
      }
    };
  };

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/teacher/complaints');
      setData(res.data.map(normalizeComplaint));
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/teacher/complaints/history');
      setHistoryData(res.data.map(normalizeComplaint));
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (viewMode === 'active') {
      fetchComplaints();
    } else {
      fetchHistory();
    }
  }, [viewMode]);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const activeSource = viewMode === 'active' ? data : historyData;

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return activeSource.filter((complaint) => {
      const matchesSearch = [complaint.title, complaint.description, complaint.reporter, complaint.location]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || complaint.priority === priorityFilter;
      const matchesRole = roleFilter === 'All' || complaint.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesRole;
    });
  }, [activeSource, searchTerm, statusFilter, priorityFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedComplaints = filteredComplaints.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, roleFilter, viewMode]);

  // Handle boundary if items are removed from current page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const resolveComplaint = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      await api.put(`/teacher/complaints/${id}/approve`, { reason });

      setData((prev) =>
        prev.filter(c => c.id !== id) // Remove from active once resolved
      );
      toast({ title: 'Success', description: 'Complaint successfully resolved.' });
    } catch (error) {
      console.error("Failed to resolve complaint:", error);
      toast({ title: 'Error', description: 'Failed to resolve complaint. Please try again.', variant: 'destructive' });
    }
  };

  const escalateComplaint = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      await api.put(`/teacher/complaints/${id}/reject`, { reason });

      setData((prev) =>
        prev.filter(c => c.id !== id) // Remove from active once escalated
      );
      toast({ title: 'Success', description: 'Complaint successfully escalated.' });
    } catch (error) {
      console.error("Failed to escalate complaint:", error);
      toast({ title: 'Error', description: 'Failed to escalate complaint. Please try again.', variant: 'destructive' });
    }
  };

  const deleteComplaint = async (id: string) => {
    try {
      if (viewMode === 'active') {
        await api.delete(`/teacher/complaints/${id}`);
        setData((prev) => prev.filter((complaint) => complaint.id !== id));
      } else {
        await api.delete(`/teacher/complaints/history/${id}`);
        setHistoryData((prev) => prev.filter((complaint) => complaint.id !== id));
      }
      toast({ title: 'Success', description: 'Complaint record permanently deleted.' });
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      toast({ title: 'Error', description: 'Failed to delete complaint record. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F4F5F7] min-h-screen text-[13px] font-medium"
    >
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full min-w-0">
        {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 w-full min-w-0">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
          >
            Teacher Complaints
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2"
          >
            Manage and resolve student and parent complaints securely.
          </motion.p>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'active' | 'history')} className="w-full md:w-auto min-w-0" suppressHydrationWarning>
          <TabsList className="bg-slate-100 border border-slate-200/60 rounded-full h-[42px] p-1 flex items-center w-full md:w-fit overflow-x-auto min-w-0 hide-scrollbar">
            <TabsTrigger value="active" className="relative rounded-full h-full px-6 text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
              {viewMode === 'active' && (
                <motion.div
                  layoutId="complaints-view-mode-pill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Active List</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="relative rounded-full h-full px-6 text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
              {viewMode === 'history' && (
                <motion.div
                  layoutId="complaints-view-mode-pill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Full History</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Area */}
      <div className="mb-8 grid gap-4 xl:grid-cols-[2fr_1fr] xl:items-end w-full min-w-0">
        <div className="relative group w-full min-w-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints..."
                className="pl-11 h-12 rounded-full border-gray-200 bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black hover:border-gray-300 text-sm transition-colors text-ellipsis"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block mb-1.5 ml-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-[42px] rounded-full border-gray-200 bg-white shadow-sm text-sm font-semibold text-slate-700 capitalize focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 transition-colors data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer capitalize">
                        {option.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block mb-1.5 ml-1">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full h-[42px] rounded-full border-gray-200 bg-white shadow-sm text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 transition-colors data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block mb-1.5 ml-1">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full h-[42px] rounded-full border-gray-200 bg-white shadow-sm text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 transition-colors data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

      {/* Content Area */}
      <div className="w-full min-w-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm animate-pulse">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-slate-200 shrink-0"></div>
                          <div className="min-w-0 flex-1">
                            <div className="h-6 w-1/3 bg-slate-200 rounded-lg mb-3"></div>
                            <div className="flex gap-2">
                              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                              <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 space-y-2 md:pl-[3.25rem]">
                          <div className="h-4 w-full bg-slate-100 rounded-md"></div>
                          <div className="h-4 w-4/5 bg-slate-100 rounded-md"></div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-start lg:self-auto md:pl-[3.25rem] lg:pl-0">
                        <div className="w-20 h-9 bg-slate-200 rounded-xl"></div>
                        <div className="w-20 h-9 bg-slate-200 rounded-xl"></div>
                      </div>
                    </div>
                    
                    {/* Info Grid Skeleton */}
                    <div className="mt-6 md:pl-[3.25rem] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <div className="h-3 w-16 bg-slate-200 rounded-md mb-2.5"></div>
                          <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline Skeleton */}
                    <div className="mt-6 md:ml-[3.25rem] rounded-2xl bg-slate-50 border border-slate-100 p-4 md:p-5">
                      <div className="h-3 w-24 bg-slate-200 rounded-md mb-5"></div>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                          <div className="flex items-center justify-center w-3 h-3 rounded-full bg-slate-300 shadow-[0_0_0_4px_#f8fafc] z-10 shrink-0 md:order-1 md:-ml-1.5" />
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                              <div className="h-2.5 w-12 bg-slate-100 rounded-md"></div>
                            </div>
                            <div className="h-3 w-12 bg-slate-100 rounded-md"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredComplaints.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm"
                >
                  <Inbox className="w-8 h-8 text-indigo-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No complaints found</h3>
                <p className="text-slate-500 max-w-sm">We couldn&apos;t find any complaints matching your current filters or search terms.</p>
                {(searchTerm !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || roleFilter !== 'All') && (
                  <Button
                    variant="outline"
                    className="mt-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('All');
                      setPriorityFilter('All');
                      setRoleFilter('All');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <AnimatePresence>
                  {paginatedComplaints.map((complaint) => (
                    <motion.div
                      key={complaint.id}
                      layout
                      variants={itemVariants}
                      whileHover={{ scale: 1.005, translateY: -2 }}
                      className="group rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 rounded-2xl p-3 shrink-0 transition-colors duration-300 ${complaint.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-rose-50 text-rose-600'
                              }`}>
                              {complaint.status === 'RESOLVED' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{complaint.title}</h2>
                              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wide">
                                <span className={`rounded-full px-3 py-1 border ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
                                <span className={`rounded-full px-3 py-1 border ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span>
                                <span className={`rounded-full px-3 py-1 border capitalize ${getRoleColor(complaint.role)}`}>{complaint.role}</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-5 text-sm leading-relaxed text-slate-600 md:pl-[3.25rem]">{complaint.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 shrink-0 self-start lg:self-auto md:pl-[3.25rem] lg:pl-0">
                          {complaint.status === 'OPEN' ? (
                            <>
                              <AlertDialog onOpenChange={(open) => !open && setResolutionNote('')}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 px-4 text-xs font-bold text-white transition-all">Resolve</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl sm:max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl">Resolve Complaint</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 mt-2">Provide resolution details for this complaint. This will notify the reporter.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Textarea
                                    placeholder="How was this issue resolved?"
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    className="h-28 mt-4 rounded-2xl resize-none border-slate-200 focus-visible:ring-emerald-500/20"
                                  />
                                  <div className="mt-6 flex gap-3 justify-end">
                                    <AlertDialogCancel className="rounded-xl font-bold" onClick={() => setResolutionNote('')}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold shadow-sm"
                                      disabled={!resolutionNote.trim()}
                                      onClick={() => {
                                        resolveComplaint(complaint.id, resolutionNote);
                                        setResolutionNote('');
                                      }}
                                    >
                                      Mark Resolved
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog onOpenChange={(open) => !open && setEscalateReason('')}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="h-9 rounded-full bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-200 px-4 text-xs font-bold text-white transition-all">Escalate</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl sm:max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl">Escalate Complaint</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 mt-2">Provide a reason for escalating this complaint to higher authorities.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Textarea
                                    placeholder="Why does this need escalation?"
                                    value={escalateReason}
                                    onChange={(e) => setEscalateReason(e.target.value)}
                                    className="h-28 mt-4 rounded-2xl resize-none border-slate-200 focus-visible:ring-rose-500/20"
                                  />
                                  <div className="mt-6 flex gap-3 justify-end">
                                    <AlertDialogCancel className="rounded-xl font-bold" onClick={() => setEscalateReason('')}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold shadow-sm"
                                      disabled={!escalateReason.trim()}
                                      onClick={() => {
                                        escalateComplaint(complaint.id, escalateReason);
                                        setEscalateReason('');
                                      }}
                                    >
                                      Escalate
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={`rounded-xl px-3 py-1 font-bold border ${complaint.status === 'RESOLVED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                                {complaint.status === 'RESOLVED' ? 'Resolved' : 'Escalated'}
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-3 text-xs font-bold transition-colors">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl sm:max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl text-rose-600">Delete Permanently?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 mt-2">This action cannot be undone. This will permanently remove the complaint record from the system.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="mt-6 flex gap-3 justify-end">
                                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                                      onClick={() => deleteComplaint(complaint.id)}
                                    >
                                      Delete Record
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="mt-6 md:pl-[3.25rem] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors group-hover:bg-slate-50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Reported By</p>
                          <p className="mt-1 text-sm font-bold text-slate-800 truncate">{complaint.reporter}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors group-hover:bg-slate-50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Date</p>
                          <p className="mt-1 text-sm font-bold text-slate-800">{formatDate(complaint.dateTime)}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors group-hover:bg-slate-50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Time</p>
                          <p className="mt-1 text-sm font-bold text-slate-800">{formatTime(complaint.dateTime)}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors group-hover:bg-slate-50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</p>
                          <p className="mt-1 text-sm font-bold text-slate-800 truncate">{complaint.location}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="mt-6 md:ml-[3.25rem] rounded-2xl bg-slate-50 border border-slate-100 p-4 md:p-5">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-4">Activity Timeline</p>
                        <div className="space-y-4 text-sm text-slate-700 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">

                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group/timeline">
                            <div className="flex items-center justify-center w-3 h-3 rounded-full bg-slate-400 shadow-[0_0_0_4px_white] z-10 shrink-0 md:order-1 md:group-odd/timeline:-ml-1.5 md:group-even/timeline:-mr-1.5" />
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-bold text-slate-800 text-[12px]">Reported</p>
                                <span className="text-[10px] font-semibold text-slate-400">{formatDate(complaint.timeline.reported)}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">{formatTime(complaint.timeline.reported)}</p>
                            </div>
                          </div>

                          {complaint.timeline.resolved && (
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group/timeline">
                              <div className="flex items-center justify-center w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_white] z-10 shrink-0 md:order-1 md:group-odd/timeline:-ml-1.5 md:group-even/timeline:-mr-1.5" />
                              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-emerald-800 text-[12px]">Resolved</p>
                                  <span className="text-[10px] font-semibold text-emerald-600/70">{formatDate(complaint.timeline.resolved)}</span>
                                </div>
                                <p className="text-xs text-emerald-600 font-medium mb-1.5">{formatTime(complaint.timeline.resolved)}</p>
                                {complaint.timeline.resolvedReason && (
                                  <p className="text-xs text-emerald-700 bg-white/60 p-2 rounded-lg font-medium">{complaint.timeline.resolvedReason}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {complaint.timeline.escalated && (
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group/timeline">
                              <div className="flex items-center justify-center w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_0_4px_white] z-10 shrink-0 md:order-1 md:group-odd/timeline:-ml-1.5 md:group-even/timeline:-mr-1.5" />
                              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-rose-50/50 p-3 rounded-xl border border-rose-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-rose-800 text-[12px]">Escalated</p>
                                  <span className="text-[10px] font-semibold text-rose-600/70">{formatDate(complaint.timeline.escalated)}</span>
                                </div>
                                <p className="text-xs text-rose-600 font-medium mb-1.5">{formatTime(complaint.timeline.escalated)}</p>
                                {complaint.timeline.escalatedReason && (
                                  <p className="text-xs text-rose-700 bg-white/60 p-2 rounded-lg font-medium">{complaint.timeline.escalatedReason}</p>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Pagination */}
      {filteredComplaints.length > ITEMS_PER_PAGE && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl shadow-sm"
        >
          <p className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-800">{filteredComplaints.length > 0 ? startIdx + 1 : 0}</span> to <span className="text-slate-800">{Math.min(startIdx + ITEMS_PER_PAGE, filteredComplaints.length)}</span> of <span className="text-slate-800">{filteredComplaints.length}</span> complaints
          </p>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => {
                // Show a limited number of page buttons to avoid clutter
                if (
                  totalPages > 5 &&
                  index !== 0 &&
                  index !== totalPages - 1 &&
                  Math.abs(currentPage - 1 - index) > 1
                ) {
                  if (Math.abs(currentPage - 1 - index) === 2) {
                    return <span key={index} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }

                return (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? 'default' : 'ghost'}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === index + 1
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                      }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </motion.div>
      )}
      </div>
    </motion.div>
  );
}
