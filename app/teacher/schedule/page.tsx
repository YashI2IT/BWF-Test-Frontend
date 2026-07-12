/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useEffect } from 'react';
import { Card } from '@/app/teacher/Template/components/ui/card';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { Badge } from '@/app/teacher/Template/components/ui/badge';
import { ScrollArea } from '@/app/teacher/Template/components/ui/scroll-area';
import { Input } from '@/app/teacher/Template/components/ui/input';
import { Textarea } from '@/app/teacher/Template/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/teacher/Template/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import {
  Share,
  Maximize2,
  MoreHorizontal,
  X,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  Info,
  FileText,
  Star,
  Sun,
  Image as ImageIcon,
  Eye,
  Download
} from 'lucide-react';
import api from '@/app/lib/api';
import { toast } from '@/app/teacher/Template/components/ui/use-toast';
import { format, startOfWeek, addDays, isSameDay, parseISO, isSameWeek, getDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/teacher/Template/components/ui/popover';
import { Calendar } from '@/app/teacher/Template/components/ui/calendar';
import { cn } from '@/app/teacher/Template/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface ScheduleAttachment {
  name: string;
  url: string;
  type: string;
}

interface ScheduleComment {
  user: string;
  name: string;
  avatar: string;
  text: string;
  createdAt: string;
}

interface ScheduleItem {
  _id: string;
  title: string;
  type: 'in_person' | 'online';
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  joinLink: string;
  attachments?: ScheduleAttachment[];
  comments?: ScheduleComment[];
}

