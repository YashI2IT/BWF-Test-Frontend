"use client";

import { useState, useEffect } from "react";
import "../styles/complaints.css";
import {
  ShieldAlert,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  History,
  UserSquare2,
  X,
  Plus,
  Send,
  MessageCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { postComplaints, getComplaints } from "./service";

type ComplaintStatus = "open" | "resolved" | "escalated";

interface Complaint {
  _id: string;
  text: string;
  category: string;
  status: ComplaintStatus;
  response: string | null;
  createdAt: string;
}

// TODO: Replace fetch history with GET /api/student/complaints/:auth_id
// TODO: Replace submit with POST /api/student/complaints/:auth_id

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const mockData = {
  eyebrow: "Permissions & Support",
  title: "Activities & Complaints 🌿",
  subtitle:
    "Request activity permissions or share a personal concern with the Warden.",
  formTitle: "What can we help you with?",
  formSub: "Your requests and concerns are handled securely by our team.",
  historyTitle: "Request History",
  emptyTitle: "No records found",
  emptyDesc: "Your history is empty. We're here whenever you need assistance.",
  loaderText: "Gathering your records...",
  sidebarHowItWorks: {
    title: "How it works",
    steps: [
      "Your message is sent securely and directly to the BWF Warden.",
      "The Warden will review and assign your concern to a mentor.",
      "You'll receive feedback and updates directly in this dashboard.",
    ],
  },
  sidebarSupport: {
    badge: "BWF Support",
    title: "Need to talk now?",
    desc: "Our team is available 24/7 for emotional and mental health support.",
    linkText: "Go to Wellbeing Hub",
  },
};

const ACTIVITY_CATEGORIES = [
  { id: "activity", label: "Activity Approval", icon: "🎉", color: "#8b5cf6" },
  { id: "outing", label: "Day Outing", icon: "🏙️", color: "#8b5cf6" },
  { id: "event", label: "Personal Event", icon: "🎂", color: "#f59e0b" },
];

const COMPLAINT_CATEGORIES = [
  { id: "hostel", label: "Hostel & Facilities", icon: "🛏️", color: "#6366f1" },
  { id: "academic", label: "Academic Pressure", icon: "📚", color: "#f59e0b" },
  { id: "peer", label: "Peer Conflict", icon: "🤝", color: "#ec4899" },
  { id: "safety", label: "Safety/Personal", icon: "⚠️", color: "#ef4444" },
  { id: "other", label: "Other", icon: "❓", color: "#64748b" },
];

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; icon: any; class: string }
> = {
  open: { label: "Received", icon: Clock, class: "rc-status--open" },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    class: "rc-status--resolved",
  },
  escalated: {
    label: "In Review",
    icon: ShieldAlert,
    class: "rc-status--escalated",
  },
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "resolved">(
    "all",
  );

  // Form State
  const [type, setType] = useState<"activity" | "complaint">("complaint");
  const [text, setText] = useState("");
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0].label);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    try {
      const data = await getComplaints();
      setComplaints(data.complaints || []);
      console.log("Fetched complaints:", data);
    } catch (err) {
      setError("Unable to load history. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!text.trim()) return;

    try {
      const newComplaint = await postComplaints({
        message: text.trim(),
        category,
        type,
      });

      setComplaints((prev) => [newComplaint, ...prev]);
      resetForm();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setError("Failed to send concern.");
    } finally {
      setSubmitting(false);
    }
  }

  const resetForm = () => {
    setText("");
    setType("complaint");
    setCategory(COMPLAINT_CATEGORIES[0].label);
    setShowForm(false);
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "open")
      return c.status === "open" || c.status === "escalated";
    return c.status === "resolved";
  });

  return (
    <main className="rc-page">
      {/* ── HEADER ── */}
      <header className="rc-header">
        <div className="rc-header-content">
          <p className="rc-eyebrow">{mockData.eyebrow}</p>
          <h1 className="rc-title">{mockData.title}</h1>
          <p className="rc-subtitle">{mockData.subtitle}</p>
        </div>
        {!showForm && (
          <button className="rc-raise-btn" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Request / Concern
          </button>
        )}
      </header>

      {/* ── ALERTS ── */}
      {submitted && (
        <div className="rc-banner rc-banner--success">
          <div className="rc-banner-inner">
            <CheckCircle2 size={18} />
            <span>
              Thank you for sharing. We've received your concern and will review
              it soon.
            </span>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="rc-banner-close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="rc-banner rc-banner--error">
          <div className="rc-banner-inner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
          <button
            className="rc-banner-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="rc-grid">
        {/* Left Column: Form / Info */}
        <section className="rc-column-main">
          {showForm ? (
            <div className="rc-form-container">
              <div className="rc-form-header">
                <button className="rc-back-btn" onClick={resetForm}>
                  ← Back to My History
                </button>
                <div className="rc-form-intro">
                  <MessageCircle size={28} className="rc-form-icon" />
                  <div>
                    <h2 className="rc-form-title">{mockData.formTitle}</h2>
                    <p className="rc-form-sub">{mockData.formSub}</p>
                  </div>
                </div>
              </div>

              {/* Step 1: Type Selection */}
              <div className="rc-form-section">
                <label className="rc-section-label">Select Request Type</label>
                <div className="rc-type-grid">
                  <button
                    className={`rc-type-item ${type === "activity" ? "rc-type-item--active" : ""}`}
                    onClick={() => {
                      setType("activity");
                      setCategory(ACTIVITY_CATEGORIES[0].label);
                    }}
                  >
                    <Plus size={20} />
                    <span>Activity Approval</span>
                  </button>
                  <button
                    className={`rc-type-item ${type === "complaint" ? "rc-type-item--active" : ""}`}
                    onClick={() => {
                      setType("complaint");
                      setCategory(COMPLAINT_CATEGORIES[0].label);
                    }}
                  >
                    <ShieldAlert size={20} />
                    <span>Personal Complaint</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Category */}
              <div className="rc-form-section">
                <label className="rc-section-label">Category</label>
                <div className="rc-category-grid">
                  {(type === "activity"
                    ? ACTIVITY_CATEGORIES
                    : COMPLAINT_CATEGORIES
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      className={`rc-cat-item ${category === cat.label ? "rc-cat-item--active" : ""}`}
                      onClick={() => setCategory(cat.label)}
                    >
                      <span className="rc-cat-icon">{cat.icon}</span>
                      <span className="rc-cat-label">{cat.label}</span>
                      {category === cat.label && (
                        <div className="rc-cat-check">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Message */}
              <div className="rc-form-section">
                <label className="rc-section-label">Your message</label>
                <div className="rc-textarea-wrapper">
                  <textarea
                    className="rc-textarea"
                    placeholder="Provide as much detail as you're comfortable sharing..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    maxLength={1000}
                  />
                  <div className="rc-textarea-footer">
                    <span>{text.length} / 1000 characters</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="rc-form-footer">
                <button className="rc-btn-cancel" onClick={resetForm}>
                  Discard
                </button>
                <button
                  className="rc-btn-submit"
                  disabled={submitting || !text.trim()}
                  onClick={handleSubmit}
                >
                  {submitting ? "Sending..." : "Submit Request"}
                  {!submitting && <Send size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="rc-history">
              <div className="rc-history-header">
                <div className="rc-history-title-group">
                  <History size={20} className="rc-history-icon" />
                  <h2 className="rc-history-title">{mockData.historyTitle}</h2>
                </div>
                <div className="rc-tabs">
                  <button
                    className={`rc-tab ${activeTab === "all" ? "rc-tab--active" : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={`rc-tab ${activeTab === "open" ? "rc-tab--active" : ""}`}
                    onClick={() => setActiveTab("open")}
                  >
                    Active
                  </button>
                  <button
                    className={`rc-tab ${activeTab === "resolved" ? "rc-tab--active" : ""}`}
                    onClick={() => setActiveTab("resolved")}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rc-loader">
                  <div className="rc-loader-ring"></div>
                  <p>{mockData.loaderText}</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="rc-empty-state">
                  <div className="rc-empty-graphic">🕊️</div>
                  <h3>{mockData.emptyTitle}</h3>
                  <p>{mockData.emptyDesc}</p>
                </div>
              ) : (
                <div className="rc-list">
                  {filteredComplaints.map((c) => {
                    const config =
                      STATUS_CONFIG[c.status] || STATUS_CONFIG["open"];
                    const Icon = config.icon;
                    return (
                      <div
                        key={c._id}
                        className={`rc-card rc-card--${c.status}`}
                      >
                        <div className="rc-card-header">
                          <div className="rc-card-badges">
                            <span className={`rc-pill-status ${config.class}`}>
                              <Icon size={12} />
                              {config.label}
                            </span>
                            <span className="rc-pill-cat">
                              {c.category || "General"}
                            </span>
                          </div>
                          <span className="rc-card-date">
                            {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="rc-card-body">{c.text}</p>

                        {c.response && (
                          <div className="rc-mentor-response">
                            <div className="rc-mentor-head">
                              <MessageSquarePlus size={14} />
                              <span>Mentor Feedback</span>
                            </div>
                            <p className="rc-mentor-body">{c.response}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Support / Guidance */}
        <aside className="rc-column-sidebar">
          <div className="rc-sidebar-card rc-sidebar-card--primary">
            <HelpCircle size={24} className="rc-sidebar-icon" />
            <h3 className="rc-sidebar-title">
              {mockData.sidebarHowItWorks.title}
            </h3>
            <ul className="rc-sidebar-list">
              {mockData.sidebarHowItWorks.steps.map((step, idx) => (
                <li key={idx}>
                  <div className="rc-list-point">{idx + 1}</div>
                  <p>{step}</p>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rc-sidebar-card rc-sidebar-card--purple"
            onClick={() => (window.location.href = "/student/wellbeing")}
          >
            <div className="rc-sidebar-badge">
              {mockData.sidebarSupport.badge}
            </div>
            <h3 className="rc-sidebar-title">
              {mockData.sidebarSupport.title}
            </h3>
            <p className="rc-sidebar-desc">{mockData.sidebarSupport.desc}</p>
            <div className="rc-sidebar-link">
              <span>{mockData.sidebarSupport.linkText}</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
