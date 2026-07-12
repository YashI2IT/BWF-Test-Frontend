'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Check, X, Forward, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/warden/Template/components/ui/dialog';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import api from '@/app/lib/api';
import { useEffect } from 'react';

type Status = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded';

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
  forwardReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  forwardedBy?: string;
}

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Forwarded'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-50 text-green-700 border border-green-100';
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border border-red-100';
    case 'Forwarded':
      return 'bg-slate-100 text-slate-800 border border-slate-200';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};

const getInitialColor = (name: string) => {
  const colors = [
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-yellow-100 text-yellow-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
};

const truncateText = (text: string, charLimit = 200) => {
  return text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
};

const isTextTruncated = (text: string, charLimit = 200) => {
  return text.length > charLimit;
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
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [forwardReason, setForwardReason] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'forward' | 'delete' | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/warden/moderation/pending');
      const normalizedData = response.data.map((item: any) => ({
        id: item._id,
        author: item.author,
        content: item.content,
        dateTime: `${new Date(item.date).toLocaleDateString()} ${item.time}`,
        status: item.status,
        type: item.type,
        hashtags: item.tags, // backend uses tags for hashtags
        pollOptions: item.pollOptions,
        rejectionReason: item.rejectionReason,
        forwardReason: item.forwardReason,
        approvedBy: item.approvedBy?.name,
        rejectedBy: item.rejectedBy?.name,
        forwardedBy: item.forwardedBy?.name
      }));
      setPosts(normalizedData);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const ITEMS_PER_PAGE = 10;

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus = statusFilter === 'All' || post.status === statusFilter;
      const matchesSearch = `${post.author} ${post.content}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [posts, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateStatus = (id: string, status: Status, reason?: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== id) return post;
        return {
          ...post,
          status,
          rejectionReason: status === 'Rejected' ? reason : post.rejectionReason,
          forwardReason: status === 'Forwarded' ? reason : post.forwardReason,
        };
      })
    );
  };

  const openDialog = (postId: string, type: 'approve' | 'reject' | 'forward') => {
    setSelectedPostId(postId);
    setDialogType(type);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedPostId) return;

    try {
      if (dialogType === 'approve') {
        await api.put(`/warden/moderation/${selectedPostId}/approve`);
        updateStatus(selectedPostId, 'Approved');
      } else if (dialogType === 'reject' && rejectionReason.trim()) {
        await api.put(`/warden/moderation/${selectedPostId}/reject`, { reason: rejectionReason.trim() });
        updateStatus(selectedPostId, 'Rejected', rejectionReason.trim());
        setRejectionReason('');
      } else if (dialogType === 'forward' && forwardReason.trim()) {
        await api.put(`/warden/moderation/${selectedPostId}/forward`, { reason: forwardReason.trim() });
        updateStatus(selectedPostId, 'Forwarded', forwardReason.trim());
        setForwardReason('');
      } else if (dialogType === 'delete') {
        await api.delete(`/warden/moderation/${selectedPostId}`);
        setPosts((prev) => prev.filter((p) => p.id !== selectedPostId));
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

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Community Moderation</h1>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
            <span>Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-500 font-semibold">Moderation</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search posts by author or content..."
                className="pl-10 h-12 rounded-2xl bg-slate-50"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : paginatedPosts.length === 0 ? (
          <Card className="border border-dashed py-12 text-center">
            <p className="text-muted-foreground">No posts found</p>
          </Card>
        ) : (
          paginatedPosts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const isTruncated = isTextTruncated(post.content);
            const displayContent = isExpanded ? post.content : truncateText(post.content);

            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getInitialColor(post.author)}`}>
                          {post.author.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{post.author}</p>
                          <p className="text-xs text-slate-500">{post.dateTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getStatusColor(post.status)} flex-shrink-0`}>
                          {post.status}
                        </Badge>
                        {(post.status === 'Approved' || post.status === 'Rejected') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => {
                              setSelectedPostId(post.id);
                              setDialogType('delete');
                              setIsOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {renderContent(displayContent)}
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

                    {post.status === 'Rejected' && post.rejectionReason && (
                      <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                        <p className="font-semibold flex justify-between items-center">
                          <span>Rejection Reason</span>
                          {post.rejectedBy && <span className="text-[10px] opacity-70">By: {post.rejectedBy}</span>}
                        </p>
                        <p className="text-red-600 text-xs mt-1 break-words">{post.rejectionReason}</p>
                      </div>
                    )}

                    {post.status === 'Forwarded' && post.forwardReason && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                        <p className="font-semibold flex justify-between items-center">
                          <span>Forwarded Note</span>
                          {post.forwardedBy && <span className="text-[10px] opacity-70">By: {post.forwardedBy}</span>}
                        </p>
                        <p className="text-slate-600 text-xs mt-1 break-words">{post.forwardReason}</p>
                      </div>
                    )}

                    {post.status === 'Approved' && post.approvedBy && (
                      <div className="text-[11px] text-slate-400 font-medium italic">
                        Approved by {post.approvedBy}
                      </div>
                    )}

                    {post.status === 'Pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => openDialog(post.id, 'approve')}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-xs"
                          onClick={() => openDialog(post.id, 'forward')}
                        >
                          <Forward className="w-3 h-3 mr-1" />
                          Forward
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs"
                          onClick={() => openDialog(post.id, 'reject')}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
              {dialogType === 'forward' && 'Forward to Admin'}
              {dialogType === 'delete' && 'Delete Moderation Record'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve' && 'Are you sure you want to approve this post?'}
              {dialogType === 'reject' && 'Please provide a rejection reason.'}
              {dialogType === 'forward' && 'Please provide a note for the admin.'}
              {dialogType === 'delete' && 'This will permanently remove this moderation record. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {(dialogType === 'reject' || dialogType === 'forward') && (
            <div className="space-y-2 py-4">
              <Textarea
                placeholder={dialogType === 'reject' ? 'Why is this being rejected?' : 'Why should this be forwarded?'}
                value={dialogType === 'reject' ? rejectionReason : forwardReason}
                onChange={(e) => {
                  if (dialogType === 'reject') {
                    setRejectionReason(e.target.value);
                  } else {
                    setForwardReason(e.target.value);
                  }
                }}
                className="min-h-24 break-all p-3"
                maxLength={200}
              />
              <p className="text-[10px] text-slate-400 text-right">
                {(dialogType === 'reject' ? rejectionReason : forwardReason).length}/200
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
                (dialogType === 'reject' && !rejectionReason.trim()) ||
                (dialogType === 'forward' && !forwardReason.trim())
              }
              className={
                dialogType === 'reject' || dialogType === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-950 text-white'
              }
            >
              {dialogType === 'approve' && 'Approve'}
              {dialogType === 'reject' && 'Reject'}
              {dialogType === 'forward' && 'Forward'}
              {dialogType === 'delete' && 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
