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
import { AlertTriangle, LifeBuoy, CheckCircle2, ShieldAlert, FileText, User, MapPin, Search, X, MessageSquareWarning, Clock } from "lucide-react";

interface Grievance {
  _id: string; submittedBy: string; role: string; home: string;
  type: "sos" | "help"; subject: string; message: string;
  priority: string; status: string; emailSent: boolean;
  resolvedBy?: string; resolvedNote?: string; resolvedAt?: string;
  createdAt: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200/50",
  high: "bg-orange-50 text-orange-700 border-orange-200/50",
  medium: "bg-amber-50 text-amber-700 border-amber-200/50",
  low: "bg-slate-100 text-slate-700 border-slate-200/50",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-red-50 text-red-700 border-red-200/50",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200/50",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  closed: "bg-slate-100 text-slate-500 border-slate-200/50",
};

const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];

export default function GrievancesPage() {
  const [items, setItems] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Grievance | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ submittedBy: "Admin", role: "admin", home: "Jammu", type: "help", subject: "", message: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (filterType && filterType !== "all") p.type = filterType;
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    adminAPI.getGrievances(p)
      .then(d => { setItems(d as Grievance[]); setLoading(false); })
      .catch(e => { flash(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterType, filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminAPI.updateGrievance(id, { status, resolvedNote: resolveNote });
      flash(`Grievance marked as ${status.replace("_", " ")}.`);
      setSelected(null); setResolveNote(""); load();
    } catch (e: unknown) { flash((e as Error).message); }
  };

  const submit = async () => {
    if (!form.subject || !form.message) return;
    setSaving(true);
    try {
      await adminAPI.addGrievance(form);
      flash("Grievance submitted. Email alert sent to admin."); setShowAdd(false);
      setForm({ submittedBy: "Admin", role: "admin", home: "Jammu", type: "help", subject: "", message: "", priority: "medium" });
      load();
    } catch (e: unknown) { flash((e as Error).message); }
    setSaving(false);
  };

  const counts = { open: items.filter(i => i.status === "open").length, sos: items.filter(i => i.type === "sos").length };

  const filteredItems = items.filter(i => 
    i.subject.toLowerCase().includes(search.toLowerCase()) || 
    i.submittedBy.toLowerCase().includes(search.toLowerCase())
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
            Admin Grievances
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Manage high-priority SOS alerts and general grievances across all homes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setForm(f => ({...f, type:"help", priority:"medium"})); setShowAdd(true); }} variant="outline" className="h-11 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold shadow-sm">
            <LifeBuoy className="w-4 h-4 mr-2" /> Log Help Request
          </Button>
          <Button onClick={() => { setForm(f => ({...f, type:"sos", priority:"critical"})); setShowAdd(true); }} className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4 mr-2" /> Trigger SOS
          </Button>
        </div>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </motion.div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Open Grievances", value: counts.open, icon: MessageSquareWarning, color: counts.open > 0 ? "text-amber-600" : "text-slate-600", bg: counts.open > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: counts.open > 0 },
          { label: "Active SOS Alerts", value: counts.sos, icon: ShieldAlert, color: counts.sos > 0 ? "text-red-600" : "text-slate-600", bg: counts.sos > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50", warn: counts.sos > 0 },
          { label: "Total Logged", value: items.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", warn: false },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`rounded-[32px] border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative group ${k.warn ? "bg-red-50/20" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${k.warn ? "text-red-600" : "text-slate-900"}`}>{k.value}</p>
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
            placeholder="Search grievances..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px] h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["open", "in_progress", "resolved", "closed"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[150px] h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sos">SOS Alerts</SelectItem>
            <SelectItem value="help">Help Requests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? <p className="text-slate-500">Loading grievances...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/60">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No grievances found matching criteria.</p>
            </div>
          ) : (
            filteredItems.map(g => (
              <Card key={g._id} onClick={() => setSelected(g)} className={`rounded-[32px] border-none bg-white shadow-sm overflow-hidden hover:shadow-md cursor-pointer transition-shadow flex flex-col relative group ${g.type === "sos" && g.status === "open" ? "ring-1 ring-red-300 bg-red-50/10" : ""}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${PRIORITY_BADGE[g.priority] || "bg-slate-100 text-slate-700"} shadow-none font-bold border capitalize`}>
                        {g.type === "sos" ? <AlertTriangle className="w-3 h-3 mr-1" /> : <LifeBuoy className="w-3 h-3 mr-1" />}
                        {g.type === "sos" ? "SOS" : "Help"} • {g.priority}
                      </Badge>
                      {g.emailSent && <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">Email Sent</Badge>}
                    </div>
                    <Badge variant="outline" className={`${STATUS_BADGE[g.status] || "bg-slate-100 text-slate-700"} shadow-none font-bold border capitalize`}>{g.status.replace("_"," ")}</Badge>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{g.subject}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{g.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {g.submittedBy} <span className="capitalize">({g.role})</span></span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {g.home}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/> {new Date(g.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Action / Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${selected.type === "sos" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    {selected.type === "sos" ? <AlertTriangle className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manage Grievance</h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{selected.subject}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div><p className="text-xs text-slate-500 font-medium">Reporter</p><p className="text-sm font-bold text-slate-900 mt-1">{selected.submittedBy}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Role</p><p className="text-sm font-bold text-slate-900 mt-1 capitalize">{selected.role}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Home</p><p className="text-sm font-bold text-slate-900 mt-1">{selected.home}</p></div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Content</h4>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                {selected.resolvedNote && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Resolution Note</h4>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800">
                      {selected.resolvedNote}
                      <p className="text-xs text-emerald-600 mt-2 font-medium">Resolved by {selected.resolvedBy} on {new Date(selected.resolvedAt!).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {["open", "in_progress"].includes(selected.status) && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Action / Resolution Note</label>
                    <Textarea rows={3} value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Required for resolving..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none focus-visible:ring-1 focus-visible:ring-blue-500" />
                    
                    <div className="flex justify-end gap-3 pt-2">
                      {selected.status === "open" && <Button onClick={() => updateStatus(selected._id, "in_progress")} variant="outline" className="rounded-xl h-10 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Mark In Progress</Button>}
                      <Button onClick={() => updateStatus(selected._id, "resolved")} disabled={!resolveNote.trim()} className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white">Resolve Grievance</Button>
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
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{form.type === "sos" ? "Trigger SOS Alert" : "Log Help Request"}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">This will send an immediate email alert to all admins.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject *</label>
                  <Input value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} placeholder="Brief title..." className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message *</label>
                  <Textarea rows={4} value={form.message} onChange={e => setForm({...form, message:e.target.value})} placeholder="Detailed description..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Home</label>
                    <Select value={form.home} onValueChange={v => setForm({...form, home:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
                    <Select value={form.priority} onValueChange={v => setForm({...form, priority:v})} disabled={form.type === "sos"}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl capitalize"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {["critical", "high", "medium", "low"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={submit} disabled={saving} className={`rounded-xl h-11 px-6 text-white shadow-sm ${form.type === "sos" ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}>
                    {saving ? "Sending..." : "Submit"}
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
