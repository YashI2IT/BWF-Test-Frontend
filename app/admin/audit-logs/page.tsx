/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "../lib/api";
import PageSkeleton from "../components/PageSkeleton";
import { Card } from "@/app/warden/Template/components/ui/card";
import { Button } from "@/app/warden/Template/components/ui/button";
import { Badge } from "@/app/warden/Template/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/warden/Template/components/ui/select";
import { Input } from "@/app/warden/Template/components/ui/input";
import { Activity, Search, ChevronDown, ChevronUp, User, LayoutList, Clock, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";

interface AuditLog {
  _id: string; adminName: string; action: string; targetType: string;
  targetName: string; timestamp: string; note: string;
  before: unknown; after: unknown;
}

const ACTION_BADGE: Record<string, string> = {
  ADD: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  EDIT: "bg-blue-50 text-blue-700 border-blue-200/50",
  DEACTIVATE: "bg-amber-50 text-amber-700 border-amber-200/50",
  DELETE: "bg-red-50 text-red-700 border-red-200/50",
  APPROVE: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  REJECT: "bg-orange-50 text-orange-700 border-orange-200/50",
};

const ACTION_ICONS: Record<string, any> = {
  ADD: UserCheck, EDIT: LayoutList, DEACTIVATE: AlertTriangle,
  DELETE: AlertTriangle, APPROVE: ShieldCheck, REJECT: ShieldCheck
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState("all");
  const [searchAdmin, setSearchAdmin] = useState("");
  const [page, setPage] = useState(1);
  const [expand, setExpand] = useState<string | null>(null);

  const LIMIT = 25;

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = { limit: String(LIMIT), page: String(page) };
    if (filterType && filterType !== "all") p.targetType = filterType;
    if (searchAdmin) p.adminId = searchAdmin;
    
    adminAPI.getAuditLogs(p)
      .then(d => { 
        setLogs((d as { logs: AuditLog[]; total: number }).logs); 
        setTotal((d as { total: number }).total); 
        setLoading(false); 
      })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { 
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [filterType, searchAdmin, page]);

  const getActionColor = (action: string) => {
    const key = Object.keys(ACTION_BADGE).find(k => action.startsWith(k));
    return key ? ACTION_BADGE[key] : "bg-slate-100 text-slate-700 border-slate-200/50";
  };
  
  const getActionIcon = (action: string) => {
    const key = Object.keys(ACTION_ICONS).find(k => action.startsWith(k));
    const Icon = key ? ACTION_ICONS[key] : Activity;
    return <Icon className="w-3.5 h-3.5 mr-1.5" />;
  };

  const formatAction = (action: string) => action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

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
            Admin Audit Logs
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Immutable, read-only record of all administrative actions and data modifications.
          </p>
        </div>
      </motion.header>

      {/* Stats & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-1.5 pl-4 pr-1.5 rounded-full border border-slate-200/60 shadow-sm">
        <div className="flex w-full lg:w-auto items-center">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-8 h-11 bg-transparent border-none shadow-none focus-visible:ring-0 w-full rounded-full"
              placeholder="Search by Admin ID..."
              value={searchAdmin} onChange={e => { setSearchAdmin(e.target.value); setPage(1); }}
            />
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block"></div>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-11 bg-transparent border-none shadow-none focus:ring-0 capitalize px-2">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {["student", "staff", "expense", "post", "kpi"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="px-5 py-2.5 bg-slate-50 rounded-full border border-slate-200/80 text-sm font-medium text-slate-600 whitespace-nowrap">
          <span className="text-slate-900 font-bold">{total}</span> total entries
        </div>
      </div>

      {/* Log Table */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white relative group">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Timestamp</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Admin</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Action</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Target</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading audit trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    No logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map(l => (
                  <Fragment key={l._id}>
                    <tr onClick={() => setExpand(expand === l._id ? null : l._id)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(l.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <User className="w-4 h-4 text-slate-400" /> {l.adminName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={`${getActionColor(l.action)} rounded-full border shadow-none font-bold uppercase tracking-wider text-[10px]`}>
                          {getActionIcon(l.action)} {formatAction(l.action)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{l.targetName || "—"}</span>
                          <span className="text-xs text-slate-500 capitalize">{l.targetType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50">
                          {expand === l._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {expand === l._id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-none bg-slate-50/50">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"/> Previous State</h4>
                                  <pre className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-700 shadow-sm max-h-[300px] overflow-y-auto">
                                    {l.before ? JSON.stringify(l.before, null, 2) : "No previous state"}
                                  </pre>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"/> New State</h4>
                                  <pre className="bg-white border border-emerald-200/60 rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-700 shadow-sm max-h-[300px] overflow-y-auto">
                                    {l.after ? JSON.stringify(l.after, null, 2) : "No new state"}
                                  </pre>
                                </div>
                                {l.note && (
                                  <div className="col-span-1 md:col-span-2 mt-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audit Note</h4>
                                    <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">{l.note}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl h-10 px-4">
            Previous
          </Button>
          <span className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} className="rounded-xl h-10 px-4">
            Next
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
