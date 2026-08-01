/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, X, Trash2, Pin, MessageSquarePlus, Activity } from "lucide-react";
import { adminAPI } from "../lib/api";
import { Card, CardContent } from "@/app/warden/Template/components/ui/card";
import { Button } from "@/app/warden/Template/components/ui/button";
import { Badge } from "@/app/warden/Template/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/warden/Template/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/warden/Template/components/ui/select";
import { Textarea } from "@/app/warden/Template/components/ui/textarea";
import { Input } from "@/app/warden/Template/components/ui/input";
import { Skeleton } from "@/app/warden/Template/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/app/warden/Template/components/ui/dialog";

function CommunitySkeleton() {
  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <Skeleton className="h-10 w-64 rounded-xl mb-3" />
            <Skeleton className="h-5 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm">
          <Skeleton className="h-12 w-full md:w-64 rounded-xl" />
          <div className="flex gap-3 w-full md:w-auto">
            <Skeleton className="h-12 w-full md:w-[150px] rounded-xl" />
            <Skeleton className="h-12 w-full md:w-[150px] rounded-xl" />
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-48 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PendingPost {
  _id: string; content: string; type: "text" | "poll";
  tags: string[]; pollOptions: { text: string }[];
  creatorName: string; creatorRole: string; hostelName: string;
  status: string; rejectionReason: string; createdAt: string;
  mediaUrl?: string; mediaType?: string;
}

interface LivePost {
  _id: string; content: string; type: "text" | "poll";
  tags: string[]; pollOptions: { text: string; votes: number }[];
  creatorName: string; creatorRole: string; hostelName: string;
  pinned: boolean; createdAt: string;
  mediaUrl?: string; mediaType?: string;
}

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-600 hover:bg-red-100",
};

const HOMES = ["Jammu","Anantnag","Kupwara","Beerwah"];

