"use client";
// app/student/noticeboard/NoticeBoardPage.tsx
import { useState } from "react";
import "../styles/noticeboard.css";
import { Bell, X, CheckCheck, Calendar } from "lucide-react";
import { useNotices } from "../context/NoticeContext";

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

export default function NoticeBoardPage() {
  // ← reads AND mutates the shared context
  const { notices, unreadCount, markAsRead, markAllRead, deleteNotice } = useNotices();

  const [filter, setFilter]       = useState<"all" | Category>("all");
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [leavingId, setLeaving]   = useState<string | null>(null);

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

  return (
    <div className="nb-page">

      {/* HEADER */}
      <header className="nb-header">
        <div>
          <p className="nb-eyebrow">{mockData.uiStrings.pageEyebrow}</p>
          <h1 className="nb-title">{mockData.uiStrings.pageTitle}</h1>
        </div>
        <div className="nb-header-right">
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
      </header>

      {/* FILTER CHIPS */}
      <div className="nb-filters">
        {mockData.filters.map(f => (
          <button
            key={f.key}
            className={`nb-chip${filter === f.key ? " nb-chip--active" : ""}`}
            onClick={() => setFilter(f.key as "all" | Category)}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="nb-list">
        {visible.length === 0 && (
          <div className="nb-empty">
            <span>🌸</span>
            <p>{mockData.uiStrings.emptyState}</p>
          </div>
        )}

        {visible.map(n => {
          const meta    = (mockData.cat as any)[n.category];
          const isOpen  = expandedId === n._id;
          const leaving = leavingId === n._id;

          return (
            <div
              key={n._id}
              className={[
                "nb-card",
                n.isRead ? "nb-card--read" : "nb-card--unread",
                leaving ? "nb-card--leaving" : "",
              ].filter(Boolean).join(" ")}
              style={{ "--cc":meta.color,"--cb":meta.bg,"--cbd":meta.border } as React.CSSProperties}
              onClick={() => handleExpand(n._id)}
            >
              {!n.isRead && <span className="nb-dot" />}
              <div className="nb-strip" />

              <div className="nb-badge">{meta.emoji}</div>

              <div className="nb-body">
                <div className="nb-top">
                  <h3 className="nb-card-title">{n.title}</h3>
                  <div className="nb-meta">
                    <span className="nb-cat" style={{ color:meta.color, background:meta.bg }}>{meta.label}</span>
                    <span className="nb-date"><Calendar size={10} />{fmt(n.date)}</span>
                  </div>
                </div>
                <p className={`nb-desc${isOpen ? " nb-desc--open" : ""}`}>{n.description}</p>
                <div className="nb-foot">
                  <span className="nb-toggle">{isOpen ? mockData.uiStrings.showLess : mockData.uiStrings.readMore}</span>
                  {n.isRead && <span className="nb-read-tag"><CheckCheck size={11} /> {mockData.uiStrings.readTag}</span>}
                </div>
              </div>

              <button
                className="nb-del"
                onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}