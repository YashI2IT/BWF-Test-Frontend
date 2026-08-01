/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/warden/Template/components/ui/dialog';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';
import api from '@/app/lib/api';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

interface Activity {
  id: string; // MongoDB _id
  title: string;
  description: string;
  requestedBy: string;
  requesterRole: 'student' | 'staff' | 'warden';
  dateTime: string;
  location: string;
  category: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  isPendingCollection?: boolean; // New flag to distinguish source
  allocatedHome?: string; // New field for Home allocation
}

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected'];
const CATEGORY_OPTIONS = ['All', 'Cultural', 'Sports', 'Technical', 'Academic', 'Social', 'Entertainment'];

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    requestedBy: '',
    requesterRole: 'Warden' as Activity['requesterRole'],
    dateTime: '',
    location: '',
    category: 'Social',
    allocatedHome: 'All Homes',
  });

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      // Fetch from the moderation (Pending/Rejected/Approved history) collection
      const response = await api.get('/warden/activities/pending');
      const normalizedData = response.data.map((item: any) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        requestedBy: item.requestedBy,
        requesterRole: item.requesterRole,
        dateTime: item.date,
        location: item.location,
        category: item.category,
        status: item.status,
        rejectionReason: item.rejectionReason,
        approvedBy: item.approvedBy?.name || item.approvedBy,
        rejectedBy: item.rejectedBy?.name || item.rejectedBy,
        isPendingCollection: true
      }));
      setActivities(normalizedData);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const matchesSearch = [activity.title, activity.description, activity.requestedBy, activity.location]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || activity.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || activity.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [activities, searchTerm, statusFilter, categoryFilter]
  );

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const openApprove = (activity: Activity) => {
    setSelectedActivity(activity);
    setApproveOpen(true);
  };

  const openReject = (activity: Activity) => {
    setSelectedActivity(activity);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedActivity) return;
    try {
      await api.put(`/warden/activities/${selectedActivity.id}/approve`);
      // After approval, the item moves from pending collection to live.
      // Refreshing is the safest way to sync IDs and collection flags.
      await fetchActivities();
      setApproveOpen(false);
    } catch (error) {
      console.error("Failed to approve activity:", error);
      alert("Failed to approve activity.");
    }
  };

  const confirmReject = async () => {
    if (!selectedActivity || !rejectReason.trim()) return;
    try {
      await api.put(`/warden/activities/${selectedActivity.id}/reject`, { reason: rejectReason });
      // Update local state to reflect rejection in the moderation collection
      setActivities((prev) => prev.map((item) =>
        item.id === selectedActivity.id
          ? { ...item, status: 'Rejected', rejectionReason: rejectReason }
          : item
      ));
      setRejectOpen(false);
      setRejectReason('');
    } catch (error) {
      console.error("Failed to reject activity:", error);
      alert("Failed to reject activity.");
    }
  };

  const confirmDelete = async () => {
    if (!selectedActivity) return;
    try {
      // Deleting from the Warden dashboard now only removes the moderation record.
      // The backend deleteActivity has been updated to target PendingActivity.
      await api.delete(`/warden/activities/${selectedActivity.id}`);
      setActivities((prev) => prev.filter((item) => item.id !== selectedActivity.id));
      setDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete activity record:", error);
      alert("Failed to delete activity record.");
    }
  };

  const openDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setDeleteOpen(true);
  };

  const openCreate = () => {
    setNewActivity({
      title: '',
      description: '',
      requestedBy: '',
      requesterRole: 'warden',
      dateTime: '',
      location: '',
      category: 'Social',
      allocatedHome: 'All Homes',
    });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!newActivity.title || !newActivity.dateTime || !newActivity.location) return;
    try {
      // For warden creation, we need the warden's profile ID.
      // But the backend testCreateActivity can take any profile ID.
      // We'll use the user's ID for now, as the warden profile is linked to it.
      // We'll get the warden profile first.
      const profileRes = await api.get('/warden/profile');
      const wardenId = profileRes.data._id;

      const response = await api.post(`/warden/activities/test/${wardenId}`, {
        title: newActivity.title,
        description: newActivity.description,
        category: newActivity.category,
        date: newActivity.dateTime,
        time: new Date(newActivity.dateTime).toTimeString().slice(0, 5),
        location: newActivity.location,
        allocatedHome: newActivity.allocatedHome
      });

      const item = response.data.activity;
      const normalizedItem: Activity = {
        id: item._id,
        title: item.title,
        description: item.description,
        requestedBy: item.requestedBy,
        requesterRole: item.requesterRole,
        dateTime: item.date,
        location: item.location,
        category: item.category,
        status: item.status,
        rejectionReason: item.rejectionReason,
        approvedBy: item.approvedBy?.name || item.approvedBy,
        rejectedBy: item.rejectedBy?.name || item.rejectedBy,
        isPendingCollection: true, // Test create always goes to pending
        allocatedHome: item.allocatedHome
      };

      setActivities((prev) => [normalizedItem, ...prev]);
      setCreateOpen(false);
    } catch (error) {
      console.error("Failed to create activity:", error);
      alert("Failed to create activity.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg opacity-70" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1 w-full rounded-2xl" />
          <Skeleton className="h-10 w-40 rounded-2xl" />
          <Skeleton className="h-10 w-40 rounded-2xl" />
        </div>

        {/* Table/List */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-slate-50 flex gap-4 items-center">
               <Skeleton className="h-10 w-10 rounded-full shrink-0" />
               <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
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
              Activity Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2 font-medium"
            >
              Oversee and manage student activities and approvals.
            </motion.p>
          </div>
          <Button onClick={openCreate} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> Create Activity
          </Button>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="rounded-4xl border border-slate-200/60 bg-white shadow-none overflow-hidden">
        <div className="lg:p-6 border-b border-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, organizer, or location..."
                className="pl-12 h-12 rounded-full border-slate-200 bg-slate-50 text-sm w-full focus-visible:ring-1 focus-visible:ring-slate-300"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 w-full lg:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-full border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">{option === 'All' ? 'All Status' : option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 rounded-full border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 focus:ring-1 focus:ring-slate-300"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">{option === 'All' ? 'All Categories' : option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="pt-2 pb-4 space-y-3 bg-slate-50/50">
          {isLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-col gap-3 min-w-0 w-full">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              No activities match your search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div key={activity.id} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">{activity.title}</h2>
                        <Badge className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${activity.status === 'Approved'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : activity.status === 'Rejected'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>{activity.status}</Badge>
                        <Badge className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[100px]">{activity.category}</Badge>
                        <Badge className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">{activity.requesterRole}</Badge>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600 break-words line-clamp-3 hover:line-clamp-none transition-all duration-300">
                        {activity.description}
                      </p>
                      {activity.rejectionReason && (
                        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 max-w-full overflow-hidden">
                          <p className="font-semibold text-slate-900 flex justify-between">
                            <span>Rejection reason</span>
                            {activity.rejectedBy && <span className="text-[10px] font-normal opacity-70">By: {activity.rejectedBy}</span>}
                          </p>
                          <p className="mt-1 text-slate-700 break-words">{activity.rejectionReason}</p>
                        </div>
                      )}
                      {activity.status === 'Approved' && activity.approvedBy && (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500 font-medium italic">
                          <span>Approved by {activity.approvedBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row items-center">
                      {activity.status === 'Pending' && activity.requesterRole?.toLowerCase() !== 'warden' && (
                        <>
                          <Button onClick={() => openApprove(activity)} size="sm" className="h-10 rounded-full bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700">Approve</Button>
                          <Button onClick={() => openReject(activity)} size="sm" variant="outline" className="h-10 rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-white">Reject</Button>
                        </>
                      )}
                      {(activity.status === 'Approved' || activity.status === 'Rejected') && (
                        <Button
                          onClick={() => openDelete(activity)}
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Requested By</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{activity.requestedBy}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Date & Time</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(activity.dateTime)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Location</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{activity.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredActivities.length > ITEMS_PER_PAGE && (
            <div className="p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {filteredActivities.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredActivities.length)} of {filteredActivities.length} activities
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </Button>
                <div className="text-xs font-semibold text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
      </motion.div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Confirm Approval</DialogTitle>
              <DialogDescription>Approve this activity request?</DialogDescription>
            </DialogHeader>
          </div>
          {selectedActivity && (
            <div className="p-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Title</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActivity.title}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Requested By</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActivity.requestedBy}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Date & Time</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedActivity.dateTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Location</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActivity.location}</p>
                </div>
                <div className="col-span-full">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Description</p>
                  <p className="mt-2 text-sm text-slate-600 break-words leading-relaxed">{selectedActivity.description}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-8 border-t border-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => setApproveOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold">Cancel</Button>
            <Button onClick={confirmApprove} className="rounded-full bg-green-600 hover:bg-green-700 text-white h-10 px-8 font-bold text-xs">Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-6 border-b border-slate-50">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">Reject Activity</DialogTitle>
              <DialogDescription className="text-sm">Provide a reason for rejecting this activity.</DialogDescription>
            </DialogHeader>
          </div>
          {selectedActivity && (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Title</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActivity.title}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Rejection Reason</p>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter a reason for rejection"
                  maxLength={200}
                  className="h-24 rounded-xl bg-slate-50 border-slate-200 text-sm resize-none break-all p-3"
                />
                <p className="mt-1 text-[10px] text-gray-500 text-right">{rejectReason.length}/200</p>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 border-t border-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold">Cancel</Button>
            <Button disabled={!rejectReason.trim()} onClick={confirmReject} className="rounded-full bg-red-600 hover:bg-red-700 text-white h-10 px-8 font-bold text-xs disabled:opacity-50">Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[min(100vw-1rem,24rem)] max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6 border-b border-slate-50">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">Create Activity</DialogTitle>
              <DialogDescription className="text-sm">Fill details and submit a new activity request.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Title</p>
              <Input value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} placeholder="Activity title" className="h-12 rounded-xl bg-slate-50 border-slate-200 text-sm" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Description</p>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="Activity details (optional)"
                maxLength={300}
                className="h-28 min-h-[7rem] max-h-40 w-full rounded-xl bg-slate-50 border-slate-200 text-sm resize-none whitespace-pre-wrap break-all overflow-y-auto leading-relaxed p-3"
              />
              <div className="flex justify-between mt-1">
                <p className="text-[11px] text-gray-500 italic">Optional • Max 300 chars.</p>
                <p className="text-[11px] text-gray-500">{newActivity.description.length}/300</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Date & Time</p>
                <Input type="datetime-local" value={newActivity.dateTime} onChange={(e) => setNewActivity({ ...newActivity, dateTime: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Location</p>
                <Input value={newActivity.location} onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })} placeholder="Activity location" className="h-12 rounded-xl bg-slate-50 border-slate-200 text-sm" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Category</p>
                <Select value={newActivity.category} onValueChange={(value) => setNewActivity({ ...newActivity, category: value })}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {CATEGORY_OPTIONS.filter((option) => option !== 'All').map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Allocated Home</p>
                <Select value={newActivity.allocatedHome} onValueChange={(value) => setNewActivity({ ...newActivity, allocatedHome: value })}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {['All Homes', 'Kupwara Home', 'Anantnag Home', 'Beerwah Home'].map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold">Cancel</Button>
            <Button onClick={submitCreate} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white h-10 px-8 font-bold text-xs shadow-md transition-all active:scale-95">Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-6 border-b border-slate-50">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight text-red-600">Delete Activity</DialogTitle>
              <DialogDescription className="text-sm">Are you sure you want to delete this activity? This action cannot be undone.</DialogDescription>
            </DialogHeader>
          </div>
          {selectedActivity && (
            <div className="p-6">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Activity Title</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedActivity.title}</p>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 border-t border-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold">Cancel</Button>
            <Button onClick={confirmDelete} className="rounded-full bg-red-600 hover:bg-red-700 text-white h-10 px-8 font-bold text-xs">Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
