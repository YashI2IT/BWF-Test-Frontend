'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Hash, MessageSquarePlus, Pencil, Pin, Search, Send, Trash2, Vote, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/warden/Template/components/ui/alert-dialog';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import api from '@/app/lib/api';

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

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-lime-100 text-lime-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

const hostelLabel = (hostelName: CommunityPost['hostelName']) =>
  typeof hostelName === 'string' ? hostelName : hostelName?.name || 'Hostel';

const toDisplayDate = (post: CommunityPost) => {
  const dateValue = post.date ? new Date(post.date) : new Date();
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateValue);
};

const totalVotes = (post: CommunityPost) => post.pollOptions.reduce((sum, option) => sum + option.votes, 0);
const initialFor = (name: string) => name.trim().charAt(0).toUpperCase() || 'W';

const avatarColorFor = (seed: string | number) => {
  const value = String(seed);
  const hash = Array.from(value).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  return avatarColors[hash % avatarColors.length];
};

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
        <strong key={`${part}-${index}`} className="font-bold text-slate-950">
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
        <h3 key={`${line}-${index}`} className="mb-2 text-base font-bold leading-6 text-slate-950">
          {heading[1].trim()}
        </h3>
      );
    }

    return line.trim() ? (
      <p key={`${line}-${index}`} className="text-sm leading-6 text-slate-700 break-words">
        {renderInlineContent(line)}
      </p>
    ) : null;
  });

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [section, setSection] = useState<FeedSection>('latest');
  const [draftType, setDraftType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [pollInputs, setPollInputs] = useState<string[]>(emptyPollInputs);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<PostType>('text');
  const [editingContent, setEditingContent] = useState('');
  const [editingTagInput, setEditingTagInput] = useState('');
  const [editingPollInputs, setEditingPollInputs] = useState<string[]>(emptyPollInputs);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/warden/posts');
      setPosts(res.data.map(normalizePost));
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to load posts.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPosts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return posts
      .filter((post) => (section === 'pinned' ? post.pinned : true))
      .filter((post) => {
        if (!query) return true;
        const searchable = `${post.author} ${post.creatorRole} ${post.tags.join(' ')} ${post.content}`.toLowerCase();
        return searchable.includes(query);
      })
      .sort((a, b) => {
        const left = new Date(`${b.date}T${b.time}`).getTime();
        const right = new Date(`${a.date}T${a.time}`).getTime();
        return left - right;
      });
  }, [posts, searchTerm, section]);

  const resetDraft = () => {
    setContent('');
    setTagInput('');
    setPollInputs(emptyPollInputs);
    setDraftType('text');
  };

  const validateDraft = () => {
    if (!content.trim()) {
      alert('Post content is required.');
      return false;
    }

    if (draftType === 'poll') {
      const validOptions = pollInputs.map((option) => option.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        alert('Poll requires at least 2 options.');
        return false;
      }
      if (validOptions.length > 4) {
        alert('Poll can have at most 4 options.');
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
      const res = await api.post('/warden/posts', buildDraftPayload());
      setPosts((current) => [normalizePost(res.data.post), ...current]);
      resetDraft();
      setSection('latest');
      setIsPublishConfirmOpen(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to publish post.'));
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
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditingType('text');
    setEditingContent('');
    setEditingTagInput('');
    setEditingPollInputs(emptyPollInputs);
  };

  const saveEditing = async (post: CommunityPost) => {
    if (!editingContent.trim()) {
      alert('Post content is required.');
      return;
    }

    const trimmedOptions = editingPollInputs.map((option) => option.trim()).filter(Boolean);
    if (editingType === 'poll' && trimmedOptions.length < 2) {
      alert('Poll requires at least 2 options.');
      return;
    }

    try {
      const payload = {
        content: editingContent.trim(),
        type: editingType,
        tags: parseTagInput(editingTagInput),
        pollOptions: editingType === 'poll' ? trimmedOptions : [],
      };

      const res = await api.put(`/warden/posts/${post._id}`, payload);
      const updatedPost = normalizePost(res.data);
      setPosts((current) => current.map((item) => (item._id === post._id ? updatedPost : item)));
      cancelEditing();
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to update post.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`/warden/posts/${deleteTarget._id}`);
      setPosts((current) => current.filter((post) => post._id !== deleteTarget._id));
      if (editingPostId === deleteTarget._id) {
        cancelEditing();
      }
      setDeleteTarget(null);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to delete post.'));
    }
  };

  const handleVote = async (post: CommunityPost, optionIndex: number) => {
    try {
      const res = await api.post(`/warden/posts/${post._id}/vote`, { optionIndex });
      setPosts((current) => current.map((item) => (item._id === post._id ? res.data.post : item)));
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to vote.'));
    }
  };

  const togglePin = async (post: CommunityPost) => {
    try {
      const res = await api.put(`/warden/posts/${post._id}/pin`, { pinned: !post.pinned });
      const updatedPost = normalizePost(res.data);
      setPosts((current) => current.map((item) => (item._id === post._id ? updatedPost : item)));
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to update pin status.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="sticky top-14 z-30 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or #hashtag"
              className="h-11 w-full rounded-xl border-slate-200 bg-white pl-11 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
          <section className="order-2 min-w-0 space-y-4 xl:order-1">
            <div className="space-y-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Your Feed</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSection('latest')}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${section === 'latest' ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950'}`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setSection('pinned')}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${section === 'pinned' ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950'}`}
                >
                  Pinned
                </button>
              </div>
            </div>

            <div className="space-y-4 pb-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="min-w-0 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="mt-5 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </Card>
                ))
              ) : filteredPosts.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-white shadow-sm">
                  <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
                    <Search className="mb-3 h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-800">No posts found</p>
                    <p className="mt-1 text-sm text-slate-500">Try another name or hashtag.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => {
                  const votes = totalVotes(post);
                  const isOwnPost = Boolean(post.canManage);
                  const isEditing = editingPostId === post._id;

                  return (
                    <article key={post._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor(`${post.author}-${post.id}`)}`}>
                            {initialFor(post.author)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-sm font-bold text-slate-950">{post.author}</h2>
                              {post.pinned && (
                                <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                  <Pin className="h-3 w-3" /> Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {toDisplayDate(post)} at {post.time} | {hostelLabel(post.hostelName)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700 capitalize">
                            {post.creatorRole}
                          </Badge>
                          {isOwnPost && !isEditing && (
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="icon" onClick={() => togglePin(post)} className="h-8 w-8 text-slate-500 hover:text-amber-600">
                                <Pin className={`h-4 w-4 ${post.pinned ? 'fill-current text-amber-600' : ''}`} />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => startEditing(post)} className="h-8 w-8 text-slate-500 hover:text-blue-700">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(post)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-5 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                          <Select value={editingType} onValueChange={(value) => setEditingType(value as PostType)}>
                            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="poll">Poll</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={editingContent}
                            onChange={(event) => setEditingContent(event.target.value)}
                            className="min-h-28 resize-none rounded-lg border-slate-200 bg-white text-sm leading-6"
                          />
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              value={editingTagInput}
                              onChange={(event) => setEditingTagInput(event.target.value)}
                              placeholder="Tags separated by commas"
                              className="h-10 rounded-lg border-slate-200 bg-white pl-10 text-sm"
                            />
                          </div>
                          {editingType === 'poll' && (
                            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
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
                                    className="h-9 rounded-lg text-sm"
                                  />
                                  {editingPollInputs.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingPollInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                      className="h-9 w-9 shrink-0 text-slate-500 hover:text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {editingPollInputs.length < 4 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditingPollInputs((current) => [...current, ''])}
                                  className="h-9 w-full border-dashed text-xs"
                                >
                                  Add option
                                </Button>
                              )}
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={cancelEditing} className="h-9 gap-2">
                              <X className="h-4 w-4" /> Cancel
                            </Button>
                            <Button type="button" onClick={() => saveEditing(post)} className="h-9 gap-2 bg-blue-700 text-white hover:bg-blue-800">
                              <Check className="h-4 w-4" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-2">{renderPostContent(post.content)}</div>
                      )}

                      {!isEditing && post.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSearchTerm(tag)}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {!isEditing && post.type === 'poll' && (
                        <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span className="flex items-center gap-2"><Vote className="h-4 w-4 text-blue-600" /> Poll</span>
                            <span>{votes} total votes</span>
                          </div>
                          {post.pollOptions.map((option, index) => {
                            const percent = votes ? Math.round((option.votes / votes) * 100) : 0;
                            const isVoted = post.userVote === index;
                            return (
                              <div key={`${post._id}-${option.text}`} className={`w-full rounded-lg border p-3 ${isVoted ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                                <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-800">
                                  <span>{option.text}</span>
                                  <div className="flex items-center gap-2">
                                    <span>{percent}%</span>
                                    <Button
                                      type="button"
                                      variant={isVoted ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleVote(post, index)}
                                      className={`h-7 px-2 text-xs ${isVoted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                    >
                                      {isVoted ? 'Voted' : 'Vote'}
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <aside className="order-1 xl:order-2 xl:sticky xl:top-28 xl:self-start">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                      <MessageSquarePlus className="h-4 w-4" /> Warden Post
                    </p>
                    <h2 className="mt-1 text-base font-bold text-slate-950">Create post</h2>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor('warden-community')}`}>
                    W
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setDraftType('text')}
                      className={`rounded-md px-3 py-2 transition ${draftType === 'text' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftType('poll')}
                      className={`rounded-md px-3 py-2 transition ${draftType === 'poll' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      Poll
                    </button>
                  </div>

                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Use #Heading# on its own line for bold heading text."
                    className="min-h-24 resize-none rounded-lg border-slate-200 bg-slate-50 text-sm leading-6 md:min-h-28"
                  />

                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Tags separated by commas"
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm"
                    />
                  </div>

                  {draftType === 'poll' && (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                            className="h-9 rounded-lg bg-white text-sm"
                          />
                          {pollInputs.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPollInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                              className="h-9 w-9 shrink-0 text-slate-500 hover:text-red-600"
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
                          className="h-9 w-full border-dashed text-xs"
                        >
                          Add option
                        </Button>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="h-10 w-full gap-2 bg-blue-700 text-white hover:bg-blue-800">
                    <Send className="h-4 w-4" />
                    Publish as warden
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Post to community?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will publish the post to the hostel community feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl border-none bg-slate-100 text-slate-600 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={isSubmitting}
              className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold px-8"
            >
              {isSubmitting ? 'Posting...' : 'Post now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will remove the post from the community feed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl border-none bg-slate-100 text-slate-600 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-8">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
