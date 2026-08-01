/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// app/student/wellbeing/WellBeingPage.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import "../styles/wellbeing.css";
import {
  Heart,
  Wind,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Check,
  Flame,
  Send,
  RotateCcw,
  Zap,
  Star,
  Users,
  Palette,
  Leaf,
} from "lucide-react";
import { motion } from "framer-motion";
import { CHALLENGES } from "../constants/wellbeingChallenges";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useProfile } from "../context/ProfileContext";
import {
  getMoodHistory,
  postMoodEntry,
  requestCounselingSession,
  toggleTask,
} from "./service";

/* ───────────────────────────────
   TYPES
─────────────────────────────── */
type Mood = "Happy" | "Okay" | "Need Help";
type CBTPhase = "mood" | "context" | "thought" | "reframe" | "action";
type RelaxExercise = "breathing" | "bodyscan" | "grounding" | null;

interface MoodEntry {
  id: number;
  date: string;
  mood: Mood;
  context?: string;
  thought?: string;
  reframe?: string;
}

const mockData = {
  moodConfig: {
    Happy: {
      emoji: "😊",
      label: "Happy",
      color: "#16a34a",
      bg: "#dcfce7",
      affirmation: "That's wonderful! Your joy is precious. 🌸",
      contextPrompt: "What's making today feel good?",
      thoughtPrompt: "What positive thought is standing out for you?",
      reframePrompt: "How can you carry this feeling into tomorrow?",
    },
    Okay: {
      emoji: "😐",
      label: "Okay",
      color: "#d97706",
      bg: "#fef3c7",
      affirmation:
        "It's okay to be okay. You're doing great just by showing up. 💛",
      contextPrompt: "What's been on your mind today?",
      thoughtPrompt: "Is there a thought that keeps pulling your attention?",
      reframePrompt:
        "What's one small thing going right, even if today feels flat?",
    },
    "Need Help": {
      emoji: "😨",
      label: "Need Help",
      color: "#dc2626",
      bg: "#fee2e2",
      affirmation:
        "You're incredibly brave for naming this. Help is right here. 💜",
      contextPrompt: "What's feeling heavy or hard right now?",
      thoughtPrompt: "What's the thought that won't leave you alone?",
      reframePrompt:
        "What might a kind friend say to you about this situation?",
    },
  },
  relaxExercises: [
    {
      id: "breathing",
      title: "4-7-8 Breathing",
      emoji: "🌬️",
      tagline: "Calm your nervous system in 2 minutes",
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      id: "bodyscan",
      title: "Body Scan",
      emoji: "🧘",
      tagline: "Release tension from head to toe",
      color: "#8b5cf6",
      bg: "#ede9fe",
    },
    {
      id: "grounding",
      title: "5-4-3-2-1 Grounding",
      emoji: "🌿",
      tagline: "Come back to the present moment",
      color: "#10b981",
      bg: "#d1fae5",
    },
  ],
  bodyScanSteps: [
    "Close your eyes and take a deep breath in… and slowly out.",
    "Bring your attention to your feet. Notice any tension — and gently let it go.",
    "Move up to your calves and knees. Just notice. No judgment.",
    "Scan your thighs and hips. Take a slow breath and release.",
    "Notice your belly and lower back. With each exhale, let your muscles soften.",
    "Bring awareness to your chest and shoulders. Are they tense? Breathe into them.",
    "Scan your arms all the way to your fingertips. Let them feel heavy and warm.",
    "Notice your neck and jaw — often where we hold the most stress. Unclench gently.",
    "Finally, relax your forehead, eyes, and scalp. You're completely here.",
    "Take one last full breath in… and let it all go. You did it. 🌸",
  ],
  groundingSteps: [
    { label: "5 things you can SEE", emoji: "👁️", color: "#3b82f6" },
    { label: "4 things you can TOUCH", emoji: "🤚", color: "#8b5cf6" },
    { label: "3 things you can HEAR", emoji: "👂", color: "#10b981" },
    { label: "2 things you can SMELL", emoji: "👃", color: "#f59e0b" },
    { label: "1 thing you can TASTE", emoji: "👅", color: "#ec4899" },
  ],
  uiStrings: {
    pageTitle: "Your Wellness Space",
    pageSubtitle: "You're safe here. Take care of yourself. 🌸",
    heroTitle: "You Matter.",
    heroSub:
      "Borderless World Foundation is here for you — always listening, always caring.",
    challengeTitle: "Today's Wellness Challenge",
    calmCornerTitle: "Calm Corner",
    calmCornerIntro:
      "Feeling overwhelmed? Pick an exercise below to find your centre.",
    talkTitle: "Need to Talk?",
    talkTagline:
      "Sometimes we all need a little extra support. Your warden and counsellor are here for you.",
    cbtTitle: "Understanding Your Day",
    cbtActionPrompt: "What's one small step you can take right now?",
    moodJourneyTitle: "Your Mood Journey",
    requestCounselling: "Request Counselling Session",
    counsellingSent:
      "Your request has been sent. Your warden will reach out soon. 💜",
  },
};

