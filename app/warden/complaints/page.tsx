'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, AlertCircle, Plus, CheckCircle2, ArrowUp, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/warden/Template/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/warden/Template/components/ui/alert-dialog';
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
      return 'bg-destructive/10 text-destructive border border-destructive/20';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    case 'Low':
      return 'bg-green-50 text-green-700 border border-green-100';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return 'bg-green-50 text-green-700 border border-green-100';
    case 'OPEN':
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    case 'ESCALATED':
      return 'bg-red-50 text-red-700 border border-red-100';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};

const getRoleColor = (role: ReporterRole) => {
  return role === 'Teacher'
    ? 'bg-slate-100 text-slate-700 border border-slate-200'
    : 'bg-sky-50 text-sky-700 border border-sky-100';
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

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/warden/complaints');
      
      const normalizedData = res.data.map((item: any) => {
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
          reporter: item.reporter,
          role: item.role as ReporterRole,
          dateTime: dateTime,
          location: item.location,
          priority: item.priority,
          status: item.status,
          timeline: {
            reported: item.timeline?.reportedDate || item.date,
            resolved: item.timeline?.resolvedDate,
            resolvedReason: item.timeline?.resolvedReason,
            escalated: item.timeline?.escalatedDate,
            escalatedReason: item.timeline?.escalatedReason,
          }
        };
      });

      setData(normalizedData);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/warden/complaints/history');
      
      const normalizedData = res.data.map((item: any) => {
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
          reporter: item.reporter,
          role: item.role as ReporterRole,
          dateTime: dateTime,
          location: item.location,
          priority: item.priority,
          status: item.status,
          timeline: {
            reported: item.timeline?.reportedDate || item.date,
            resolved: item.timeline?.resolvedDate,
            resolvedReason: item.timeline?.resolvedReason,
            escalated: item.timeline?.escalatedDate,
            escalatedReason: item.timeline?.escalatedReason,
          }
        };
      });

      setHistoryData(normalizedData);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const matchesRole = roleFilter === 'All' || complaint.role === roleFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesRole;
    });
  }, [activeSource, searchTerm, statusFilter, priorityFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedComplaints = filteredComplaints.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const resolveComplaint = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      const res = await api.put(`/warden/complaints/${id}/approve`, { reason });
      const updatedItem = res.data;
      
      setData((prev) =>
        prev.map((complaint) =>
          complaint.id === id
            ? {
                ...complaint,
                status: 'RESOLVED',
                timeline: {
                  ...complaint.timeline,
                  resolved: updatedItem.timeline.resolvedDate,
                  resolvedReason: updatedItem.timeline.resolvedReason,
                },
              }
            : complaint
        )
      );
    } catch (error) {
      console.error("Failed to resolve complaint:", error);
      alert("Failed to resolve complaint. Please try again.");
    }
  };

  const escalateComplaint = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    try {
      const res = await api.put(`/warden/complaints/${id}/reject`, { reason });
      const updatedItem = res.data;

      setData((prev) =>
        prev.map((complaint) =>
          complaint.id === id
            ? {
                ...complaint,
                status: 'ESCALATED',
                timeline: {
                  ...complaint.timeline,
                  escalated: updatedItem.timeline.escalatedDate,
                  escalatedReason: updatedItem.timeline.escalatedReason,
                },
              }
            : complaint
        )
      );
    } catch (error) {
      console.error("Failed to escalate complaint:", error);
      alert("Failed to escalate complaint. Please try again.");
    }
  };

  const deleteComplaint = async (id: string) => {
    try {
      if (viewMode === 'active') {
        await api.delete(`/warden/complaints/${id}`);
        setData((prev) => prev.filter((complaint) => complaint.id !== id));
      } else {
        await api.delete(`/warden/complaints/history/${id}`);
        setHistoryData((prev) => prev.filter((complaint) => complaint.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      alert("Failed to delete complaint record. Please try again.");
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Warden Complaints</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <span>Home</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-500 font-semibold">Complaints</span>
            </div>
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
              <TabsList className="bg-slate-100 rounded-2xl h-10 p-1">
                <TabsTrigger value="active" className="rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Active List</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Full History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <Card className="rounded-4xl border border-slate-200/60 bg-white shadow-none overflow-hidden">
        <div className="lg:p-6 border-b border-slate-100">
          <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr] xl:items-end">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints by title, reporter, or location"
                className="pl-12 h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Status</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Priority</p>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Role</p>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                    <SelectValue placeholder="Reporter" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="pt-4 pb-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              No complaints match your search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedComplaints.map((complaint) => (
                <div key={complaint.id} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold text-slate-900 truncate">{complaint.title}</h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                            <span className={`rounded-full px-3 py-1 ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
                            <span className={`rounded-full px-3 py-1 ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span>
                            <span className={`rounded-full px-3 py-1 ${getRoleColor(complaint.role)}`}>{complaint.role}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-2">{complaint.description}</p>
                    </div>

                    <div className="flex gap-2">
                      {complaint.status === 'OPEN' ? (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="h-8 rounded-lg bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700">Resolve</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Resolve Complaint?</AlertDialogTitle>
                                <AlertDialogDescription>Provide resolution details for this complaint.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <Textarea
                                placeholder="How was this resolved?"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                className="h-24 mt-4"
                              />
                              <div className="mt-4 flex gap-3 justify-end">
                                <AlertDialogCancel onClick={() => setResolutionNote('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-green-600 hover:bg-green-700"
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="h-8 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700">Escalate</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Escalate Complaint?</AlertDialogTitle>
                                <AlertDialogDescription>Provide escalation details for this complaint.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <Textarea
                                placeholder="Why is this being escalated?"
                                value={escalateReason}
                                onChange={(e) => setEscalateReason(e.target.value)}
                                className="h-24 mt-4"
                              />
                              <div className="mt-4 flex gap-3 justify-end">
                                <AlertDialogCancel onClick={() => setEscalateReason('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
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
                        <div className="flex gap-2 items-center">
                          <div className="rounded-3xl bg-slate-50 px-4 py-2 text-slate-600 text-sm">
                            {complaint.status === 'RESOLVED' ? 'Resolved' : 'Escalated'}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 px-3 text-xs font-bold">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone. This will permanently remove the complaint record.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="mt-4 flex gap-3 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => deleteComplaint(complaint.id)}
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reported By</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.reporter}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(complaint.dateTime)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Time</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatTime(complaint.dateTime)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Location</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.location}</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-3">Timeline</p>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Reported</p>
                          <p>{formatDate(complaint.timeline.reported)} • {formatTime(complaint.timeline.reported)}</p>
                        </div>
                      </div>
                      {complaint.timeline.resolved && (
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                          <div>
                            <p className="font-semibold text-slate-900">Resolved</p>
                            <p>{formatDate(complaint.timeline.resolved)} • {formatTime(complaint.timeline.resolved)}</p>
                            {complaint.timeline.resolvedReason && (
                              <p className="text-xs text-slate-600 mt-1">{complaint.timeline.resolvedReason}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {complaint.timeline.escalated && (
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
                          <div>
                            <p className="font-semibold text-slate-900">Escalated</p>
                            <p>{formatDate(complaint.timeline.escalated)} • {formatTime(complaint.timeline.escalated)}</p>
                            {complaint.timeline.escalatedReason && (
                              <p className="text-xs text-slate-600 mt-1">{complaint.timeline.escalatedReason}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredComplaints.length > ITEMS_PER_PAGE && (
        <div className="p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-t border-slate-100 bg-white rounded-b-4xl">
          <p className="text-xs text-slate-500">
            Showing {filteredComplaints.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredComplaints.length)} of {filteredComplaints.length} complaints
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded-lg hover:bg-slate-100"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
