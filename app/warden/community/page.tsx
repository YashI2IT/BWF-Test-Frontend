/* eslint-disable @next/next/no-img-element */
'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState, useRef, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Hash, MessageSquarePlus, Pencil, Pin, Search, Send, Trash2, Vote, X, ImagePlus, Video, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/warden/Template/components/ui/alert-dialog';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/app/warden/Template/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { getAvatarUrl } from '@/app/lib/avatar';
import api from '@/app/lib/api';
import { cn } from '@/app/warden/Template/lib/utils';

type Status = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded';
type PostType = 'text' | 'poll';
type FeedSection = 'latest' | 'pinned';

interface PollOption {
  text: string;
  votes: number;
}

interface CommunityPost {
  _id: string;
  id: number;
  author: string;
  content: string;
  date: string;
  time: string;
  status: Status;
  type: PostType;
  tags: string[];
  pollOptions: PollOption[];
  voters?: { userId: string; optionIndex: number }[];
  userVote?: number | null;
  creatorId: string;
  creatorRole: string;
  hostelName: string | { _id: string; name?: string };
  pinned?: boolean;
  canManage?: boolean;
  profilePic?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
}

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || apiError.message || fallback;
};

const emptyPollInputs = ['', ''];


const hostelLabel = (hostelName: CommunityPost['hostelName']) =>
  typeof hostelName === 'string' ? hostelName : hostelName?.name || 'Community';

const toDisplayDate = (post: CommunityPost) => {
  const dateValue = post.date ? new Date(post.date) : new Date();
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateValue);
};

const totalVotes = (post: CommunityPost) => post.pollOptions.reduce((sum, option) => sum + option.votes, 0);