// TODO: Replace with GET /api/student/wellbeing/:auth_id/history
// TODO: Replace mood-log with POST /api/student/wellbeing/:auth_id/mood-log
// TODO: Replace counselling request with POST /api/student/wellbeing/:auth_id/counselling

/* ───────────────────────────────
   DATA (Internal use only)
─────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  health: <Heart size={12} />,
  mindfulness: <Leaf size={12} />,
  wellness: <Zap size={12} />,
  social: <Users size={12} />,
  creative: <Palette size={12} />,
};

/* ───────────────────────────────
   CONFETTI COMPONENT
─────────────────────────────── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 48 }, (_, i) => i);
  const colors = [
    "#ec4899",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#3b82f6",
  ];

  return (
    <div className="wb-confetti-container" aria-hidden="true">
      {pieces.map((i) => (
        <div
          key={i}
          className="wb-confetti-piece"
          style={
            {
              left: `${Math.random() * 100}%`,
              background: colors[i % colors.length],
              animationDelay: `${Math.random() * 0.6}s`,
              animationDuration: `${0.9 + Math.random() * 0.6}s`,
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${Math.random() * 360}deg)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────
   BREATHING EXERCISE (4-7-8)
─────────────────────────────── */
type BPhase = "in" | "hold" | "out" | "done";
const BREATH_PHASES: {
  name: BPhase;
  duration: number;
  label: string;
  next: BPhase;
}[] = [
  { name: "in", duration: 4, label: "Breathe in…", next: "hold" },
  { name: "hold", duration: 7, label: "Hold…", next: "out" },
  { name: "out", duration: 8, label: "Breathe out…", next: "in" },
];
const TOTAL_BREATHING_ROUNDS = 4;

