/* eslint-disable react-hooks/exhaustive-deps */
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
import { Wallet, IndianRupee, Clock, CheckCircle2, BarChart3, Building, Plus, X, FileText, Activity } from "lucide-react";

interface Expense {
  _id: string; title: string; category: string; amount: number;
  date: string; home: string; status: string; notes: string;
  submittedBy: string; rejectionReason: string;
}
interface KPI {
  month: number; home: string; budget: number; actualExpenses: number;
  donations: number; fundraisingCost: number; beneficiariesServed: number;
  variance: number; fundraisingROI: number | null; impactPerDollar: number | null;
}

const HOMES = ["Jammu", "Anantnag", "Kupwara", "Beerwah"];
const CATEGORIES = ["Food", "Education", "Medical", "Cosmetics", "Utilities", "Maintenance", "Events", "Other"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EMPTY_EXP = { title: "", category: "Food", amount: 0, date: "", home: "Jammu", notes: "" };

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border border-amber-200/50",
  approved: "bg-blue-50 text-blue-600 border border-blue-200/50",
  rejected: "bg-red-50 text-red-600 border border-red-200/50",
  paid: "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
};

export default function FinancePage() {
  const [tab, setTab] = useState<string>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [filterHome, setFilterHome] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>(EMPTY_EXP);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadExpenses = () => {
    const p: Record<string, string> = {};
    if (filterHome && filterHome !== "all") p.home = filterHome;
    if (filterStatus && filterStatus !== "all") p.status = filterStatus;
    if (filterCat && filterCat !== "all") p.category = filterCat;
    adminAPI.getExpenses(p)
      .then(d => setExpenses(d as Expense[]))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const loadKPIs = () => {
    adminAPI.getKPIs(new Date().getFullYear()).then(d => setKPIs(d as KPI[])).catch(e => setError(e.message));
  };

  useEffect(() => { if (tab === "expenses" || tab === "homes") loadExpenses(); }, [tab, filterHome, filterStatus, filterCat]);
  useEffect(() => { if (tab === "kpis" || tab === "homes") loadKPIs(); }, [tab]);

  const addExpense = async () => {
    if (!form.title || !form.amount || !form.date) return;
    setSaving(true); setError("");
    try {
      await adminAPI.addExpense({ ...form, date: new Date(form.date as string) });
      setMsg("Expense added successfully."); setTimeout(() => setMsg(""), 3000);
      setShowAdd(false); loadExpenses(); setForm(EMPTY_EXP);
    } catch (e: unknown) { setError((e as Error).message); }
    setSaving(false);
  };

  const setStatus = async (id: string, status: string, reason?: string) => {
    try {
      await adminAPI.updateExpense(id, { status, ...(reason ? { rejectionReason: reason } : {}) });
      setMsg(`Expense marked as ${status}.`); setTimeout(() => setMsg(""), 3000);
      loadExpenses();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  const deleteExp = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try { await adminAPI.deleteExpense(id); setMsg("Expense deleted."); setTimeout(() => setMsg(""), 3000); loadExpenses(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  const totalApproved = expenses.filter(e => ["approved","paid"].includes(e.status)).reduce((a,e) => a + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === "pending").length;

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
            Admin Finance
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Manage expense approvals, budget variance, fundraising ROI, and track impact.
          </p>
        </div>
      </motion.header>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-medium text-emerald-700 shadow-sm">
          {msg}
        </motion.div>
      )}

      {/* KPI Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Logged", value: expenses.length, icon: FileText, color: "text-slate-600", bg: "bg-slate-100", warn: false },
          { label: "Approved Value", value: `₹${totalApproved.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50", warn: false },
          { label: "Pending Approval", value: totalPending, icon: Clock, color: totalPending > 0 ? "text-amber-600" : "text-slate-600", bg: totalPending > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50", warn: totalPending > 0 },
          { label: "Paid Expenses", value: expenses.filter(e => e.status === "paid").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", warn: false },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`rounded-[32px] border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative group ${k.warn ? "bg-amber-50/20" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className={`text-2xl font-bold mt-2 ${k.warn ? "text-amber-600" : "text-slate-900"}`}>{k.value}</p>
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
          <TabsList className="bg-white border border-slate-200/60 shadow-sm p-1 rounded-full w-full sm:w-auto h-auto relative">
            <TabsTrigger value="expenses" className="rounded-full px-5 py-2 font-medium text-sm relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 z-10 transition-colors">
              {tab === "expenses" && (
                <motion.div layoutId="finance-tab" className="absolute inset-0 bg-blue-50/50 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10 flex items-center"><Wallet className="w-4 h-4 mr-2" /> Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="rounded-full px-5 py-2 font-medium text-sm relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 z-10 transition-colors">
              {tab === "kpis" && (
                <motion.div layoutId="finance-tab" className="absolute inset-0 bg-blue-50/50 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10 flex items-center"><BarChart3 className="w-4 h-4 mr-2" /> KPI Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="homes" className="rounded-full px-5 py-2 font-medium text-sm relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 z-10 transition-colors">
              {tab === "homes" && (
                <motion.div layoutId="finance-tab" className="absolute inset-0 bg-blue-50/50 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10 flex items-center"><Building className="w-4 h-4 mr-2" /> Home Summary</span>
            </TabsTrigger>
          </TabsList>
          
          {tab === "expenses" && (
            <Button onClick={() => setShowAdd(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          )}
        </div>

        <TabsContent value="expenses" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-2.5 rounded-full border border-slate-200/60 shadow-sm w-full sm:w-max">
            <Select value={filterHome} onValueChange={setFilterHome}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50/50 border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
                <SelectValue placeholder="All Homes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Homes</SelectItem>
                {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50/50 border-slate-200 rounded-full hover:bg-slate-50 transition-colors capitalize">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Status</SelectItem>
                {["pending","approved","rejected","paid"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-slate-50/50 border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden relative group">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Date & Home</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No expenses found.</p>
                      </td>
                    </tr>
                  ) : (
                    expenses.map(e => (
                      <tr key={e._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{e.title}</p>
                          {e.notes && <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={e.notes}>{e.notes}</p>}
                        </td>
                        <td className="px-6 py-4"><Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none shadow-none">{e.category}</Badge></td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">₹{e.amount.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{new Date(e.date).toLocaleDateString("en-IN")}</p>
                          <p className="text-xs text-slate-500">{e.home}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${STATUS_BADGE[e.status] || "bg-slate-100 text-slate-700"} capitalize shadow-none`}>{e.status}</Badge>
                          {e.rejectionReason && <p className="text-[10px] text-red-500 mt-1 font-medium">{e.rejectionReason}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {e.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setStatus(e._id, "approved")}>Approve</Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                  const r = prompt("Rejection Reason:");
                                  if (r !== null) setStatus(e._id, "rejected", r);
                                }}>Reject</Button>
                              </>
                            )}
                            {e.status === "approved" && (
                              <Button size="sm" className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStatus(e._id, "paid")}>Mark Paid</Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => deleteExp(e._id, e.title)}>Delete</Button>
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

        <TabsContent value="kpis" className="mt-0">
          <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden relative group">
            <div className="p-6 bg-slate-50/50 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-900">Performance & ROI {new Date().getFullYear()}</h2>
              <p className="text-sm text-slate-500">System-generated analytics combining expenses and external donation records.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Month / Home</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Budget</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actuals</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Variance</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Donations</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Fundr. Cost</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">ROI</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Impact/₹100</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kpis.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium"><Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" /> No KPI records generated.</td></tr>
                  ) : kpis.map((k, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{MONTHS[k.month - 1]} <span className="text-slate-500 font-normal">({k.home})</span></td>
                      <td className="px-6 py-4 text-right">₹{k.budget.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right">₹{k.actualExpenses.toLocaleString("en-IN")}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${k.variance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {k.variance > 0 ? "+" : ""}₹{k.variance.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">₹{k.donations.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right">₹{k.fundraisingCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right">{k.fundraisingROI ? `${k.fundraisingROI.toFixed(1)}x` : "—"}</td>
                      <td className="px-6 py-4 text-right font-medium text-blue-600">{k.impactPerDollar ? `${(k.impactPerDollar * 100).toFixed(2)} pts` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="homes" className="mt-0">
          <Card className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden p-12 text-center relative group">
            <Building className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Home Summary Dashboard</h3>
            <p className="text-sm text-slate-500 mt-2">Aggregated budgets and expense burndown charts will be displayed here.</p>
            <Badge variant="outline" className="mt-4 bg-slate-50 text-slate-500">Coming Soon</Badge>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Log Expense</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Submit a new expense for approval.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Title *</label>
                  <Input value={form.title as string} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Monthly Groceries" className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (₹) *</label>
                    <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date *</label>
                    <Input type="date" value={form.date as string} onChange={e => setForm({...form, date: e.target.value})} className="h-11 bg-slate-50 border-slate-200 rounded-2xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                    <Select value={form.category as string} onValueChange={v => setForm({...form, category: v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Home</label>
                    <Select value={form.home as string} onValueChange={v => setForm({...form, home: v})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HOMES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes</label>
                  <Textarea rows={3} value={form.notes as string} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Additional details..." className="bg-slate-50 border-slate-200 rounded-2xl resize-none" />
                </div>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-full h-11 px-6 shadow-sm">Cancel</Button>
                  <Button onClick={addExpense} disabled={saving} className="rounded-full h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                    {saving ? "Saving..." : "Log Expense"}
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
