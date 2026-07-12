"use client";
// app/student/components/DiaryEntry.tsx
import { useState, useMemo, useEffect } from "react";
import { postJournal } from "../profile/service";
import {
  BookOpen,
  Save,
  Feather,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Gift,
} from "lucide-react";
import "../styles/diary.css";
interface Entry {
  _id: string;
  title: string;
  body: string;
  date: string; // "YYYY-MM-DD"
  createdAt: string;
}

interface Props {
  studentName: string;
  dob: string; // "YYYY-MM-DD"
  entries: Entry[];
}

const mockData = {
  weekdays: ["S", "M", "T", "W", "T", "F", "S"],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  historyWindowDays: 7,
  historyMaxItems: 50,
  maxStoredEntries: 300,
  seedEntries: [
    {
      id: "seed1",
      title: "My first day thoughts",
      body: "Today was a new beginning. I felt nervous but excited...",
      date: "2024-09-01",
      createdAt: "2024-09-01T10:00:00Z",
    },
    {
      id: "seed2",
      title: "I finished my algebra module!",
      body: "Finally! It was hard but I did it. Ms. Dana believed in me.",
      date: "2024-11-14",
      createdAt: "2024-11-14T14:00:00Z",
    },
    {
      id: "seed3",
      title: "What I want for my future",
      body: "One day I want to be a scientist. I wrote this on my birthday...",
      date: "2024-05-14",
      createdAt: "2024-05-14T09:00:00Z",
    },
  ],
  uiStrings: {
    pageTitle: "Personal Journal",
    pageSubtitle: "Your private space — write, reflect, revisit.",
    entryLabel: "entry",
    entriesLabel: "entries",
    birthdayGreeting: "🎉 Happy Birthday, ",
    pastLetterTitle: "A letter from past you — ",
    fullEntryBtn: "Read full entry ✨",
    noEntryFound: "No entry found from your last birthday",
    writeForFuture:
      "Write something today for future you to read next year! 🌸",
    hasEntryLegend: "has entry",
    todayLegend: "today",
    birthdayLegend: "birthday",
    noEntryDay: "No entry for this day.",
    savedLabel: "✅ Saved!",
    titlePlaceholder: "Give this entry a title… (optional)",
    bodyPlaceholder: (
      name: string,
    ) => `Write freely, ${name}. This is your space.

What happened today? What are you feeling?
What do you want to tell your future self?`,
    saveEntryBtn: " Save Entry",
    recentEntriesTitle: "📚 Recent Entries ",
    searchPlaceholder: "Search journal…",
    noEntriesHistory: "No entries yet. Start writing above! 🌸",
  },
};

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function isBirthday(dob: string): boolean {
  const today = new Date();
  const d = new Date(dob);
  return today.getMonth() === d.getMonth() && today.getDate() === d.getDate();
}

