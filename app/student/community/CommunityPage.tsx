"use client";
// app/student/community/page.tsx — BWF Family Wall
import React, { useEffect, useState } from "react";
import "../styles/community.css";
import { useProfile } from "../context/ProfileContext";
import { SkeletonLoader } from "../components/SkeletonLoader";
import {
  Heart,
  Send,
  Sparkles,
  CheckCircle2,
  ImagePlus,
  ShieldCheck,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { getAvatarUrl } from "@/app/lib/avatar";
import { fetchCommunityPosts, postMessage, toggleLike } from "./service";
import { motion, type Variants } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { X, Video } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

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
  mediaType?: string;
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
  const { name, customAvatarUrl } = useProfile();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{url: string, type?: string} | null>(null);
  
  const getMediaUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    const normalizedPath = url.replace(/\\/g, '/');
    return `${baseUrl}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
  };



  const handleSubmit = async () => {
    if ((!submitText.trim() && !mediaFile) || isSubmitting) return;

    try {
      setIsSubmitting(true);
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
    } catch {
      setError("Failed to submit post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await toggleLike(postId);

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.likes } : p)),
      );
    } catch {
      // Fail silently
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
        const [data] = await Promise.all([
          fetchCommunityPosts(),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <div className="cm-error">{error}</div>;
  }

  return (
    <div className="cm-page">
      <motion.div variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 mt-2 px-4 md:px-0">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
          >
            Student Community
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-slate-500 mt-2"
          >
            Connect, share resources, and create polls.
          </motion.p>
        </div>
      </motion.div>

      {/* HERO */}
      <motion.div variants={itemVariants}>
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
      </motion.div>

      {/* FILTER CHIPS */}
      <motion.div variants={itemVariants} className="mb-8 overflow-x-auto hide-scrollbar">
        <div className="flex items-center bg-slate-100/80 p-1 rounded-full w-max border border-slate-200/60 shadow-inner">
          {mockData.filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as "all" | Category)}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="community-filter-pill-student"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-sm">{f.emoji}</span>
                  <span>{f.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 2-COL LAYOUT */}
      <motion.div variants={itemVariants} className="cm-layout">
        {/* FEED */}
        <div className="cm-feed">
          {visible.length === 0 ? (
            <div className="cm-empty">
              <span>🌸</span>
              {mockData.uiStrings.emptyState}
            </div>
          ) : (
            visible.map((post) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        className="cm-post-av overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getAvatarUrl(post.author)} alt={post.author} className="w-full h-full object-cover" />
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

                  {post.mediaUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 relative group cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewMedia({url: post.mediaUrl!, type: post.mediaType})}>
                      {post.mediaType?.startsWith('video') ? (
                        <>
                          <video src={getMediaUrl(post.mediaUrl)} className="w-full h-auto max-h-[400px] object-cover pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="bg-white/80 p-3 rounded-full shadow-lg backdrop-blur-sm"><Video className="w-6 h-6 text-slate-800" /></div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getMediaUrl(post.mediaUrl)} alt="Post media" className="w-full h-auto max-h-[400px] object-cover pointer-events-none" />
                        </>
                      )}
                    </div>
                  )}

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
                  <div className="cm-submit-av overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={customAvatarUrl || getAvatarUrl(name)}
                      alt="Profile photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="cm-submit-name">{firstName}</span>
                </div>
                <Select value={submitCat} onValueChange={(value) => setSubmitCat(value as Category)}>
                  <SelectTrigger className="cm-cat-select flex h-10 items-center justify-between">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 bg-white">
                    {(Object.keys(mockData.catConfig) as Category[]).map((c) => (
                      <SelectItem key={c} value={c} className="rounded-xl focus:bg-slate-100 cursor-pointer">
                        <span className="flex items-center gap-2">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <span>{(mockData.catConfig as any)[c].emoji}</span>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <span>{(mockData.catConfig as any)[c].label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <textarea
                  className="cm-submit-textarea"
                  placeholder="Write something that made you proud, grateful, or happy…"
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  rows={4}
                />
                {!mediaPreview ? (
                  <label className="cm-media-upload">
                    <input
                      type="file"
                      accept="image/*,application/pdf,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setMediaFile(file);
                        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                        setMediaPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                    <ImagePlus size={14} />
                    <span>Add file (optional)</span>
                  </label>
                ) : (
                  <div className="cm-media-preview-wrap relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 mb-3">
                    {mediaFile?.type.startsWith('video/') ? (
                      <video src={mediaPreview} controls className="cm-media-preview w-full" />
                    ) : mediaFile?.type.startsWith('application/pdf') ? (
                      <div className="flex flex-col items-center justify-center p-8">
                         <FileText className="w-10 h-10 text-blue-500 mb-3" />
                         <span className="text-sm font-semibold text-slate-700 text-center px-4">{mediaFile.name}</span>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaPreview} alt="Selected upload" className="cm-media-preview w-full object-cover" />
                      </>
                    )}
                    
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-sm backdrop-blur-sm transition-colors border border-slate-200">
                        <Pencil className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              setMediaFile(file);
                              if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                              setMediaPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="bg-white/90 hover:bg-rose-50 text-rose-600 p-2 rounded-full shadow-sm backdrop-blur-sm transition-colors border border-slate-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  className="cm-submit-btn"
                  onClick={handleSubmit}
                  disabled={(!submitText.trim() && !mediaFile) || isSubmitting}
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
      </motion.div>
      </motion.div>
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          {previewMedia && (
            <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
              {previewMedia.type?.startsWith('video') ? (
                <video src={getMediaUrl(previewMedia.url)} controls className="max-w-full max-h-full rounded-lg" autoPlay />
              ) : previewMedia.type?.includes('pdf') ? (
                <iframe src={getMediaUrl(previewMedia.url)} className="w-full h-full bg-white rounded-lg" title="PDF Preview" />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(previewMedia.url)} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
                </>
              )}
              <button
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-50"
                onClick={() => setPreviewMedia(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
