"use client";
// app/student/profile/ProfilePage.tsx
import { useState, useEffect } from "react";
import "../styles/profile.css";
import {
  Edit2,
  Save,
  Star,
  BookOpen,
  Sparkles,
  Upload,
  Trash2,
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { AVATARS, AVATAR_CATEGORIES, getAvatar } from "../constants/avatars";
import DiaryEntry from "../components/DiaryEntry";
import Image from "next/image";
import { getProfile, updateProfile, getJournalEntries } from "./service";

const mockData = {
  interestEmojis: {
    Drawing: "🎨",
    Science: "🔬",
    Music: "🎵",
    Reading: "📚",
    Sports: "⚽",
    Cooking: "🍳",
    Dancing: "💃",
    Writing: "✍️",
    Nature: "🌿",
    Crafts: "✂️",
    Singing: "🎤",
    Gardening: "🌱",
  },
  // initialProfile: {
  //   name: "Aisha Sharma",
  //   dob: "2010-05-14",
  //   classInfo: "10th Grade",
  //   interests: ["Drawing", "Science", "Music"],
  //   bio: "I love learning new things and believe every day is a chance to grow. 🌸",
  // },
  uiStrings: {
    pageEyebrow: "My Account",
    pageTitle: "My Profile",
    savedToast: "Saved! ✨",
    saveBtn: "Save Profile",
    editBtn: "Edit Profile",
    avatarTitle: "Tap to change avatar",
    roleStudent: "Student",
    bioPlaceholder: "Something about yourself…",
    tagAddPlaceholder: "+ Add…",
    pickerTitle: "Choose your avatar ✨",
    pickerSub: "Pick something that feels like you!",
    uploadBtn: "Upload my photo",
    removeBtn: "Remove photo",
    statClass: "Class",
    statInterests: "Interests",
    statInterestsSub: " things I love",
  },
};

interface Profile {
  name: string;
  dob: string;
  classInfo: string;
  interests: string[];
  bio: string;
}

export default function ProfilePage() {
  const {
    avatarId,
    customAvatarUrl,
    setAvatarId,
    setCustomAvatarUrl,
    setName: setCtxName,
  } = useProfile();
  const av = getAvatar(avatarId);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeCategory, setActiveCat] = useState<string>("Animals");
  const [tagInput, setTagInput] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  // const [profile, setProfile] = useState<Profile>(mockData.initialProfile);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    dob: "",
    classInfo: "",
    interests: [],
    bio: "",
  });

  const set = (k: keyof Profile, v: any) =>
    setProfile((p) => ({ ...p, [k]: v }));

  // const handleSave = () => {
  //   setCtxName(profile.name); // sync name to context
  //   setSaved(true);
  //   setEditing(false);
  //   setPickerOpen(false);
  //   setTimeout(() => setSaved(false), 2800);
  // };

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        bio: profile.bio,
        classInfo: profile.classInfo,
        interests: profile.interests,
        avatarId,
        customAvatarUrl,
      });

      setProfile({
        name: updated.name,
        dob: updated.dob,
        classInfo: updated.classInfo,
        interests: updated.interests,
        bio: updated.bio,
      });

      setCtxName(profile.name);

      setSaved(true);
      setEditing(false);
      setPickerOpen(false);

      setTimeout(() => setSaved(false), 2800);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !profile.interests.includes(v)) {
      set("interests", [...profile.interests, v]);
      setTagInput("");
    }
  };

  const catAvatars = AVATARS.filter((a) => a.category === activeCategory);

  const handleCustomAvatarUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setCustomAvatarUrl(result);
      setPickerOpen(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProfile();

        setProfile({
          name: data.name,
          dob: data.dob || "",
          classInfo: data.classInfo,
          interests: data.interests,
          bio: data.bio,
        });

        // also sync avatar
        if (data.avatarId) setAvatarId(data.avatarId);
        if (data.customAvatarUrl) setCustomAvatarUrl(data.customAvatarUrl);
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const data = await getJournalEntries();
        console.log("journal data:", data);
        setEntries(data.entries || []);
      } catch (err) {
        console.error("Journal fetch error:", err);
      }
    };

    fetchJournal();
  }, []);

  return (
    <div className="prof-page">
      {/* HEADER */}
      <header className="prof-header">
        <div>
          <p className="prof-eyebrow">{mockData.uiStrings.pageEyebrow}</p>
          <h1 className="prof-title">{mockData.uiStrings.pageTitle}</h1>
        </div>
        <div className="prof-header-right">
          {saved && (
            <div className="prof-toast">
              <Sparkles size={13} /> {mockData.uiStrings.savedToast}
            </div>
          )}
          <button
            className={`prof-edit-btn${editing ? " prof-edit-btn--save" : ""}`}
            onClick={() => (editing ? handleSave() : setEditing(true))}
          >
            {editing ? (
              <>
                <Save size={15} />
                {mockData.uiStrings.saveBtn}
              </>
            ) : (
              <>
                <Edit2 size={15} />
                {mockData.uiStrings.editBtn}
              </>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="prof-hero">
        <div className="prof-blob b1" />
        <div className="prof-blob b2" />
        <div className="prof-blob b3" />

        {/* Avatar */}
        <div className="prof-av-col">
          <button
            className="prof-av"
            style={{ background: av.bg }}
            onClick={() => editing && setPickerOpen((o) => !o)}
            title={editing ? mockData.uiStrings.avatarTitle : av.label}
          >
            {customAvatarUrl ? (
              <Image
                src={customAvatarUrl}
                alt="Custom profile photo"
                fill
                sizes="96px"
                className="prof-av-image"
              />
            ) : (
              <span className="prof-av-emoji">{av.emoji}</span>
            )}
            {editing && <span className="prof-av-overlay">🎨</span>}
          </button>
          {!customAvatarUrl && <span className="prof-av-name">{av.label}</span>}
        </div>

        {/* Info */}
        <div className="prof-hero-info">
          {editing ? (
            <input
              className="prof-name-input"
              value={profile.name}
              onChange={(e) => set("name", e.target.value)}
            />
          ) : (
            <h2 className="prof-hero-name">{profile.name}</h2>
          )}

          <div className="prof-badges">
            <span className="prof-badge prof-badge--b">
              <Star size={11} fill="currentColor" />
              {mockData.uiStrings.roleStudent}
            </span>
            <span className="prof-badge prof-badge--t">
              <BookOpen size={11} />
              {profile.classInfo}
            </span>
          </div>

          {editing ? (
            <input
              className="prof-bio-input"
              value={profile.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder={mockData.uiStrings.bioPlaceholder}
            />
          ) : (
            <p className="prof-hero-bio">{profile.bio}</p>
          )}

          <div className="prof-tags">
            {profile.interests.map((t) => (
              <span key={t} className="prof-tag">
                {(mockData.interestEmojis as any)[t] || "🌟"} {t}
                {editing && (
                  <button
                    className="prof-tag-rm"
                    onClick={() =>
                      set(
                        "interests",
                        profile.interests.filter((x) => x !== t),
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {editing && (
              <input
                className="prof-tag-add"
                placeholder={mockData.uiStrings.tagAddPlaceholder}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTag();
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* AVATAR PICKER */}
      {pickerOpen && editing && (
        <section className="prof-picker">
          <div className="prof-picker-top">
            <div>
              <h3 className="prof-picker-title">
                {mockData.uiStrings.pickerTitle}
              </h3>
              <p className="prof-picker-sub">{mockData.uiStrings.pickerSub}</p>
            </div>
            <button
              className="prof-picker-close"
              onClick={() => setPickerOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="prof-custom-upload-row">
            <label className="prof-custom-upload-btn">
              <Upload size={14} />
              {mockData.uiStrings.uploadBtn}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCustomAvatarUpload(e.target.files?.[0] ?? null)
                }
              />
            </label>
            {customAvatarUrl && (
              <button
                className="prof-custom-remove-btn"
                onClick={() => setCustomAvatarUrl(null)}
              >
                <Trash2 size={14} />
                {mockData.uiStrings.removeBtn}
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="prof-picker-tabs">
            {AVATAR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`prof-picker-tab${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Avatar grid */}
          <div className="prof-picker-grid">
            {catAvatars.map((a) => (
              <button
                key={a.id}
                className={`prof-picker-item${avatarId === a.id ? " selected" : ""}`}
                style={{ background: a.bg }}
                onClick={() => {
                  setAvatarId(a.id);
                  setCustomAvatarUrl(null);
                  setPickerOpen(false);
                }}
                title={a.label}
              >
                <span className="picker-emoji">{a.emoji}</span>
                <span className="picker-label">{a.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* STATS */}
      <div className="prof-stats">
        {[
          {
            emoji: "🏫",
            label: mockData.uiStrings.statClass,
            value: profile.classInfo,
          },
          {
            emoji: "🎯",
            label: mockData.uiStrings.statInterests,
            value: `${profile.interests.length}${mockData.uiStrings.statInterestsSub}`,
          },
        ].map((s, i) => (
          <div key={i} className="prof-stat">
            <span className="prof-stat-emoji">{s.emoji}</span>
            <div>
              <p className="prof-stat-label">{s.label}</p>
              <p className="prof-stat-val">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="prof-grid">
        <DiaryEntry
          studentName={profile.name}
          dob={profile.dob}
          entries={entries}
        />
      </div>
    </div>
  );
}
