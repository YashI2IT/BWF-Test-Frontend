"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/mycourses.css";
import { useProfile } from "../context/ProfileContext";
import { getAvatar } from "../constants/avatars";
import { SkeletonLoader } from "../components/SkeletonLoader";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Flame,
  BookOpen,
  Target,
  TrendingUp,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
  Paperclip
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/app/teacher/Template/components/ui/dialog";
import { Button } from "@/app/teacher/Template/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Image from "next/image";
import {
  getMyAssignments,
  revertAssignment,
  submitAssignment,
} from "./service";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface Assignment {
  _id: string;
  title: string;
  subject: string;
  status: "todo" | "student_submitted" | "under_review" | "verified" | "pending" | "approved" | "rejected" | "not_submitted";
  dueDate: string;
  submittedDate?: string;
  rejectionNote?: string;
  fileUrl?: string;
  fileType?: string;
}

const mockData = {
  studentId: "BWF-2024-001",
  undoMs: 5000,
  months: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  seed: [
    {
      _id: "1",
      title: "Math Worksheet 1",
      subject: "Mathematics",
      status: "verified",
      dueDate: "2026-04-24",
      submittedDate: "2026-04-23",
    },
    {
      _id: "2",
      title: "Science Project",
      subject: "Science",
      status: "verified",
      dueDate: "2026-04-23",
      submittedDate: "2026-04-22",
    },
    {
      _id: "3",
      title: "English Essay",
      subject: "English",
      status: "under_review",
      dueDate: "2026-04-25",
    },
    {
      _id: "4",
      title: "History Timeline",
      subject: "History",
      status: "student_submitted",
      dueDate: "2026-04-24",
    },
    {
      _id: "5",
      title: "Biology Notes",
      subject: "Science",
      status: "todo",
      dueDate: "2026-04-26",
    },
    {
      _id: "6",
      title: "Grammar Quiz",
      subject: "English",
      status: "verified",
      dueDate: "2026-04-20",
      submittedDate: "2026-04-20",
    },
    {
      _id: "7",
      title: "Algebra Problem Set",
      subject: "Mathematics",
      status: "verified",
      dueDate: "2026-04-21",
      submittedDate: "2026-04-21",
    },
    {
      _id: "8",
      title: "Chemical Reactions",
      subject: "Science",
      status: "todo",
      dueDate: "2026-04-26",
    },
    {
      _id: "9",
      title: "Poem Analysis",
      subject: "English",
      status: "verified",
      dueDate: "2026-03-15",
      submittedDate: "2026-03-15",
    },
    {
      _id: "10",
      title: "Fractions Worksheet",
      subject: "Mathematics",
      status: "verified",
      dueDate: "2026-03-10",
      submittedDate: "2026-03-09",
    },
    {
      _id: "11",
      title: "History Essay",
      subject: "History",
      status: "verified",
      dueDate: "2026-02-20",
      submittedDate: "2026-02-19",
    },
    {
      _id: "12",
      title: "Geometry Practice",
      subject: "Mathematics",
      status: "verified",
      dueDate: "2026-02-14",
      submittedDate: "2026-02-14",
    },
  ] as Assignment[],
  subjectCfg: {
    Mathematics: { color: "#2563eb", bg: "#dbeafe", emoji: "🔢" },
    Science: { color: "#16a34a", bg: "#dcfce7", emoji: "🌿" },
    English: { color: "#db2777", bg: "#fce7f3", emoji: "📖" },
    History: { color: "#ca8a04", bg: "#fef3c7", emoji: "📜" },
    Default: { color: "#6b7280", bg: "#f3f4f6", emoji: "📝" },
  },
  statusCfg: {
    todo: {
      label: "To Do",
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5",
      icon: "📝",
    },
    student_submitted: {
      label: "Submitted",
      color: "#92400e",
      bg: "#fef3c7",
      border: "#fde68a",
      icon: "✅",
    },
    under_review: {
      label: "Under Review",
      color: "#5b21b6",
      bg: "#ede9fe",
      border: "#c4b5fd",
      icon: "👀",
    },
    verified: {
      label: "Verified",
      color: "#065f46",
      bg: "#dcfce7",
      border: "#6ee7b7",
      icon: "⭐",
    },
    not_submitted: {
      label: "Not Submitted",
      color: "#9ca3af",
      bg: "#f3f4f6",
      border: "#e5e7eb",
      icon: "➖",
    },
    pending: {
      label: "Pending",
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5",
      icon: "📝",
    },
    approved: {
      label: "Approved",
      color: "#065f46",
      bg: "#dcfce7",
      border: "#6ee7b7",
      icon: "⭐",
    },
    rejected: {
      label: "Needs Revision",
      color: "#92400e",
      bg: "#fef3c7",
      border: "#fde68a",
      icon: "🔄",
    },
  },
  cheers: [
    "Great work! Keep it up! 💪",
    "Shabash! You did it! ⭐",
    "Wah! One more done! 🎉",
    "You're crushing it! 🔥",
  ],
  uiStrings: {
    pageEyebrow: "My Academic Journey",
    pageTitle: "Track Your Progress",
    todayTasks: "Today's Tasks",
    assignmentTimeline: "Assignment Timeline",
    yearlyPerformance: "Yearly Performance",
    allClearToday: "All clear today!",
    crushedIt: "You crushed it!",
    todayChallenge: "Today's Challenge",
    noTasksToday: "No tasks assigned for today 🌸",
    verifiedSoon: "All tasks done — teacher will verify soon! 🌟",
    verifiedOf: (v: number, t: number) => `${v} of ${t} verified — keep going!`,
    markedDone: "Marked as done!",
    undo: " Undo",
    yourTasksToday: "Your Tasks Today",
    enjoyDay: "No tasks today — enjoy your day!",
    assignmentHistory: "Assignment History",
    historyRange: (len: number) => `April 2026 · ${len} days`,
    today: "Today",
    upcoming: "Upcoming",
    overdue: "⚠️ Overdue",
    pendingBadge: (p: number) => `${p} pending`,
    submitting: "Submitting…",
    done: "I'm Done",
    pendingTasks: "⏳ Pending Tasks",
    totalAssigned: "Total Assigned",
    verified: "Verified",
    verifyRate: "Verification Rate",
    stillPending: "Still Pending",
    completionTrend: "Monthly Completion Trend",
    perfBySubject: "Performance by Subject",
    verifiedSub: (v: number, t: number) => `${v}/${t} verified`,
    due: "Due",
    submitted: "Submitted",
  },
};

