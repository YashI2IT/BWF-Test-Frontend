/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "../lib/api";
import PageSkeleton from "../components/PageSkeleton";
import { Card, CardContent } from "@/app/warden/Template/components/ui/card";
import { Button } from "@/app/warden/Template/components/ui/button";
import { Badge } from "@/app/warden/Template/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/warden/Template/components/ui/select";
import { Input } from "@/app/warden/Template/components/ui/input";
import { Textarea } from "@/app/warden/Template/components/ui/textarea";
import { MessageSquareHeart, Star, User, Building, Clock, CheckCircle2, Search, X, MessageSquareWarning, Filter } from "lucide-react";

interface Feedback {
  _id: string; submittedBy: string; role: string; home: string;
  category: string; message: string; rating?: number; anonymous: boolean;
  status: string; reviewedBy?: string; reviewNote?: string; createdAt: string;
}

const CATEGORIES = ["academics", "facilities", "food", "staff", "general", "other"];
const ROLES = ["student", "staff", "warden"];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200/50",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200/50",
  actioned: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
};

const STAR_COLORS = ["", "text-slate-300", "text-red-400 text-fill-red-400", "text-amber-400 text-fill-amber-400", "text-amber-500 text-fill-amber-500", "text-emerald-500 text-fill-emerald-500"];

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ submittedBy: "Admin", role: "admin", home: "Jammu", category: "general", message: "", rating: 5, anonymous: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    if (filterRole && filterRole !== "all") p.role = filterRole;
    if (filterCat && filterCat !== "all") p.category = filterCat;
    adminAPI.getFeedback(p)
      .then(d => { setItems(d as Feedback[]); setLoading(false); })
      .catch(e => { flash(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterStatus, filterRole, filterCat]);

  const markReviewed = async (id: string, status: string) => {
    try {
      await adminAPI.reviewFeedback(id, { status, reviewNote });
      flash(`Feedback marked as ${status}.`); setSelected(null); setReviewNote(""); load();
    } catch (e: unknown) { flash((e as Error).message); }
  };

  const submit = async () => {
    if (!form.message) return;
    setSaving(true);
    try {
      await adminAPI.addFeedback(form);
      flash("Feedback submitted successfully."); setShowAdd(false); 
      setForm({ submittedBy: "Admin", role: "admin", home: "Jammu", category: "general", message: "", rating: 5, anonymous: false });
      load();
    } catch (e: unknown) { flash((e as Error).message); }
    setSaving(false);
  };

  const avgRating = items.filter(i => i.rating).reduce((a, i) => a + (i.rating ?? 0), 0) / (items.filter(i => i.rating).length || 1);
  const newCount = items.filter(i => i.status === "new").length;

  const filteredItems = items.filter(i => 
    i.message.toLowerCase().includes(search.toLowerCase()) || 
    (!i.anonymous && i.submittedBy.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Admin Feedback
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Review feedback from students and staff. Identify areas for improvement.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20">
          <MessageSquareHeart className="w-4 h-4 mr-2" /> Submit Feedback
        </Button>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </motion.div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Feedback", value: items.length, icon: MessageSquareHeart, color: "text-blue-600", bg: "bg-blue-50", warn: false },
          { label: "New (Unreviewed)", value: newCount, icon: MessageSquareWarning, color: newCount > 0 ? "text-amber-600" : "text-slate-600", bg: newCount > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: newCount > 0 },
          { label: "Average Rating", value: `${avgRating.toFixed(1)} / 5`, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50", warn: false },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`rounded-[32px] border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative group ${k.warn ? "bg-amber-50/20" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${k.warn ? "text-amber-600" : "text-slate-900"}`}>{k.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${k.bg} ${k.color}`}>
                    <k.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl w-full"
            placeholder="Search feedback..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[150px] h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["new", "reviewed", "actioned"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full md:w-[150px] h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full md:w-[150px] h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? <p className="text-slate-500">Loading feedback...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/60">
              <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No feedback found matching criteria.</p>
            </div>
          ) : (
            filteredItems.map(f => (
              <Card key={f._id} onClick={() => setSelected(f)} className={`rounded-[32px] border-none bg-white shadow-sm overflow-hidden hover:shadow-md cursor-pointer transition-shadow flex flex-col relative group ${f.status === "new" ? "ring-1 ring-amber-300 bg-amber-50/10" : ""}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${STATUS_BADGE[f.status] || "bg-slate-100 text-slate-700"} shadow-none font-bold border capitalize`}>
                        {f.status}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none capitalize">{f.category}</Badge>
                    </div>
                    {f.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= f.rating! ? STAR_COLORS[f.rating!] : "text-slate-200"} ${n <= f.rating! && "fill-current"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-700 line-clamp-3 mb-4 leading-relaxed">{f.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-auto">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {f.anonymous ? "Anonymous" : f.submittedBy} <span className="capitalize">({f.role})</span></span>
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400"/> {f.home}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/> {new Date(f.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Detail / Action Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-xl rounded-[32px] bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <MessageSquareHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Feedback Review</h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize">{selected.category} Feedback</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div><p className="text-xs text-slate-500 font-medium">Author</p><p className="text-sm font-bold text-slate-900 mt-1">{selected.anonymous ? "Anonymous" : selected.submittedBy} <span className="capitalize text-slate-500 font-normal">({selected.role})</span></p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Rating</p>
                    {selected.rating ? (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(n => <Star key={n} className={`w-4 h-4 ${n <= selected.rating! ? STAR_COLORS[selected.rating!] : "text-slate-200"} ${n <= selected.rating! && "fill-current"}`} />)}
                      </div>
                    ) : <p className="text-sm font-bold text-slate-900 mt-1">—</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Content</h4>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                {selected.reviewNote && (
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Review / Action Note</h4>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-800">
                      {selected.reviewNote}
                      <p className="text-xs text-blue-600 mt-2 font-medium">Reviewed by {selected.reviewedBy}</p>
                    </div>
                  </div>
                )}

                {["new", "reviewed"].includes(selected.status) && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Action / Review Note</label>
                    <Textarea rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Required for marking as actioned..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none focus-visible:ring-1 focus-visible:ring-blue-500" />
                    
                    <div className="flex justify-end gap-3 pt-2">
                      {selected.status === "new" && <Button onClick={() => markReviewed(selected._id, "reviewed")} variant="outline" className="rounded-xl h-10 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Mark Reviewed</Button>}
                      <Button onClick={() => markReviewed(selected._id, "actioned")} disabled={!reviewNote.trim()} className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20">Mark Actioned</Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submit Feedback</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Provide insights or suggestions for the facility.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                    <Select value={form.category} onValueChange={v => setForm({...form, category:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl capitalize"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rating (1-5)</label>
                    <Input type="number" min="1" max="5" value={form.rating} onChange={e => setForm({...form, rating:parseInt(e.target.value)||5})} className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message *</label>
                  <Textarea rows={4} value={form.message} onChange={e => setForm({...form, message:e.target.value})} placeholder="Detailed feedback..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={submit} disabled={saving} className={`rounded-xl h-11 px-6 text-white shadow-sm bg-blue-600 hover:bg-blue-700 shadow-blue-600/20`}>
                    {saving ? "Sending..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
