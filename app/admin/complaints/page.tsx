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
import { MessageSquareWarning, ShieldAlert, CheckCircle2, Search, X, MapPin, User, Clock, AlertTriangle, AlertCircle, MessageCircle } from "lucide-react";

interface Complaint {
  _id: string; title: string; description: string; location: string;
  role: "student"|"staff"; priority: "Low"|"Medium"|"High";
  status: "OPEN"|"RESOLVED"|"ESCALATED";
  reporter: string; hostelName: string;
  timeline: {
    reportedDate: string; resolvedReason?: string; escalatedReason?: string;
    resolvedDate?: string; escalatedDate?: string;
  };
  createdAt: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200/50",
  Medium: "bg-amber-50 text-amber-700 border-amber-200/50",
  Low: "bg-slate-100 text-slate-700 border-slate-200/50",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200/50",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  ESCALATED: "bg-orange-50 text-orange-700 border-orange-200/50",
};

const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];

export default function ComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterHome, setFilterHome] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<"resolve"|"escalate"|null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    if (filterPriority && filterPriority !== "all") p.priority = filterPriority;
    if (filterHome && filterHome !== "all") p.hostelName = filterHome;
    adminAPI.getComplaints(p)
      .then(d => { setItems(d as Complaint[]); setLoading(false); })
      .catch(e => { flash(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterStatus, filterPriority, filterHome]);

  const act = async () => {
    if (!selected || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "resolve") {
        await adminAPI.resolveComplaint(selected._id, { resolvedReason: actionReason || "Resolved by admin" });
        flash("Complaint marked as resolved.");
      } else {
        await adminAPI.escalateComplaint(selected._id, { escalatedReason: actionReason || "Escalated by admin" });
        flash("Complaint escalated successfully.");
      }
      setSelected(null); setActionType(null); setActionReason(""); load();
    } catch (e: unknown) { flash((e as Error).message); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this complaint?")) return;
    try { await adminAPI.deleteComplaint(id); flash("Complaint deleted."); load(); }
    catch (e: unknown) { flash((e as Error).message); }
  };

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.reporter.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    open: items.filter(i => i.status === "OPEN").length,
    high: items.filter(i => i.priority === "High" && i.status === "OPEN").length,
    resolved: items.filter(i => i.status === "RESOLVED").length,
    escalated: items.filter(i => i.status === "ESCALATED").length,
  };

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
            Admin Complaints
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Review, resolve, or escalate facility and operational complaints across all homes.
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
          { label: "Open Complaints", value: counts.open, icon: MessageSquareWarning, color: counts.open > 0 ? "text-amber-600" : "text-slate-600", bg: counts.open > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: counts.open > 0 },
          { label: "High Priority", value: counts.high, icon: AlertTriangle, color: counts.high > 0 ? "text-red-600" : "text-slate-600", bg: counts.high > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50", warn: counts.high > 0 },
          { label: "Resolved", value: counts.resolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", warn: false },
          { label: "Escalated", value: counts.escalated, icon: ShieldAlert, color: counts.escalated > 0 ? "text-orange-600" : "text-slate-600", bg: counts.escalated > 0 ? "bg-orange-50 border border-orange-200" : "bg-slate-50", warn: counts.escalated > 0 },
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
      <div className="flex flex-col md:flex-row gap-3 bg-white p-2.5 rounded-2xl md:rounded-full border border-slate-200/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 stroke-[1.5]" />
          <Input 
            className="pl-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-transparent focus:border-blue-500 rounded-full w-full transition-colors"
            placeholder="Search by title or reporter..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[150px] h-11 px-4 bg-slate-50/50 hover:bg-slate-50 border-transparent rounded-full capitalize transition-colors">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["OPEN", "RESOLVED", "ESCALATED"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full md:w-[150px] h-11 px-4 bg-slate-50/50 hover:bg-slate-50 border-transparent rounded-full transition-colors">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {["High", "Medium", "Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterHome} onValueChange={setFilterHome}>
          <SelectTrigger className="w-full md:w-[150px] h-11 px-4 bg-slate-50/50 hover:bg-slate-50 border-transparent rounded-full transition-colors">
            <SelectValue placeholder="All Homes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Homes</SelectItem>
            {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid of Complaints */}
      {loading ? <p className="text-slate-500">Loading complaints...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/60">
              <MessageSquareWarning className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No complaints match your filters.</p>
            </div>
          ) : (
            filteredItems.map(c => (
              <Card key={c._id} className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col relative group">
                <div className="p-5 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className={`${PRIORITY_BADGE[c.priority] || "bg-slate-100 text-slate-700"} shadow-none font-bold border`}>{c.priority} Priority</Badge>
                    <Badge variant="outline" className={`${STATUS_BADGE[c.status] || "bg-slate-100 text-slate-700"} shadow-none font-bold border`}>{c.status}</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{c.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3 mb-4">{c.description}</p>
                  
                  <div className="space-y-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Reporter</span>
                      <span className="text-slate-900">{c.reporter} <span className="text-slate-400 capitalize">({c.role})</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</span>
                      <span className="text-slate-900">{c.location} <span className="text-slate-400">({c.hostelName})</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Reported</span>
                      <span className="text-slate-900">{new Date(c.timeline.reportedDate).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-end gap-2">
                  {c.status === "OPEN" ? (
                    <>
                      <Button size="sm" className="h-9 font-semibold bg-slate-900 hover:bg-slate-800 text-white flex-1 rounded-full shadow-sm" onClick={() => { setSelected(c); setActionType("escalate"); }}>Escalate</Button>
                      <Button size="sm" className="h-9 font-semibold bg-slate-900 hover:bg-slate-800 text-white flex-1 rounded-full shadow-sm" onClick={() => { setSelected(c); setActionType("resolve"); }}>Resolve</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-8 text-slate-500 hover:bg-slate-200 w-full rounded-full" onClick={() => del(c._id)}>Delete Record</Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {selected && actionType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${actionType === "resolve" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                    {actionType === "resolve" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{actionType} Complaint</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{selected.title}</p>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setActionType(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Action Notes</label>
                  <Textarea rows={4} value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder={actionType === "resolve" ? "How was this resolved?..." : "Why is this being escalated?..."} className="bg-slate-50 border-slate-200 rounded-3xl p-4 resize-none focus-visible:ring-1 focus-visible:ring-slate-400" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => { setSelected(null); setActionType(null); }} variant="outline" className="rounded-full h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={act} disabled={saving} className="rounded-full h-11 px-6 text-white shadow-sm bg-slate-900 hover:bg-slate-800">
                    {saving ? "Processing..." : `Confirm ${actionType}`}
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
