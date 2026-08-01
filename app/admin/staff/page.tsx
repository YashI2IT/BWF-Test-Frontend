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
import { Users, ShieldAlert, FileEdit, UserMinus, Plus, X, UserCheck, TrendingDown } from "lucide-react";
import { getAvatarUrl } from '@/app/lib/avatar';

interface Cert { name: string; completedOn: string; expiresOn: string; status: string; }
interface Staff {
  _id: string; name: string; email: string; phone: string; role: string;
  house: string; type: string; caseload: number; status: string;
  certifications: Cert[]; joinedOn: string; notes: string;
  permissions: { viewStudents: boolean; editStudents: boolean; approveExpenses: boolean; manageMedia: boolean; viewReports: boolean; };
}

const ROLES = ["housemother", "dean", "counsellor", "warden", "volunteer", "admin_staff"];
const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah", "All", "Outside"];

const PILL_CATEGORIES = [
  { label: "All Homes", value: "all" },
  { label: "Kupwara Home", value: "Kupwara" },
  { label: "Anantnag Home", value: "Anantnag" },
  { label: "Beerwah Home", value: "Beerwah" },
  { label: "Outside", value: "Outside" }
];
const EMPTY: Partial<Staff> = { name: "", email: "", phone: "", role: "housemother", house: "Jammu", type: "full-time", caseload: 0, notes: "" };

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-50",
  inactive: "bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-50",
  on_leave: "bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-50",
};

const ROLE_BADGE: Record<string, string> = {
  housemother: "bg-pink-50 text-pink-600 border border-pink-200/50",
  warden: "bg-purple-50 text-purple-600 border border-purple-200/50",
  counsellor: "bg-blue-50 text-blue-600 border border-blue-200/50",
  dean: "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
  volunteer: "bg-slate-100 text-slate-600 border border-slate-200/50",
  admin_staff: "bg-orange-50 text-orange-600 border border-orange-200/50",
};

const CERT_BADGE: Record<string, string> = {
  valid: "bg-emerald-100 text-emerald-700",
  expiring_soon: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  not_done: "bg-slate-100 text-slate-500",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHouse, setFilterHouse] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<Partial<Staff>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    const p: Record<string, string> = {};
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    if (filterHouse && filterHouse !== "all") p.house = filterHouse;
    if (filterRole && filterRole !== "all") p.role = filterRole;
    adminAPI.getStaff(p)
      .then(d => { setStaff(d as Staff[]); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterStatus, filterHouse, filterRole]);

  const turnoverRatio = staff.length > 0 ? ((staff.filter(s => s.status === "inactive").length / staff.length) * 100).toFixed(1) : "0.0";
  const certAlertCount = staff.reduce((acc, s) => acc + s.certifications.filter(c => ["expired", "expiring_soon", "not_done"].includes(c.status)).length, 0);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setShowAdd(true); };
  const openEdit = (s: Staff) => { setEditing(s); setForm(s); setShowAdd(true); };

  const save = async () => {
    setSaving(true); setError("");
    try {
      if (editing) { await adminAPI.updateStaff(editing._id, form); setMsg("Staff member updated."); }
      else { await adminAPI.addStaff(form); setMsg("Staff member registered."); }
      setTimeout(() => setMsg(""), 3000);
      setShowAdd(false); load();
    } catch (e: unknown) { setError((e as Error).message); }
    setSaving(false);
  };

  const deactivate = async (s: Staff) => {
    if (!confirm(`Are you sure you want to deactivate ${s.name}?`)) return;
    try { await adminAPI.deactivateStaff(s._id); setMsg(`${s.name} deactivated.`); setTimeout(() => setMsg(""), 3000); load(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  const certStatusFor = (s: Staff) => {
    if (!s.certifications || !s.certifications.length) return "not_done";
    if (s.certifications.some(c => c.status === "expired")) return "expired";
    if (s.certifications.some(c => c.status === "expiring_soon")) return "expiring_soon";
    if (s.certifications.some(c => c.status === "not_done")) return "not_done";
    return "valid";
  };

  if (loading) return <PageSkeleton rows={8} />;

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
            Admin Staff
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Manage staff roles, permissions, caseload assignments, and certification tracking.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
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
          { label: "Total Staff", value: staff.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", warn: false },
          { label: "Active", value: staff.filter(s => s.status === "active").length, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", warn: false },
          { label: "Turnover Ratio", value: `${turnoverRatio}%`, icon: TrendingDown, color: parseFloat(turnoverRatio) > 20 ? "text-amber-600" : "text-slate-600", bg: parseFloat(turnoverRatio) > 20 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: parseFloat(turnoverRatio) > 20, sub: "Target < 20%" },
          { label: "Cert Alerts", value: certAlertCount, icon: ShieldAlert, color: certAlertCount > 0 ? "text-red-600" : "text-slate-600", bg: certAlertCount > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50", warn: certAlertCount > 0, sub: "Expired or missing" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`rounded-[32px] border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative group ${k.warn ? "bg-red-50/20" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${k.warn ? "text-red-600" : "text-slate-900"}`}>{k.value}</p>
                    {k.sub && <p className={`text-xs mt-1 ${k.warn ? "text-red-500/80 font-medium" : "text-slate-400"}`}>{k.sub}</p>}
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
              onClick={() => setFilterHouse(cat.value)}
              className={`relative px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300 whitespace-nowrap ${
                filterHouse === cat.value
                  ? "text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              {filterHouse === cat.value && (
                <motion.div
                  layoutId="activeTabStaff"
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

      {/* Role & Status Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["active", "inactive", "on_leave"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl capitalize">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Modern Data Table */}
      <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden relative group">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Role & Home</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Caseload</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Certs</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No staff members found.</p>
                  </td>
                </tr>
              ) : (
                staff.map((s) => {
                  const certStat = certStatusFor(s);
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img src={getAvatarUrl(s.name)} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{s.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge className={`${ROLE_BADGE[s.role] || "bg-slate-100 text-slate-700"} capitalize shadow-none`}>
                            {s.role.replace("_"," ")}
                          </Badge>
                          <span className="text-xs font-medium text-slate-500">{s.house}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium capitalize">{s.type.replace("-"," ")}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/60">
                          {s.caseload || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${CERT_BADGE[certStat]} border-none uppercase text-[10px] font-bold tracking-wider`}>
                            {certStat.replace("_"," ")}
                          </Badge>
                          <span className="text-xs font-medium text-slate-500">{s.certifications?.length || 0}/4</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={STATUS_BADGE[s.status] || "bg-slate-100 text-slate-700 capitalize shadow-none"}>{s.status.replace("_"," ")}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <FileEdit className="w-4 h-4" />
                          </Button>
                          {s.status === "active" && (
                            <Button variant="ghost" size="icon" onClick={() => deactivate(s)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{editing ? `Edit Staff: ${editing.name}` : "Register New Staff"}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Enter staff details and assignments.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                    <Input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="John Doe" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role *</label>
                    <Select value={form.role} onValueChange={v => setForm({...form, role:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Home Assignment *</label>
                    <Select value={form.house} onValueChange={v => setForm({...form, house:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employment Type</label>
                    <Select value={form.type} onValueChange={v => setForm({...form, type:v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["full-time", "part-time", "contract"].map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("-"," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email</label>
                    <Input value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="email@example.com" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone</label>
                    <Input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91..." className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">Notes</label>
                  <Textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Additional details..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4"/> {error}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={save} disabled={saving} className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                    {saving ? "Saving..." : editing ? "Update Staff" : "Register Staff"}
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
