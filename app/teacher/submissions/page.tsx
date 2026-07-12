/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { getAvatarUrl } from '@/app/lib/avatar';
import { CheckCircle2, Clock, Download, ChevronDown, Eye, X } from 'lucide-react';
import { toast } from '@/app/teacher/Template/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/teacher/Template/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/app/teacher/Template/components/ui/tabs';
import { getSubmissions, reviewSubmission } from '../service';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

interface Submission {
  _id: string;
  assignmentTitle: string;
  studentAuthId: string;
  studentName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  rejectionNote?: string;
  fileUrl?: string;
}

export default function SubmissionsPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load submissions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (filter === 'All') return submissions;
    return submissions.filter(sub => sub.status === filter);
  }, [filter, submissions]);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  
  const handleExpand = (sub: Submission) => {
    if (sub.status === 'not_submitted') return; // Do not expand if not submitted

    if (expandedId === sub._id) {
      setExpandedId(null);
    } else {
      setExpandedId(sub._id);
      setReviewStatus(sub.status === 'rejected' ? 'rejected' : 'approved');
      setFeedbackInput(sub.rejectionNote || '');
      setIsEditingReview(sub.status === 'pending');
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();

    if (reviewStatus === 'rejected' && !feedbackInput.trim()) {
      toast({ title: 'Validation Error', description: 'Feedback is required when rejecting an assignment.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await reviewSubmission(id, { status: reviewStatus, rejectionNote: feedbackInput.trim() });
      toast({ title: 'Success', description: 'Review saved successfully.' });
      setExpandedId(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to save review.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        
        {/* Minimalist Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
            >
              Submissions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2"
            >
              Review and grade student assignments.
            </motion.p>
          </div>

          {/* Clean Pill Filters */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full md:w-auto" suppressHydrationWarning>
            <TabsList className="bg-slate-100 border border-slate-200/60 rounded-full h-[42px] p-1 flex items-center">
              {['All', 'pending', 'approved', 'rejected'].map((f) => (
                <TabsTrigger 
                  key={f} 
                  value={f} 
                  className="relative rounded-full h-full px-6 text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300 capitalize"
                >
                  {filter === f && (
                    <motion.div
                      layoutId="submissions-filter-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">
                    {f === 'pending' ? `Pending (${pendingCount})` : f === 'approved' || f === 'rejected' ? f : `All (${submissions.length})`}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* List Content */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                {[1, 2, 3, 4, 5].map((i, idx) => (
                  <div key={i} className={`flex items-center justify-between p-5 ${idx !== 4 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-100 rounded-md w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-slate-50 rounded-md w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 pl-4 hidden sm:flex">
                      <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                      <div className="w-9 h-9 bg-slate-100 rounded-xl animate-pulse"></div>
                      <div className="w-6 h-6 bg-slate-50 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredSubmissions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1">You&apos;re all caught up!</h3>
                <p className="text-[14px] text-slate-500">No {filter !== 'All' ? filter.toLowerCase() : ''} submissions found.</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col"
              >
                <AnimatePresence>
                  {filteredSubmissions.map((sub, idx) => {
                    const isExpanded = expandedId === sub._id;
                    const isLast = idx === filteredSubmissions.length - 1;

                    return (
                      <motion.div
                        key={sub._id}
                        layout
                        variants={itemVariants}
                        className={`group relative flex flex-col ${!isLast ? 'border-b border-slate-100' : ''}`}
                      >
                        {/* Minimal Row */}
                        <div 
                          onClick={() => handleExpand(sub)}
                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 gap-3 sm:gap-0 transition-colors ${sub.status !== 'not_submitted' ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
                        >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-slate-100">
                                <img src={getAvatarUrl(sub.studentName || 'Student')} alt={sub.studentName} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight">{sub.assignmentTitle}</h3>
                                <div className="flex items-center gap-2 mt-0.5 text-[12.5px] sm:text-[13px]">
                                  <span className="font-semibold text-slate-600">{sub.studentName}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-6 shrink-0 pl-[52px] sm:pl-4">
                              {/* Status Badge */}
                              <div className={`flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-2.5 sm:px-3 py-1 rounded-full capitalize ${
                                sub.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                                sub.status === 'approved' ? 'text-emerald-600 bg-emerald-50' :
                                sub.status === 'rejected' ? 'text-rose-600 bg-rose-50' :
                                'text-slate-600 bg-slate-100'
                              }`}>
                                {sub.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                                {sub.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>{sub.status.replace('_', ' ')}</span>
                              </div>

                              {/* File Actions */}
                              {sub.fileUrl && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setSelectedPdfUrl(sub.fileUrl || null);
                                      setSelectedPdfTitle(sub.assignmentTitle);
                                    }}
                                    className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                    title="View PDF"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); window.open(sub.fileUrl, '_blank'); }}
                                    className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                    title="Download PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}

                            {/* Expand Icon */}
                            {sub.status !== 'not_submitted' && (
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-transform duration-300 ${isExpanded ? 'bg-slate-100 rotate-180' : 'text-slate-300 group-hover:text-slate-600'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable Grade Form */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden bg-slate-50/50"
                            >
                              <div className="p-6 pt-2 border-t border-slate-100/50">
                                {isEditingReview ? (
                                  <form onSubmit={(e) => handleGradeSubmit(e, sub._id)} className="max-w-2xl">
                                    <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
                                      <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Review Decision</label>
                                        <Select 
                                          value={reviewStatus}
                                          onValueChange={(value) => setReviewStatus(value as 'approved' | 'rejected')}
                                        >
                                          <SelectTrigger className="w-full h-[42px] rounded-[16px] border border-gray-200 bg-white focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 font-medium text-[14px] text-slate-800 transition-colors px-4 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                                            <SelectValue placeholder="Select Decision" />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                                            <SelectItem value="approved" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">Approve</SelectItem>
                                            <SelectItem value="rejected" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">Reject</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Feedback</label>
                                        <textarea 
                                          className="flex min-h-[80px] w-full rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 transition-colors resize-none placeholder:text-slate-400 text-slate-700 font-medium leading-relaxed"
                                          placeholder="Provide constructive feedback..."
                                          value={feedbackInput}
                                          onChange={(e) => setFeedbackInput(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-4">
                                      {sub.status !== 'pending' ? (
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          onClick={() => setIsEditingReview(false)}
                                          className="h-8 px-4 rounded-full text-[12px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                          Cancel Edit
                                        </Button>
                                      ) : (
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          onClick={() => setExpandedId(null)}
                                          className="h-8 px-4 rounded-full text-[12px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                          Cancel
                                        </Button>
                                      )}
                                      <Button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="h-8 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold shadow-sm transition-all"
                                      >
                                        {isSubmitting ? 'Saving...' : 'Save Review'}
                                      </Button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="max-w-2xl">
                                    <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
                                      <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Review Decision</label>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold capitalize ${
                                          sub.status === 'approved' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                                        }`}>
                                          {sub.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : null}
                                          {sub.status}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Feedback</label>
                                        <div className="min-h-[80px] w-full rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-[14px] text-slate-700 font-medium leading-relaxed shadow-sm">
                                          {sub.rejectionNote || <span className="text-slate-400 italic">No feedback provided.</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsEditingReview(true)}
                                        className="h-8 px-5 rounded-full text-[12px] font-bold shadow-sm transition-all"
                                      >
                                        Edit Review
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      
      {/* PDF Viewer Modal */}
      <Dialog open={!!selectedPdfUrl} onOpenChange={(open) => !open && setSelectedPdfUrl(null)}>
        <DialogContent className="max-w-5xl sm:max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-4 border-b border-slate-100 bg-white z-10 shrink-0 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-[16px] font-bold text-slate-800">{selectedPdfTitle}</DialogTitle>
            <button 
              onClick={() => setSelectedPdfUrl(null)}
              className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>
          <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
            {selectedPdfUrl && (
              <iframe 
                src={selectedPdfUrl} 
                className="w-full h-full border-0 absolute inset-0"
                title="PDF Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
