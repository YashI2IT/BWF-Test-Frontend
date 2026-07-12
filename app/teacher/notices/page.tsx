/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card, CardContent } from '@/app/teacher/Template/components/ui/card';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { Input } from '@/app/teacher/Template/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Textarea } from '@/app/teacher/Template/components/ui/textarea';
import { Megaphone, Send, Clock, User2, Image as ImageIcon, X, Trash2, Pencil } from 'lucide-react';
import api from '@/app/lib/api';
import { cn } from '@/app/teacher/Template/lib/utils';

interface Notice {
  _id: string;
  title: string;
  body: string;
  category: string;
  authorRole: string;
  authorName?: string;
  publishedDate: string;
  imageUrl?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

function NoticeCard({ 
  notice, 
  onUpdate, 
  onDelete 
}: { 
  notice: Notice, 
  onUpdate: (id: string, data: { title: string, body: string, category: string, image?: File | null, removeImage?: boolean }) => Promise<void>, 
  onDelete: (id: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: notice.title, body: notice.body, category: notice.category });
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(notice.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(notice._id, { ...editData, image: editImageFile, removeImage });
    setIsSaving(false);
    setIsEditing(false);
    setRemoveImage(false);
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200 shadow-sm rounded-[24px] bg-white relative overflow-hidden group flex flex-col pt-14">
        
        {/* Background Top Bar Area */}
        <div className="absolute top-0 left-0 w-full h-20 bg-slate-50 overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-indigo-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Edit / Delete Actions */}
          <div className={`absolute top-2 right-4 flex gap-2 z-20 transition-all duration-300 ease-out ${isEditing ? 'opacity-100 translate-y-0' : 'sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-[-10px] sm:group-hover:translate-y-0'}`}>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 h-8 flex items-center justify-center bg-slate-900 text-white text-[12px] font-bold rounded-full hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({ title: notice.title, body: notice.body, category: notice.category });
                    setEditImageFile(null);
                    setEditImagePreview(notice.imageUrl || null);
                  }}
                  className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                  title="Edit Notice"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(notice._id)}
                  className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-red-600 hover:border-red-200 shadow-sm transition-all"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* White Content Area */}
        <div className="bg-white rounded-t-[24px] p-5 pl-7 relative border-t border-slate-100/60 flex-1 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-10">
          <div className="absolute -top-6 left-7 w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10 group-hover:border-blue-200 group-hover:shadow-md transition-all duration-300">
            <Megaphone className="w-5 h-5 text-slate-600 group-hover:text-blue-600 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
          </div>
          
          <div className={`flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3 ${isEditing ? 'mt-4' : 'mt-1'}`}>
            <div className="flex-1 mr-4">
              {isEditing ? (
                <Input 
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="font-bold text-lg h-12 rounded-[16px] border-slate-200 bg-white px-4 shadow-sm focus-visible:ring-indigo-500/20"
                  placeholder="Notice Title"
                />
              ) : (
                <h3 className="font-bold text-lg text-slate-900 tracking-tight">{notice.title}</h3>
              )}
              
              <div className="flex items-center gap-4 mt-2">
                {isEditing ? (
                  <Select value={editData.category} onValueChange={(val) => setEditData({...editData, category: val})}>
                    <SelectTrigger className="h-10 rounded-[14px] border-slate-200 bg-white hover:bg-slate-50 focus:ring-0 focus:border-slate-300 font-bold text-[14px] text-slate-800 w-full sm:w-[140px] px-4 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl bg-white p-2">
                      <SelectItem value="academic" className="font-bold text-[14px] text-slate-700 focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 px-4 cursor-pointer mb-1 transition-colors">Academic</SelectItem>
                      <SelectItem value="events" className="font-bold text-[14px] text-slate-700 focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 px-4 cursor-pointer mb-1 transition-colors">Events</SelectItem>
                      <SelectItem value="welfare" className="font-bold text-[14px] text-slate-700 focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 px-4 cursor-pointer mb-1 transition-colors">Welfare</SelectItem>
                      <SelectItem value="general" className="font-bold text-[14px] text-slate-700 focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 px-4 cursor-pointer transition-colors">General</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1 bg-slate-100/80 text-slate-600 rounded-full uppercase tracking-wider">
                    {notice.category}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 capitalize">
                  <User2 className="w-3.5 h-3.5" />
                  {notice.authorName || notice.authorRole}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-bold bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {notice.publishedDate}
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100/50 relative">
            {isEditing ? (
              <>
                <Textarea
                  value={editData.body}
                  onChange={(e) => setEditData({...editData, body: e.target.value})}
                  className="min-h-[120px] w-full rounded-[20px] border-slate-200 bg-white p-5 text-[14px] leading-relaxed custom-scrollbar shadow-sm focus-visible:ring-indigo-500/20"
                  placeholder="Notice Body"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditImageFile(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                
                {editImagePreview ? (
                  <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center min-h-[100px]">
                    <img src={editImagePreview} alt="Preview" className="w-full h-auto object-contain max-h-[400px]" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditImagePreview(null);
                        setEditImageFile(null);
                        setRemoveImage(true);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex items-center justify-center w-full gap-2 py-4 border-2 border-dashed border-slate-200 bg-slate-50 rounded-[16px] text-slate-500 font-medium text-[13px] hover:bg-slate-100 hover:border-slate-300 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" /> Attach Image (Optional)
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-600 leading-relaxed font-medium text-[14px] whitespace-pre-wrap">{notice.body}</p>
                {notice.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    <img src={notice.imageUrl} alt="Notice media" className="w-full h-auto object-contain max-h-[400px]" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function NoticesPage() {
  const [data, setData] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', body: '', category: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/notices');
      setData(res.data);
    } catch {
      showMessage('Failed to load notices.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category) {
      showMessage('Please select a category.', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('body', formData.body);
      payload.append('category', formData.category);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      await api.post('/teacher/notices', payload);
      showMessage('Notice broadcasted successfully!', 'success');
      
      setFormData({ title: '', body: '', category: '' });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await loadData();
    } catch {
      showMessage('Failed to broadcast notice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineUpdate = async (noticeId: string, data: { title: string, body: string, category: string, image?: File | null, removeImage?: boolean }) => {
    try {
      const payload = new FormData();
      payload.append('title', data.title);
      payload.append('body', data.body);
      payload.append('category', data.category);
      if (data.image) {
        payload.append('image', data.image);
      }
      if (data.removeImage) {
        payload.append('removeImage', 'true');
      }
      
      await api.put(`/teacher/notices/${noticeId}`, payload);
      showMessage('Notice updated successfully!', 'success');
      await loadData();
    } catch {
      showMessage('Failed to update notice.', 'error');
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/teacher/notices/${noticeId}`);
      showMessage('Notice deleted successfully!', 'success');
      await loadData();
    } catch {
      showMessage('Failed to delete notice.', 'error');
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 bg-[#F4F5F7] min-h-screen p-4 md:p-6 lg:p-8"
    >
      <div className="max-w-[1400px] mx-auto">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-[14px] font-bold border shadow-sm",
                message.type === 'error' 
                  ? "bg-red-50 text-red-600 border-red-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                message.type === 'error' ? "bg-red-500" : "bg-emerald-500"
              )} />
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
          >
            Broadcast Notices
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2"
          >
            Manage and broadcast important notices to students.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-4 lg:sticky lg:top-[120px] lg:self-start lg:z-10 lg:h-[calc(100vh-160px)]">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full flex flex-col rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/30 shrink-0">
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <Send className="w-5 h-5 text-slate-600" /> New Broadcast
                  </h3>
                </div>
                <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                  <form onSubmit={handleSubmit} className="flex flex-col w-full h-full">
                    <div className="flex-1 flex flex-col space-y-5 p-6 min-h-0 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2 shrink-0">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Notice Title</label>
                        <Input 
                          value={formData.title} 
                          onChange={e => setFormData({...formData, title: e.target.value})} 
                          placeholder="e.g. Midterm Exam Schedule" 
                          required 
                          className="h-12 rounded-full px-6 border-gray-200 bg-white focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 font-medium text-[14px]"
                        />
                      </div>
                      <div className="space-y-2 shrink-0">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
                        <Select 
                          required
                          value={formData.category} 
                          onValueChange={value => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger className="h-12 rounded-full px-6 border-gray-200 bg-white hover:border-gray-300 focus:ring-1 focus:ring-black focus:border-black transition-colors font-medium text-[14px] text-slate-700 data-[state=open]:bg-gray-50 data-[state=open]:text-slate-900">
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                            <SelectItem value="academic" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">Academic</SelectItem>
                            <SelectItem value="events" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">Events</SelectItem>
                            <SelectItem value="welfare" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">Welfare</SelectItem>
                            <SelectItem value="general" className="font-medium focus:bg-slate-50 focus:text-slate-900 rounded-xl py-2.5 cursor-pointer">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex flex-col">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Message Content</label>
                        <div className="relative flex flex-col">
                          <Textarea 
                            className="flex-1 min-h-[150px] w-full rounded-[28px] border-gray-200 bg-white px-6 py-5 pb-14 text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300 resize-y placeholder:text-slate-400 text-slate-700 leading-relaxed shadow-none custom-scrollbar"
                            value={formData.body} 
                            onChange={e => setFormData({...formData, body: e.target.value})} 
                            placeholder="Write your broadcast message here..." 
                            required 
                          />
                          <div className="absolute bottom-2 right-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-full hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" /> Attach Image
                            </button>
                          </div>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />

                        {imagePreview && (
                          <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 flex items-center justify-center min-h-[100px] shrink-0">
                            <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain max-h-40" />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 pt-2 shrink-0">
                      <div className="flex gap-3">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="flex-1 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-200 transition-all text-[15px]"
                        >
                          {isSubmitting ? 'Broadcasting...' : 'Broadcast Notice'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Notices Feed */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-[24px] p-6 pl-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] animate-pulse border border-transparent flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
                          <div className="h-6 w-20 bg-slate-100 rounded-lg"></div>
                        </div>
                      </div>
                      <div className="h-8 w-24 bg-slate-100 rounded-xl"></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[16px] space-y-2 border border-slate-100/50">
                      <div className="h-3 w-full bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-5/6 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-2/3 bg-slate-200 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : data.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="rounded-[32px] border-0 bg-white/50 border-slate-200/50 border-dashed shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Megaphone className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-800 text-lg tracking-tight">No Active Notices</p>
                    <p className="mt-1 text-[14px] text-slate-500 font-medium">You haven&apos;t broadcasted any notices yet. Create one using the form.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <AnimatePresence>
                  {data.map((notice) => (
                    <NoticeCard key={notice._id} notice={notice} onDelete={handleDelete} onUpdate={handleInlineUpdate} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
