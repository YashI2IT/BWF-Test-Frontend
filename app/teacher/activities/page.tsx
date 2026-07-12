/* eslint-disable @next/next/no-img-element */

'use client'
import React, { useState, useEffect } from 'react';

import { Button } from '@/app/teacher/Template/components/ui/button';
import { Input } from '@/app/teacher/Template/components/ui/input';
import { Textarea } from '@/app/teacher/Template/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/app/teacher/Template/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/teacher/Template/components/ui/popover";
import { toast } from '@/app/teacher/Template/components/ui/use-toast';
import { cn } from "@/app/teacher/Template/lib/utils";
import { format } from "date-fns";
import api from '@/app/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/teacher/Template/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/teacher/Template/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/teacher/Template/components/ui/dialog';
import { MoreVertical, Edit2, Trash2, Loader2, Paperclip, FileText, X, ExternalLink } from 'lucide-react';
import { getStudents } from '../service';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRef } from 'react';

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

import { getAvatarUrl } from '@/app/lib/avatar';

interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  status: string;
  fileUrl?: string;
  fileType?: string;
}

interface Student {
  auth_id: string;
  name: string;
}

export default function ActivitiesPage() {
  const [data, setData] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', assignedTo: '' });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preview State
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; type: 'image' | 'pdf', title: string } | null>(null);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', dueDate: '', assignedTo: '' });
  const [editAttachedFile, setEditAttachedFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    try {
      const [tasksRes, studentsRes] = await Promise.all([
        api.get('/teacher/tasks'),
        getStudents()
      ]);
      setData(tasksRes.data);
      setStudents(studentsRes);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load custom tasks.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate || !formData.assignedTo) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('dueDate', formData.dueDate);
      payload.append('assignedTo', formData.assignedTo);
      
      if (attachedFile) {
        payload.append('file', attachedFile);
      }

      await api.post('/teacher/tasks', payload);
      
      setFormData({ title: '', description: '', dueDate: '', assignedTo: '' });
      setAttachedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      toast({ title: 'Success', description: 'Task successfully assigned.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to assign task.', variant: 'destructive' });
    }
  };

  const verifyTask = async (taskId: string) => {
    setData(prev => prev.map(t => t._id === taskId ? { ...t, status: 'verified' } : t));
    try {
      await api.put(`/teacher/tasks/${taskId}/verify`);
      toast({ title: 'Verified', description: 'Task successfully verified.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to verify task.', variant: 'destructive' });
      loadData();
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo
    });
    setEditAttachedFile(null);
    if (task.fileUrl) {
      const isPdf = task.fileUrl.toLowerCase().endsWith('.pdf') || task.fileType?.includes('pdf');
      const type = isPdf ? 'pdf' : 'image';
      setEditFilePreview({ url: task.fileUrl, type });
    } else {
      setEditFilePreview(null);
    }
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editFormData.title.trim() || !editFormData.description.trim() || !editFormData.dueDate || !editFormData.assignedTo) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    
    setUpdating(true);
    try {
      const payload = new FormData();
      payload.append('title', editFormData.title);
      payload.append('description', editFormData.description);
      payload.append('dueDate', editFormData.dueDate);
      payload.append('assignedTo', editFormData.assignedTo);
      
      if (editAttachedFile) {
        payload.append('file', editAttachedFile);
      }

      await api.put(`/teacher/tasks/${editingTask._id}`, payload);
      setEditOpen(false);
      setEditingTask(null);
      setEditAttachedFile(null);
      setEditFilePreview(null);
      toast({ title: 'Success', description: 'Task updated successfully.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update task.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (taskId: string) => {
    setDeletingTaskId(taskId);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    setDeleting(true);
    try {
      await api.delete(`/teacher/tasks/${deletingTaskId}`);
      setDeleteOpen(false);
      setDeletingTaskId('');
      toast({ title: 'Success', description: 'Task deleted successfully.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="flex-1 bg-[#F4F5F7] min-h-screen font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
          >
            Custom Tasks
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2"
          >
            Assign specific extra-curricular tasks and verify completion.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column - Assign Form */}
          <div className="lg:col-span-4 lg:sticky lg:top-[104px] lg:self-start lg:max-h-[calc(100vh-128px)] flex flex-col min-h-0">
            <div className="bg-white rounded-3xl flex flex-col flex-1 min-h-0 animate-fade-in shadow-sm overflow-hidden">
              <div className="p-8 pb-6 border-b border-slate-100 shrink-0">
                <h2 className="text-xl md:text-2xl font-bold text-black mb-2">
                  Assign Task
                </h2>
                <p className="text-sm text-gray-500">
                  Complete the details below to assign a new task.
                </p>
              </div>
              
              <motion.form 
                onSubmit={handleSubmit} 
                className="flex flex-col flex-1 min-h-0"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <div className="flex-1 p-8 pt-6 space-y-5 overflow-y-auto scrollable-hide min-h-0">
                <motion.div variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Student</label>
                  <Select value={formData.assignedTo} onValueChange={value => setFormData({...formData, assignedTo: value})}>
                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-white focus:ring-1 focus:ring-black focus:border-black text-gray-900 font-medium w-full transition-colors hover:border-gray-300 px-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {formData.assignedTo ? (
                           (() => {
                             const selectedS = students.find(s => s.auth_id === formData.assignedTo);
                             if (selectedS) {
                               return (
                                 <>
                                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                    <img src={getAvatarUrl(selectedS.name)} alt="avatar" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[14px] font-medium text-gray-900 leading-tight">{selectedS.name}</span>
                                 </>
                               )
                             }
                             return <SelectValue placeholder="Select a student" />
                           })()
                        ) : (
                          <span className="text-[14px] font-normal text-gray-400">Select a student</span>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent side="bottom" className="rounded-2xl border-gray-100 shadow-xl max-h-[250px]">
                      {students.map(s => (
                        <SelectItem key={s.auth_id} value={s.auth_id} className="cursor-pointer transition-all duration-200 focus:bg-gray-50 focus:text-slate-900 py-3 px-2 rounded-xl my-1 mx-1">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                              <img src={getAvatarUrl(s.name)} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-semibold text-gray-900 leading-tight">{s.name}</span>
                              <span className="text-[13px] font-medium text-gray-500 leading-tight mt-1">{s.auth_id}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Task title</label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    className="h-12 rounded-2xl border-gray-200 bg-white focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black text-gray-900 font-medium transition-colors hover:border-gray-300"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    required 
                    className="min-h-[100px] rounded-2xl border-gray-200 bg-white focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black text-gray-900 font-medium transition-colors hover:border-gray-300 resize-none py-3"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Due date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 rounded-2xl border-gray-200 bg-white justify-start text-left font-medium transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900 focus:ring-1 focus:ring-black focus:border-black px-4",
                          !formData.dueDate && "text-gray-400 font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-[18px] w-[18px] text-gray-400 shrink-0" />
                        {formData.dueDate ? (
                          <span className="text-gray-900 text-[15px]">{format(new Date(formData.dueDate + 'T12:00:00Z'), "PPP")}</span>
                        ) : (
                          <span className="text-[15px]">Pick a due date...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate ? new Date(formData.dueDate + 'T12:00:00Z') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({...formData, dueDate: format(date, 'yyyy-MM-dd')});
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100/50 text-[13px] font-bold text-gray-600 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" /> Attach File (Image / PDF)
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachedFile(file);
                        const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
                        setFilePreview({
                          url: URL.createObjectURL(file),
                          type: isPdf ? 'pdf' : 'image'
                        });
                      }
                    }}
                  />

                  {filePreview && (
                    <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50/50 flex items-center justify-center min-h-[100px] p-2">
                      {filePreview.type === 'image' ? (
                        <img src={filePreview.url} alt="Preview" className="w-full h-auto object-contain max-h-[400px] rounded-lg bg-white" />
                      ) : (
                        <embed src={`${filePreview.url}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-[400px] rounded-lg bg-white" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFilePreview(null);
                          setAttachedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>

                </div>
                <div className="p-8 pt-4 border-t border-slate-100 shrink-0 bg-white relative z-10">
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] transition-colors shadow-sm">
                      Assign task
                    </Button>
                  </motion.div>
                </div>
              </motion.form>
            </div>
          </div>

          {/* Right Column - Task List */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-pulse">
                      <div className="w-full">
                        <div className="h-5 bg-slate-200 rounded-md w-1/3 mb-3"></div>
                        <div className="h-4 bg-slate-100 rounded-md w-2/3 mb-4"></div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                          <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
                        </div>
                      </div>
                      <div className="h-9 w-24 bg-slate-200 rounded-full shrink-0"></div>
                    </div>
                  ))}
                </motion.div>
              ) : data.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="bg-white rounded-[32px] p-12 shadow-sm text-center">
                    <p className="text-slate-500 font-medium text-[15px]">No tasks assigned yet.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-5"
                >
                  <AnimatePresence>
                    {data.map((task) => {
                      const studentObj = students.find(s => s.auth_id === task.assignedTo);
                      const studentName = studentObj?.name || task.assignedTo;
                      return (
                      <motion.div 
                        key={task._id} 
                        layout
                        variants={itemVariants}
                        whileHover={{ scale: 1.01, translateY: -2 }}
                        className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 border border-slate-200/50 hover:shadow-lg transition-shadow duration-300 relative"
                      >
                        <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img src={getAvatarUrl(studentName)} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="pr-24 sm:pr-0">
                              <h3 className="font-bold text-slate-900 text-[16px] sm:text-[17px] tracking-tight">{task.title}</h3>
                            </div>
                            <p className="text-[13.5px] sm:text-[14px] text-slate-500 mt-1 font-medium">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                              <span className="text-[11.5px] sm:text-[12px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full truncate max-w-[120px]" title={studentName}>
                                {studentName}
                              </span>
                              <span className="text-[12.5px] sm:text-[13px] font-medium text-slate-400">
                                Due: {task.dueDate}
                              </span>
                              {task.fileUrl && (
                                <button
                                  type="button" 
                                  onClick={() => setPreviewAttachment({ 
                                    url: task.fileUrl!, 
                                    type: (task.fileUrl!.toLowerCase().endsWith('.pdf') || task.fileType?.includes('pdf')) ? 'pdf' : 'image',
                                    title: task.title
                                  })}
                                  className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1 rounded-full transition-colors"
                                >
                                  <Paperclip className="w-3.5 h-3.5" /> Attachment
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-4 right-3 sm:static flex items-center gap-2 sm:gap-3">
                          {task.status === 'verified' ? (
                            <div className="px-2.5 py-1 sm:px-3 sm:py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] sm:text-[12px] font-bold rounded-full text-center">
                              Verified
                            </div>
                          ) : task.status === 'completed' ? (
                            <Button onClick={() => verifyTask(task._id)} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11.5px] sm:text-[13px] px-3 sm:px-4 h-7 sm:h-8 shadow-sm">
                              Verify
                            </Button>
                          ) : (
                            <div className="px-2.5 py-1 sm:px-3 sm:py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] sm:text-[12px] font-bold rounded-full text-center">
                              Pending
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 border border-transparent hover:border-slate-200">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl">
                              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] gap-2 py-2.5 focus:bg-slate-100 focus:text-slate-900" onClick={() => openEditModal(task)}>
                                <Edit2 className="h-4 w-4 text-slate-500" /> Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] gap-2 py-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => openDeleteModal(task._id)}>
                                <Trash2 className="h-4 w-4" /> Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    )})}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-[32px] w-[95vw] sm:max-w-[500px] p-0 border-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900">Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col overflow-hidden flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Student</label>
              <Select value={editFormData.assignedTo} onValueChange={v => setEditFormData({...editFormData, assignedTo: v})}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white font-medium text-[14px] focus:ring-1 focus:ring-black focus:border-black transition-colors hover:border-gray-300">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent side="bottom" className="rounded-2xl border-gray-100 shadow-xl max-h-[250px]">
                  {students.map(s => (
                    <SelectItem key={s.auth_id} value={s.auth_id} className="cursor-pointer py-3 rounded-xl my-1 mx-1 focus:bg-gray-50 focus:text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-semibold text-gray-900">{s.name}</span>
                        <span className="text-[12px] font-medium text-gray-500">({s.auth_id})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Task title</label>
              <Input 
                value={editFormData.title} 
                onChange={e => setEditFormData({...editFormData, title: e.target.value})} 
                required 
                className="h-11 rounded-xl border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <Textarea
                value={editFormData.description} 
                onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                required 
                className="min-h-[90px] rounded-xl border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 resize-none py-3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Due date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 rounded-xl border-gray-200 bg-white justify-start text-left font-medium text-[14px] focus:ring-1 focus:ring-black focus:border-black transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900 px-4",
                      !editFormData.dueDate && "text-gray-400 font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-gray-400 shrink-0" />
                    {editFormData.dueDate ? (
                      <span className="text-gray-900 text-[15px]">{format(new Date(editFormData.dueDate + 'T12:00:00Z'), "PPP")}</span>
                    ) : (
                      <span className="text-[15px]">Pick a due date...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={editFormData.dueDate ? new Date(editFormData.dueDate + 'T12:00:00Z') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setEditFormData({...editFormData, dueDate: format(date, 'yyyy-MM-dd')});
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100/50 text-[13px] font-bold text-gray-600 transition-colors"
              >
                <Paperclip className="w-4 h-4" /> {editFilePreview ? 'Change Attached File' : 'Attach File (Image / PDF)'}
              </button>
              <input
                type="file"
                ref={editFileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditAttachedFile(file);
                    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
                    setEditFilePreview({
                      url: URL.createObjectURL(file),
                      type: isPdf ? 'pdf' : 'image'
                    });
                  }
                }}
              />

              {/* Compact file preview — no inline PDF embed */}
              {editFilePreview && (
                <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {editAttachedFile ? editAttachedFile.name : editFilePreview.type === 'pdf' ? 'Attached PDF' : 'Attached Image'}
                      </p>
                      <p className="text-[12px] text-slate-400 font-medium">
                        {editFilePreview.type === 'pdf' ? 'PDF Document' : 'Image'}
                        {editAttachedFile && ` · ${(editAttachedFile.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={editFilePreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
                      title="Open file"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEditFilePreview(null);
                        setEditAttachedFile(null);
                        if (editFileInputRef.current) editFileInputRef.current.value = '';
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white flex gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="rounded-full h-10 font-bold hover:bg-slate-100 text-slate-600 px-5 text-[14px]" type="button">Cancel</Button>
              <Button 
                type="submit"
                className="rounded-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-sm disabled:opacity-50 text-[14px]" 
                disabled={updating || !editFormData.title.trim() || !editFormData.description.trim() || !editFormData.dueDate || !editFormData.assignedTo}
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-rose-600">Delete Task?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2 font-medium">
              This action cannot be undone. This will permanently remove the task from the student's dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3">
            <AlertDialogCancel className="rounded-xl font-bold hover:bg-slate-100 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fullscreen Attachment Preview Lightbox */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setPreviewAttachment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col relative"
              style={{ maxHeight: 'calc(100vh - 64px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-none">{previewAttachment.title}</h3>
                    <p className="text-[13px] text-slate-500 mt-1">Attachment Preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              {previewAttachment.type === 'pdf' ? (
                <div className="flex-1 flex flex-col overflow-hidden min-h-[600px] bg-[#525659]">
                  <iframe 
                    src={`${previewAttachment.url}#toolbar=0`} 
                    className="w-full flex-1 border-none min-h-full"
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-slate-50/50 p-6 flex items-center justify-center min-h-[400px]">
                  <img 
                    src={previewAttachment.url} 
                    alt="Preview" 
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-sm border border-slate-200 bg-white"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
