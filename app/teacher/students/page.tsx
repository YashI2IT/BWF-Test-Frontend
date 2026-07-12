/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  GraduationCap,
  CalendarClock,
  UserCheck,
  MessageSquareText,
  BookOpen,
  HeartPulse,
  Send,
  ChevronRight,
  Calendar as CalendarIcon,
  Paperclip,
  FileText,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent } from '@/app/teacher/Template/components/ui/card'
import { Input } from '@/app/teacher/Template/components/ui/input'
import { Button } from '@/app/teacher/Template/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/teacher/Template/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from "@/app/teacher/Template/components/ui/popover"
import { Calendar } from "@/app/teacher/Template/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/app/teacher/Template/lib/utils"
import { getAvatarUrl } from '@/app/lib/avatar'
import {
  getTeacherDashboard,
  getStudentOverview,
  addAssignment,
  addSchedule,
  assignMentor,
  pushMentorNote,
} from '../service'
import type { TeacherDashboardResponse, StudentOverview } from '../types'
import { MOCK_TEACHER_DASHBOARD, getMockOverview } from '../dashboard/teacherDashboardMock'

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

export default function TeacherStudentsPage() {
  const [data, setData] = useState<TeacherDashboardResponse | null>(null)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [overview, setOverview] = useState<StudentOverview | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subject: "", dueDate: "", priority: "medium" })
  const [scheduleForm, setScheduleForm] = useState({ title: "", sessionType: "class", date: "", startTime: "", joinLink: "" })
  const [noteMessage, setNoteMessage] = useState("")
  const [mentorName, setMentorName] = useState("Teacher")

  useEffect(() => {
    async function loadData() {
      try {
        const dashboard = await getTeacherDashboard()
        setData(dashboard)
      } catch (err) {
        setData(MOCK_TEACHER_DASHBOARD)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedStudent) {
      setOverview(null)
      return
    }
    setOverview(null) // Clear previous student's data to show skeleton
    getStudentOverview(selectedStudent)
      .then(res => setOverview(res))
      .catch(() => setOverview(getMockOverview(selectedStudent)))
  }, [selectedStudent])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  const handleAssignmentCreate = async () => {
    if (!selectedStudent) return showMessage("Select a student first", "error")
    if (!assignmentForm.title.trim()) return showMessage("Assignment title is required", "error")
    if (!assignmentForm.subject.trim()) return showMessage("Subject is required", "error")
    if (!assignmentForm.dueDate) return showMessage("Due date is required", "error")

    try {
      setIsSaving(true)
      
      const payload = new FormData()
      payload.append('title', assignmentForm.title.trim())
      payload.append('subject', assignmentForm.subject.trim())
      payload.append('dueDate', assignmentForm.dueDate)
      payload.append('priority', assignmentForm.priority)
      
      if (attachedFile) {
        payload.append('file', attachedFile)
      }

      await addAssignment(selectedStudent, payload)
      showMessage("Assignment issued successfully.", "success")
      setAssignmentForm({ title: "", subject: "", dueDate: "", priority: "medium" })
      setAttachedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      setOverview(await getStudentOverview(selectedStudent))
    } catch {
      showMessage("Could not add assignment.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSchedulePush = async () => {
    if (!selectedStudent) return showMessage("Select a student first", "error")
    if (!scheduleForm.title.trim()) return showMessage("Session title is required", "error")
    if (!scheduleForm.sessionType.trim()) return showMessage("Session type is required", "error")
    if (!scheduleForm.date) return showMessage("Date is required", "error")

    try {
      setIsSaving(true)
      await addSchedule(selectedStudent, {
        ...scheduleForm,
        title: scheduleForm.title.trim(),
        sessionType: scheduleForm.sessionType.trim()
      })
      showMessage("Academic schedule pushed.", "success")
      setScheduleForm({ title: "", sessionType: "class", date: "", startTime: "", joinLink: "" })
    } catch {
      showMessage("Could not push schedule.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMentorNote = async () => {
    if (!selectedStudent) return showMessage("Select a student first", "error")
    if (!noteMessage.trim()) return showMessage("Mentorship note cannot be empty", "error")

    try {
      setIsSaving(true)
      await assignMentor(selectedStudent, mentorName)
      await pushMentorNote(selectedStudent, noteMessage.trim(), mentorName)
      setNoteMessage("")
      showMessage("Mentorship and note updated.", "success")
    } catch {
      showMessage("Could not push mentorship note.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="flex-1 bg-[#F4F5F7] relative font-sans flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
          >
            Students & Mentorship
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2"
          >
            Manage assignments, schedules, and monitor academic progress for your students.
          </motion.p>
          
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? <UserCheck className="w-4 h-4" /> : <HeartPulse className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array(8).fill(0).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="bg-white rounded-[28px] p-6 shadow-sm flex flex-col justify-between border border-transparent animate-pulse h-[160px]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
                  </div>
                  <div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded-md mb-3"></div>
                    <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : data.students.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <div className="bg-white rounded-[32px] p-12 shadow-sm text-center col-span-full">
                <p className="text-slate-500 font-medium text-[15px]">No students found.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {data.students.map((student, idx) => (
                  <motion.div 
                    key={student._id} 
                    layout
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    onClick={() => setSelectedStudent(student.auth_id)}
                    className="bg-white rounded-[28px] p-6 shadow-sm flex flex-col justify-between border border-slate-200/50 hover:shadow-lg transition-shadow duration-300 h-[160px] cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src={getAvatarUrl(student.name)} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[17px] tracking-tight truncate">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[13px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full truncate">
                          {student.auth_id}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </div>

      {/* Student Details Panel */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent("")}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 sm:top-[80px]"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed right-0 top-0 sm:top-[80px] bottom-0 w-full sm:max-w-2xl bg-[#F4F5F7] border-l border-slate-200/60 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.08)] z-50 flex flex-col overflow-hidden"
            >
            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-8 pb-8 pt-6 sm:pt-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img src={getAvatarUrl(data?.students.find(s => s.auth_id === selectedStudent)?.name || "Student")} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                      {data?.students.find(s => s.auth_id === selectedStudent)?.name}
                    </h2>
                    <p className="text-sm font-bold text-slate-500">{selectedStudent}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent("")} 
                  className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-200/50 hover:bg-slate-200/80 p-2 rounded-full shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px]" />
                </button>
              </div>
                
                <div className="space-y-6">
                  {/* Performance Overview ReadOnly */}
                  {overview ? (
                    <Card className="rounded-[32px] border-0 bg-white shadow-sm overflow-hidden">
                      <div className="p-6 pb-4 border-b border-slate-100">
                        <h3 className="text-[17px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          Progress Overview
                        </h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Assignments */}
                          <div className="bg-blue-50/30 p-5 rounded-[24px] border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><BookOpen className="w-4 h-4" /></div>
                              <p className="text-[15px] font-bold text-blue-900">Assignments</p>
                            </div>
                            <div className="space-y-3">
                              {overview.assignments.slice(0, 3).map(a => (
                                <div key={a._id} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                  <p className="font-bold text-slate-800 text-[13px]">{a.title}</p>
                                  <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">Due: {a.dueDate}</p>
                                </div>
                              ))}
                              {overview.assignments.length === 0 && <p className="text-sm text-slate-500 italic">No recent assignments.</p>}
                            </div>
                          </div>
                          
                          {/* Moods */}
                          <div className="bg-pink-50/30 p-5 rounded-[24px] border border-pink-100/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-pink-100 text-pink-600 rounded-xl"><HeartPulse className="w-4 h-4" /></div>
                              <p className="text-[15px] font-bold text-pink-900">Recent Moods</p>
                            </div>
                            <div className="space-y-3">
                              {overview.moods.slice(0, 3).map(m => (
                                <div key={m._id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                  <p className="font-bold text-slate-800 capitalize text-[13px]">{m.mood}</p>
                                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{m.date}</p>
                                </div>
                              ))}
                              {overview.moods.length === 0 && <p className="text-sm text-slate-500 italic">No mood check-ins.</p>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-[32px] border-0 bg-white shadow-sm overflow-hidden animate-pulse">
                      <div className="p-6 pb-4 border-b border-slate-100">
                        <div className="h-6 bg-slate-200/60 rounded-md w-40"></div>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 h-[140px]">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-slate-200/60 rounded-xl"></div>
                              <div className="h-4 bg-slate-200/60 rounded w-24"></div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-10 bg-slate-200/40 rounded-xl w-full"></div>
                            </div>
                          </div>
                          <div className="bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 h-[140px]">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-slate-200/60 rounded-xl"></div>
                              <div className="h-4 bg-slate-200/60 rounded w-24"></div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-10 bg-slate-200/40 rounded-xl w-full"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Forms Grid */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Assignment Form */}
                    <Card className="rounded-[28px] border-0 bg-white shadow-sm overflow-hidden">
                      <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-500" /> Issue Assignment
                        </h3>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Title</label>
                          <Input placeholder="e.g. Math Quiz" value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} className="h-[42px] rounded-[16px] border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 shadow-sm px-4 placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
                          <Input placeholder="e.g. Math" value={assignmentForm.subject} onChange={e => setAssignmentForm({ ...assignmentForm, subject: e.target.value })} className="h-[42px] rounded-[16px] border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 shadow-sm px-4 placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Due Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-[42px] rounded-[16px] justify-start text-left font-medium border-gray-200 bg-white transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black shadow-sm px-4",
                                  !assignmentForm.dueDate && "text-gray-400 font-normal"
                                )}
                              >
                                <CalendarIcon className="mr-3 h-[18px] w-[18px] text-slate-400 shrink-0" />
                                {assignmentForm.dueDate ? (
                                  <span>{format(new Date(assignmentForm.dueDate + 'T12:00:00Z'), "PPP")}</span>
                                ) : (
                                  <span>Pick a due date...</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-xl" align="start">
                              <Calendar
                                mode="single"
                                selected={assignmentForm.dueDate ? new Date(assignmentForm.dueDate + 'T12:00:00Z') : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setAssignmentForm({...assignmentForm, dueDate: format(date, 'yyyy-MM-dd')});
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
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[16px] border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 text-[13px] font-bold text-slate-600 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" /> Attach File (Image / PDF)
                          </button>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedFile(file);
                              const isPdf = file.type === 'application/pdf';
                              setFilePreview({
                                url: URL.createObjectURL(file),
                                type: isPdf ? 'pdf' : 'image'
                              });
                            }
                          }}
                        />

                        {filePreview && (
                          <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 flex items-center justify-center min-h-[100px] p-2">
                            {filePreview.type === 'image' ? (
                              <img src={filePreview.url} alt="Preview" className="w-full h-auto object-contain max-h-40 rounded-lg" />
                            ) : (
                              <embed src={`${filePreview.url}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-40 rounded-lg" />
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
                        <Button className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] shadow-sm transition-all mt-2" onClick={handleAssignmentCreate} disabled={isSaving}>
                          <Send className="w-4 h-4 mr-2" /> Assign Task
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Schedule Form */}
                    <Card className="rounded-[28px] border-0 bg-white shadow-sm overflow-hidden">
                      <div className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/30">
                        <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                          <CalendarClock className="w-5 h-5 text-emerald-500" /> Push Schedule
                        </h3>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Session Title</label>
                          <Input placeholder="e.g. Review" value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} className="h-[42px] rounded-[16px] border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 shadow-sm px-4 placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Session Type</label>
                          <Input placeholder="class / workshop" value={scheduleForm.sessionType} onChange={e => setScheduleForm({ ...scheduleForm, sessionType: e.target.value })} className="h-[42px] rounded-[16px] border-gray-200 bg-white font-medium text-[14px] focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 shadow-sm px-4 placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-[42px] rounded-[16px] justify-start text-left font-medium border-gray-200 bg-white transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black shadow-sm px-4",
                                  !scheduleForm.date && "text-gray-400 font-normal"
                                )}
                              >
                                <CalendarIcon className="mr-3 h-[18px] w-[18px] text-slate-400 shrink-0" />
                                {scheduleForm.date ? (
                                  <span>{format(new Date(scheduleForm.date + 'T12:00:00Z'), "PPP")}</span>
                                ) : (
                                  <span>Pick a date...</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-xl" align="start">
                              <Calendar
                                mode="single"
                                selected={scheduleForm.date ? new Date(scheduleForm.date + 'T12:00:00Z') : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setScheduleForm({...scheduleForm, date: format(date, 'yyyy-MM-dd')});
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Button className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] shadow-sm transition-all mt-2" onClick={handleSchedulePush} disabled={isSaving}>
                          <Send className="w-4 h-4 mr-2" /> Push Session
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mentor Note */}
                    <Card className="sm:col-span-2 rounded-[28px] border-0 bg-white shadow-sm overflow-hidden">
                      <div className="p-6 pb-4 border-b border-slate-100 bg-pink-50/30">
                        <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-pink-500" /> Mentorship & Feedback
                        </h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">Mentorship Note</label>
                            <textarea
                              className="rounded-[16px] bg-white border border-gray-200 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black hover:border-gray-300 transition-colors shadow-sm text-[14px] p-3 font-medium placeholder:text-slate-400 min-h-[120px] resize-none w-full"
                              placeholder="Write an encouraging note or specific feedback..."
                              value={noteMessage}
                              onChange={e => setNoteMessage(e.target.value)}
                            />
                          </div>
                          <Button className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] shadow-sm transition-all mt-2" onClick={handleMentorNote} disabled={isSaving}>
                            <MessageSquareText className="w-4 h-4 mr-2" /> Send Note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
