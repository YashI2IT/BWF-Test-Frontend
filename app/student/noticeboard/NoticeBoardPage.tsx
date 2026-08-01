"use client";
// app/student/noticeboard/NoticeBoardPage.tsx
import { useState } from "react";
import "../styles/noticeboard.css";
import { Bell, X, CheckCheck, Calendar } from "lucide-react";
import { useNotices } from "../context/NoticeContext";
import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/app/teacher/Template/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/app/teacher/Template/components/ui/dialog";
import { SkeletonLoader } from "../components/SkeletonLoader";

type Category = "events" | "academic" | "welfare" | "general";

const mockData = {
  cat: {
    events:    { label:"Event",    emoji:"🎉", color:"#db2777", bg:"#fce7f3", border:"#fbcfe8" },
    academic: { label:"Academic", emoji:"📚", color:"#2563eb", bg:"#dbeafe", border:"#bfdbfe" },
    welfare:  { label:"Welfare",  emoji:"💚", color:"#16a34a", bg:"#dcfce7", border:"#bbf7d0" },
    general:  { label:"General",  emoji:"📢", color:"#d97706", bg:"#fef3c7", border:"#fde68a" },
  },
  filters: [
    { key:"all",      label:"All",      emoji:"📋" },
    { key:"academic", label:"Academic", emoji:"📚" },
    { key:"events",   label:"Events",   emoji:"🎉" },
    { key:"welfare",  label:"Welfare",  emoji:"💚" },
    { key:"general",  label:"General",  emoji:"📢" },
  ],
  uiStrings: {
    pageEyebrow: "Announcements",
    pageTitle: "Notice Board",
    newLabel: " new",
    markAllRead: " Mark all read",
    emptyState: "No notices here right now.",
    showLess: "Show less ↑",
    readMore: "Read more ↓",
    readTag: " Read"
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function NoticeBoardPage() {
  // ← reads AND mutates the shared context
  const { notices, unreadCount, markAsRead, markAllRead, deleteNotice, isLoading } = useNotices();

  const [filter, setFilter]       = useState<"all" | Category>("all");
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [leavingId, setLeaving]   = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{url: string, type?: string} | null>(null);

  const visible = filter === "all" ? notices : notices.filter(n => n.category === filter);

  const handleExpand = (id: string) => {
    const isExpanding = expandedId !== id;
    setExpanded(isExpanding ? id : null);
    // Mark as read when the user opens a notice
    if (isExpanding) markAsRead(id);
  };

  const handleDelete = (id: string) => {
    setLeaving(id);
    setTimeout(() => {
      deleteNotice(id);
      setLeaving(null);
    }, 360);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <main className="flex-1 bg-[#F4F5F7] min-h-screen font-sans relative overflow-x-hidden">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full min-w-0">
        <div className="nb-page" style={{ padding: 0, minHeight: "auto", background: "transparent" }}>

          {/* HEADER */}
          <motion.div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 mt-2 px-4 md:px-0">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
              >
                {mockData.uiStrings.pageTitle}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[15px] text-slate-500 mt-2"
              >
                Stay updated with school announcements and events.
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="nb-unread-pill">
                  <Bell size={13} />
                  {unreadCount}{mockData.uiStrings.newLabel}
                </div>
              )}
              {unreadCount > 0 && (
                <button className="nb-mark-all" onClick={markAllRead}>
                  <CheckCheck size={14} /> {mockData.uiStrings.markAllRead}
                </button>
              )}
            </div>
          </motion.div>

      {/* FILTER CHIPS */}
      <div className="nb-filters">
        {mockData.filters.map(f => (
          <button
            key={f.key}
            className={`nb-filter-chip${filter === f.key ? " nb-filter-chip--active" : ""}`}
            onClick={() => setFilter(f.key as "all" | Category)}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="nb-list">
        {isLoading ? (
          <div className="flex flex-col gap-4 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[22px] border-[1.5px] border-[#eff0f7] p-4 flex gap-4 h-[120px]">
                <Skeleton className="w-[46px] h-[46px] rounded-2xl flex-shrink-0" />
                <div className="flex flex-col flex-1 gap-3 py-1">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-[40%]" />
                    <Skeleton className="h-4 w-[15%]" />
                  </div>
                  <Skeleton className="h-4 w-[85%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {visible.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nb-empty">
                <span>🌸</span>
                <p>{mockData.uiStrings.emptyState}</p>
              </motion.div>
            )}

            <motion.div 
              className="flex flex-col gap-[14px]"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {visible.map(n => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const meta    = (mockData.cat as any)[n.category];
                const isOpen  = expandedId === n._id;
                const leaving = leavingId === n._id;

                return (
                  <motion.div variants={itemVariants} key={n._id}>
                    <div
                      className={[
                        "relative flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md",
                        n.isRead ? "opacity-75" : "",
                        leaving ? "nb-card--leaving" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => handleExpand(n._id)}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl text-2xl" style={{ backgroundColor: meta.bg }}>
                          {meta.emoji}
                        </div>
                        {!n.isRead && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            {n.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase" style={{ color: meta.color, backgroundColor: meta.bg }}>
                              {meta.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-400">
                              <Calendar size={12} />
                              {fmt(n.date)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm font-medium text-slate-500 leading-relaxed ${isOpen ? "" : "line-clamp-2"}`}>
                          {n.description}
                        </p>
                        
                        {isOpen && n.imageUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative cursor-pointer group" onClick={(e) => { e.stopPropagation(); setPreviewMedia({ url: n.imageUrl!, type: n.mediaType }); }}>
                            {n.mediaType === 'video' ? (
                              <video src={n.imageUrl} className="w-full max-h-[300px] object-contain" />
                            ) : n.mediaType === 'pdf' ? (
                              <div className="w-full h-[300px] relative">
                                <iframe src={n.imageUrl} className="w-full h-full pointer-events-none" title="PDF Document" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">
                                    Click to view fullscreen
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={n.imageUrl} alt="Notice media" className="w-full max-h-[300px] object-contain group-hover:scale-[1.02] transition-transform duration-300" />
                              </>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            {isOpen ? mockData.uiStrings.showLess : mockData.uiStrings.readMore}
                          </span>
                          {n.isRead && (
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                              <CheckCheck size={14} /> {mockData.uiStrings.readTag}
                            </span>
                          )}
                        </div>
                      </div>

              <button
                className="nb-delete-btn"
                onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
    </div>
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl [&>button]:text-white/70 [&>button:hover]:text-white [&>button:hover]:bg-white/10">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <div className="relative w-full h-[85vh] flex items-center justify-center p-4 sm:p-8">
            {previewMedia?.type === 'video' ? (
              <video src={previewMedia.url} controls autoPlay className="w-full h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10" />
            ) : previewMedia?.type === 'pdf' ? (
              <iframe src={previewMedia.url} className="w-full h-full bg-white rounded-lg shadow-2xl" title="PDF Preview" />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewMedia?.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10" />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  </main>
  );
}