// TODO: Replace with GET /api/student/courses/:auth_id/assignments

const TODAY = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

function subCfg(s: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mockData.subjectCfg as any)[s] ?? mockData.subjectCfg.Default;
}

function stCfg(s: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mockData.statusCfg as any)[s] ?? mockData.statusCfg.not_submitted;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dateTag(d: string): "today" | "upcoming" | "past" {
  if (d === TODAY) return "today";
  return d > TODAY ? "upcoming" : "past";
}

type Tab = "daily" | "timeline" | "yearly";

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function AcademicJourney() {
  const { name, avatarId, customAvatarUrl } = useProfile();
  const av = getAvatar(avatarId);
  const firstName = name.split(" ")[0];

  const [tab, setTab] = useState<Tab>("daily");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // 1. Keep the full history for the Graph
  const allTimeAssignments = assignments;

  // 2. Keep the filtered history for the Timeline/Tasks (30-day guardrail)
  // const initialAssignments = useMemo(() => {
  //   const thirtyDaysAgo = new Date(TODAY);
  //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  //   return mockData.seed.filter((a) => new Date(a.dueDate) >= thirtyDaysAgo);
  // }, []);

  // const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab 1 — expand/undo
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [cheerMsg, setCheerMsg] = useState<string | null>(null);

  // File Upload Modal
  const [submitModalTask, setSubmitModalTask] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Tab 2 — expand date group
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // ── Submit handler (shared by Tab1 + Tab2) ──
  const handleSubmit = useCallback(
    async (id: string, file: File | null = null) => {
      setSubmitModalTask(null);
      setSelectedFile(null);
      if (undoTimer) clearTimeout(undoTimer);

      // optimistic UI update
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, status: "student_submitted", submittedDate: TODAY }
            : a,
        ),
      );

      setCheerMsg(
        mockData.cheers[Math.floor(Math.random() * mockData.cheers.length)],
      );
      setUndoId(id);

      try {
        await submitAssignment(id, file); // 🔥 REAL API CALL
      } catch {
        // Fail silently

        // rollback if API fails
        setAssignments((prev) =>
          prev.map((a) =>
            a._id === id
              ? { ...a, status: "todo", submittedDate: undefined }
              : a,
          ),
        );

        setUndoId(null);
        return;
      }

      const t = setTimeout(() => {
        setUndoId(null);
        setUndoTimer(null);
      }, mockData.undoMs);

      setUndoTimer(t);
      setTimeout(() => setCheerMsg(null), 3000);
    },
    [undoTimer],
  );

  // ── Undo handler ──
  const handleUndo = useCallback(async () => {
    if (!undoId) return;

    if (undoTimer) clearTimeout(undoTimer);

    // optimistic UI
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === undoId
          ? { ...a, status: "todo", submittedDate: undefined }
          : a,
      ),
    );

    try {
      await revertAssignment(undoId);
    } catch {
      // Fail silently
      // optional: refetch to fix state
    }

    setUndoId(null);
    setUndoTimer(null);
  }, [undoId, undoTimer]);

  // ─────────────────────────────────────────
  // TAB 1 & 2 DERIVED DATA (Use 30-day filtered)
  // ─────────────────────────────────────────
  const todayTasks = useMemo(
    () => assignments.filter((a) => a.dueDate === TODAY),
    [assignments],
  );
  const verifiedToday = todayTasks.filter(
    (a) => a.status === "verified",
  ).length;
  const todayPct = todayTasks.length
    ? Math.round((verifiedToday / todayTasks.length) * 100)
    : 0;
  const allDone = todayTasks.length > 0 && verifiedToday === todayTasks.length;

  const timelineGroups = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments.forEach((a) => {
      if (!map[a.dueDate]) map[a.dueDate] = [];
      map[a.dueDate].push(a);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([date, tasks]) => ({
        date,
        tag: dateTag(date),
        tasks,
        total: tasks.length,
        verified: tasks.filter((t) => t.status === "verified").length,
        pending: tasks.filter((t) => t.status !== "verified").length,
        pct: Math.round(
          (tasks.filter((t) => t.status === "verified").length / tasks.length) *
            100,
        ),
      }));
  }, [assignments]);

  const allPending = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "verified")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignments],
  );

  // ─────────────────────────────────────────
  // TAB 3 DERIVED DATA (Use ALL-TIME history)
  // ─────────────────────────────────────────
  const yearly = useMemo(() => {
    const bySubject: Record<string, { total: number; verified: number }> = {};
    const byMonth: Record<number, { total: number; verified: number }> = {};
    let verified = 0,
      pending = 0,
      inReview = 0;
    allTimeAssignments.forEach((a) => {
      // <-- Use the full history here!
      if (a.status === "verified") verified++;
      else if (a.status === "todo") pending++;
      else inReview++;
      if (!bySubject[a.subject])
        bySubject[a.subject] = { total: 0, verified: 0 };
      bySubject[a.subject].total++;
      if (a.status === "verified") bySubject[a.subject].verified++;
      const m = new Date(a.dueDate).getMonth();
      if (!byMonth[m]) byMonth[m] = { total: 0, verified: 0 };
      byMonth[m].total++;
      if (a.status === "verified") byMonth[m].verified++;
    });
    return {
      total: allTimeAssignments.length,
      verified,
      pending,
      inReview,
      bySubject,
      byMonth,
    };
  }, [allTimeAssignments]);

  const verifyRate = yearly.total
    ? Math.round((yearly.verified / yearly.total) * 100)
    : 0;

  const monthChart = useMemo(
    () =>
      Object.entries(yearly.byMonth)
        .map(([m, d]) => ({
          month: mockData.months[Number(m)],
          idx: Number(m),
          pct: d.total ? Math.round((d.verified / d.total) * 100) : 0,
        }))
        .sort((a, b) => a.idx - b.idx),
    [yearly.byMonth],
  );

  const [data30d, setData30d] = useState<Assignment[]>([]);
  const [dataAll, setDataAll] = useState<Assignment[]>([]);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (tab === "yearly" && dataAll.length === 0) {
          const res = await getMyAssignments("all");
          setDataAll(res.assignments);
          setAssignments(res.assignments);
        } else if (tab !== "yearly" && data30d.length === 0) {
          const res = await getMyAssignments("30d");
          setData30d(res.assignments);
          setAssignments(res.assignments);
        } else {
          setAssignments(tab === "yearly" ? dataAll : data30d);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <div className="ac-error">{error}</div>;
  }

  return (
    <main className="flex-1 bg-[#F4F5F7] min-h-screen font-sans relative overflow-x-hidden">
      <div className="ac-page">
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
              Track your coursework and assignment progress.
            </motion.p>
          </div>
          <div className="ac-avatar-pill" style={{ background: av.bg }}>
            {customAvatarUrl ? (
              <Image
                src={customAvatarUrl}
                alt="Profile photo"
                width={24}
                height={24}
                className="ac-avatar-img"
              />
            ) : (
              <span>{av.emoji}</span>
            )}
            <span className="ac-avatar-name">{firstName}</span>
          </div>
        </motion.div>

      {/* TABS */}
      <div className="ac-tabs">
        {[
          {
            key: "daily",
            label: mockData.uiStrings.todayTasks,
            icon: <Flame size={14} />,
          },
          {
            key: "timeline",
            label: mockData.uiStrings.assignmentTimeline,
            icon: <TrendingUp size={14} />,
          },
          {
            key: "yearly",
            label: mockData.uiStrings.yearlyPerformance,
            icon: <Target size={14} />,
          },
        ].map((t) => (
          <button
            key={t.key}
            className={`ac-tab${tab === t.key ? " ac-tab--on" : ""}`}
            onClick={() => setTab(t.key as Tab)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB 1: TODAY'S TASKS
      ══════════════════════════════════════ */}
      {tab === "daily" && (
        <div className="ac-view">
          {/* Hero — compact, no star decorations */}
          <section
            className={`ac-daily-hero${allDone ? " ac-daily-hero--done" : ""}`}
          >
            <div className="ac-dh-blob ac-dh-blob-1" />
            <div className="ac-dh-blob ac-dh-blob-2" />
            <div className="ac-dh-left">
              <div className="ac-dh-badge">
                {allDone ? "🏆" : <Flame size={18} color="#fff" />}
              </div>
              <div>
                <h2 className="ac-dh-title">
                  {todayTasks.length === 0
                    ? mockData.uiStrings.allClearToday
                    : allDone
                      ? mockData.uiStrings.crushedIt
                      : mockData.uiStrings.todayChallenge}
                </h2>
                <p className="ac-dh-sub">
                  {todayTasks.length === 0
                    ? mockData.uiStrings.noTasksToday
                    : allDone
                      ? mockData.uiStrings.verifiedSoon
                      : mockData.uiStrings.verifiedOf(
                          verifiedToday,
                          todayTasks.length,
                        )}
                </p>
              </div>
            </div>
            {/* Donut ring — clean, no SVG text tricks */}
            <div className="ac-dh-donut-wrap">
              <svg className="ac-dh-donut" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" className="ac-donut-track" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="ac-donut-fill"
                  style={{
                    strokeDasharray: `${(todayPct / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`,
                    strokeDashoffset: `${2 * Math.PI * 32 * 0.25}`,
                    stroke: allDone ? "#16a34a" : "#2563eb",
                  }}
                />
              </svg>
              <div className="ac-donut-center">
                <span className="ac-donut-num">{todayPct}%</span>
                <span className="ac-donut-label">done</span>
              </div>
            </div>
          </section>

          {/* Cheer toast */}
          {cheerMsg && (
            <div className="ac-cheer-toast">
              <Sparkles size={14} /> {cheerMsg}
            </div>
          )}

          {/* Undo banner */}
          {undoId && (
            <div className="ac-undo-banner">
              <span>✅</span>
              <span className="ac-undo-text">
                {mockData.uiStrings.markedDone}
              </span>
              <button className="ac-undo-btn" onClick={handleUndo}>
                <RotateCcw size={12} /> {mockData.uiStrings.undo}
              </button>
              <div className="ac-undo-bar">
                <div
                  className="ac-undo-fill"
                  style={{ animationDuration: `${mockData.undoMs}ms` }}
                />
              </div>
            </div>
          )}

          {/* Task list */}
          <section className="ac-tasks-section">
            <p className="ac-section-label">
              {mockData.uiStrings.yourTasksToday}
            </p>
            {todayTasks.length === 0 ? (
              <div className="ac-empty">
                <span>🎉</span>
                <p>{mockData.uiStrings.enjoyDay}</p>
              </div>
            ) : (
              <div className="ac-task-list">
                {todayTasks.map((a) => (
                  <TaskCard
                    key={a._id}
                    a={a}
                    expanded={expandedId === a._id}
                    isUndo={undoId === a._id}
                    onToggle={() =>
                      setExpandedId(expandedId === a._id ? null : a._id)
                    }
                    onSubmit={() => setSubmitModalTask(a)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2: TIMELINE
      ══════════════════════════════════════ */}
      {tab === "timeline" && (
        <div className="ac-view">
          <div className="ac-tl-layout">
            {/* Left: history */}
            <div className="ac-tl-main">
              <div className="ac-tl-toprow">
                <p className="ac-section-label" style={{ margin: 0 }}>
                  {mockData.uiStrings.assignmentHistory}
                </p>
                <span className="ac-tl-range">
                  {mockData.uiStrings.historyRange(timelineGroups.length)}
                </span>
              </div>
              <div className="ac-tl-list">
                {timelineGroups.map((g) => (
                  <div
                    key={g.date}
                    className={`ac-tl-group ac-tl-group--${g.tag}`}
                  >
                    <button
                      className="ac-tl-head"
                      onClick={() =>
                        setExpandedDate(expandedDate === g.date ? null : g.date)
                      }
                    >
                      <div
                        className={`ac-tl-dot ac-tl-dot--${g.pct === 100 ? "done" : g.pct > 0 ? "partial" : "none"}`}
                      />
                      <div className="ac-tl-head-info">
                        <div className="ac-tl-date-row">
                          <span className="ac-tl-date">{fmtDate(g.date)}</span>
                          {g.tag === "today" && (
                            <span className="ac-tl-badge ac-tl-badge--today">
                              {mockData.uiStrings.today}
                            </span>
                          )}
                          {g.tag === "upcoming" && (
                            <span className="ac-tl-badge ac-tl-badge--upcoming">
                              {mockData.uiStrings.upcoming}
                            </span>
                          )}
                          {g.tag === "past" && g.pending > 0 && (
                            <span className="ac-tl-badge ac-tl-badge--overdue">
                              {mockData.uiStrings.overdue}
                            </span>
                          )}
                        </div>
                        <div className="ac-tl-bar-row">
                          <div className="ac-tl-bar">
                            <div
                              className="ac-tl-bar-fill"
                              style={{
                                width: `${g.pct}%`,
                                background:
                                  g.pct === 100
                                    ? "#16a34a"
                                    : g.tag === "upcoming"
                                      ? "#94a3b8"
                                      : "#3b82f6",
                              }}
                            />
                          </div>
                          <span className="ac-tl-stat">
                            {g.verified}/{g.total} done
                          </span>
                        </div>
                      </div>
                      <div className="ac-tl-head-right">
                        {g.pending > 0 && (
                          <span className="ac-tl-pending-badge">
                            {mockData.uiStrings.pendingBadge(g.pending)}
                          </span>
                        )}
                        {expandedDate === g.date ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </button>

                    {expandedDate === g.date && (
                      <div className="ac-tl-expanded">
                        {g.tasks.map((t) => (
                          <div key={t._id} className="ac-tl-task">
                            <span
                              className="ac-tl-task-icon"
                              style={{ background: subCfg(t.subject).bg }}
                            >
                              {subCfg(t.subject).emoji}
                            </span>
                            <div className="ac-tl-task-info">
                              <p className="ac-tl-task-name">{t.title}</p>
                              <p className="ac-tl-task-sub">{t.subject}</p>
                            </div>
                            <div className="ac-tl-task-right">
                              {/* COMPLETE FLOW: show I'm Done button for open tasks */}
                              {["todo", "not_submitted", "pending"].includes(t.status) && (
                                <button
                                  className="ac-done-btn"
                                  onClick={() => setSubmitModalTask(t)}
                                  disabled={undoId === t._id}
                                >
                                  <CheckCircle2 size={13} />
                                  {undoId === t._id
                                    ? mockData.uiStrings.submitting
                                    : mockData.uiStrings.done}
                                </button>
                              )}
                              {!["todo", "not_submitted", "pending"].includes(t.status) && (
                                <span
                                  className="ac-status-pill ac-status-pill--sm"
                                  style={{
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    background: (mockData.statusCfg as any)[
                                      t.status
                                    ].bg,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    color: (mockData.statusCfg as any)[t.status]
                                      .color,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    borderColor: (mockData.statusCfg as any)[
                                      t.status
                                    ].border,
                                  }}
                                >
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {(mockData.statusCfg as any)[t.status].icon}{" "}
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {(mockData.statusCfg as any)[t.status].label}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pending sidebar */}
            <aside className="ac-tl-sidebar">
              <div className="ac-tl-sidebar-card">
                <p className="ac-tl-sidebar-title">
                  {mockData.uiStrings.pendingTasks}
                </p>
                {allPending.length === 0 ? (
                  <div className="ac-tl-all-clear">
                    <span>🎉</span>
                    <p>All clear!</p>
                  </div>
                ) : (
                  <div className="ac-pending-list">
                    {allPending.map((a) => {
                      const sc = subCfg(a.subject);
                      const st = stCfg(a.status);
                      const overdue = a.dueDate < TODAY;
                      return (
                        <div
                          key={a._id}
                          className={`ac-pending-item${overdue ? " ac-pending-item--overdue" : ""}`}
                        >
                          <span
                            className="ac-pending-icon"
                            style={{ background: sc.bg }}
                          >
                            {sc.emoji}
                          </span>
                          <div className="ac-pending-info">
                            <p className="ac-pending-name">{a.title}</p>
                            <p className="ac-pending-due">
                              {overdue ? "⚠️ " : ""}
                              {fmtDate(a.dueDate)}
                            </p>
                          </div>
                          {/* COMPLETE FLOW: action button in pending sidebar too */}
                          {a.status === "todo" ? (
                            <button
                              className="ac-done-btn ac-done-btn--sm"
                              onClick={() => setSubmitModalTask(a)}
                              disabled={undoId === a._id}
                            >
                              <CheckCircle2 size={11} />
                              Done
                            </button>
                          ) : (
                            <span
                              className="ac-status-pill ac-status-pill--sm"
                              style={{
                                background: st.bg,
                                color: st.color,
                                borderColor: st.border,
                              }}
                            >
                              {st.icon}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 3: YEARLY PERFORMANCE
      ══════════════════════════════════════ */}
      {tab === "yearly" && (
        <div className="ac-view">
          {/* KPI row */}
          <div className="ac-kpi-row">
            {[
              {
                icon: "📚",
                label: mockData.uiStrings.totalAssigned,
                value: yearly.total,
                color: "#2563eb",
                bg: "#dbeafe",
              },
              {
                icon: "⭐",
                label: mockData.uiStrings.verified,
                value: yearly.verified,
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                icon: "🎯",
                label: mockData.uiStrings.verifyRate,
                value: `${verifyRate}%`,
                color: "#7c3aed",
                bg: "#ede9fe",
              },
              {
                icon: "⏳",
                label: mockData.uiStrings.stillPending,
                value: yearly.pending + yearly.inReview,
                color: "#d97706",
                bg: "#fef3c7",
              },
            ].map((k, i) => (
              <div
                key={i}
                className="ac-kpi"
                style={
                  {
                    "--kpi-color": k.color,
                    "--kpi-bg": k.bg,
                  } as React.CSSProperties
                }
              >
                <div className="ac-kpi-icon">{k.icon}</div>
                <div>
                  <p className="ac-kpi-label">{k.label}</p>
                  <p className="ac-kpi-value">{k.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Area chart */}
          <section className="ac-yr-section">
            <div className="ac-yr-head">
              <TrendingUp size={15} color="#3b82f6" />
              <h3>{mockData.uiStrings.completionTrend}</h3>
            </div>
            <div className="ac-chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={monthChart}
                  margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1.5px solid #e2e8f0",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontFamily: "Nunito",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v}% verified`, "Completion"]}
                    labelStyle={{ fontWeight: 800, color: "#1e293b" }}
                    cursor={{
                      stroke: "#3b82f6",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pct"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#cGrad)"
                    dot={{
                      fill: "#3b82f6",
                      r: 4,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Subject cards */}
          <section className="ac-yr-section">
            <div className="ac-yr-head">
              <BookOpen size={15} color="#7c3aed" />
              <h3>{mockData.uiStrings.perfBySubject}</h3>
            </div>
            <div className="ac-subject-grid">
              {Object.entries(yearly.bySubject).map(([subject, data]) => {
                const pct = data.total
                  ? Math.round((data.verified / data.total) * 100)
                  : 0;
                const cfg = subCfg(subject);
                return (
                  <div
                    key={subject}
                    className="ac-subject-card"
                    style={
                      {
                        "--sub-color": cfg.color,
                        "--sub-bg": cfg.bg,
                      } as React.CSSProperties
                    }
                  >
                    <div className="ac-sub-top">
                      <div className="ac-sub-icon">{cfg.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <p className="ac-sub-name">{subject}</p>
                        <p className="ac-sub-stat">
                          {mockData.uiStrings.verifiedSub(
                            data.verified,
                            data.total,
                          )}
                        </p>
                      </div>
                      {/* Mini donut */}
                      <div className="ac-sub-ring">
                        <svg viewBox="0 0 56 56" className="ac-sub-donut">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="5"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * 0.25}`}
                          />
                        </svg>
                        <div
                          className="ac-sub-donut-center"
                          style={{ color: cfg.color }}
                        >
                          {pct}%
                        </div>
                      </div>
                    </div>
                    <div className="ac-sub-bar">
                      <div
                        className="ac-sub-bar-fill"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
      </div>

      <Dialog open={!!submitModalTask} onOpenChange={(open) => {
        if (!open) {
          setSubmitModalTask(null);
          setSelectedFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900">Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-6">
              You are about to submit <strong className="text-slate-800">{submitModalTask?.title}</strong>. You can optionally attach a file (image, video, or PDF) to show your work.
            </p>
            
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
                ${selectedFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="text-blue-600" size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFile(null); }}
                    className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                    <UploadCloud className="text-slate-500" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Click or drag file to upload</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, Image, or Video (max 10MB)</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 sm:justify-between flex-row-reverse">
            <Button 
              onClick={() => {
                if (submitModalTask) {
                  handleSubmit(submitModalTask._id, selectedFile);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6"
            >
              Submit Assignment
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSubmitModalTask(null);
                setSelectedFile(null);
              }}
              className="rounded-xl font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ─────────────────────────────────────────
// TASK CARD — Tab 1
// ─────────────────────────────────────────
interface TaskCardProps {
  a: Assignment;
  expanded: boolean;
  isUndo: boolean;
  onToggle: () => void;
  onSubmit: () => void;
}

function TaskCard({ a, expanded, isUndo, onToggle, onSubmit }: TaskCardProps) {
  const sc = subCfg(a.subject);
  const st = stCfg(a.status);
  return (
    <div
      className={`ac-task${expanded ? " ac-task--open" : ""}${isUndo ? " ac-task--pulse" : ""}`}
      style={{ "--task-accent": sc.color } as React.CSSProperties}
    >
      <div className="ac-task-strip" />
      <div className="ac-task-icon" style={{ background: sc.bg }}>
        {sc.emoji}
      </div>
      <div className="ac-task-body">
        <p className="ac-task-name">{a.title}</p>
        <p className="ac-task-subject">{a.subject}</p>
      </div>
      <div className="ac-task-right">
        {/* COMPLETE FLOW: todo/not_submitted/pending → button, others → status pill */}
        {["todo", "not_submitted", "pending"].includes(a.status) ? (
          <button className="ac-done-btn" onClick={onSubmit} disabled={isUndo}>
            <CheckCircle2 size={13} />
            {isUndo
              ? mockData.uiStrings.submitting
              : mockData.uiStrings.done + "!"}
          </button>
        ) : (
          <span
            className="ac-status-pill"
            style={{
              background: st.bg,
              color: st.color,
              borderColor: st.border,
            }}
          >
            {st.icon} {st.label}
          </span>
        )}
        <button className="ac-task-toggle" onClick={onToggle}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && (
        <div className="ac-task-details">
          <div className="ac-detail">
            <span>{mockData.uiStrings.due}</span>
            <span>{fmtDate(a.dueDate)}</span>
          </div>
          {a.submittedDate && (
            <div className="ac-detail">
              <span>{mockData.uiStrings.submitted}</span>
              <span className="ac-detail--green">
                {fmtDate(a.submittedDate)}
              </span>
            </div>
          )}
          {a.rejectionNote && (
            <div className="ac-detail ac-detail--warn">
              <AlertCircle size={12} />
              <span>{a.rejectionNote}</span>
            </div>
          )}
          {a.fileUrl && (
            <div className="ac-detail">
              <Paperclip size={12} className="text-slate-400" />
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline hover:text-blue-600 font-medium">
                View Attachment ({a.fileType === 'pdf' ? 'PDF' : a.fileType === 'video' ? 'Video' : 'Image'})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
