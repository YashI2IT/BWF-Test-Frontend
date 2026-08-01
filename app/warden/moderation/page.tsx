/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Input } from '@/app/warden/Template/components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/warden/Template/components/ui/dialog';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';
import api from '@/app/lib/api';
import { useEffect } from 'react';
import { getAvatarUrl } from '@/app/lib/avatar';


const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

type Status = 'Pending' | 'Approved' | 'Rejected';

type PostType = 'text' | 'poll';

interface PollOption {
  _id: string;
  text: string;
  votes: number;
}

interface Post {
  id: string; // MongoDB _id
  author: string;
  content: string;
  dateTime: string;
  status: Status;
  type: PostType;
  hashtags?: string[];
  tags?: string[];
  pollOptions?: PollOption[];
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  mediaUrl?: string;
  mediaType?: string;
}


const truncateText = (text: string, charLimit = 200) => {
  return text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
};

const isTextTruncated = (text: string, charLimit = 200) => {
  return text.length > charLimit;
};

const getMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  const normalizedPath = url.replace(/\\/g, '/');
  return `${baseUrl}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
};

const renderContent = (content: string) => {
  const parts = content.split(/(#.*?#)/g);
  return parts.map((part, index) => {
    if (part.startsWith('#') && part.endsWith('#') && part.length > 2) {
      return (
        <strong key={index} className="font-extrabold text-slate-900">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return part;
  });
};

export default function ModerationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{url: string, type?: string} | null>(null);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/warden/moderation/pending');
      const normalizedData = response.data.map((item: any) => ({
        id: item._id,
        author: item.author,
        content: item.content,
        dateTime: new Date(item.createdAt).toLocaleString(),
        status: 'Pending',
        type: item.category,
        hashtags: [], 
        pollOptions: [],
        rejectionReason: '',
        approvedBy: '',
        rejectedBy: '',
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType
      }));
      setPosts(normalizedData);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const ITEMS_PER_PAGE = 10;

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      return `${post.author} ${post.content}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  }, [posts, searchTerm]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const removePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id));
  };

  const openDialog = (postId: string, type: 'approve' | 'reject') => {
    setSelectedPostId(postId);
    setDialogType(type);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedPostId) return;

    try {
      if (dialogType === 'approve') {
        await api.put(`/warden/moderation/${selectedPostId}/approve`);
        removePost(selectedPostId);
      } else if (dialogType === 'reject' && rejectionReason.trim()) {
        await api.put(`/warden/moderation/${selectedPostId}/reject`, { reason: rejectionReason.trim() });
        removePost(selectedPostId);
        setRejectionReason('');
      } else if (dialogType === 'delete') {
        await api.delete(`/warden/moderation/${selectedPostId}`);
        removePost(selectedPostId);
      }
      setIsOpen(false);
      setDialogType(null);
      setSelectedPostId(null);
      fetchPosts(); // Refresh list to sync performer names and final status
    } catch (error) {
      console.error("Action failed:", error);
      alert("Action failed. Please try again.");
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
        </div>
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end mb-6">
          <div className="flex-1 w-full">
            <Skeleton className="h-4 w-16 mb-2 rounded-md" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>

        {/* List of cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4 mb-2 rounded-md" />
              <Skeleton className="h-4 w-1/2 mb-6 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
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
            Community Moderation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2 font-medium"
          >
            Review and moderate community posts and content.
          </motion.p>
        </div>
      </div>

      <motion.div variants={itemVariants} className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 w-full">
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search pending posts by author or content..."
                className="pl-10 h-12 rounded-full bg-white border-slate-200"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 flex-1">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedPosts.length === 0 ? (
          <Card className="border border-dashed py-12 text-center">
            <p className="text-muted-foreground">No posts found</p>
          </Card>
        ) : (
          paginatedPosts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const isTruncated = isTextTruncated(post.content);

            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow rounded-3xl border-slate-200/60">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 flex-1">
                        <img 
                          src={getAvatarUrl(post.author)} 
                          alt={post.author} 
                          className="w-10 h-10 rounded-full flex-shrink-0 object-cover border border-slate-100 bg-slate-50" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{post.author}</p>
                          <p className="text-xs text-slate-500">{post.dateTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
                          Pending
                        </Badge>
                      </div>
                    </div>

                    <p className="text-slate-800 text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap font-medium">
                      {renderContent(
                        expandedPostId === post.id
                          ? post.content
                          : truncateText(post.content, 200)
                      )}
                    </p>
                    
                    {post.mediaUrl && (
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 mt-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                        <img src={getMediaUrl(post.mediaUrl)} alt="Post attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {isTruncated && !isExpanded && (
                        <button
                          onClick={() => setExpandedPostId(post.id)}
                          className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Read more
                        </button>
                      )}
                      {isTruncated && isExpanded && (
                        <button
                          onClick={() => setExpandedPostId(null)}
                          className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Show less
                        </button>
                      )}
                    </div>

                    {post.type === 'poll' && post.pollOptions && (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                        {post.pollOptions.slice(0, 4).map((option) => (
                          <div key={option._id} className="text-sm text-slate-700 p-2 bg-white rounded border border-slate-200 cursor-not-allowed">
                            {option.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-full px-4"
                        onClick={() => openDialog(post.id, 'approve')}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs rounded-full px-4"
                        onClick={() => openDialog(post.id, 'reject')}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' && 'Approve Post'}
              {dialogType === 'reject' && 'Reject Post'}
              {dialogType === 'delete' && 'Delete Moderation Record'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve' && 'Are you sure you want to approve this post?'}
              {dialogType === 'reject' && 'Please provide a rejection reason.'}
              {dialogType === 'delete' && 'This will permanently remove this moderation record. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {dialogType === 'reject' && (
            <div className="space-y-2 py-4">
              <Textarea
                placeholder={'Why is this being rejected?'}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24 break-all p-3"
                maxLength={200}
              />
              <p className="text-[10px] text-slate-400 text-right">
                {rejectionReason.length}/200
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                (dialogType === 'reject' && !rejectionReason.trim())
              }
              className={
                dialogType === 'reject' || dialogType === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-950 text-white'
              }
            >
              {dialogType === 'approve' && 'Approve'}
              {dialogType === 'reject' && 'Reject'}
              {dialogType === 'delete' && 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </motion.div>
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          {previewMedia && (
            <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
              {previewMedia.type?.startsWith('video') ? (
                <video src={getMediaUrl(previewMedia.url)} controls className="max-w-full max-h-full rounded-lg" autoPlay />
              ) : previewMedia.type?.includes('pdf') ? (
                <iframe src={getMediaUrl(previewMedia.url)} className="w-full h-full bg-white rounded-lg" title="PDF Preview" />
              ) : (
                <img src={getMediaUrl(previewMedia.url)} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full z-50 bg-black/20"
                onClick={() => setPreviewMedia(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
