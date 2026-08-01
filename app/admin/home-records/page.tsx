/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageSkeleton from "../components/PageSkeleton";
import { Card, CardContent } from "@/app/warden/Template/components/ui/card";
import { Button } from "@/app/warden/Template/components/ui/button";
import { Badge } from "@/app/warden/Template/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/warden/Template/components/ui/select";
import { Input } from "@/app/warden/Template/components/ui/input";
import { Textarea } from "@/app/warden/Template/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/warden/Template/components/ui/tabs";
import { Plus, MapPin, Search, Calendar, Users, Home, TrendingUp, TrendingDown, Bell, CheckCircle, FolderOpen, CheckCircle2, AlertTriangle, Building, Activity, BookOpen, X, ListTodo, ShieldAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];

const CATEGORIES: Record<string, { label: string; group: string }> = {
  SIR: { label: "Social Investigation Report (SIR)", group: "Child Case Files" },
  ICP: { label: "Individual Care Plan (ICP)", group: "Child Case Files" },
  medical_records: { label: "Medical Records", group: "Child Case Files" },
  education_records: { label: "Education Records", group: "Child Case Files" },
  counseling_notes: { label: "Counseling / Rehab Notes", group: "Child Case Files" },
  restoration_report: { label: "Restoration Report", group: "Child Case Files" },
  admission_register: { label: "Admission Register", group: "Admission & Discharge" },
  discharge_register: { label: "Discharge Register", group: "Admission & Discharge" },
  cwc_order_file: { label: "CWC Order File", group: "CWC & Legal" },
  production_register: { label: "Production Register", group: "CWC & Legal" },
  case_followup_file: { label: "Case Follow-up File", group: "CWC & Legal" },
  court_documents: { label: "Court-related Documents", group: "CWC & Legal" },
  medical_register: { label: "Medical Register", group: "Health Records" },
  immunization_records: { label: "Immunization Records", group: "Health Records" },
  sick_register: { label: "Sick Register", group: "Health Records" },
  referral_records: { label: "Hospital Referral", group: "Health Records" },
  diet_register: { label: "Diet Register", group: "Nutrition & Daily Care" },
  stock_register: { label: "Stock Register", group: "Nutrition & Daily Care" },
  daily_routine_register: { label: "Daily Routine Register", group: "Nutrition & Daily Care" },
  education_register: { label: "Education Register", group: "Education & Activities" },
  vocational_training: { label: "Vocational Training", group: "Education & Activities" },
  attendance_register: { label: "Attendance Register", group: "Education & Activities" },
  activity_file: { label: "Activity / Skill File", group: "Education & Activities" },
  staff_attendance: { label: "Staff Attendance", group: "Staff & Administration" },
  staff_personal_files: { label: "Staff Personal Files", group: "Staff & Administration" },
  duty_roster: { label: "Duty Roster", group: "Staff & Administration" },
  leave_records: { label: "Staff Leave Records", group: "Staff & Administration" },
  cash_book: { label: "Cash Book", group: "Financial Records" },
  ledger: { label: "Ledger", group: "Financial Records" },
  budget_expenditure: { label: "Budget File", group: "Financial Records" },
  donation_register: { label: "Donation Register", group: "Financial Records" },
  inspection_register: { label: "Inspection Register", group: "Inspection & Monitoring" },
  visitors_book: { label: "Visitor's Book", group: "Inspection & Monitoring" },
  complaint_register: { label: "Complaint Register", group: "Inspection & Monitoring" },
  social_audit_report: { label: "Social Audit Reports", group: "Inspection & Monitoring" },
  ngo_registration: { label: "NGO Licenses File", group: "Miscellaneous" },
  miscellaneous: { label: "Miscellaneous Files", group: "Miscellaneous" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  closed: "bg-slate-100 text-slate-600 border-slate-200/50",
  archived: "bg-amber-50 text-amber-700 border-amber-200/50",
  missing: "bg-red-50 text-red-700 border-red-200/50",
  flagged: "bg-orange-50 text-orange-700 border-orange-200/50",
};

type HomeRecord = {
  _id: string; home: string; category: string; title: string;
  fileType: "per_child" | "shared_register";
  childName?: string; status: string; maintainedBy?: string; notes?: string;
  lastInspectedOn?: string;
  entries: { _id: string; date: string; enteredBy: string; content: string; childName?: string; referenceNo?: string }[];
};

type Summary = {
  home: string; sharedRegisters: { present: number; required: number };
  perChildFiles: { total: number }; missingCount: number; flaggedCount: number;
  complianceScore: number;
  byCategory: Record<string, { _id: string; title: string; fileType: string; status: string; childName?: string }[]>;
};

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` };
}

export default function HomeRecordsPage() {
  const [selectedHome, setSelectedHome] = useState("Jammu");
  const [activeTab, setActiveTab] = useState<string>("registers");
  const [records, setRecords] = useState<HomeRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<HomeRecord | null>(null);
  const [newEntry, setNewEntry] = useState("");
  const [newEntryRef, setNewEntryRef] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const ft = activeTab === "registers" ? "shared_register" : "per_child";
      const params = new URLSearchParams({ home: selectedHome, fileType: ft });
      if (filterCat && filterCat !== "all") params.set("category", filterCat);
      const res = await fetch(`${API}/admin/home-records?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch { setRecords([]); }
    setLoading(false);
  }, [selectedHome, activeTab, filterCat]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/home-records/summary/${selectedHome}`, { headers: authHeaders() });
      setSummary(await res.json());
    } catch { setSummary(null); }
    setLoading(false);
  }, [selectedHome]);

  useEffect(() => {
    if (activeTab === "summary") fetchSummary();
    else fetchRecords();
  }, [activeTab, selectedHome, filterCat, fetchRecords, fetchSummary]);

  useEffect(() => {
    Promise.all([fetchRecords(), fetchSummary()]).finally(() => setInitialLoad(false));
  }, []); // Run only once on mount to handle the initial skeleton

  const addEntry = async () => {
    if (!selectedRecord || !newEntry.trim()) return;
    setEntryLoading(true);
    try {
      await fetch(`${API}/admin/home-records/${selectedRecord._id}/entries`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ content: newEntry, referenceNo: newEntryRef }),
      });
      setNewEntry(""); setNewEntryRef("");
      await fetchRecords();
      const updated = records.find(r => r._id === selectedRecord._id);
      if (updated) setSelectedRecord(updated);
      showToast("Entry added successfully.");
      setSelectedRecord(null);
    } catch { showToast("Failed to add entry."); }
    setEntryLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/admin/home-records/${id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      showToast(`Record marked as ${status}.`);
      fetchRecords();
    } catch { showToast("Failed to update status."); }
  };

  const filtered = records.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    (r.childName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (initialLoad) return <PageSkeleton rows={8} />;

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
            Admin Home Records
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Centralized registry of shared logbooks, official registers, and child files per home.
          </p>
        </div>
      </motion.header>

      {toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm">
          {toast}
        </motion.div>
      )}

      {/* Global Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm inline-block">
        <Select value={selectedHome} onValueChange={setSelectedHome}>
          <SelectTrigger className="w-[200px] h-10 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700">
            <Building className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOMES.map(h => <SelectItem key={h} value={h}>{h} Home</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto h-auto mb-6">
          <TabsTrigger value="registers" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Shared Registers
          </TabsTrigger>
          <TabsTrigger value="child-files" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-sm">
            <FolderOpen className="w-4 h-4 mr-2" /> Child Files
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-sm">
            <Activity className="w-4 h-4 mr-2" /> Compliance Summary
          </TabsTrigger>
        </TabsList>

        {(activeTab === "registers" || activeTab === "child-files") && (
          <TabsContent value={activeTab} className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl w-full"
                  placeholder="Search registers or files..."
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-full sm:w-[220px] h-11 bg-slate-50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden relative group">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-200/60">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Record / Title</th>
                      {activeTab === "child-files" && <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Child</th>}
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Entries</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">No records found for this criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{r.title}</td>
                          {activeTab === "child-files" && <td className="px-6 py-4 font-medium text-slate-700">{r.childName || "—"}</td>}
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{CATEGORIES[r.category]?.label || r.category}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200/50">
                              {r.entries.length}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"} capitalize font-bold`}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" onClick={() => setSelectedRecord(r)} className="h-8 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-none border border-blue-200/50">
                                <Plus className="w-3 h-3 mr-1" /> Entry
                              </Button>
                              <Select value={r.status} onValueChange={(v) => updateStatus(r._id, v)}>
                                <SelectTrigger className="h-8 w-[100px] text-xs bg-white border-slate-200 rounded-lg"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                  {["active","closed","archived","missing","flagged"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="summary" className="mt-0">
          {loading || !summary ? <p className="text-slate-500">Loading summary...</p> : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Compliance Score", value: `${summary.complianceScore}%`, icon: CheckCircle2, color: summary.complianceScore < 80 ? "text-amber-600" : "text-emerald-600", bg: summary.complianceScore < 80 ? "bg-amber-50" : "bg-emerald-50", warn: summary.complianceScore < 80 },
                  { label: "Missing Files", value: summary.missingCount, icon: AlertTriangle, color: summary.missingCount > 0 ? "text-red-600" : "text-slate-600", bg: summary.missingCount > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50", warn: summary.missingCount > 0 },
                  { label: "Flagged Issues", value: summary.flaggedCount, icon: ShieldAlert, color: summary.flaggedCount > 0 ? "text-orange-600" : "text-slate-600", bg: summary.flaggedCount > 0 ? "bg-orange-50 border border-orange-200" : "bg-slate-50", warn: summary.flaggedCount > 0 },
                  { label: "Total Registers", value: summary.sharedRegisters.present, icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50", warn: false },
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
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add Record Entry</h2>
                  <p className="text-sm font-medium text-blue-600 mt-1">{selectedRecord.title} {selectedRecord.childName ? `(${selectedRecord.childName})` : ""}</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ref No. (Optional)</label>
                  <Input value={newEntryRef} onChange={e => setNewEntryRef(e.target.value)} placeholder="e.g. CWC-2025-102" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content / Observation *</label>
                  <Textarea rows={4} value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="Describe the update, inspection note, or action taken..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => setSelectedRecord(null)} variant="outline" className="rounded-xl h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={addEntry} disabled={entryLoading} className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                    {entryLoading ? "Saving..." : "Save Entry"}
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