function renderContent(text: string) {
  const parts = text.split(/#([^#]+)#/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{p}</strong> : p);
}

const getMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  const normalizedPath = url.replace(/\\/g, '/');
  return `${baseUrl}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
};

export default function CommunityPage() {
  const [tab, setTab] = useState<"pending"|"live">("pending");
  const [pending, setPending] = useState<PendingPost[]>([]);
  const [live, setLive] = useState<LivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterHome, setFilterHome] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [previewMedia, setPreviewMedia] = useState<{url: string, type?: string} | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ content:"", type:"text", tags:"", hostelName:"Jammu" });
  const [saving, setSaving] = useState(false);

  const flash = (m: string, isErr = false) => { 
    if (isErr) { setError(m); } else { setMsg(m); } 
    setTimeout(() => { setMsg(""); setError(""); }, 4000); 
  };

  const loadPending = () => {
    const p: Record<string,string> = { status: filterStatus };
    if (filterHome && filterHome !== "all") p.hostelName = filterHome;
    adminAPI.getPendingPosts(p).then(d => { setPending(d as PendingPost[]); setLoading(false); }).catch(e => { flash(e.message, true); setLoading(false); });
  };

  const loadLive = () => {
    const p: Record<string,string> = {};
    if (filterHome && filterHome !== "all") p.hostelName = filterHome;
    adminAPI.getLivePosts(p).then(d => { setLive(d as LivePost[]); setLoading(false); }).catch(e => { flash(e.message, true); setLoading(false); });
  };

  useEffect(() => { setLoading(true); if (tab === "pending") loadPending(); else loadLive(); }, [tab, filterHome, filterStatus]);

  const reviewPost = async (id: string, status: "approved"|"rejected") => {
    let rejectionReason = "";
    if (status === "rejected") { const r = prompt("Reason for rejection:"); if (r === null) return; rejectionReason = r; }
    try { await adminAPI.reviewPendingPost(id, { status, rejectionReason }); flash(`Post ${status}!`); loadPending(); }
    catch (e: unknown) { flash((e as Error).message, true); }
  };

  const deleteP = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try { await adminAPI.deletePendingPost(id); flash("Deleted."); loadPending(); }
    catch (e: unknown) { flash((e as Error).message, true); }
  };

  const deleteL = async (id: string) => {
    if (!confirm("Delete live post?")) return;
    try { await adminAPI.deleteLivePost(id); flash("Deleted."); loadLive(); }
    catch (e: unknown) { flash((e as Error).message, true); }
  };

  const pin = async (id: string) => {
    try { const r = await adminAPI.togglePinPost(id) as { message: string }; flash(r.message); loadLive(); }
    catch (e: unknown) { flash((e as Error).message, true); }
  };

  const compose = async () => {
    if (!form.content) return;
    setSaving(true);
    try {
      await adminAPI.createLivePost({ content: form.content, type: form.type, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean), hostelName: form.hostelName });
      flash("Post published to live feed!"); setShowCompose(false); setForm({ content:"", type:"text", tags:"", hostelName:"Jammu" }); loadLive();
    } catch (e: unknown) { flash((e as Error).message, true); }
    setSaving(false);
  };

  const pendingCount = pending.filter(p => p.status === "pending").length;

  if (loading) {
    return <CommunitySkeleton />;
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Admin Community
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Moderate pending posts from students, manage the live feed, and pin important announcements.
          </p>
        </div>
        
        {tab === "live" && (
          <Button onClick={() => setShowCompose(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20">
            <MessageSquarePlus className="w-4 h-4 mr-2" /> Admin Post
          </Button>
        )}
      </motion.div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm">
          {msg}
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600 shadow-sm">
          {error}
        </motion.div>
      )}

      {/* Modern Tab Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pending"|"live")} className="w-full md:w-auto">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg px-4 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
              Pending Review {pendingCount > 0 && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="live" className="rounded-lg px-4 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
              Live Feed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={filterHome} onValueChange={setFilterHome}>
            <SelectTrigger className="w-full md:w-[150px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="All Homes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>

          {tab === "pending" && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px] bg-slate-50 border-slate-200 rounded-xl capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            
            {tab === "pending" && pending.length === 0 && (
              <motion.div variants={itemVariants} className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center">
                <Activity className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No posts in this queue.</p>
              </motion.div>
            )}
            
            {tab === "live" && live.length === 0 && (
              <motion.div variants={itemVariants} className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center">
                <Activity className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No live posts yet.</p>
              </motion.div>
            )}

            {/* Pending Posts List */}
            {tab === "pending" && pending.map(post => (
              <motion.div key={post._id} variants={itemVariants} layoutId={post._id}>
                <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden flex flex-col relative group transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm border border-slate-200/50">
                          {(post.creatorName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{post.creatorName || "Unknown"}</p>
                          <p className="text-xs font-medium text-slate-500 capitalize">{post.creatorRole} • {post.hostelName} • {new Date(post.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className={STATUS_BADGE[post.status] || "bg-slate-100 text-slate-700"}>{post.status}</Badge>
                        {post.type === "poll" && <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-200/50 hover:bg-indigo-50">📊 Poll</Badge>}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl">{renderContent(post.content)}</p>

                    {post.mediaUrl && (
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 mt-4 cursor-pointer" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                        <img src={getMediaUrl(post.mediaUrl)} alt="Post attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {post.type === "poll" && post.pollOptions.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {post.pollOptions.map((opt, i) => (
                          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm flex items-center justify-center text-center">{opt.text}</div>
                        ))}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map(t => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200/60">#{t}</span>)}
                      </div>
                    )}

                    {post.rejectionReason && (
                      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
                        <X className="w-4 h-4" /> Rejection reason: {post.rejectionReason}
                      </div>
                    )}

                    {post.status === "pending" && (
                      <div className="flex gap-3 pt-2">
                        <Button onClick={() => reviewPost(post._id, "approved")} className="flex-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-none">
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button onClick={() => reviewPost(post._id, "rejected")} variant="secondary" className="flex-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 shadow-none">
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button onClick={() => deleteP(post._id)} variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Live Posts List */}
            {tab === "live" && live.map(post => (
              <motion.div key={post._id} variants={itemVariants} layoutId={post._id}>
                <Card className={`rounded-[32px] border-none shadow-sm overflow-hidden flex flex-col relative group transition-all duration-300 ${post.pinned ? "bg-amber-50/20" : "bg-white hover:shadow-md"}`}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {post.pinned && <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Pin className="w-4 h-4" /></div>}
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm border border-slate-200/50">
                          {(post.creatorName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{post.creatorName}</p>
                          <p className="text-xs font-medium text-slate-500 capitalize">{post.creatorRole} • {post.hostelName} • {new Date(post.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      {post.type === "poll" && <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-200/50 hover:bg-indigo-50">📊 Poll</Badge>}
                    </div>

                    <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl">{renderContent(post.content)}</p>

                    {post.mediaUrl && (
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 mt-4 cursor-pointer" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                        <img src={getMediaUrl(post.mediaUrl)} alt="Post attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {post.type === "poll" && post.pollOptions.length > 0 && (
                      <div className="space-y-3 mt-3">
                        {post.pollOptions.map((opt, i) => {
                          const total = post.pollOptions.reduce((s, o) => s + o.votes, 0);
                          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                          return (
                            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative h-10 flex items-center px-4">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="absolute inset-y-0 left-0 bg-blue-100/50 transition-all duration-500" />
                              <div className="relative w-full flex justify-between text-sm font-medium text-slate-700">
                                <span>{opt.text}</span>
                                <span className="text-slate-500">{opt.votes} ({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map(t => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200/60">#{t}</span>)}
                      </div>
                    )}

                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <Button onClick={() => pin(post._id)} variant="secondary" className={`rounded-xl shadow-none text-xs font-semibold ${post.pinned ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        <Pin className="w-3 h-3 mr-2" /> {post.pinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button onClick={() => deleteL(post._id)} variant="ghost" className="rounded-xl text-red-500 hover:bg-red-50 text-xs font-semibold">
                        <Trash2 className="w-3 h-3 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Post</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Posts directly to the live feed.</p>
                </div>
                <button onClick={() => setShowCompose(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Type</label>
                    <Select value={form.type} onValueChange={v => setForm({...form, type:v})}>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="poll">Poll</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Home</label>
                    <Select value={form.hostelName} onValueChange={v => setForm({...form, hostelName:v})}>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content</label>
                  <Textarea rows={4} value={form.content} onChange={e => setForm({...form, content:e.target.value})} placeholder="Write your post... use #bold text# for emphasis" className="w-full rounded-2xl border-slate-200 bg-slate-50 resize-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tags</label>
                  <Input value={form.tags} onChange={(e: any) => setForm({...form, tags:e.target.value})} placeholder="sports, event, announcement" className="w-full rounded-xl border-slate-200 bg-slate-50 h-11" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={() => setShowCompose(false)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={compose} disabled={saving} className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                    {saving ? "Publishing..." : "Publish to Feed"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
