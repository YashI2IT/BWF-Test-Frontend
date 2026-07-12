"use client";
// app/student/community/page.tsx — BWF Family Wall
import React, { useEffect, useState } from "react";
import "../styles/community.css";
import { useProfile } from "../context/ProfileContext";
import { getAvatar } from "../constants/avatars";
import {
  Heart,
  Send,
  Sparkles,
  CheckCircle2,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { fetchCommunityPosts, postMessage, toggleLike } from "./service";

// ── Types ──
type Category = "Win" | "Story" | "Gratitude" | "Highlight";

interface Post {
  _id: string;
  author: string;
  avatarId: string;
  role: "Student" | "Warden" | "Admin";
  category: Category;
  content: string;
  likes: number;
  createdAt: string;
  mediaUrl?: string;
}

const mockData = {
  catConfig: {
    Win: {
      emoji: "🏆",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
      label: "Win",
    },
    Story: {
      emoji: "💛",
      color: "#d97706",
      bg: "#fef3c7",
      border: "#fde68a",
      label: "Story",
    },
    Gratitude: {
      emoji: "🌸",
      color: "#db2777",
      bg: "#fce7f3",
      border: "#fbcfe8",
      label: "Gratitude",
    },
    Highlight: {
      emoji: "⭐",
      color: "#2563eb",
      bg: "#dbeafe",
      border: "#bfdbfe",
      label: "Highlight",
    },
  },
  filters: [
    { key: "all", label: "All", emoji: "🌟" },
    { key: "Win", label: "Wins", emoji: "🏆" },
    { key: "Story", label: "Stories", emoji: "💛" },
    { key: "Gratitude", label: "Gratitude", emoji: "🌸" },
    { key: "Highlight", label: "Highlights", emoji: "⭐" },
  ],
  verifiedPosts: [
    {
      _id: "1",
      author: "Zoya Khan",
      avatarId: "bunny",
      role: "Student",
      category: "Win",
      content:
        "I finally completed my advanced algebra module after weeks of hard work! This journey has taught me that I am capable of more than I thought. Thank you Ms. Dana and everyone who believed in me. 🙏",
      likes: 47,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      _id: "2",
      author: "Ms. Dana Elomo",
      avatarId: "flower",
      role: "Warden",
      category: "Highlight",
      content:
        "So proud of our students this week — the Science module presentation was outstanding. Every single one of you showed up with courage and curiosity. The BWF family is shining bright. ✨",
      likes: 93,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      _id: "3",
      author: "Arif Shaikh",
      avatarId: "rocket",
      role: "Student",
      category: "Gratitude",
      content:
        "I want to say a big thank you to my warden and the BWF team. A year ago I didn't think school was for me. Today I submitted my first assignment on time and I am really proud of myself. This family made that possible. 💛",
      likes: 121,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      _id: "4",
      author: "BWF Admin",
      avatarId: "rocket",
      role: "Admin",
      category: "Highlight",
      content:
        "This month, 87% of our students completed their modules on time — an all-time record for our community! Every small step each of you takes builds something bigger than you know. Keep going. 🌟",
      likes: 158,
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ],
  uiStrings: {
    pageTitle: "BWF Inspiration Wall",
    pageEyebrow: "Our Community",
    heroTitle: "Every voice here matters. 🌸",
    heroSub1:
      "Wins, moments, gratitude — from our students, wardens, and team.",
    heroSub2: "All posts are reviewed before they appear here.",
    storiesShared: "Stories shared",
    emptyState: "No stories in this category yet.",
    verifiedTag: "Verified post",
    shareTitle: "✍️ Share your story",
    shareHint:
      "Your story and any image are reviewed by your warden before they appear on the wall.",
    submittedTitle: "Submitted!",
    submittedDesc: "Your submission is with the warden for review. 🌸",
    aboutTitle: "🌿 About this wall",
    aboutSteps: [
      "You share a story or moment",
      "Your warden reviews it",
      "It appears here for the whole BWF community",
    ],
    aboutPublicNote: "Only verified posts and media are visible publicly",
  },
};

// TODO: Replace with GET /api/student/community/posts
// TODO: Replace submit with POST /api/student/community/posts

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export default function CommunityPage() {
  const { name, avatarId, customAvatarUrl } = useProfile();
  const av = getAvatar(avatarId as string);
  const firstName = name.split(" ")[0];

  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"all" | Category>("all");

  // Submit form state
  const [submitText, setSubmitText] = useState("");
  const [submitCat, setSubmitCat] = useState<Category>("Story");
  const [submitted, setSubmitted] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!submitText.trim() && !mediaFile) return;

    try {
      const formData = new FormData();
      formData.append("content", submitText);
      formData.append("category", submitCat);

      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      await postMessage(formData);

      setSubmitted(true);
      setSubmitText("");
      setMediaFile(null);
      setMediaPreview(null);

      const data = await fetchCommunityPosts();
      setPosts(data);

      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await toggleLike(postId);

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.likes } : p)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const visible =
    filter === "all" ? posts : posts.filter((p) => p.category === filter);

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const data = await fetchCommunityPosts();
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return <div className="cm-loading">Loading community...</div>;
  }

  if (error) {
    return <div className="cm-error">{error}</div>;
  }

  return (
    <div className="cm-page">
      {/* HEADER */}
      <header className="cm-header">
        <div>
          <p className="cm-eyebrow">{mockData.uiStrings.pageEyebrow}</p>
          <h1 className="cm-title">{mockData.uiStrings.pageTitle}</h1>
        </div>
      </header>

      {/* HERO */}
      <section className="cm-hero">
        <div className="cm-hero-blob cm-hero-blob-1" />
        <div className="cm-hero-blob cm-hero-blob-2" />
        <div className="cm-hero-text">
          <h2>{mockData.uiStrings.heroTitle}</h2>
          <p>{mockData.uiStrings.heroSub1}</p>
          <p className="cm-hero-sub">{mockData.uiStrings.heroSub2}</p>
        </div>
        <div className="cm-hero-stats">
          <div className="cm-hero-stat">
            <span className="cm-hero-stat-num">{posts.length}</span>
            <span className="cm-hero-stat-label">
              {mockData.uiStrings.storiesShared}
            </span>
          </div>
        </div>
      </section>

      {/* FILTER CHIPS */}
      <div className="cm-filters">
        {mockData.filters.map((f) => (
          <button
            key={f.key}
            className={`cm-chip${filter === f.key ? " cm-chip--active" : ""}`}
            onClick={() => setFilter(f.key as "all" | Category)}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* 2-COL LAYOUT */}
      <div className="cm-layout">
        {/* FEED */}
        <div className="cm-feed">
          {visible.length === 0 ? (
            <div className="cm-empty">
              <span>🌸</span>
              {mockData.uiStrings.emptyState}
            </div>
          ) : (
            visible.map((post) => {
              const postAv = getAvatar(post.avatarId);
              const cfg = (mockData.catConfig as any)[post.category];
              return (
                <article key={post._id} className="cm-post">
                  <div
                    className="cm-post-stripe"
                    style={{ background: cfg.border }}
                  />

                  {/* Header */}
                  <div className="cm-post-head">
                    <div className="cm-post-author">
                      <div
                        className="cm-post-av"
                        style={{ background: postAv.bg }}
                      >
                        {postAv.emoji}
                      </div>
                      <div>
                        <div className="cm-post-name">
                          {post.author}
                          {(post.role === "Admin" ||
                            post.role === "Warden") && (
                            <span className="cm-role-badge cm-role-badge--staff">
                              {post.role}
                            </span>
                          )}
                        </div>
                        <div className="cm-post-meta">
                          {timeAgo(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span
                      className="cm-cat-badge"
                      style={{
                        color: cfg.color,
                        background: cfg.bg,
                        borderColor: cfg.border,
                      }}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="cm-post-text">{post.content}</p>

                  {/* Footer */}
                  <div className="cm-post-foot">
                    <button onClick={() => handleLike(post._id)}>
                      <Heart size={14} />
                      {post.likes}
                    </button>
                    <span className="cm-verified-tag">
                      <CheckCircle2 size={12} />{" "}
                      {mockData.uiStrings.verifiedTag}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="cm-sidebar">
          {/* Submit your story */}
          <div className="cm-sidebar-card cm-submit-card">
            <p className="cm-sidebar-title">{mockData.uiStrings.shareTitle}</p>
            <p className="cm-submit-hint">{mockData.uiStrings.shareHint}</p>

            {submitted ? (
              <div className="cm-submit-success">
                <Sparkles size={16} />
                <div>
                  <strong>{mockData.uiStrings.submittedTitle}</strong>
                  <p>{mockData.uiStrings.submittedDesc}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="cm-submit-author">
                  <div className="cm-submit-av" style={{ background: av.bg }}>
                    {customAvatarUrl ? (
                      <Image
                        src={customAvatarUrl}
                        alt="Profile photo"
                        width={30}
                        height={30}
                        className="cm-submit-av-img"
                      />
                    ) : (
                      av.emoji
                    )}
                  </div>
                  <span className="cm-submit-name">{firstName}</span>
                </div>
                <select
                  className="cm-cat-select"
                  value={submitCat}
                  onChange={(e) => setSubmitCat(e.target.value as Category)}
                >
                  {(Object.keys(mockData.catConfig) as Category[]).map((c) => (
                    <option key={c} value={c}>
                      {(mockData.catConfig as any)[c].emoji}{" "}
                      {(mockData.catConfig as any)[c].label}
                    </option>
                  ))}
                </select>
                <textarea
                  className="cm-submit-textarea"
                  placeholder="Write something that made you proud, grateful, or happy…"
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  rows={4}
                />
                <label className="cm-media-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMediaFile(file);
                      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                      setMediaPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                  <ImagePlus size={14} />
                  <span>
                    {mediaFile ? "Change image" : "Add image (optional)"}
                  </span>
                </label>
                {mediaPreview && (
                  <div className="cm-media-preview-wrap">
                    <img
                      src={mediaPreview}
                      alt="Selected upload"
                      className="cm-media-preview"
                    />
                  </div>
                )}
                <button
                  className="cm-submit-btn"
                  onClick={handleSubmit}
                  disabled={!submitText.trim() && !mediaFile}
                >
                  <Send size={14} /> Send for review
                </button>
              </>
            )}
          </div>

          {/* What is this wall */}
          <div className="cm-sidebar-card">
            <p className="cm-sidebar-title">{mockData.uiStrings.aboutTitle}</p>
            <div className="cm-about-steps">
              {mockData.uiStrings.aboutSteps.map((step, idx) => (
                <div key={idx} className="cm-about-step">
                  <span className="cm-about-num">{idx + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
              <div className="cm-about-step">
                <span className="cm-about-num">
                  <ShieldCheck size={14} />
                </span>
                <span>{mockData.uiStrings.aboutPublicNote}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
