"use client";
// app/student/dashboard/page.tsx
import React, { useState, useEffect } from "react";

import "../styles/dashboard.css";
import { Sunrise, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "../context/ProfileContext";
import api from "../../lib/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

import { INSPIRATIONAL_QUOTES } from "../constants/quotes";

const mockData = {
  studentId: "BWF-2024-001",
  defaultUrl: "https://www.borderlessworldfoundation.org/",
  mentorFallback: {
    name: "Ms. Dana",
    role: "Your Mentor",
    dateLabel: "Today",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Dana+Elomo&background=fce7f3&color=db2777&rounded=true",
    message:
      "Hi Aisha! Your group presentation for the Science module was excellent yesterday. Keep up the great momentum.",
  },
  uiStrings: {
    welcomeTitle: "Welcome back!",
    welcomeSub:
      "Borderless World Foundation (BWF) created a safe space for you.",
    scheduleTitle: "Today's Schedule",
    assignmentsTitle: "Recent Assignments",
    resourcesTitle: "Quick Resources",
    mentorNoteTitle: "Note from ",
    dailyInspirationTitle: "Daily Inspiration",
    loading: "Loading...",
    allCaughtUp: "All caught up!",
    joinSession: "Join session",
    viewDetails: "View details",
    thanked: "Thanked!",
    sayThanks: "Say thanks",
    resourceLibrary: "📚 Library",
    resourceSyllabus: "📄 Download Syllabus",
    resourceContact: "💬 Contact Mentor",
  },
};

// TODO: Replace fetch with GET /api/student/dashboard/:auth_id

export default function Dashboard() {
  const { name, authId } = useProfile();

  /* ── State ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schedule, setSchedule] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assignments, setAssignments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mentorNote, setMentorNote] = useState<any>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);

  // NEW: Dynamic Resources State
  const [resources, setResources] = useState({
    library: mockData.defaultUrl,
    syllabus: mockData.defaultUrl,
    contactMentor: mockData.defaultUrl,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reacted, setReacted] = useState(false);
  const [greeting, setGreeting] = useState<{ text: string; icon: React.ReactNode }>({ text: "Welcome", icon: <Sun className="w-6 h-6 text-orange-500" /> });

  // Stable quote for the day
  const quoteIndex = new Date().getDate() % INSPIRATIONAL_QUOTES.length;

  const firstName = name.split(" ")[0];
  
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const h = new Date().getHours();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (h < 12) {
      setGreeting({ text: "Good Morning", icon: <Sunrise className="w-6 h-6 text-amber-500" /> });
    } else if (h < 17) {
      setGreeting({ text: "Good Afternoon", icon: <Sun className="w-6 h-6 text-orange-500" /> });
    } else {
      setGreeting({ text: "Good Evening", icon: <Moon className="w-6 h-6 text-indigo-500" /> });
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const fetchDashboard = async () => {
      try {
        const [res] = await Promise.all([
          api.get(`/student/dashboard/${authId}`),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);

        setSchedule(res.data.schedule || []);

        // 30-day Guardrail for Assignments
        const allAssignments = res.data.assignments || [];
        console.log("All assignments:", allAssignments);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredAssignments = allAssignments.filter((a: any) => {
          const dueDate = new Date(a.dueDate);
          return dueDate <= thirtyDaysFromNow;
        });

        console.log("Filtered assignments:", filteredAssignments);
        setAssignments(filteredAssignments);

        // Load Mentor Note & "Thanks" state
        const note = res.data.mentorNote || null;
        setMentorNote(note);
        if (note?.thanked) setReacted(true);

        setTodayMood(res.data.todayMood || null);

        // Map dynamic resources from backend if they exist
        if (res.data.resources) {
          setResources({
            library: res.data.resources.library || mockData.defaultUrl,
            syllabus: res.data.resources.syllabus || mockData.defaultUrl,
            contactMentor:
              res.data.resources.contactMentor || mockData.defaultUrl,
          });
        }
      } catch {
        // Fail silently or toast
      } finally {
        setIsLoading(false);
      }
    };

    if (authId) fetchDashboard();
  }, [authId]);

  const handleMoodClick = async (mood: string) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await api.post(`/student/dashboard/${authId}/mood`, { mood });
      setTodayMood(mood);
    } catch {
      // Fail silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThanksClick = async () => {
    if (!mentorNote?._id || reacted || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setReacted(true);
      await api.post(
        `/student/dashboard/${authId}/mentor-note/${mentorNote._id}/thanks`,
      );
    } catch {
      setReacted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLink = (url: string) => window.open(url, "_blank");

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto w-full min-w-0 relative">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 mt-2"
      >
        <div className="flex items-center gap-3 mb-1">
          {greeting.icon}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {greeting.text}, {firstName}
          </h1>
        </div>
        <p className="text-[15px] text-slate-500 ml-9">
          Borderless World Foundation (BWF) created a safe space for you today, {todayFormatted}.
        </p>
      </motion.div>

      {/* WELCOME / MOOD */}
      <section className="welcome-banner mt-2">
        <div className="welcome-text">
          <h2>How are you feeling today?</h2>
          <p>Let us know your mood so we can support you better.</p>
        </div>
        <div className="mood-tracker">
          <button className="mood-btn" onClick={() => handleMoodClick("happy")} disabled={isSubmitting}>
            <span className="emoji">😊</span>
            <span className="label">
              {todayMood === "happy" ? "Logged!" : "Happy"}
            </span>
          </button>
          <button className="mood-btn" onClick={() => handleMoodClick("okay")} disabled={isSubmitting}>
            <span className="emoji">😐</span>
            <span className="label">
              {todayMood === "okay" ? "Logged!" : "Okay"}
            </span>
          </button>
          <button className="mood-btn" onClick={() => handleMoodClick("need_help")} disabled={isSubmitting}>
            <span className="emoji">🌧️</span>
            <span className="label">
              {todayMood === "need_help" ? "Logged!" : "Need Help"}
            </span>
          </button>
        </div>
      </section>

      {/* GRID */}
      <section className="dashboard-grid">
        <div className="card schedule-card">
          <h3>{mockData.uiStrings.scheduleTitle}</h3>
          <div className="schedule-list">
            {isLoading ? (
              <p>{mockData.uiStrings.loading}</p>
            ) : schedule.length > 0 ? (
              schedule.map((s) => (
                <div key={s._id} className="schedule-item">
                  <div className="time">{s.startTime}</div>
                  <div className="details">
                    <h4>{s.title}</h4>
                    <button
                      className="btn-primary"
                      onClick={() => s.joinLink && openLink(s.joinLink)}
                    >
                      {s.joinLink
                        ? mockData.uiStrings.joinSession
                        : mockData.uiStrings.viewDetails}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-slate-500 font-medium p-2">No classes scheduled for today.</p>
            )}
          </div>
        </div>

        {/* RECENT ASSIGNMENTS */}
        <div className="card assignments-card">
          <h3>{mockData.uiStrings.assignmentsTitle}</h3>
          <div className="assignment-list">
            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div key={a._id} className="assignment-item">
                  <div className="assignment-header">
                    <span
                      className={`status-dot dot-${a.priority || "medium"}`}
                    />
                    <h4>{a.title}</h4>
                  </div>
                  <span className="due-date">Due: {a.dueDate}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">
                {mockData.uiStrings.allCaughtUp}
              </p>
            )}
          </div>
        </div>

        {/* DYNAMIC RESOURCES */}
        <div className="card resources-card">
          <h3>{mockData.uiStrings.resourcesTitle}</h3>
          <div className="resource-buttons">
            <button
              className="resource-btn bg-library"
              onClick={() => openLink(resources.library)}
            >
              {mockData.uiStrings.resourceLibrary}
            </button>
            <button
              className="resource-btn bg-syllabus"
              onClick={() => openLink(resources.syllabus)}
            >
              {mockData.uiStrings.resourceSyllabus}
            </button>
            <button
              className="resource-btn bg-mentor"
              onClick={() => openLink(resources.contactMentor)}
            >
              {mockData.uiStrings.resourceContact}
            </button>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION */}
      <section className="connection-section mt-8">
        <div className="card mentor-note-card">
          <div className="card-header">
            <div className="mentor-info">
              <div className="mentor-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mockData.mentorFallback.avatarUrl} alt="Mentor" />
              </div>
              <div>
                <h3>
                  {mockData.uiStrings.mentorNoteTitle}
                  {mentorNote?.mentorName || mockData.mentorFallback.name}
                </h3>
                <span className="mentor-role-label">
                  {mockData.mentorFallback.role}
                </span>
              </div>
            </div>
          </div>
          <div className="mentor-message">
            <p>&quot;{mentorNote?.message || mockData.mentorFallback.message}&quot;</p>
          </div>
          <div className="mentor-actions">
            <button
              className={`btn-react${reacted ? " btn-react--active" : ""}`}
              onClick={handleThanksClick}
              disabled={reacted || isSubmitting}
            >
              {reacted ? "❤️" : "🤍"}
            </button>
            <button className="btn-reply" onClick={handleThanksClick} disabled={reacted || isSubmitting}>
              {reacted
                ? mockData.uiStrings.thanked
                : mockData.uiStrings.sayThanks}
            </button>
          </div>
        </div>

        <div className="card mindful-card">
          <div className="mindful-header">
            <h3>{mockData.uiStrings.dailyInspirationTitle}</h3>
          </div>
          <div className="mindful-body">
            <p>&quot;{INSPIRATIONAL_QUOTES[quoteIndex].quote}&quot;</p>
          </div>
          <div className="mindful-footer">
            <p>{INSPIRATIONAL_QUOTES[quoteIndex].footer}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
