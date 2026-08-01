/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/warden/Template/components/ui/tabs";
import { CalendarDays, MapPin, Clock, X, Plus, CheckCircle2, ShieldAlert, Users, Dumbbell, Laptop, BookOpen, HeartHandshake, PartyPopper, CalendarClock, Building } from "lucide-react";

interface Activity {
  _id: string; title: string; description: string;
  requestedBy: string; requesterRole: string;
  date: string; time: string; location: string;
  category: string; hostelName: string; status: string;
  approvedBy?: string; rejectionReason?: string; createdAt: string;
}

const CATEGORIES = ["Cultural", "Sports", "Technical", "Academic", "Social", "Entertainment"];
const CATEGORY_ICONS: Record<string, any> = {
  Cultural: Users, Sports: Dumbbell, Technical: Laptop, Academic: BookOpen, Social: HeartHandshake, Entertainment: PartyPopper
};

const STATUS_STYLE: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200/50",
  ongoing: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  completed: "bg-slate-100 text-slate-600 border-slate-200/50",
  cancelled: "bg-red-50 text-red-600 border-red-200/50",
  pending: "bg-amber-50 text-amber-700 border-amber-200/50",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  rejected: "bg-red-50 text-red-600 border-red-200/50",
};

const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];

export default function ActivitiesPage() {
  const [tab, setTab] = useState<string>("live");
  const [pending, setPending] = useState<Activity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [filterHome, setFilterHome] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [form, setForm] = useState({ title:"", description:"", date:"", time:"", location:"", category:"Cultural", hostelName:"Jammu" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const loadPending = () => {
    const p: Record<string, string> = { status: filterStatus };
    if (filterHome && filterHome !== "all") p.hostelName = filterHome;
    adminAPI.getPendingActivities(p).then(d => { setPending(d as Activity[]); setLoading(false); }).catch(e => { flash(e.message); setLoading(false); });
  };

  const loadLive = () => {
    const p: Record<string, string> = {};
    if (filterCat && filterCat !== "all") p.category = filterCat;
    if (filterHome && filterHome !== "all") p.hostelName = filterHome;
    adminAPI.getActivities(p).then(d => { setActivities(d as Activity[]); setLoading(false); }).catch(e => { flash(e.message); setLoading(false); });
  };

  useEffect(() => { setLoading(true); if (tab === "pending") loadPending(); else loadLive(); }, [tab, filterCat, filterHome, filterStatus]);

  const review = async (id: string, status: "approved"|"rejected") => {
    let rejectionReason = "";
    if (status === "rejected") { const r = prompt("Reason:"); if (r === null) return; rejectionReason = r; }
    try { await adminAPI.reviewPendingActivity(id, { status, rejectionReason }); flash(`Activity ${status}!`); loadPending(); }
    catch (e: unknown) { flash((e as Error).message); }
  };

  const del = async (id: string, isLive: boolean) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      if (isLive) { await adminAPI.deleteActivity(id); loadLive(); }
      else { await adminAPI.deletePendingActivity(id); loadPending(); }
      flash("Activity deleted successfully.");
    } catch (e: unknown) { flash((e as Error).message); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await adminAPI.updateActivity(id, { status }); flash(`Activity marked as ${status}.`); loadLive(); }
    catch (e: unknown) { flash((e as Error).message); }
  };

  const save = async () => {
    if (!form.title || !form.description || !form.date) return;
    setSaving(true);
    try {
      if (editItem) { await adminAPI.updateActivity(editItem._id, form); flash("Activity updated successfully."); }
      else { await adminAPI.createActivity(form); flash("Activity created successfully."); }
      setShowAdd(false); setEditItem(null); 
      setForm({ title:"", description:"", date:"", time:"", location:"", category:"Cultural", hostelName:"Jammu" }); 
      loadLive();
    } catch (e: unknown) { flash((e as Error).message); }
    setSaving(false);
  };

  const pendingCount = pending.filter(p => p.status === "pending").length;

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
            Admin Activities
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Approve warden requests, schedule upcoming events, and manage campus activities.
          </p>
        </div>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </motion.div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Pending Approval", value: pendingCount, icon: Clock, color: pendingCount > 0 ? "text-amber-600" : "text-slate-600", bg: pendingCount > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: pendingCount > 0 },
          { label: "Active Events", value: activities.filter(a => ["upcoming", "ongoing"].includes(a.status)).length, icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-50", warn: false },
          { label: "Completed", value: activities.filter(a => a.status === "completed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", warn: false },
          { label: "Cancelled", value: activities.filter(a => a.status === "cancelled").length, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", warn: false },
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

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto h-auto">
            <TabsTrigger value="live" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-sm">
              <CalendarDays className="w-4 h-4 mr-2" /> Live Activities
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-sm">
              <Clock className="w-4 h-4 mr-2" /> Pending Approval {pendingCount > 0 && <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>}
            </TabsTrigger>
          </TabsList>
          
          {tab === "live" && (
            <Button onClick={() => { setEditItem(null); setForm({ title:"", description:"", date:"", time:"", location:"", category:"Cultural", hostelName:"Jammu" }); setShowAdd(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20">
              <Plus className="w-4 h-4 mr-2" /> Create Activity
            </Button>
          )}
        </div>

        {/* Global Filters inside Tab content */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
          <Select value={filterHome} onValueChange={setFilterHome}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="All Homes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {tab === "live" && (
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50 border-slate-200 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {tab === "pending" && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50 border-slate-200 rounded-xl capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["pending", "approved", "rejected"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="live" className="mt-0">
          {loading ? <p className="text-slate-500">Loading activities...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/60">
                  <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No live activities found.</p>
                </div>
              ) : (
                activities.map(a => {
                  const Icon = CATEGORY_ICONS[a.category] || CalendarDays;
                  return (
                    <Card key={a._id} className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative">
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2.5 rounded-xl bg-slate-100 text-slate-600`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge variant="outline" className={`${STATUS_STYLE[a.status] || "bg-slate-100 text-slate-600"} capitalize shadow-none border font-bold`}>{a.status}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{a.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{a.description}</p>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-xs font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {new Date(a.date).toLocaleDateString("en-IN", { month:"short", day:"numeric" })} at {a.time}
                          </div>
                          <div className="flex items-center text-xs font-medium text-slate-600">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {a.location}
                          </div>
                          <div className="flex items-center text-xs font-medium text-slate-600">
                            <Building className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {a.hostelName} Home
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Select value={a.status} onValueChange={(v) => updateStatus(a._id, v)}>
                          <SelectTrigger className="h-8 w-[110px] text-xs bg-white border-slate-200 rounded-lg shadow-sm capitalize"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            {["upcoming", "ongoing", "completed", "cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => {
                            setEditItem(a);
                            setForm({ title:a.title, description:a.description, date:a.date, time:a.time, location:a.location, category:a.category, hostelName:a.hostelName });
                            setShowAdd(true);
                          }}>Edit</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => del(a._id, true)}>Delete</Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {loading ? <p className="text-slate-500">Loading pending requests...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/60">
                  <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No pending activity requests.</p>
                </div>
              ) : (
                pending.map(a => {
                  const Icon = CATEGORY_ICONS[a.category] || CalendarDays;
                  return (
                    <Card key={a._id} className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden flex flex-col relative group">
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2.5 rounded-xl bg-amber-50 text-amber-600`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge variant="outline" className={`${STATUS_STYLE[a.status] || "bg-slate-100 text-slate-600"} capitalize shadow-none border font-bold`}>{a.status}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{a.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{a.description}</p>
                        
                        <div className="mt-4 space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-slate-500">Requested By:</span>
                            <span className="text-slate-900">{a.requestedBy} <span className="text-slate-400 capitalize">({a.requesterRole.replace("_"," ")})</span></span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-slate-500">Home:</span>
                            <span className="text-slate-900">{a.hostelName}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-xs font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {new Date(a.date).toLocaleDateString("en-IN", { month:"short", day:"numeric" })} at {a.time}
                          </div>
                          <div className="flex items-center text-xs font-medium text-slate-600">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {a.location}
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-end gap-2">
                        {a.status === "pending" ? (
                          <>
                            <Button size="sm" variant="outline" className="h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 w-full" onClick={() => review(a._id, "rejected")}>Reject</Button>
                            <Button size="sm" className="h-9 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white w-full" onClick={() => review(a._id, "approved")}>Approve</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 text-slate-500 hover:bg-slate-200" onClick={() => del(a._id, false)}>Delete Record</Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{editItem ? "Edit Activity" : "Create New Activity"}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Directly schedule an admin-approved event.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Title *</label>
                  <Input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g., Annual Sports Meet" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description *</label>
                  <Textarea rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Event details and agenda..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date *</label>
                    <Input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time *</label>
                    <Input type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})} className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                    <Select value={form.category} onValueChange={v => setForm({...form, category:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Home / Target</label>
                    <Select value={form.hostelName} onValueChange={v => setForm({...form, hostelName:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
                  <Input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="e.g., Main Ground" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={save} disabled={saving} className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                    {saving ? "Saving..." : editItem ? "Update Activity" : "Create Activity"}
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
