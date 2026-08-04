/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
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
import { Search, GraduationCap, Users, MapPin, UserCheck, X, UserMinus, FileEdit, Plus, ShieldAlert, BadgeInfo } from "lucide-react";
import { getAvatarUrl } from '@/app/lib/avatar';

interface Student {
  _id: string; studentId: string; name: string; home: string;
  className: string; background: string; status: string; xp: number;
  dueDiligenceNotes: string; notes: string;
}

const HOMES = ["Kupwara Home", "Anantnag Home", "Beerwah Home", "Outside"];
const EMPTY_FORM = { name: "", home: "Kupwara Home", className: "", background: "", dueDiligenceNotes: "", notes: "" };

const PILL_CATEGORIES = [
  { label: "All Homes", value: "All Homes" },
  { label: "Kupwara Home", value: "Kupwara Home" },
  { label: "Anantnag Home", value: "Anantnag Home" },
  { label: "Beerwah Home", value: "Beerwah Home" },
  { label: "Outside", value: "Outside" }
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-50",
  inactive: "bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-50",
  graduated: "bg-blue-50 text-blue-600 border border-blue-200/50 hover:bg-blue-50",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterHome, setFilterHome] = useState("All Homes");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<Student | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [msg, setMsg]           = useState("");

  const load = () => {
    const p: Record<string, string> = {};
    if (filterHome && filterHome !== "All Homes") p.home = filterHome;
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    if (search) p.search = search;
    adminAPI.getStudents(p)
      .then(d => { setStudents(d as Student[]); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [search, filterHome, filterStatus]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setShowAdd(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, home: s.home, className: s.className, background: s.background, dueDiligenceNotes: s.dueDiligenceNotes, notes: s.notes });
    setShowAdd(true);
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      if (editing) { await adminAPI.updateStudent(editing._id, form); setMsg("Student updated."); }
      else { await adminAPI.addStudent(form); setMsg("Student added."); }
      setTimeout(() => setMsg(""), 3000);
      setShowAdd(false); load();
    } catch (e: unknown) { setError((e as Error).message); }
    setSaving(false);
  };

  const deactivate = async (s: Student) => {
    if (!confirm(`Are you sure you want to deactivate ${s.name}?`)) return;
    try { await adminAPI.deactivateStudent(s._id); setMsg(`${s.name} deactivated.`); setTimeout(() => setMsg(""), 3000); load(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  if (loading) return <PageSkeleton rows={8} />;

  const activeCount = students.filter(s => s.status === "active").length;
  const inactiveCount = students.filter(s => s.status === "inactive").length;
  const homeCount = [...new Set(students.map(s => s.home))].length;

  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Admin Students
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Full student registry with welfare tracking, academic records, and status management.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm">
          {msg}
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Enrolled", value: students.length, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Students", value: activeCount, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Inactive", value: inactiveCount, icon: UserMinus, color: "text-red-600", bg: "bg-red-50" },
          { label: "Active Homes", value: homeCount, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="rounded-[32px] border-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 relative group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{k.value}</p>
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

      {/* Home Filter Toggle (Pills) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
      >
        <div className="inline-flex items-center p-1.5 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-full shadow-sm">
          {PILL_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterHome(cat.value)}
              className={`relative px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300 whitespace-nowrap ${
                filterHome === cat.value
                  ? "text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              {filterHome === cat.value && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/50"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-full border border-slate-200/60 shadow-sm mb-6 w-fit">
        <div className="relative flex-1 md:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-full w-full"
            placeholder="Search by name or ID..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px] h-11 bg-slate-50 border-slate-200 rounded-full capitalize shadow-none">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Modern Grid Layout */}
      {students.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 shadow-sm text-center col-span-full border border-slate-200/50">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No students found.</p>
        </div>
      ) : (
        <motion.div
          key="list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {students.map((s) => (
              <motion.div 
                key={s._id} 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.02, translateY: -4 }}
                className="bg-white rounded-[28px] p-6 shadow-sm flex flex-col justify-between border border-slate-200/50 hover:shadow-lg transition-shadow duration-300 h-[220px] relative group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img src={getAvatarUrl(s.name)} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[17px] tracking-tight truncate max-w-[120px]" title={s.name}>
                        {s.name}
                      </h3>
                      <p className="text-[13px] font-bold text-slate-500 truncate max-w-[120px]">
                        {s.studentId}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_BADGE[s.status] || "bg-slate-100 text-slate-700 capitalize"}>
                    {s.status}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 mt-2 flex-1 justify-center">
                  <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{s.home}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{s.className || "—"}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 text-blue-600 hover:bg-blue-50 font-bold text-[13px] rounded-xl px-3">
                    <FileEdit className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  {s.status === "active" && (
                    <Button variant="ghost" size="sm" onClick={() => deactivate(s)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-[13px] rounded-xl px-3">
                      <UserMinus className="w-4 h-4 mr-1.5" /> Deactivate
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{editing ? `Edit Student: ${editing.name}` : "Register New Student"}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Enter academic and welfare details.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                    <Input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Jane Doe" className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Home *</label>
                    <Select value={form.home} onValueChange={v => setForm({...form, home:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Class/Grade</label>
                    <Input value={form.className} onChange={e => setForm({...form, className:e.target.value})} placeholder="e.g., 10th Grade" className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Background</label>
                    <Input value={form.background} onChange={e => setForm({...form, background:e.target.value})} placeholder="Orphan, Single Parent, etc." className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Due Diligence Notes</label>
                  <Textarea rows={3} value={form.dueDiligenceNotes} onChange={e => setForm({...form, dueDiligenceNotes:e.target.value})} placeholder="Intake verification, background check, referral source..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600 flex items-center gap-2">
                    <BadgeInfo className="w-4 h-4"/> {error}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-full h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={save} disabled={saving} className="rounded-full h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                    {saving ? "Saving..." : editing ? "Update Student" : "Register Student"}
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