function BreathingExercise({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<BPhase>("in");
  const [round, setRound] = useState(1);
  const [count, setCount] = useState(4);

  useEffect(() => {
    if (phase === "done") return;
    const cfg = BREATH_PHASES.find((p) => p.name === phase);
    if (!cfg) return;

    setCount(cfg.duration);

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Phase transition listener
  useEffect(() => {
    if (count === 0 && phase !== "done") {
      const cfg = BREATH_PHASES.find((p) => p.name === phase);
      if (!cfg) return;

      const nextPhase = cfg.next;
      if (nextPhase === "in") {
        if (round >= TOTAL_BREATHING_ROUNDS) {
          setPhase("done");
        } else {
          setRound((r) => r + 1);
          setPhase("in");
        }
      } else {
        setPhase(nextPhase);
      }
    }
  }, [count, phase, round]);

  const currentCfg = BREATH_PHASES.find((p) => p.name === phase);
  const scaleMap: Record<BPhase, number> = {
    in: 1.4,
    hold: 1.4,
    out: 1,
    done: 1,
  };

  return (
    <div className="wb-relax-exercise">
      {phase !== "done" ? (
        <>
          <div className="wb-relax-round-badge">
            Round {round} of {TOTAL_BREATHING_ROUNDS}
          </div>
          <div
            className={`wb-breath-orb wb-breath-orb--${phase}`}
            style={{
              transform: `scale(${scaleMap[phase]})`,
              transition: `transform ${currentCfg?.duration ?? 4}s cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            <span>🌬️</span>
          </div>
          <p className="wb-breath-phase-label">{currentCfg?.label}</p>
          <div className="wb-breath-count-display">
            <span className="wb-breath-count-number">{count}</span>
            <span className="wb-breath-count-unit">s</span>
          </div>
          <div className="wb-breath-phase-pills">
            {(["in", "hold", "out"] as BPhase[]).map((p) => (
              <span
                key={p}
                className={`wb-breath-pill ${phase === p ? "wb-breath-pill--active" : ""}`}
              >
                {p === "in" ? "In" : p === "hold" ? "Hold" : "Out"}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="wb-relax-done">
          <div className="wb-relax-done-emoji">🎉</div>
          <p className="wb-relax-done-title">Beautifully Done!</p>
          <p className="wb-relax-done-sub">
            You've completed 4 rounds. Notice how your body feels right now.
          </p>
        </div>
      )}
      <button className="wb-btn-close-exercise" onClick={onClose}>
        {phase === "done" ? "Finish Session" : "Stop Exercise"}
      </button>
    </div>
  );
}

/* ───────────────────────────────
   BODY SCAN
─────────────────────────────── */
function BodyScanExercise({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const done = step >= mockData.bodyScanSteps.length;

  return (
    <div className="wb-relax-exercise">
      {!done ? (
        <>
          <div className="wb-relax-round-badge">
            Step {step + 1} of {mockData.bodyScanSteps.length}
          </div>
          <div className="wb-bodyscan-progress">
            {mockData.bodyScanSteps.map((_, i) => (
              <div
                key={i}
                className={`wb-bs-dot ${i <= step ? "wb-bs-dot--done" : ""}`}
              />
            ))}
          </div>
          <div className="wb-bodyscan-text">{mockData.bodyScanSteps[step]}</div>
          <button
            className="wb-btn-primary"
            onClick={() => setStep((s) => s + 1)}
          >
            {step < mockData.bodyScanSteps.length - 1
              ? "Next Step →"
              : "Finish"}
          </button>
        </>
      ) : (
        <div className="wb-relax-done">
          <div className="wb-relax-done-emoji">🌸</div>
          <p className="wb-relax-done-title">Scan complete!</p>
          <p className="wb-relax-done-sub">
            You just spent time with yourself. That takes courage and care.
          </p>
        </div>
      )}
      <button
        className="wb-btn-close-exercise"
        style={{ marginTop: 10 }}
        onClick={onClose}
      >
        {done ? "Close" : "Stop"}
      </button>
    </div>
  );
}

/* ───────────────────────────────
   GROUNDING
─────────────────────────────── */
function GroundingExercise({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));
  const current = mockData.groundingSteps[step];
  const done = step >= mockData.groundingSteps.length;
  const count = [5, 4, 3, 2, 1][step] ?? 0;

  const handleInput = (val: string) => {
    const copy = [...inputs];
    copy[step] = val;
    setInputs(copy);
  };

  return (
    <div className="wb-relax-exercise">
      {!done ? (
        <>
          <div className="wb-relax-round-badge">Step {step + 1} of 5</div>
          <div
            className="wb-grounding-icon"
            style={{ background: current.color + "15", color: current.color }}
          >
            <span style={{ fontSize: "2.2rem" }}>{current.emoji}</span>
          </div>
          <p className="wb-grounding-label" style={{ color: current.color }}>
            {current.label}
          </p>
          <p className="wb-grounding-sub">
            Take a deep breath. Name {count} of them below.
          </p>
          <textarea
            className="wb-cbt-input"
            rows={2}
            placeholder={`Type ${count} things here...`}
            value={inputs[step]}
            onChange={(e) => handleInput(e.target.value)}
            style={{
              borderColor: current.color + "44",
              background: current.color + "05",
            }}
          />
          <div className="wb-exercise-nav">
            <div className="wb-nav-btn-shell">
              {step > 0 && (
                <button
                  className="wb-btn-nav-prev"
                  onClick={() => setStep((s) => s - 1)}
                >
                  ← Previous
                </button>
              )}
            </div>
            <button
              className="wb-btn-nav-next"
              onClick={() => setStep((s) => s + 1)}
              disabled={!inputs[step].trim()}
              style={{ background: current.color }}
            >
              {step < 4 ? "Next Step →" : "Finish Exercise"}
            </button>
            <div className="wb-nav-btn-shell" />
          </div>
        </>
      ) : (
        <div className="wb-relax-done">
          <div className="wb-relax-done-emoji">🌿</div>
          <p className="wb-relax-done-title">You're Present.</p>
          <p className="wb-relax-done-sub">
            You just pulled your mind back to the here and now. Beautifully
            done.
          </p>
        </div>
      )}
      <button
        className="wb-btn-close-exercise"
        style={{ marginTop: 12 }}
        onClick={onClose}
      >
        {done ? "Close" : "Stop"}
      </button>
    </div>
  );
}

/* ───────────────────────────────
   MAIN COMPONENT
─────────────────────────────── */
export default function WellBeingPage() {
  const dayOfYear = Math.floor(
    (new Date().getTime() -
      new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const dailyChallenge = CHALLENGES[dayOfYear % CHALLENGES.length];

  /* ── State ── */
  const [studentName] = useState(""); // Could be pulled from user context/profile
  // const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([
  //   {
  //     id: 1,
  //     date: "2026-04-23",
  //     mood: "Happy",
  //     context: "Finished my Science project",
  //     thought: "I can do hard things",
  //   },
  //   {
  //     id: 2,
  //     date: "2026-04-22",
  //     mood: "Okay",
  //     context: "Busy day",
  //     thought: "That's normal, I did my best",
  //   },
  // ]);

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [res] = await Promise.all([
          getMoodHistory(),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);
        setMoodHistory(res.history || res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  /* CBT */
  const [cbtPhase, setCBTPhase] = useState<CBTPhase>("mood");
  const [cbtMood, setCBTMood] = useState<Mood | null>(null);
  const [cbtContext, setCBTContext] = useState("");
  const [cbtThought, setCBTThought] = useState("");
  const [cbtReframe, setCBTReframe] = useState("");
  const [cbtAction, setCBTAction] = useState<string | null>(null);
  const [cbtSaved, setCBTSaved] = useState(false);

  /* Challenge */
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  /* Counselling */
  const [showCounselling, setShowCounselling] = useState(false);
  const [counsellingMsg, setCounsellingMsg] = useState("");
  const [counsellingSent, setCounsellingSent] = useState(false);

  /* Relaxation */
  const [activeRelax, setActiveRelax] = useState<RelaxExercise>(null);

  const [taskLoading, setTaskLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── CBT helpers ── */
  const cbtConfig = cbtMood ? mockData.moodConfig[cbtMood] : null;
  const phases: CBTPhase[] = [
    "mood",
    "context",
    "thought",
    "reframe",
    "action",
  ];

  const CBT_ACTIONS =
    cbtMood === "Need Help"
      ? [
          { emoji: "🌬️", label: "Breathing exercise", value: "breathing" },
          { emoji: "📞", label: "Talk to someone", value: "talk" },
          { emoji: "🧘", label: "Body scan", value: "bodyscan" },
          { emoji: "💜", label: "Request counselling", value: "counselling" },
        ]
      : cbtMood === "Okay"
        ? [
            { emoji: "🚶", label: "Take a short walk", value: "walk" },
            { emoji: "🌬️", label: "Breathing exercise", value: "breathing" },
            { emoji: "✍️", label: "Journal your thoughts", value: "journal" },
            { emoji: "🎵", label: "Play a favourite song", value: "music" },
          ]
        : [
            { emoji: "📞", label: "Share your joy", value: "share" },
            { emoji: "✍️", label: "Write it down", value: "journal" },
            { emoji: "⭐", label: "Do something kind", value: "kind" },
            { emoji: "🎨", label: "Create something", value: "create" },
          ];

  const handleCBTNext = () => {
    if (cbtPhase === "mood" && !cbtMood) return;
    if (cbtPhase === "context" && !cbtContext.trim()) return;
    if (cbtPhase === "thought" && !cbtThought.trim()) return;
    if (cbtPhase === "reframe" && !cbtReframe.trim()) return;
    const nextIdx = phases.indexOf(cbtPhase) + 1;
    if (nextIdx < phases.length) setCBTPhase(phases[nextIdx]);
  };

  const handleCBTSave = async () => {
    if (!cbtMood || isSubmitting) return;

    const payload = {
      mood: cbtMood,
      context: cbtContext,
      thought: cbtThought,
      reframe: cbtReframe,
    };

    try {
      setIsSubmitting(true);
      await postMoodEntry(payload);

      // refresh history from backend
      const res = await getMoodHistory();
      setMoodHistory(res.history || res);

      if (cbtAction === "counselling") setShowCounselling(true);

      setCBTMood(null);
      setCBTContext("");
      setCBTThought("");
      setCBTReframe("");
      setCBTAction(null);
      setCBTPhase("mood");
      setCBTSaved(true);

      setTimeout(() => setCBTSaved(false), 3500);
    } catch {
      // Fail silently
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Challenge complete with confetti ── */
  const handleChallengeComplete = async () => {
    try {
      setTaskLoading(true);

      await toggleTask({
        completed: true,
      });

      setChallengeCompleted(true);
      setShowConfetti(true);

      setTimeout(() => setShowConfetti(false), 2200);
    } catch {
      // Fail silently
    } finally {
      setTaskLoading(false);
    }
  };

  /* ── Counselling ── */
  const handleCounsellingSubmit = async () => {
    if (!counsellingMsg.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await requestCounselingSession({
        message: counsellingMsg,
      });

      setCounsellingSent(true);
      setCounsellingMsg("");

      setTimeout(() => {
        setShowCounselling(false);
        setCounsellingSent(false);
      }, 3000);
    } catch (err) {
      console.error("Counselling Error:", err);
      alert("Failed to send request: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const greeting = studentName ? `Hey ${studentName}!` : "Hey there! 👋";

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <main className="flex-1 bg-[#F4F5F7] min-h-screen font-sans relative overflow-x-hidden">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <Confetti active={showConfetti} />

        {/* ── HEADER ── */}
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
              {mockData.uiStrings.pageSubtitle}
            </motion.p>
          </div>
        </motion.div>

        {/* ── HERO BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-br from-pink-100 via-blue-50 to-green-100 rounded-3xl p-8 mb-8 overflow-hidden border border-white/80 shadow-[0_10px_32px_rgba(236,72,153,0.08)]"
        >
          <div className="absolute -top-20 -right-16 w-52 h-52 bg-white/35 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-rose-900 mb-2 tracking-tight">
                {mockData.uiStrings.heroTitle}
              </h2>
              <p className="text-[15px] font-semibold text-rose-800 leading-relaxed max-w-sm">
                {mockData.uiStrings.heroSub}
              </p>
            </div>
            <div className="text-6xl hidden sm:block">🌸</div>
          </div>
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* ════ LEFT COLUMN ════ */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* DAILY CHALLENGE */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-2xl">✨</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex-1">
                  {mockData.uiStrings.challengeTitle}
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wide"
                  style={{
                    background: dailyChallenge.bg,
                    color: dailyChallenge.color,
                  }}
                >
                  {CATEGORY_ICONS[dailyChallenge.category]}
                  {dailyChallenge.category}
                </span>
              </div>

              <div
                className="rounded-2xl p-6 text-center mb-4 transition-transform hover:-translate-y-1 border-2"
                style={{
                  background: dailyChallenge.bg,
                  borderColor: dailyChallenge.color,
                }}
              >
                <span className="block text-5xl mb-4 animate-bounce">
                  {dailyChallenge.emoji}
                </span>
                <p
                  className="text-xl font-black mb-1.5 tracking-tight"
                  style={{ color: dailyChallenge.color }}
                >
                  {dailyChallenge.title}
                </p>
                <p
                  className="text-[15px] font-semibold mb-3 opacity-90"
                  style={{ color: dailyChallenge.color }}
                >
                  {dailyChallenge.description}
                </p>
                <p
                  className="text-[14px] font-semibold mb-5 opacity-80 italic"
                  style={{ color: dailyChallenge.color }}
                >
                  {dailyChallenge.instruction}
                </p>

                {!challengeCompleted ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-extrabold text-[15px] text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ background: dailyChallenge.color }}
                    onClick={handleChallengeComplete}
                  >
                    <Flame size={18} />
                    {taskLoading ? "Saving..." : "I did this! 🎉"}
                  </button>
                ) : (
                  <div
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-extrabold text-[15px] text-white"
                    style={{ background: dailyChallenge.color }}
                  >
                    <Check size={18} />
                    Challenge crushed! You're amazing 🔥
                  </div>
                )}
              </div>

              <p className="text-[13px] font-semibold text-slate-500 text-center">
                {challengeCompleted
                  ? "🌟 You're on a streak! Keep it up tomorrow."
                  : "Complete your challenge to feel more energised!"}
              </p>
            </motion.section>

            {/* RELAXATION / CALM CORNER */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-50 to-purple-50 p-5 sm:p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🍃</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {mockData.uiStrings.calmCornerTitle}
                </h2>
              </div>
              <p className="text-[14px] font-semibold text-slate-500 mb-5 leading-relaxed">
                {mockData.uiStrings.calmCornerIntro}
              </p>

              {!activeRelax ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mockData.relaxExercises.map((ex) => (
                    <button
                      key={ex.id}
                      className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-1 hover:shadow-md border-2 border-transparent"
                      style={{
                        background: ex.bg,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = ex.color)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "transparent")
                      }
                      onClick={() => setActiveRelax(ex.id as RelaxExercise)}
                    >
                      <span className="text-3xl mb-1">{ex.emoji}</span>
                      <span
                        className="text-[13px] font-black leading-tight"
                        style={{ color: ex.color }}
                      >
                        {ex.title}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 leading-snug">
                        {ex.tagline}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-4 text-[15px] font-extrabold text-slate-900">
                    <span>
                      {
                        mockData.relaxExercises.find(
                          (e) => e.id === activeRelax,
                        )?.emoji
                      }
                    </span>
                    <span>
                      {
                        mockData.relaxExercises.find(
                          (e) => e.id === activeRelax,
                        )?.title
                      }
                    </span>
                    <button
                      className="ml-auto bg-slate-100 border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors"
                      onClick={() => setActiveRelax(null)}
                    >
                      ← Back
                    </button>
                  </div>
                  {activeRelax === "breathing" && (
                    <BreathingExercise onClose={() => setActiveRelax(null)} />
                  )}
                  {activeRelax === "bodyscan" && (
                    <BodyScanExercise onClose={() => setActiveRelax(null)} />
                  )}
                  {activeRelax === "grounding" && (
                    <GroundingExercise onClose={() => setActiveRelax(null)} />
                  )}
                </div>
              )}
            </motion.section>

            {/* NEED TO TALK / COUNSELLING */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💬</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {mockData.uiStrings.talkTitle}
                </h2>
              </div>
              <p className="text-[14px] font-semibold text-slate-500 mb-5 leading-relaxed">
                {mockData.uiStrings.talkTagline}
              </p>

              {!showCounselling ? (
                <button
                  className="w-full bg-gradient-to-r from-pink-100 to-pink-50 border border-pink-200 hover:border-pink-300 text-pink-700 font-extrabold text-[15px] py-4 px-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-md shadow-pink-500/10"
                  onClick={() => setShowCounselling(true)}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} />
                    {mockData.uiStrings.requestCounselling}
                  </div>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="animate-fade-in">
                  <p className="text-[14px] font-semibold text-slate-500 mb-4 leading-relaxed">
                    Your warden and counsellor care about you. Tell them what's
                    on your mind (optional).
                  </p>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-[15px] font-medium text-slate-900 mb-4 transition-colors resize-y"
                    placeholder="What's bothering you? (you don't have to share everything)"
                    value={counsellingMsg}
                    onChange={(e) => setCounsellingMsg(e.target.value)}
                    rows={3}
                  />
                  {!counsellingSent ? (
                    <div className="flex gap-3">
                      <button
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[14px] py-3 rounded-xl transition-colors"
                        onClick={() => setShowCounselling(false)}
                      >
                        Not right now
                      </button>
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        onClick={handleCounsellingSubmit}
                        disabled={isSubmitting}
                      >
                        <Send size={16} />
                        Yes, send request
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[15px] px-4 py-3 rounded-xl animate-fade-in">
                      <Check size={20} />
                      <span>{mockData.uiStrings.counsellingSent}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* PERSONALISED CBT CHECK-IN */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-blue-50/50 p-5 sm:p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🧠</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {mockData.uiStrings.cbtTitle}
                </h2>
              </div>

              {/* Progress bar */}
              {!cbtSaved && (
                <div className="flex gap-1.5 mb-6">
                  {phases.map((p, i) => (
                    <div
                      key={p}
                      className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                        phases.indexOf(cbtPhase) >= i
                          ? "bg-blue-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {cbtSaved ? (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[15px] p-5 rounded-2xl animate-fade-in">
                  <Sparkles size={24} className="shrink-0" />
                  <p>
                    Check-in saved! You just invested in yourself. That's huge. 💛
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Phase 1: Mood */}
                  {cbtPhase === "mood" && (
                    <div className="animate-fade-in flex-1">
                      <p className="text-[16px] font-black text-slate-900 mb-4 tracking-tight">
                        {greeting} How are you feeling right now?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        {(Object.keys(mockData.moodConfig) as Mood[]).map((m) => {
                          const cfg = mockData.moodConfig[m];
                          return (
                            <button
                              key={m}
                              className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border-2 ${
                                cbtMood === m
                                  ? "scale-[1.03] shadow-md"
                                  : "hover:-translate-y-1 border-transparent"
                              }`}
                              style={{
                                background: cfg.bg,
                                borderColor: cbtMood === m ? cfg.color : "transparent",
                              }}
                              onClick={() => setCBTMood(m)}
                            >
                              <span className="text-3xl">{cfg.emoji}</span>
                              <span
                                className="text-[13px] font-extrabold"
                                style={{ color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {cbtMood && (
                        <div
                          className="px-4 py-3 rounded-xl border font-bold text-[15px] text-center mb-5 animate-fade-in"
                          style={{
                            background: mockData.moodConfig[cbtMood].bg,
                            borderColor: mockData.moodConfig[cbtMood].color + "55",
                            color: mockData.moodConfig[cbtMood].color,
                          }}
                        >
                          {mockData.moodConfig[cbtMood].affirmation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Phase 2: Context */}
                  {cbtPhase === "context" && cbtConfig && (
                    <div className="animate-fade-in flex-1">
                      <p className="text-[16px] font-black text-slate-900 mb-1 tracking-tight">
                        {cbtConfig.contextPrompt}
                      </p>
                      <p className="text-[14px] font-semibold text-slate-500 mb-4 leading-relaxed">
                        Share as much or as little as you'd like — this is just
                        for you.
                      </p>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[15px] font-medium text-slate-900 mb-5 transition-colors resize-y"
                        placeholder="For example: 'I have a big exam tomorrow' or 'I had a great chat with a friend'..."
                        value={cbtContext}
                        onChange={(e) => setCBTContext(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Phase 3: Thought */}
                  {cbtPhase === "thought" && cbtConfig && (
                    <div className="animate-fade-in flex-1">
                      <p className="text-[16px] font-black text-slate-900 mb-1 tracking-tight">
                        {cbtConfig.thoughtPrompt}
                      </p>
                      <p className="text-[14px] font-semibold text-slate-500 mb-4 leading-relaxed">
                        Our thoughts shape how we feel. Name the thought honestly.
                      </p>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[15px] font-medium text-slate-900 mb-5 transition-colors resize-y"
                        placeholder="For example: 'I'm going to mess it up' or 'I'm proud of myself'..."
                        value={cbtThought}
                        onChange={(e) => setCBTThought(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Phase 4: Reframe */}
                  {cbtPhase === "reframe" && cbtConfig && (
                    <div className="animate-fade-in flex-1">
                      <p className="text-[16px] font-black text-slate-900 mb-1 tracking-tight">
                        {cbtConfig.reframePrompt}
                      </p>
                      <p className="text-[14px] font-semibold text-slate-500 mb-4 leading-relaxed">
                        {cbtMood === "Need Help"
                          ? "Try to be as kind to yourself as you'd be to your best friend."
                          : "Reframing helps you see clearly — not to dismiss your feelings, but to find strength."}
                      </p>
                      {cbtThought && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-col gap-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            Your thought:
                          </span>
                          <span className="text-[14px] text-slate-600 font-medium">
                            "{cbtThought}"
                          </span>
                        </div>
                      )}
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[15px] font-medium text-slate-900 mb-5 transition-colors resize-y"
                        placeholder="Write a kinder or more balanced thought here..."
                        value={cbtReframe}
                        onChange={(e) => setCBTReframe(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Phase 5: Action */}
                  {cbtPhase === "action" && (
                    <div className="animate-fade-in flex-1">
                      <p className="text-[16px] font-black text-slate-900 mb-1 tracking-tight">
                        {mockData.uiStrings.cbtActionPrompt}
                      </p>
                      <p className="text-[14px] font-semibold text-slate-500 mb-4 leading-relaxed">
                        Pick one action. Even tiny steps count.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        {CBT_ACTIONS.map((a) => (
                          <button
                            key={a.value}
                            className={`rounded-xl p-3 flex flex-col items-center gap-2 border-2 transition-all ${
                              cbtAction === a.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300"
                            }`}
                            onClick={() => setCBTAction(a.value)}
                          >
                            <span className="text-2xl">{a.emoji}</span>
                            <span className="text-[13px] font-bold text-center">
                              {a.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-3 mt-auto">
                    {cbtPhase !== "mood" && (
                      <button
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[14px] px-5 py-3 rounded-xl transition-colors flex items-center gap-2"
                        onClick={() => {
                          const idx = phases.indexOf(cbtPhase);
                          if (idx > 0) setCBTPhase(phases[idx - 1]);
                        }}
                      >
                        <RotateCcw size={16} />
                        Back
                      </button>
                    )}
                    {cbtPhase !== "action" ? (
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        onClick={handleCBTNext}
                        disabled={
                          (cbtPhase === "mood" && !cbtMood) ||
                          (cbtPhase === "context" && !cbtContext.trim()) ||
                          (cbtPhase === "thought" && !cbtThought.trim()) ||
                          (cbtPhase === "reframe" && !cbtReframe.trim())
                        }
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        onClick={handleCBTSave}
                        disabled={isSubmitting}
                      >
                        <Star size={16} />
                        Save Check-In
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.section>

            {/* MOOD HISTORY */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">📅</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {mockData.uiStrings.moodJourneyTitle}
                </h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {moodHistory.slice(0, 5).map((entry) => {
                  const cfg = mockData.moodConfig[entry.mood];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-4 rounded-2xl border-2 transition-transform hover:translate-x-1"
                      style={{
                        background: cfg.bg,
                        borderColor: "transparent",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = cfg.color)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "transparent")
                      }
                    >
                      <span className="text-3xl shrink-0">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span
                          className="block font-black text-[14px] mb-0.5"
                          style={{ color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        {entry.context && (
                          <p
                            className="text-[13px] font-bold opacity-90 mb-1"
                            style={{ color: cfg.color }}
                          >
                            {entry.context}
                          </p>
                        )}
                        {entry.reframe && (
                          <p className="text-[12px] font-bold text-indigo-600 italic mt-1">
                            💭 {entry.reframe}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-[12px] font-extrabold opacity-70 shrink-0"
                        style={{ color: cfg.color }}
                      >
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  );
                })}
                {moodHistory.length === 0 && (
                  <p className="text-[14px] font-semibold text-slate-500 text-center py-6">
                    No check-ins yet. Start your journey above! 🌱
                  </p>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </main>
  );
}