function lastYearBirthdayStr(dob: string): string {
  const d = new Date(dob);
  const y = new Date().getFullYear() - 1;
  return `${y}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DiaryEntry({ studentName, dob, entries }: Props) {
  const [localEntries, setLocalEntries] = useState<Entry[]>(entries || []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  // Calendar nav
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Read overlay
  const [readEntry, setReadEntry] = useState<Entry | null>(null);

  // Search
  const [search, setSearch] = useState("");

  const todayIsBirthday = isBirthday(dob);
  const lastBdayStr = lastYearBirthdayStr(dob);
  const capsuleEntry = localEntries.find((e) => e.date === lastBdayStr);

  useEffect(() => {
    setLocalEntries(entries || []);
  }, [entries]);

  // Entries for selected date
  const dateEntries = useMemo(
    () =>
      localEntries
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [localEntries, selectedDate],
  );

  // All entries filtered by search
  const recentEntries = useMemo(() => {
    const cutoffTs =
      Date.now() - mockData.historyWindowDays * 24 * 60 * 60 * 1000;
    const q = search.toLowerCase();
    return localEntries
      .filter((e) => new Date(e.createdAt).getTime() >= cutoffTs)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, mockData.historyMaxItems);
  }, [localEntries, search]);

  // Dates that have entries (for calendar dots)
  const entryDates = useMemo(
    () => new Set(localEntries.map((e) => e.date)),
    [localEntries],
  );

  // Calendar helpers
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  };

  const handleSave = async () => {
    if (!body.trim()) return;

    const newEntry = {
      title: title.trim() || "Untitled",
      body: body.trim(),
      date: selectedDate,
    };

    try {
      const res = await postJournal(newEntry);

      if (res?.entry) {
        setLocalEntries((prev) => [res.entry, ...prev]);
      }

      setTitle("");
      setBody("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="dj-root">
      {/* === HEADER === */}
      <div className="dj-header">
        <div className="dj-header-left">
          <div className="dj-header-icon">
            <Feather size={16} color="#7c3aed" />
          </div>
          <div>
            <h2 className="dj-title">{mockData.uiStrings.pageTitle}</h2>
            <p className="dj-subtitle">{mockData.uiStrings.pageSubtitle}</p>
          </div>
        </div>
        <div className="dj-entry-count">
          {localEntries.length}{" "}
          {localEntries.length === 1
            ? mockData.uiStrings.entryLabel
            : mockData.uiStrings.entriesLabel}
        </div>
      </div>

      {/* === BIRTHDAY TIME CAPSULE === */}
      {todayIsBirthday && (
        <div className="dj-capsule">
          <div className="dj-capsule-glow" />
          <div className="dj-capsule-left">
            <span className="dj-capsule-emoji">🎂</span>
          </div>
          <div className="dj-capsule-body">
            <p className="dj-capsule-eyebrow">
              {mockData.uiStrings.birthdayGreeting}
              {studentName.split(" ")[0]}!
            </p>
            {capsuleEntry ? (
              <>
                <p className="dj-capsule-title">
                  {mockData.uiStrings.pastLetterTitle}
                  {formatShortDate(lastBdayStr)}
                </p>
                <p className="dj-capsule-preview">
                  "{capsuleEntry.body.slice(0, 160)}
                  {capsuleEntry.body.length > 160 ? "…" : ""}"
                </p>
                <button
                  className="dj-capsule-read"
                  onClick={() => setReadEntry(capsuleEntry)}
                >
                  {mockData.uiStrings.fullEntryBtn}
                </button>
              </>
            ) : (
              <>
                <p className="dj-capsule-title">
                  {mockData.uiStrings.noEntryFound}
                </p>
                <p className="dj-capsule-preview">
                  {mockData.uiStrings.writeForFuture}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* === MAIN 2-COL LAYOUT === */}
      <div className="dj-layout">
        {/* ── LEFT: Calendar ── */}
        <aside className="dj-cal-col">
          {/* Month nav */}
          <div className="dj-cal-nav">
            <button className="dj-cal-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={14} />
            </button>
            <span className="dj-cal-month">
              {mockData.months[calMonth]} {calYear}
            </span>
            <button className="dj-cal-nav-btn" onClick={nextMonth}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="dj-cal-grid">
            {mockData.weekdays.map((w, i) => (
              <div key={i} className="dj-cal-weekday">
                {w}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={"e" + i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const hasEntry = entryDates.has(dateStr);
              const isToday = dateStr === getTodayStr();
              const isSelected = dateStr === selectedDate;
              const isBday = (() => {
                const dob_ = new Date(dob);
                return calMonth === dob_.getMonth() && d === dob_.getDate();
              })();
              return (
                <button
                  key={d}
                  className={[
                    "dj-cal-day",
                    isSelected ? "dj-cal-day--sel" : "",
                    isToday ? "dj-cal-day--today" : "",
                    hasEntry ? "dj-cal-day--has" : "",
                    isBday ? "dj-cal-day--bday" : "",
                  ].join(" ")}
                  onClick={() => setSelectedDate(dateStr)}
                  title={isBday ? "🎂 Your Birthday!" : ""}
                >
                  {isBday ? "🎂" : d}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="dj-cal-legend">
            <span className="dj-legend-item">
              <span className="dj-legend-dot dj-legend-dot--has" />
              <span className="dj-legend-text">
                {mockData.uiStrings.hasEntryLegend}
              </span>
            </span>
            <span className="dj-legend-item">
              <span className="dj-legend-dot dj-legend-dot--today" />
              <span className="dj-legend-text">
                {mockData.uiStrings.todayLegend}
              </span>
            </span>
            <span className="dj-legend-item">
              <span className="dj-legend-dot dj-legend-dot--bday">🎂</span>
              <span className="dj-legend-text">
                {mockData.uiStrings.birthdayLegend}
              </span>
            </span>
          </div>

          {/* Entries for selected date */}
          <div className="dj-cal-date-section">
            <p className="dj-cal-date-label">
              📅 {formatShortDate(selectedDate)}
            </p>
            {dateEntries.length === 0 ? (
              <p className="dj-cal-empty">{mockData.uiStrings.noEntryDay}</p>
            ) : (
              dateEntries.map((e) => (
                <button
                  key={e._id}
                  className="dj-cal-entry-item"
                  onClick={() => setReadEntry(e)}
                >
                  <p className="dj-cal-entry-title">{e.title}</p>
                  <p className="dj-cal-entry-preview">{e.body.slice(0, 60)}…</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── RIGHT: Writing area + history ── */}
        <div className="dj-write-col">
          {/* Paper card */}
          <div className="dj-paper">
            <div className="dj-paper-top">
              <div className="dj-paper-date">{formatDate(selectedDate)}</div>
              {savedFlash && (
                <span className="dj-saved-flash">
                  {mockData.uiStrings.savedLabel}
                </span>
              )}
            </div>

            <input
              className="dj-title-input"
              placeholder={mockData.uiStrings.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="dj-body-textarea leading-[32px] bg-[linear-gradient(transparent_31px,_#e2e8f0_32px)] bg-[length:100%_32px] bg-local pt-[8px]"
              placeholder={mockData.uiStrings.bodyPlaceholder(
                studentName.split(" ")[0],
              )}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <div className="dj-paper-foot">
              <span className="dj-char-hint">{body.length} characters</span>
              <button
                className="dj-save-btn"
                onClick={handleSave}
                disabled={!body.trim()}
              >
                <Save size={14} /> {mockData.uiStrings.saveEntryBtn}
              </button>
            </div>
          </div>

          {/* Past entries list */}
          <div className="dj-history">
            <div className="dj-history-head">
              <p className="dj-history-title">
                {mockData.uiStrings.recentEntriesTitle}(
                {mockData.historyWindowDays} days)
              </p>
              <div className="dj-search-wrap">
                <Search size={13} className="dj-search-icon" />
                <input
                  className="dj-search"
                  placeholder={mockData.uiStrings.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {recentEntries.length === 0 ? (
              <p className="dj-history-empty">
                {mockData.uiStrings.noEntriesHistory}
              </p>
            ) : (
              <div className="dj-history-list">
                {recentEntries.map((e) => (
                  <button
                    key={e._id}
                    className="dj-history-card"
                    onClick={() => setReadEntry(e)}
                  >
                    <div className="dj-history-card-left">
                      <div className="dj-history-datebadge">
                        {formatShortDate(e.date)}
                      </div>
                      <h4 className="dj-history-card-title">{e.title}</h4>
                      <p className="dj-history-card-preview">
                        {e.body.slice(0, 100)}
                        {e.body.length > 100 ? "…" : ""}
                      </p>
                    </div>
                    <div className="dj-history-card-arrow">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === READ MODAL === */}
      {readEntry && (
        <div className="dj-overlay" onClick={() => setReadEntry(null)}>
          <div className="dj-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="dj-modal-close"
              onClick={() => setReadEntry(null)}
            >
              <X size={15} />
            </button>
            <p className="dj-modal-date">{formatDate(readEntry.date)}</p>
            <h2 className="dj-modal-title">{readEntry.title}</h2>
            <div className="dj-modal-body leading-[32px] bg-[linear-gradient(transparent_31px,_#e2e8f0_32px)] bg-[length:100%_32px] bg-local pt-[8px]">
              {readEntry.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