const normalizeTag = (value: string) => {
  const compact = value.trim().replace(/^#/, '').replace(/\s+/g, '');
  return compact ? `#${compact}` : '';
};

const tagsToInput = (tags: string[]) => tags.map((tag) => tag.replace(/^#/, '')).join(', ');

const parseTagInput = (value: string) =>
  value
    .split(',')
    .map(normalizeTag)
    .filter(Boolean)
    .slice(0, 10);

const normalizePost = (post: CommunityPost): CommunityPost => ({
  ...post,
  date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
  tags: Array.isArray(post.tags) ? post.tags : [],
  pollOptions: Array.isArray(post.pollOptions) ? post.pollOptions : [],
  voters: Array.isArray(post.voters) ? post.voters : [],
  userVote: post.userVote ?? null,
  pinned: Boolean(post.pinned),
  canManage: Boolean(post.canManage),
});

const renderInlineContent = (line: string) =>
  line.split(/(#.+?#)/g).map((part, index) => {
    const boldText = part.match(/^#(.+?)#$/);

    if (boldText) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-slate-900">
          {boldText[1].trim()}
        </strong>
      );
    }

    return part;
  });

const renderPostContent = (content: string): ReactNode =>
  content.split('\n').map((line, index) => {
    const heading = line.match(/^#(.+)#$/);

    if (heading) {
      return (
        <h3 key={`${line}-${index}`} className="mb-2 text-[16px] font-bold leading-6 text-slate-900 tracking-tight">
          {heading[1].trim()}
        </h3>
      );
    }

    return line.trim() ? (
      <p key={`${line}-${index}`} className="text-[14px] leading-relaxed text-slate-600 font-medium break-words">
        {renderInlineContent(line)}
      </p>
    ) : null;
  });

const getMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${url}`;
};

export default function WardenCommunityWall() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [section, setSection] = useState<FeedSection>('latest');
  const [draftType, setDraftType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [pollInputs, setPollInputs] = useState<string[]>(emptyPollInputs);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<PostType>('text');
  const [editingContent, setEditingContent] = useState('');
  const [editingTagInput, setEditingTagInput] = useState('');
  const [editingPollInputs, setEditingPollInputs] = useState<string[]>(emptyPollInputs);
  const [acceptType, setAcceptType] = useState('image/*');
  const [editingMedia, setEditingMedia] = useState<{file?: File, url?: string, type?: string} | null>(null);
  
  const [previewMedia, setPreviewMedia] = useState<{url: string, type?: string} | null>(null);
  
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const deferredSection = useDeferredValue(section);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/warden/posts');
        setPosts(res.data.map(normalizePost));
      } catch (error: unknown) {
        console.error("Fetch posts error", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return posts
      .filter((post) => (deferredSection === 'pinned' ? post.pinned : true))
      .filter((post) => {
        if (!query) return true;
        const searchable = `${post.author} ${post.creatorRole} ${post.tags.join(' ')} ${post.content}`.toLowerCase();
        return searchable.includes(query);
      })
      .sort((a, b) => {
        const getTimestamp = (p: CommunityPost) => {
          if (!p.date) return 0;
          const datePart = p.date.split('T')[0];
          const timePart = p.time ? (p.time.length === 5 ? `${p.time}:00` : p.time) : '00:00:00';
          return new Date(`${datePart}T${timePart}`).getTime() || 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
  }, [posts, deferredSearchTerm, deferredSection]);

  const resetDraft = () => {
    setContent('');
    setTagInput('');
    setPollInputs(emptyPollInputs);
    setDraftType('text');
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateDraft = () => {
    if (!content.trim()) {
      showMessage('Post content is required.', 'error');
      return false;
    }

    if (draftType === 'poll') {
      const validOptions = pollInputs.map((option) => option.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        showMessage('Poll requires at least 2 options.', 'error');
        return false;
      }
      if (validOptions.length > 4) {
        showMessage('Poll can have at most 4 options.', 'error');
        return false;
      }
    }

    return true;
  };

  const buildDraftPayload = () => ({
    content: content.trim(),
    type: draftType,
    tags: parseTagInput(tagInput),
    pollOptions: draftType === 'poll' ? pollInputs.map((option) => option.trim()).filter(Boolean) : [],
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateDraft()) return;
    setIsPublishConfirmOpen(true);
  };

  const confirmPublish = async () => {
    try {
      setIsSubmitting(true);
      const payload = buildDraftPayload();
      
      const formData = new FormData();
      formData.append('content', payload.content);
      formData.append('type', payload.type);
      formData.append('tags', JSON.stringify(payload.tags));
      formData.append('pollOptions', JSON.stringify(payload.pollOptions));
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const res = await api.post('/warden/posts', formData);
      setPosts((current) => [normalizePost(res.data.post), ...current]);
      resetDraft();
      setSection('latest');
      setIsPublishConfirmOpen(false);
      showMessage('Post published successfully!', 'success');
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'Failed to publish post.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (post: CommunityPost) => {
    setEditingPostId(post._id);
    setEditingType(post.type);
    setEditingContent(post.content);
    setEditingTagInput(tagsToInput(post.tags));
    setEditingPollInputs(
      post.type === 'poll'
        ? [...post.pollOptions.map((option) => option.text), ...emptyPollInputs].slice(0, Math.max(2, post.pollOptions.length))
        : emptyPollInputs
    );
    setEditingMedia(null);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditingType('text');
    setEditingContent('');
    setEditingTagInput('');
    setEditingPollInputs(emptyPollInputs);
    setEditingMedia(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const saveEditing = async (post: CommunityPost) => {
    if (!editingContent.trim()) {
      showMessage('Post content is required.', 'error');
      return;
    }

    const trimmedOptions = editingPollInputs.map((option) => option.trim()).filter(Boolean);
    if (editingType === 'poll' && trimmedOptions.length < 2) {
      showMessage('Poll requires at least 2 options.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', editingContent.trim());
      formData.append('type', editingType);
      formData.append('tags', parseTagInput(editingTagInput).join(','));
      if (editingType === 'poll') {
        formData.append('pollOptions', JSON.stringify(trimmedOptions));
      }
      if (editingMedia?.file) {
        formData.append('media', editingMedia.file);
      }

      const res = await api.put(`/warden/posts/${post._id}`, formData);
      const updatedPost = normalizePost(res.data.post || res.data);
      setPosts((current) => current.map((item) => (item._id === post._id ? updatedPost : item)));
      cancelEditing();
      showMessage('Post updated successfully!', 'success');
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'Failed to update post.'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.delete(`/warden/posts/${deleteTarget._id}`);
      setPosts((current) => current.filter((post) => post._id !== deleteTarget._id));
      if (editingPostId === deleteTarget._id) {
        cancelEditing();
      }
      setDeleteTarget(null);
      showMessage('Post deleted.', 'success');
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'Failed to delete post.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVote = async (post: CommunityPost, optionIndex: number) => {
    try {
      const res = await api.post(`/warden/posts/${post._id}/vote`, { optionIndex });
      const updatedPost = normalizePost(res.data.post);
      setPosts((current) => current.map((item) => (item._id === post._id ? updatedPost : item)));
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'Failed to vote.'), 'error');
    }
  };

  const togglePin = async (post: CommunityPost) => {
    try {
      const res = await api.put(`/warden/posts/${post._id}/pin`, { pinned: !post.pinned });
      const updatedPost = normalizePost(res.data.post || res.data);
      setPosts((current) => current.map((item) => (item._id === post._id ? updatedPost : item)));
      showMessage(updatedPost.pinned ? 'Post pinned.' : 'Post unpinned.', 'success');
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'Failed to update pin status.'), 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 md:gap-6 p-4 md:p-6 lg:p-8">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "px-4 py-3 rounded-xl flex items-center gap-3 text-[14px] font-bold border shadow-sm",
                message.type === 'error' 
                  ? "bg-red-50 text-red-600 border-red-100"
                  : "bg-blue-50 text-blue-600 border-emerald-100"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                message.type === 'error' ? "bg-red-500" : "bg-slate-300"
              )} />
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
        
        <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
             <DialogTitle className="hidden">Media Preview</DialogTitle>
             {previewMedia && (
                <div className="flex items-center justify-center w-full h-[80vh]">
                  {previewMedia.type?.startsWith('video') ? (
                    <video src={getMediaUrl(previewMedia.url)} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
                  ) : (
                    <img src={getMediaUrl(previewMedia.url)} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                  )}
                </div>
             )}
          </DialogContent>
        </Dialog>

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
            >
              Warden Community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2"
            >
              Connect, share resources, and create polls.
            </motion.p>
          </div>
          
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or #hashtag"
              className="h-12 w-full rounded-2xl border-slate-200 bg-white pl-12 text-[14px] font-medium text-slate-700 shadow-sm focus-visible:ring-slate-300/20 focus-visible:border-black transition-all"
            />
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Feed Column */}
          <section className="order-2 lg:order-1 min-w-0 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Your Feed</h2>
              <Tabs value={section} onValueChange={(v) => setSection(v as FeedSection)} suppressHydrationWarning>
                <TabsList className="bg-slate-100 border border-slate-200/60 rounded-full h-[42px] p-1 flex items-center max-w-full overflow-x-auto hide-scrollbar">
                  <TabsTrigger value="latest" className="relative rounded-full h-full px-6 text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
                    {section === 'latest' && (
                      <motion.div
                        layoutId="community-feed-section"
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Latest</span>
                  </TabsTrigger>
                  <TabsTrigger value="pinned" className="relative rounded-full h-full px-6 text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
                    {section === 'pinned' && (
                      <motion.div
                        layoutId="community-feed-section"
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Pinned</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-5 pb-10">
              <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] animate-pulse border border-transparent">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                            <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-slate-100 rounded-full shrink-0"></div>
                      </div>
                      <div className="mt-6 space-y-2">
                        <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                        <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                        <div className="h-3 w-3/4 bg-slate-100 rounded-md"></div>
                      </div>
                      <div className="mt-6 flex items-center gap-4">
                        <div className="h-8 w-20 bg-slate-100 rounded-full"></div>
                        <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : posts.length === 0 ? (
                <motion.div
                  key="empty-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-[32px] border-0 bg-white/50 border-slate-200/50 border-dashed shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <MessageSquarePlus className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-800 text-lg tracking-tight">No posts yet</p>
                      <p className="mt-1 text-[14px] text-slate-500 font-medium max-w-sm">Be the first to share an update, question, or resource with the community.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : filteredPosts.length === 0 ? (
                <motion.div
                  key="empty-search"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                <Card className="rounded-[32px] border-0 bg-white/50 border-slate-200/50 border-dashed shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Search className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-800 text-lg tracking-tight">No posts found</p>
                    <p className="mt-1 text-[14px] text-slate-500 font-medium">Try searching for a different name or hashtag.</p>
                  </CardContent>
                </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5"
                >
                  {filteredPosts.map((post) => {
                    const votes = totalVotes(post);
                    const isOwnPost = Boolean(post.canManage);
                    const isEditing = editingPostId === post._id;

                    return (
                      <article 
                        key={post._id} 
                        className={`rounded-[28px] border-0 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group ${post.pinned ? 'ring-1 ring-amber-200/50' : ''}`}
                      >
                        {post.pinned && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-center sm:items-start gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-slate-100">
                               <img src={post.profilePic || getAvatarUrl(post.author)} alt={post.author} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">{post.author}</h2>
                                {post.pinned && (
                                  <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-sm">
                                    <Pin className="h-3 w-3" /> Pinned
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {toDisplayDate(post)} at {post.time} <span className="mx-1 text-slate-300">•</span> {hostelLabel(post.hostelName)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge className="border-0 bg-slate-100 text-slate-600 capitalize text-[11px] font-bold tracking-wide px-3 py-1">
                              {post.creatorRole}
                            </Badge>
                            {isOwnPost && !isEditing && (
                              <div className="flex items-center gap-1 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="ghost" size="icon" onClick={() => togglePin(post)} className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                  <Pin className={`h-4 w-4 ${post.pinned ? 'fill-current text-amber-600' : ''}`} />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => startEditing(post)} className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-blue-50 rounded-lg">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(post)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-6 space-y-4 rounded-[20px] border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
                            <Select value={editingType} onValueChange={(value) => setEditingType(value as PostType)}>
                              <SelectTrigger className="h-10 w-full sm:w-[140px] rounded-[14px] border-slate-200 bg-white font-bold text-[14px] text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-0 focus:border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-xl bg-white p-2">
                                <SelectItem value="text" className="font-bold text-[14px] text-slate-700 focus:bg-indigo-600 focus:text-white rounded-xl py-2.5 px-4 cursor-pointer mb-1 transition-colors">Text Post</SelectItem>
                                <SelectItem value="poll" className="font-bold text-[14px] text-slate-700 focus:bg-indigo-600 focus:text-white rounded-xl py-2.5 px-4 cursor-pointer transition-colors">Poll Post</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={editingContent}
                              onChange={(event) => setEditingContent(event.target.value)}
                              className="min-h-[100px] resize-y rounded-[16px] border-gray-200 bg-white text-[14px] font-medium leading-relaxed p-4 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                            />
                            <div className="relative">
                              <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                value={editingTagInput}
                                onChange={(event) => setEditingTagInput(event.target.value)}
                                placeholder="Tags separated by commas"
                                className="h-[42px] rounded-[16px] border-gray-200 bg-white pl-11 text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAcceptType('image/*');
                                  if (editFileInputRef.current) {
                                    editFileInputRef.current.accept = 'image/*';
                                    editFileInputRef.current.click();
                                  }
                                }}
                                className="h-9 rounded-[14px] bg-white text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 border-slate-200"
                              >
                                <ImagePlus className="mr-2 h-4 w-4 text-blue-500" /> New Image
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAcceptType('video/*');
                                  if (editFileInputRef.current) {
                                    editFileInputRef.current.accept = 'video/*';
                                    editFileInputRef.current.click();
                                  }
                                }}
                                className="h-9 rounded-[14px] bg-white text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 border-slate-200"
                              >
                                <Video className="mr-2 h-4 w-4 text-emerald-500" /> New Video
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAcceptType('.pdf');
                                  if (editFileInputRef.current) {
                                    editFileInputRef.current.accept = '.pdf';
                                    editFileInputRef.current.click();
                                  }
                                }}
                                className="h-9 rounded-[14px] bg-white text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 border-slate-200"
                              >
                                <FileText className="mr-2 h-4 w-4 text-rose-500" /> New PDF
                              </Button>
                            </div>
                            <input
                              type="file"
                              ref={editFileInputRef}
                              className="hidden"
                              accept={acceptType}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.type.startsWith('video/')) setEditingMedia({ type: 'video', file });
                                  else if (file.type === 'application/pdf') setEditingMedia({ type: 'pdf', file });
                                  else setEditingMedia({ type: 'image', file });
                                }
                              }}
                            />

                            {!editingMedia && post.mediaUrl && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[300px] opacity-80 pointer-events-none relative">
                                <div className="absolute top-2 left-2 z-10">
                                  <Badge className="bg-slate-900/80 text-white font-bold backdrop-blur-sm border-0 shadow-sm">Current Media</Badge>
                                </div>
                                {post.mediaType?.startsWith('video') ? (
                                  <div className="relative cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                                    <video src={getMediaUrl(post.mediaUrl)} className="w-full h-auto object-contain max-h-[300px]" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                      <div className="bg-white/80 p-3 rounded-full shadow-lg backdrop-blur-sm"><Video className="w-6 h-6 text-slate-800" /></div>
                                    </div>
                                  </div>
                                ) : post.mediaType?.includes('pdf') ? (
                                  <div className="flex flex-col items-center justify-center h-48 bg-slate-100 p-4">
                                    <iframe src={getMediaUrl(post.mediaUrl)} className="w-full flex-1 rounded-t-lg pointer-events-none" title="PDF Document" />
                                    <div className="w-full p-2 bg-white flex justify-center mt-2 rounded-b-lg border border-slate-200">
                                      <a href={getMediaUrl(post.mediaUrl)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-all">
                                        Open PDF
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <img src={getMediaUrl(post.mediaUrl)} alt="Post media" className="w-full h-auto object-contain max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})} />
                                )}
                              </div>
                            )}

                            {editingMedia && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-blue-50/50 flex flex-col items-center justify-center min-h-[150px] max-h-[300px] relative p-4">
                                <div className="absolute top-2 left-2 z-10">
                                  <Badge className="bg-blue-600 text-white font-bold border-0 shadow-sm">New Attachment</Badge>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMedia(null);
                                    if (editFileInputRef.current) editFileInputRef.current.value = '';
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all z-20"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                {editingMedia.type === 'video' ? (
                                  <video src={URL.createObjectURL(editingMedia.file!)} controls className="w-full h-auto object-contain max-h-[260px] rounded-lg mt-6" />
                                ) : editingMedia.type === 'pdf' ? (
                                  <div className="flex flex-col items-center text-slate-500 mt-6">
                                    <FileText className="w-12 h-12 mb-2 text-rose-500" />
                                    <span className="font-medium text-sm">{editingMedia.file?.name}</span>
                                  </div>
                                ) : (
                                  <img src={URL.createObjectURL(editingMedia.file!)} alt="Preview" className="w-full h-auto object-contain max-h-[260px] rounded-lg mt-6 shadow-sm" />
                                )}
                              </div>
                            )}

                            {editingType === 'poll' && (
                              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                {editingPollInputs.map((option, index) => (
                                  <div key={`${post._id}-edit-${index}`} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(event) =>
                                        setEditingPollInputs((current) =>
                                          current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                                        )
                                      }
                                      placeholder={`Option ${index + 1}`}
                                      className="h-[42px] rounded-[16px] border-gray-200 bg-white text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                                    />
                                    {editingPollInputs.length > 2 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingPollInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                        className="h-11 w-11 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                      >
                                        <X className="h-5 w-5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                {editingPollInputs.length < 4 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingPollInputs((current) => [...current, ''])}
                                    className="h-11 w-full bg-white hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 font-bold rounded-xl transition-all"
                                  >
                                    + Add poll option
                                  </Button>
                                )}
                              </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                              <Button type="button" variant="outline" onClick={cancelEditing} className="h-9 px-5 rounded-full font-bold border-slate-200 text-slate-600 text-[13px] hover:bg-slate-50">
                                Cancel
                              </Button>
                              <Button type="button" onClick={() => saveEditing(post)} className="h-9 px-6 rounded-full font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm text-[13px]">
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-4 pl-2">
                            <div className="space-y-2">{renderPostContent(post.content)}</div>
                            
                            {post.mediaUrl && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[500px]">
                                {post.mediaType?.startsWith('video') ? (
                                  <div className="relative cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                                    <video src={getMediaUrl(post.mediaUrl)} className="w-full h-auto object-contain max-h-[500px]" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                      <div className="bg-white/80 p-4 rounded-full shadow-lg backdrop-blur-sm"><Video className="w-8 h-8 text-slate-800" /></div>
                                    </div>
                                  </div>
                                ) : post.mediaType?.includes('pdf') ? (
                                  <div className="flex flex-col h-[500px] bg-slate-100 p-2">
                                    <iframe src={getMediaUrl(post.mediaUrl)} className="w-full flex-1 rounded-t-lg" title="PDF Document" />
                                    <div className="w-full p-4 bg-white flex justify-center rounded-b-lg border border-slate-200 mt-2">
                                      <a href={getMediaUrl(post.mediaUrl)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all">
                                        Open PDF in New Tab
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <img src={getMediaUrl(post.mediaUrl)} alt="Post media" className="w-full h-auto object-contain max-h-[500px] cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})} />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {!isEditing && post.tags.length > 0 && (
                          <div className="mt-6 flex flex-wrap gap-2 pl-2">
                            {post.tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (searchTerm === tag) {
                                    setSearchTerm('');
                                  } else {
                                    setSearchTerm(tag);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                                  searchTerm === tag
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-slate-50 border border-slate-100 text-slate-500 hover:bg-blue-50 hover:text-slate-900 hover:border-slate-300"
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}

                        {!isEditing && post.type === 'poll' && (
                          <div className="mt-6 space-y-3 rounded-[20px] border border-slate-100 bg-slate-50/50 p-5">
                            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                              <span className="flex items-center gap-2"><Vote className="h-4 w-4 text-slate-600" /> Community Poll</span>
                              <span className="bg-white px-2 py-1 rounded-md border border-slate-200">{votes} votes</span>
                            </div>
                            {post.pollOptions.map((option, index) => {
                              const percent = votes ? Math.round((option.votes / votes) * 100) : 0;
                              const isVoted = post.userVote === index;
                              return (
                                <div key={`${post._id}-poll-${index}`} className={`relative w-full rounded-full border overflow-hidden p-3 transition-colors ${isVoted ? 'border-slate-300 bg-slate-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                  {/* Progress bar background */}
                                  <div className="absolute top-0 left-0 h-full bg-slate-200/50 transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
                                  
                                  <div className="relative flex items-center justify-between gap-3 text-[14px] font-bold text-slate-800 z-10">
                                    <span>{option.text}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-slate-500 font-bold">{percent}%</span>
                                      <Button
                                        type="button"
                                        variant={isVoted ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleVote(post, index)}
                                        className={cn("rounded-full h-8 px-5 border-slate-200 text-[12px] font-bold transition-all", isVoted ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-200" : "text-slate-600 hover:bg-slate-50")}
                                      >
                                        {isVoted ? 'Voted' : 'Vote'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </article>
                    );
                  })}
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </section>

          {/* Create Post Sidebar */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-[104px] lg:self-start lg:max-h-[calc(100vh-128px)] flex flex-col min-h-0">
            <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                 <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-1">
                   <MessageSquarePlus className="h-4 w-4" /> Share with Community
                 </p>
                 <h2 className="text-lg font-bold text-slate-900">Create Post</h2>
              </div>
              <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-4 p-6 flex-1 overflow-y-auto scrollable-hide min-h-0">
                  <Tabs value={draftType} onValueChange={(v) => setDraftType(v as PostType)} className="w-full" suppressHydrationWarning>
                    <TabsList className="bg-slate-100 border border-slate-200/60 rounded-full h-[42px] p-1 flex items-center w-full max-w-full overflow-x-auto hide-scrollbar">
                      <TabsTrigger value="text" className="flex-1 relative rounded-full h-full text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
                        {draftType === 'text' && (
                          <motion.div
                            layoutId="community-draft-type"
                            className="absolute inset-0 bg-white rounded-full shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">Text Post</span>
                      </TabsTrigger>
                      <TabsTrigger value="poll" className="flex-1 relative rounded-full h-full text-[13px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
                        {draftType === 'poll' && (
                          <motion.div
                            layoutId="community-draft-type"
                            className="absolute inset-0 bg-white rounded-full shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">Poll</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative">
                    <Textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Write your post here... Use #Heading# for bold titles."
                      className="min-h-[120px] resize-y rounded-[16px] border-gray-200 bg-white text-[14px] font-medium leading-relaxed p-4 pb-12 focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                           if (fileInputRef.current) {
                             fileInputRef.current.accept = 'image/*,video/*,.pdf';
                             fileInputRef.current.click();
                           }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-colors"
                      >
                        <ImagePlus className="w-4 h-4" /> Attach Media
                      </button>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setMediaFile(file);
                        setMediaPreview(URL.createObjectURL(file));
                      }
                    }}
                  />

                  {mediaPreview && (
                    <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 flex items-center justify-center min-h-[100px]">
                      {mediaFile?.type.startsWith('video/') ? (
                        <video src={mediaPreview} controls className="w-full h-auto object-contain max-h-60" />
                      ) : mediaFile?.type === 'application/pdf' ? (
                        <iframe src={mediaPreview} className="w-full h-[350px] rounded-lg" title="PDF Preview" />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full h-auto object-contain max-h-60" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPreview(null);
                          setMediaFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Add tags separated by commas"
                      className="h-[42px] rounded-[16px] border-gray-200 bg-white pl-11 text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                    />
                  </div>

                  {draftType === 'poll' && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      {pollInputs.map((option, index) => (
                        <div key={`draft-${index}`} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(event) =>
                              setPollInputs((current) =>
                                current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                              )
                            }
                            placeholder={`Option ${index + 1}`}
                            className="h-[42px] rounded-[16px] border-gray-200 bg-white text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors hover:border-gray-300"
                          />
                          {pollInputs.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPollInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                              className="h-10 w-10 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {pollInputs.length < 4 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPollInputs((current) => [...current, ''])}
                          className="h-10 w-full bg-white hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-[12px] transition-all"
                        >
                          + Add poll option
                        </Button>
                      )}
                    </div>
                  )}
                  </div>
                  
                  <div className="p-6 pt-4 bg-white border-t border-slate-100 shrink-0 relative z-10">
                    <Button type="submit" className="h-12 w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm shadow-slate-200 transition-all">
                      <Send className="h-4 w-4 mr-2" />
                      Publish Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent className="rounded-[32px] border-0 p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl md:text-2xl font-bold text-slate-900">Publish Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-[15px] font-medium leading-relaxed mt-2">
              This will publish your post to the main community feed for all students and teachers to see.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-full border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 h-9 px-5 text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={isSubmitting}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-6 text-[13px] shadow-sm shadow-slate-200"
            >
              {isSubmitting ? 'Posting...' : 'Publish Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[32px] border-0 p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl md:text-2xl font-bold text-slate-900">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-[15px] font-medium leading-relaxed mt-2">
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-full border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 h-9 px-5 text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 px-6 text-[13px] shadow-sm shadow-rose-200"
            >
              {isDeleting ? 'Deleting...' : 'Delete Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