const CustomTimePicker = ({ value, onChange, placeholder = "Select time" }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value ? value.split(':') : ['', ''];

  const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-[42px] rounded-[16px] justify-start text-left font-medium border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/80 transition-all shadow-sm px-4",
            !value && "text-slate-400"
          )}
        >
          <Clock className="mr-2.5 h-[16px] w-[16px] text-slate-500" />
          {value ? (
            <span>
              {(() => {
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                return `${displayHour.toString().padStart(2, '0')}:${m} ${ampm}`;
              })()}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 rounded-[24px] border-slate-200 shadow-xl bg-white z-[100] overflow-hidden" align="start">
        <div className="flex gap-4 h-[240px]">
          <div className="flex flex-col gap-2 w-[64px]">
            <span className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">Hours</span>
            <div className="h-[210px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-1">
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => onChange(`${hour}:${m || '00'}`)}
                    className={cn(
                      "py-2 rounded-xl text-[14px] font-bold transition-all text-center",
                      h === hour ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="w-[1px] bg-slate-100 my-2"></div>
          <div className="flex flex-col gap-2 w-[64px]">
            <span className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">Mins</span>
            <div className="h-[210px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-1">
                {minutes.map(minute => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => onChange(`${h || '09'}:${minute}`)}
                    className={cn(
                      "py-2 rounded-xl text-[14px] font-bold transition-all text-center",
                      m === minute ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // PDF/Image Viewer State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'in_person',
    date: new Date(),
    startTime: '',
    endTime: '',
    description: '',
    joinLink: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const newPreviews: { [key: string]: string } = {};
    attachments.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        newPreviews[file.name] = filePreviews[file.name] || URL.createObjectURL(file);
      }
    });
    setFilePreviews(newPreviews);
  }, [attachments]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(new Date());

  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday

  useEffect(() => {
    fetchSchedules();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/teacher/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/teacher/schedule');
      setSchedules(res.data);
    } catch (error) {
      console.error('Error fetching schedules', error);
      toast({ title: 'Error fetching schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.startTime || !formData.endTime) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (formData.type === 'online' && !formData.joinLink.trim()) {
      toast({ title: 'Please provide a meeting link for online classes', variant: 'destructive' });
      return;
    }

    if (timeToMinutes(formData.startTime) >= timeToMinutes(formData.endTime)) {
      toast({ title: 'End time must be after start time', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('type', formData.type);
      payload.append('date', format(formData.date, 'yyyy-MM-dd'));
      payload.append('startTime', formData.startTime);
      payload.append('endTime', formData.endTime);
      if (formData.description) payload.append('description', formData.description);
      if (formData.type === 'online' && formData.joinLink) payload.append('joinLink', formData.joinLink);
      
      attachments.forEach(file => {
        payload.append('attachments', file);
      });
      
      const res = await api.post('/teacher/schedule', payload);
      
      setSchedules([...schedules, res.data]);
      setIsAddOpen(false);
      setFormData({
        title: '',
        type: 'in_person',
        date: new Date(),
        startTime: '',
        endTime: '',
        description: '',
        joinLink: ''
      });
      setAttachments([]);
      toast({ title: 'Schedule added successfully' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to add schedule', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await api.delete(`/teacher/schedule/${id}`);
      setSchedules(schedules.filter(s => s._id !== id));
      if (selectedEventId === id) setSelectedEventId(null);
      toast({ title: 'Schedule deleted' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to delete schedule', variant: 'destructive' });
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedEventId) return;
    
    setIsPostingComment(true);
    try {
      const res = await api.post(`/teacher/schedule/${selectedEventId}/comments`, { text: newComment });
      // The API returns the updated schedule, so we update it in the state
      setSchedules(schedules.map(s => s._id === selectedEventId ? res.data : s));
      setNewComment('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleShare = async () => {
    if (!selectedEventId || !selectedEvent) return;
    
    const shareTitle = `Class Schedule: ${selectedEvent.title}`;
    const shareText = `Join me for ${selectedEvent.title} on ${format(parseISO(selectedEvent.date), 'MMM d, yyyy')} from ${selectedEvent.startTime} to ${selectedEvent.endTime}.${selectedEvent.type === 'online' && selectedEvent.joinLink ? `\\nMeeting Link: ${selectedEvent.joinLink}` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        toast({ title: 'Shared successfully!' });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareText);
      toast({ title: 'Class details copied to clipboard!' });
    }
  };

  const selectedEvent = schedules.find(s => s._id === selectedEventId);

  // Determine if we should shift the 5-day view based on the current day
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });
  let startOffset = 0;
  if (isCurrentWeek) {
    const todayIndex = getDay(new Date()); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (todayIndex === 6) startOffset = 1; // Tue - Sat
    else if (todayIndex === 0) startOffset = 2; // Wed - Sun
  }

  // Generate 5 Week Days dynamically based on the current date
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i + startOffset));

  const nextWeek = () => {
    const newStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(newStart);
    setSelectedMobileDay(addDays(newStart, 0));
  };
  const prevWeek = () => {
    const newStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(newStart);
    setSelectedMobileDay(addDays(newStart, 0));
  };
  const todayWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedMobileDay(new Date());
  };

  // Calendar Constants & Helpers
  const CALENDAR_START_HOUR = 8; // 8 AM
  const CALENDAR_END_HOUR = 19; // 7 PM
  const HOUR_HEIGHT = 90; // px per hour

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const getEventStyle = (startTime: string, endTime: string) => {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const startOffset = Math.max(0, startMins - (CALENDAR_START_HOUR * 60));
    const duration = Math.max(15, endMins - startMins); // Min height of 15 mins
    
    return {
      top: `${(startOffset / 60) * HOUR_HEIGHT}px`,
      height: `${(duration / 60) * HOUR_HEIGHT}px`,
    };
  };

  const hoursList = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }).map((_, i) => CALENDAR_START_HOUR + i);

  const EventCard = ({ event }: { event: ScheduleItem }) => {
    const style = getEventStyle(event.startTime, event.endTime);
    const isSelected = selectedEventId === event._id;
    const isOnline = event.type === 'online';
    
    // Theme colors matching the image
    const themeBg = isOnline ? 'bg-[#F4F7FE]' : 'bg-[#F0FAF5]';
    const themeBorder = isOnline ? 'border-[#E2E8F0]' : 'border-[#D1F4E0]';
    const themeDot = isOnline ? 'bg-[#5A67D8]' : 'bg-[#059669]';
    const themeText = isOnline ? 'text-[#1E1B4B]' : 'text-[#064E3B]';
    const themeTimeBg = isOnline ? 'bg-[#E4ECFA] text-[#4F46E5]' : 'bg-[#D1F4E0] text-[#059669]';

    return (
      <div 
        onClick={() => setSelectedEventId(event._id)}
        style={style}
        className={`absolute inset-x-2 p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col ${themeBg} ${themeBorder} ${isSelected ? 'shadow-md z-30 scale-[1.02] ring-2 ring-indigo-500/20' : 'shadow-sm z-10 hover:z-20 hover:shadow-md'}`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${themeDot}`} />
          <h3 className={`font-bold text-[13px] truncate ${themeText}`}>{event.title}</h3>
        </div>

        <div className="mt-auto">
          <div className={`inline-flex px-2.5 py-1 rounded-xl text-[10.5px] font-bold ${isSelected ? 'bg-slate-900 text-white shadow-sm' : themeTimeBg}`}>
            {event.startTime} - {event.endTime}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 bg-[#F4F5F7] h-screen p-4 md:p-6 lg:p-8 font-sans flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-sm relative">
      {/* LEFT COLUMN: Timetable */}
      <div className="w-full flex flex-col border-r border-slate-100 bg-white">
        <div className={`p-4 md:p-6 lg:p-8 pb-4 flex flex-col gap-3 ${!selectedEventId ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {/* Title row */}
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900"
            >
              Class Timetable
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[14px] md:text-[15px] text-slate-500 mt-1"
            >
              Manage your weekly subject and class schedules.
            </motion.p>
          </div>
          {/* Controls row - nav left, add button right, fully fits on mobile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-slate-100/50 rounded-full p-1 border border-slate-200/60 shrink-0">
              <button 
                onClick={prevWeek} 
                className="px-3 py-1.5 rounded-full text-slate-500 font-semibold text-[13px] hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={todayWeek} 
                className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-bold text-[13px] shadow-sm border border-slate-200/50 transition-all"
              >
                Today
              </button>
              <button 
                onClick={nextWeek} 
                className="px-3 py-1.5 rounded-full text-slate-500 font-semibold text-[13px] hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
              >
                Next
              </button>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 md:px-5 h-[36px] shadow-sm shadow-slate-200 text-[13px] font-bold transition-all shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> Add Schedule
            </Button>
          </div>
        </div>


        {/* ===================== MOBILE VIEW ===================== */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden">
          {/* Mobile Day Selector Strip */}
          <div className="px-4 pt-2 pb-3 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedMobileDay);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMobileDay(day)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : isToday
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{format(day, 'EEE')}</span>
                  <span className="text-[18px] font-black leading-none">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Day Events List */}
          <ScrollArea className="flex-1 px-4 pb-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="mob-skeleton" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-[80px] bg-slate-100 rounded-2xl" />
                  ))}
                </motion.div>
              ) : (() => {
                const dateStr = format(selectedMobileDay, 'yyyy-MM-dd');
                const dayEvents = schedules.filter(s => s.date === dateStr);
                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex flex-col gap-3 mt-2"
                  >
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                      {format(selectedMobileDay, 'EEEE, MMMM d')}
                    </p>
                    {dayEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                          <CalendarDays className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-slate-400 font-semibold text-[14px]">No classes scheduled</p>
                      </div>
                    ) : (
                      dayEvents
                        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                        .map(event => {
                          const isOnline = event.type === 'online';
                          const isSelected = selectedEventId === event._id;
                          return (
                            <motion.div
                              key={event._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => setSelectedEventId(event._id)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                  : isOnline
                                  ? 'bg-[#F4F7FE] border-[#E2E8F0]'
                                  : 'bg-[#F0FAF5] border-[#D1F4E0]'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-white/20' : isOnline ? 'bg-[#E4ECFA]' : 'bg-[#D1F4E0]'
                              }`}>
                                {isOnline
                                  ? <Video className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#4F46E5]'}`} />
                                  : <MapPin className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#059669]'}`} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-[14px] truncate ${isSelected ? 'text-white' : isOnline ? 'text-[#1E1B4B]' : 'text-[#064E3B]'}`}>
                                  {event.title}
                                </h3>
                                <p className={`text-[12px] font-semibold mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                                  {event.startTime} – {event.endTime}
                                </p>
                              </div>
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : isOnline ? 'bg-[#E4ECFA] text-[#4F46E5]' : 'bg-[#D1F4E0] text-[#059669]'
                              }`}>
                                {isOnline ? 'Online' : 'In-Person'}
                              </span>
                            </motion.div>
                          );
                        })
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </ScrollArea>
        </div>

        {/* ===================== DESKTOP VIEW ===================== */}
        <ScrollArea className={`hidden md:flex flex-1 px-4 md:px-6 lg:px-8 ${!selectedEventId ? 'max-w-7xl mx-auto w-full' : ''}`}>
          <div className="overflow-x-auto w-full pb-4">
            <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="skeleton"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              className="animate-pulse flex bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 min-w-[800px] h-[700px]"
            >
              {/* Skeleton Time Labels */}
              <div className="w-[70px] flex-shrink-0 border-r border-slate-200 bg-white">
                <div className="h-[100px] border-b border-slate-200" />
                <div className="flex flex-col gap-[75px] pt-10 items-center">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-8 h-2.5 bg-slate-200 rounded-full" />
                  ))}
                </div>
              </div>
              {/* Skeleton Days Columns */}
              <div className="flex-1 flex">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="flex-1 border-r border-slate-200 last:border-r-0 flex flex-col">
                    <div className="h-[100px] border-b border-slate-200 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-2 bg-slate-200 rounded-full" />
                      <div className="w-6 h-6 bg-slate-200 rounded-md" />
                      <div className="w-12 h-2 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex-1 p-3 relative">
                      {idx === 1 && <div className="absolute top-20 inset-x-2 h-24 bg-slate-100 border border-slate-200 rounded-xl" />}
                      {idx === 3 && <div className="absolute top-40 inset-x-2 h-32 bg-slate-100 border border-slate-200 rounded-xl" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="calendar"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="flex bg-white mb-8 min-w-max mt-4"
            >
              {/* Time Labels Column */}
              <motion.div variants={itemVariants} className="w-[60px] flex-shrink-0 bg-white z-20 relative sticky left-0 pr-4">
                <div className="h-[80px]" /> {/* Header Spacer */}
                <div className="relative" style={{ height: `${(CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT}px` }}>
                  {hoursList.map(hour => (
                    <div 
                      key={hour} 
                      className="absolute w-full flex justify-end -mt-2.5"
                      style={{ top: `${(hour - CALENDAR_START_HOUR) * HOUR_HEIGHT}px` }}
                    >
                      <span className="text-[11px] font-bold text-slate-400">
                        {hour === 0 || hour === 24 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Days Columns */}
              <div className="flex-1 relative flex gap-3 pr-6">
                {weekDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = schedules.filter(s => s.date === dateStr);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <motion.div variants={itemVariants} key={idx} className={`flex-1 border border-slate-100 rounded-[20px] overflow-hidden min-w-[140px] flex flex-col ${isToday ? 'bg-indigo-50/20' : 'bg-white'}`}>
                      {/* Day Header */}
                      <div className={`h-[80px] flex flex-col items-center justify-center ${isToday ? 'bg-indigo-50' : 'bg-slate-50/50'}`}>
                        <span className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {format(day, 'EEE')}
                        </span>
                        <span className={`text-[20px] font-black leading-none ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      {/* Day Content Area */}
                      <div className="relative flex-1 bg-white" style={{ height: `${(CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT}px` }}>
                        {/* Internal Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none">
                          {hoursList.map(hour => (
                            <div 
                              key={hour} 
                              className="absolute w-full border-t border-slate-100"
                              style={{ top: `${(hour - CALENDAR_START_HOUR) * HOUR_HEIGHT}px` }}
                            />
                          ))}
                        </div>
                        {dayEvents.map(event => <EventCard key={event._id} event={event} />)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: Details */}
      <AnimatePresence>
        {selectedEventId && selectedEvent && (
          <motion.div 
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className={isExpanded ? "absolute inset-0 z-50 flex flex-col bg-slate-50 rounded-[32px]" : "absolute right-0 top-0 bottom-0 w-full md:w-[420px] flex flex-col bg-white/95 backdrop-blur-xl shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.08)] border-l border-slate-200/60 z-40"}
          >
            <ScrollArea className="flex-1">
            <div className="p-5 md:p-8 max-w-2xl mx-auto w-full">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-5 text-slate-500">
                    <button onClick={handleShare} className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                      <Share className="w-[18px] h-[18px] stroke-[2px]" />
                      <span className="text-[14px] font-semibold">Share</span>
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                      <Maximize2 className="w-[18px] h-[18px] stroke-[2px]" />
                      <span className="text-[14px] font-semibold">{isExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                    <button className="hover:text-rose-600 transition-colors" onClick={() => handleDelete(selectedEvent._id)}>
                      <Trash2 className="w-[18px] h-[18px] stroke-[2px]" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedEventId(null);
                      setIsExpanded(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100/70 p-2 rounded-full"
                  >
                    <X className="w-[18px] h-[18px] stroke-[2px]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-slate-500 mb-3 font-semibold text-[13px]">
                  <CalendarDays className="w-4 h-4" />
                  <span>Class Schedule</span>
                </div>

                <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-extrabold text-slate-900 mb-6 leading-[1.15] tracking-tight pr-8">
                  {selectedEvent.title}
                </h1>

                <div className="flex items-center gap-3 mb-8">
                  <Badge className={`rounded-full px-3.5 py-1.5 font-bold shadow-none text-[13px] ${selectedEvent.type === 'online' ? 'bg-indigo-50 text-indigo-700 border-none' : 'bg-[#E5F7ED] text-[#128854] border-none'}`}>
                    {selectedEvent.type === 'online' ? 'Online Class' : 'In Person'}
                  </Badge>
                  <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full text-[13px] font-semibold shadow-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{format(parseISO(selectedEvent.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl mb-10 bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-blue-50/80 border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-[#111] text-white w-[42px] h-[42px] flex items-center justify-center rounded-[12px] shadow-md">
                      <Clock className="w-5 h-5 stroke-[2px]" />
                    </div>
                    <span className="font-semibold text-[#2C334A] text-[15px]">Class Timing</span>
                  </div>
                  <div className="flex items-center gap-2 relative z-10 group">
                    <span className="font-bold text-slate-900 text-[18px] tracking-tight">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                    <div className="relative">
                      <Info className="w-4 h-4 text-slate-400 cursor-help" />
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-2 w-max px-3 py-2 bg-slate-800 text-white text-[12px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700/50">
                      <div className="flex flex-col text-right gap-0.5">
                        <span className="font-semibold text-slate-200">Duration Info</span>
                        <span className="text-slate-400 mt-0.5">Times are shown in your</span>
                        <span className="text-slate-400">local browser timezone.</span>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-1 right-2.5 w-2 h-2 bg-slate-800 rotate-45 border-l border-t border-slate-700/50" />
                    </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-10">
                  <h3 className="font-bold text-slate-900 text-[15px] mb-3">Description</h3>
                  <div className="text-slate-500 text-[14.5px] leading-[1.7] whitespace-pre-wrap">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-bold text-slate-900 text-[16px] mb-4">Attachments</h3>
                  <div className="flex flex-col gap-3">
                    {selectedEvent.attachments.map((file, idx) => {
                      let Icon = FileText;
                      let bgClass = "bg-rose-50";
                      let iconColorClass = "text-rose-500";
                      
                      if (file.name.toLowerCase().endsWith('.pdf')) {
                        Icon = Star;
                        bgClass = "bg-purple-100";
                        iconColorClass = "text-purple-700";
                      } else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
                        Icon = Sun;
                        bgClass = "bg-rose-100";
                        iconColorClass = "text-rose-700";
                      } else if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i)) {
                        Icon = ImageIcon;
                        bgClass = "bg-emerald-100";
                        iconColorClass = "text-emerald-700";
                      }
                      
                      return (
                          <div key={idx} className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className={`w-[46px] h-[46px] shrink-0 rounded-[14px] flex items-center justify-center ${bgClass}`}>
                                <Icon className={`w-5 h-5 fill-current ${iconColorClass}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-[14.5px] truncate" title={file.name}>{file.name}</div>
                                <div className="flex items-center gap-1 text-slate-400 text-[12px] mt-0.5 font-medium">
                                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{format(new Date(), "MMM dd, yyyy")}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPdfUrl(file.url);
                                  setSelectedPdfTitle(file.name);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[13px] rounded-lg transition-colors border border-slate-200/60"
                              >
                                <Eye className="w-4 h-4 stroke-[2px]" /> View
                              </button>
                              <a href={file.url} download className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-lg transition-colors">
                                <Download className="w-4 h-4 stroke-[2px]" /> <span className="hidden sm:inline">Download</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
  
                {selectedEvent.type === 'online' && selectedEvent.joinLink && (
                  <div className="mb-10">
                    <h3 className="font-bold text-slate-900 text-[15px] mb-3">Meeting Link</h3>
                    <a 
                      href={selectedEvent.joinLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-indigo-100 text-indigo-600 w-[42px] h-[42px] shrink-0 flex items-center justify-center rounded-[12px]">
                          <Video className="w-5 h-5 stroke-[2px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-indigo-900 text-[14.5px] truncate">Join Online Class</div>
                          <div className="text-indigo-600 text-[13px] truncate mt-0.5">{selectedEvent.joinLink}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 shrink-0 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    </a>
                  </div>
                )}

              {/* Tabs for Comments / Updates */}
              <div className="mt-8">
                <div className="flex items-center gap-6 border-b border-slate-200 mb-6 relative">
                  <button 
                    className={`pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'comments' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setActiveTab('comments')}
                  >
                    Comments
                    {activeTab === 'comments' && (
                      <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-t-full" />
                    )}
                  </button>
                  <button 
                    className={`pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'updates' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setActiveTab('updates')}
                  >
                    Updates
                    {activeTab === 'updates' && (
                      <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-t-full" />
                    )}
                  </button>
                </div>

                {activeTab === 'comments' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 flex flex-col gap-5 mb-6">
                      {selectedEvent.comments && selectedEvent.comments.map((comment, idx) => {
                        const isTeacher = comment.name === 'Teacher';
                        
                        if (isTeacher && isProfileLoading) {
                          return (
                            <div key={idx} className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
                              <div className="flex-1 mt-0.5">
                                <div className="flex items-baseline gap-2 mb-2">
                                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                                  <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
                                </div>
                                <div className="h-3.5 w-3/4 bg-slate-100 animate-pulse rounded" />
                              </div>
                            </div>
                          );
                        }

                        const displayName = isTeacher ? (profile?.name || 'Yash Borade') : comment.name;
                        const avatarImg = isTeacher 
                          ? (profile?.profilePic || 'https://i.pravatar.cc/150?img=11')
                          : (comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.name)}&background=f3f4f6&color=4b5563`);
                        
                        return (
                          <div key={idx} className="flex gap-3">
                            <img 
                              src={avatarImg} 
                              alt={displayName} 
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-100" 
                            />
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-900 text-[14.5px]">{displayName}</span>
                                <span className="text-slate-400 text-[12px] font-medium">{format(new Date(comment.createdAt), "HH:mm a")}</span>
                              </div>
                              <p className="text-slate-600 text-[14px] mt-1 leading-[1.6]">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedEvent.comments || selectedEvent.comments.length === 0) && (
                        <div className="text-slate-400 text-sm text-center py-4">No comments yet.</div>
                      )}
                    </div>
                    
                    <div className="relative mt-2">
                      <Input 
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        className="w-full h-[52px] rounded-full bg-white border border-slate-200/80 pl-5 pr-[100px] text-[14.5px] focus-visible:ring-2 focus-visible:ring-slate-900/10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] placeholder:text-slate-400"
                      />
                      <Button 
                        size="sm"
                        onClick={handlePostComment}
                        disabled={isPostingComment || !newComment.trim()}
                        className="absolute right-1.5 top-1.5 h-[40px] rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 transition-all shadow-sm disabled:opacity-50"
                      >
                        {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                      </Button>
                    </div>
                  </div>
                )}
                {activeTab === 'updates' && (
                  <div className="text-slate-400 text-sm text-center py-4">No updates yet.</div>
                )}
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
      </AnimatePresence>
      </div>

      {/* ADD SCHEDULE MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[28px] p-7 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="mb-2 shrink-0">
            <DialogTitle className="text-[20px] font-extrabold text-slate-900 tracking-tight">Add Class Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="space-y-4 overflow-y-auto px-2 -mx-2 flex-1 pb-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject / Title</label>
                <Input 
                  required 
                  placeholder="e.g. 10th Grade Math" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="h-[42px] rounded-[16px] bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black hover:border-gray-300 transition-colors text-[14px] px-4 font-medium placeholder:text-slate-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-[42px] rounded-[16px] justify-start text-left font-medium border-gray-200 bg-white hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors px-4",
                          !formData.date && "text-slate-400"
                        )}
                      >
                        <CalendarDays className="mr-2.5 h-[16px] w-[16px] text-slate-500" />
                        {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[20px] border-slate-200 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({...formData, date})}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Class Type</label>
                  <Select value={formData.type} onValueChange={(val: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ => setFormData({...formData, type: val})}>
                    <SelectTrigger className="h-[42px] rounded-[16px] bg-white border-gray-200 focus:ring-1 focus:ring-black focus:border-black hover:border-gray-300 transition-colors font-medium px-4 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[16px] shadow-lg border-slate-200">
                      <SelectItem value="in_person" className="rounded-[10px] font-medium my-0.5">In Person</SelectItem>
                      <SelectItem value="online" className="rounded-[10px] font-medium my-0.5">Online Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Time</label>
                  <div className="relative">
                    <CustomTimePicker 
                      value={formData.startTime}
                      onChange={val => setFormData({...formData, startTime: val})}
                      placeholder="Start Time"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">End Time</label>
                  <div className="relative">
                    <CustomTimePicker 
                      value={formData.endTime}
                      onChange={val => setFormData({...formData, endTime: val})}
                      placeholder="End Time"
                    />
                  </div>
                </div>
              </div>

              {formData.type === 'online' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5 pt-1">Meeting Link</label>
                  <Input 
                    type="url" 
                    placeholder="https://zoom.us/j/..." 
                    value={formData.joinLink}
                    onChange={e => setFormData({...formData, joinLink: e.target.value})}
                    className="h-[42px] rounded-[16px] bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black hover:border-gray-300 transition-colors text-[14px] px-4 font-medium placeholder:text-slate-400"
                  />
                </motion.div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description (Optional)</label>
                <Textarea 
                  placeholder="Topics to cover..." 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="rounded-[16px] bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black hover:border-gray-300 transition-colors text-[14px] p-3 font-medium placeholder:text-slate-400 min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Attachments</label>
                <div className="relative">
                  <input 
                    id="schedule-file-upload"
                    type="file" 
                    multiple 
                    onChange={e => setAttachments(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                  <label 
                    htmlFor="schedule-file-upload"
                    className="h-[42px] flex items-center rounded-[16px] bg-white border border-gray-200 transition-colors text-[14px] font-medium text-slate-400 cursor-pointer px-1.5 hover:bg-gray-50 hover:border-gray-300"
                  >
                    <div className="bg-slate-900 hover:bg-slate-800 transition-colors text-white text-[12px] font-bold py-1.5 px-4 rounded-full mr-3 shadow-sm">
                      Choose Files
                    </div>
                    <span className="truncate pr-4">
                      {attachments.length === 0 ? "No file chosen" : `${attachments.length} file${attachments.length > 1 ? 's' : ''} chosen`}
                    </span>
                  </label>
                </div>

                {/* Attachment Previews */}
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex flex-col gap-2"
                    >
                      {attachments.map((file, idx) => {
                        const isImage = file.type.startsWith('image/');
                        const isPDF = file.type === 'application/pdf';
                        const previewUrl = (isImage || isPDF) ? filePreviews[file.name] : null;
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={idx} 
                            className="relative w-full rounded-[16px] border border-slate-200/60 overflow-hidden bg-slate-50 shadow-sm group shrink-0"
                            style={{ height: (isImage || isPDF) ? '240px' : 'auto' }}
                          >
                            <button 
                              type="button" 
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 bg-slate-800/70 hover:bg-slate-900 text-white rounded-full p-1.5 z-10 transition-colors backdrop-blur-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            {isImage && previewUrl ? (
                              <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : isPDF && previewUrl ? (
                              <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full" title={file.name} />
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-white w-full">
                                <div className="bg-indigo-50/50 p-2 rounded-[10px]">
                                  <FileText className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-bold text-slate-700 truncate max-w-[200px] leading-tight mb-0.5">{file.name}</span>
                                  <span className="text-[11px] font-semibold text-slate-400 leading-tight">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <DialogFooter className="mt-4 pt-4 border-t border-slate-100 shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-[40px] rounded-full font-bold px-6 text-[14px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-[40px] rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 text-[14px] shadow-sm shadow-slate-200 transition-all">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* PDF Viewer Modal */}
      <Dialog open={!!selectedPdfUrl} onOpenChange={(open) => !open && setSelectedPdfUrl(null)}>
        <DialogContent className="max-w-5xl sm:max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-4 border-b border-slate-100 bg-white z-10 shrink-0">
            <DialogTitle className="text-[16px] font-bold text-slate-800">{selectedPdfTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
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
