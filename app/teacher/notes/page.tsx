/* eslint-disable @next/next/no-img-element */

'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/teacher/Template/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Textarea } from '@/app/teacher/Template/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/teacher/Template/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/teacher/Template/components/ui/alert-dialog';
import { getMentorNotes, getStudents, getTeacherProfile } from '../service';
import api from '@/app/lib/api';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PenLine, Quote, Loader2, BookOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/app/teacher/Template/components/ui/use-toast';
import { getAvatarUrl } from '@/app/lib/avatar';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

interface Student {
  auth_id: string;
  name: string;
}

interface Note {
  _id: string;
  auth_id: string;
  message: string;
  mentorName: string;
  createdAt: string;
  studentInfo?: {
    name: string;
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentorName, setMentorName] = useState('Mentor');

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notesRes, studentsRes, profileRes] = await Promise.all([
        getMentorNotes(),
        getStudents(),
        getTeacherProfile()
      ]);
      setNotes(notesRes);
      setStudents(studentsRes);
      if (profileRes?.name) setMentorName(profileRes.name);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load notes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !message.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/teacher/students/${selectedStudent}/mentor-note`, {
        message,
        mentorName
      });
      setOpen(false);
      setMessage('');
      setSelectedStudent('');
      toast({ title: 'Success', description: 'Mentor note added successfully.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setEditMessage(note.message);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingNote || !editMessage.trim()) return;
    setUpdating(true);
    try {
      await api.put(`/teacher/mentor-notes/${editingNote._id}`, { message: editMessage });
      setEditOpen(false);
      setEditingNote(null);
      setEditMessage('');
      toast({ title: 'Success', description: 'Mentor note updated successfully.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update note.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (noteId: string) => {
    setDeletingNoteId(noteId);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingNoteId) return;
    setDeleting(true);
    try {
      await api.delete(`/teacher/mentor-notes/${deletingNoteId}`);
      setDeleteOpen(false);
      setDeletingNoteId('');
      toast({ title: 'Success', description: 'Mentor note deleted.' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
            >
              Mentor Notes
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2"
            >
              Private observations and mentorship tracking.
            </motion.p>
          </div>
          
          <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
              setTimeout(() => {
                setMessage('');
                setSelectedStudent('');
              }, 200);
            }
          }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm px-5 h-9 font-bold text-[13px] transition-all duration-300 flex items-center gap-2 group">
                  <PenLine className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Write Note
                </Button>
              </DialogTrigger>
            </motion.div>
            <DialogContent className="rounded-[32px] w-[95vw] sm:max-w-[500px] p-6 sm:p-8 bg-white border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900">Write a Note</DialogTitle>
                <p className="text-[15px] text-slate-500 mt-1 font-medium">Record a private observation for a student.</p>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Student</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-full h-[42px] rounded-[16px] border border-gray-200 bg-white hover:border-gray-300 transition-colors font-medium text-[14px] focus:ring-1 focus:ring-black focus:border-black px-4 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="rounded-2xl border border-slate-100 shadow-xl max-h-[300px] p-2 bg-white">
                      {students.map(s => (
                        <SelectItem key={s.auth_id} value={s.auth_id} className="rounded-xl cursor-pointer py-3 px-3 text-[14px] font-medium transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900">
                          <span className="text-slate-900">{s.name}</span> <span className="text-slate-400 font-normal ml-2">({s.auth_id})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Observation Details</label>
                  <Textarea 
                    placeholder="Write your private observation here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[160px] rounded-[16px] resize-none border border-gray-200 bg-white hover:border-gray-300 transition-colors p-4 font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black leading-relaxed placeholder:text-slate-400 text-slate-900"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 sm:space-x-3 flex flex-col sm:flex-row gap-3 sm:gap-0">
                <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full h-10 w-full sm:w-auto px-6 font-semibold text-[14px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">Cancel</Button>
                <Button 
                  className="rounded-full h-10 w-full sm:w-auto px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[14px] shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100 transition-all active:scale-95" 
                  onClick={handleSubmit} 
                  disabled={submitting || !selectedStudent || !message.trim()}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {Array(4).fill(0).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="bg-white rounded-[28px] p-7 shadow-sm border border-transparent animate-pulse flex flex-col justify-between h-[200px]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                    <div className="h-3 w-4/5 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : notes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-200/50"
            >
              <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Mentor Notes Yet</h3>
              <p className="text-slate-500 font-medium max-w-sm">You haven&apos;t recorded any private observations yet. Click "Write Note" to begin tracking.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <AnimatePresence>
                {notes.map(note => {
                  const studentName = note.studentInfo?.name || note.auth_id;
                  return (
                    <motion.div 
                      key={note._id} 
                      layout
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, translateY: -2 }}
                      className="group bg-white rounded-[28px] p-7 shadow-sm border border-slate-200/50 hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0">
                              <img src={getAvatarUrl(studentName)} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-[18px] tracking-tight truncate max-w-[150px] sm:max-w-[250px]">
                                {studentName}
                              </h3>
                              <span className="text-[12px] font-bold text-slate-400 tracking-wide uppercase mt-1 block">
                                {note.auth_id}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 hidden sm:inline-block">
                              {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl">
                                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] gap-2 py-2.5 focus:bg-slate-100 focus:text-slate-900" onClick={() => openEditModal(note)}>
                                  <Edit2 className="h-4 w-4 text-slate-500" /> Edit Note
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] gap-2 py-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => openDeleteModal(note._id)}>
                                  <Trash2 className="h-4 w-4" /> Delete Note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="relative pl-6">
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 sm:hidden block w-fit mb-3">
                            {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <Quote className="absolute left-0 top-0.5 w-4 h-4 text-slate-200 fill-slate-100" />
                          <p className="text-slate-600 text-[15px] leading-relaxed font-medium italic break-words">
                            "{note.message}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                        <p className="text-[13px] font-bold text-slate-500 flex items-center gap-2">
                          <span className="w-4 h-px bg-slate-300"></span>
                          {note.mentorName}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-[32px] w-[95vw] sm:max-w-[500px] p-6 sm:p-8 bg-white border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900">Edit Note</DialogTitle>
            <p className="text-[15px] text-slate-500 mt-1 font-medium">Update your private observation.</p>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Student</label>
              <div className="w-full h-[42px] rounded-[16px] border border-gray-200 bg-gray-50 flex items-center px-4 font-medium text-[14px] text-slate-500">
                {editingNote?.studentInfo?.name || editingNote?.auth_id} 
                <span className="text-slate-400 font-normal ml-2">({editingNote?.auth_id})</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Observation Details</label>
              <Textarea 
                placeholder="Write your private observation here..."
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="min-h-[160px] rounded-[16px] resize-none border border-gray-200 bg-white hover:border-gray-300 transition-colors p-4 font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black leading-relaxed placeholder:text-slate-400 text-slate-900"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 sm:space-x-3 flex flex-col sm:flex-row gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="rounded-full h-10 w-full sm:w-auto px-6 font-semibold text-[14px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">Cancel</Button>
            <Button 
              className="rounded-full h-10 w-full sm:w-auto px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[14px] shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100 transition-all active:scale-95" 
              onClick={handleUpdate} 
              disabled={updating || !editMessage.trim() || editMessage === editingNote?.message}
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-rose-600">Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2 font-medium">
              This action cannot be undone. This will permanently remove the mentor note from the student's record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3">
            <AlertDialogCancel className="rounded-xl font-bold hover:bg-slate-100 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}
