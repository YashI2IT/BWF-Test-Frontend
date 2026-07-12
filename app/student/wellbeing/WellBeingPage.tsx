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
  Leaf,
  Users,
  Palette,
} from "lucide-react";
import { CHALLENGES } from "../constants/wellbeingChallenges";
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
  const today = new Date().toISOString().split("T")[0];
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

  const [taskCompleted, setTaskCompleted] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

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
    if (!cbtMood) return;

    const payload = {
      mood: cbtMood,
      context: cbtContext,
      thought: cbtThought,
      reframe: cbtReframe,
    };

    try {
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
    } catch (err) {
      console.error("Failed to save mood", err);
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
    } catch (err) {
      console.error("Challenge update failed", err);
    } finally {
      setTaskLoading(false);
    }
  };

  /* ── Counselling ── */
  const handleCounsellingSubmit = async () => {
    if (!counsellingMsg.trim()) return;

    try {
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
      console.error(err);
    }
  };

  const greeting = studentName ? `Hey ${studentName}!` : "Hey there! 👋";

  return (
    <div className="wb-page">
      <Confetti active={showConfetti} />

      {/* ── HEADER ── */}
      <header className="wb-header">
        <p className="wb-eyebrow">Wellbeing / Help</p>
        <h1 className="wb-title">{mockData.uiStrings.pageTitle}</h1>
        <p className="wb-subtitle">{mockData.uiStrings.pageSubtitle}</p>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="wb-hero">
        <div className="wb-hero-blob wb-hero-blob-1" />
        <div className="wb-hero-blob wb-hero-blob-2" />
        <div className="wb-hero-inner">
          <div className="wb-hero-left">
            <h2>{mockData.uiStrings.heroTitle}</h2>
            <p>{mockData.uiStrings.heroSub}</p>
          </div>
          <div className="wb-hero-lotus">🌸</div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="wb-grid">
        {/* ════ LEFT COLUMN ════ */}
        <div className="wb-col">
          {/* DAILY CHALLENGE */}
          <section className="wb-card">
            <div className="wb-card-header">
              <span className="wb-card-emoji">✨</span>
              <h2 className="wb-card-title">
                {mockData.uiStrings.challengeTitle}
              </h2>
              <span
                className="wb-challenge-category-badge"
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
              className="wb-challenge-box"
              style={
                {
                  "--ch": dailyChallenge.color,
                  "--chb": dailyChallenge.bg,
                } as React.CSSProperties
              }
            >
              <span className="wb-challenge-emoji">{dailyChallenge.emoji}</span>
              <p className="wb-challenge-title">{dailyChallenge.title}</p>
              <p className="wb-challenge-desc">{dailyChallenge.description}</p>
              <p className="wb-challenge-instr">{dailyChallenge.instruction}</p>

              {!challengeCompleted ? (
                <button
                  className="wb-challenge-btn"
                  onClick={handleChallengeComplete}
                >
                  <Flame size={16} />
                  {taskLoading ? "Saving..." : "I did this! 🎉"}
                </button>
              ) : (
                <div className="wb-challenge-done">
                  <Check size={16} />
                  Challenge crushed! You're amazing 🔥
                </div>
              )}
            </div>

            <p className="wb-challenge-hint">
              {challengeCompleted
                ? "🌟 You're on a streak! Keep it up tomorrow."
                : "Complete your challenge to feel more energised!"}
            </p>
          </section>

          {/* RELAXATION / CALM CORNER */}
          <section className="wb-card wb-calm-card">
            <div className="wb-card-header">
              <span className="wb-card-emoji">🍃</span>
              <h2 className="wb-card-title">
                {mockData.uiStrings.calmCornerTitle}
              </h2>
            </div>
            <p className="wb-calm-intro">
              {mockData.uiStrings.calmCornerIntro}
            </p>

            {!activeRelax ? (
              <div className="wb-calm-grid">
                {mockData.relaxExercises.map((ex) => (
                  <button
                    key={ex.id}
                    className="wb-calm-exercise-btn"
                    style={
                      {
                        "--rex": ex.color,
                        "--rexb": ex.bg,
                      } as React.CSSProperties
                    }
                    onClick={() => setActiveRelax(ex.id as RelaxExercise)}
                  >
                    <span className="wb-calm-ex-emoji">{ex.emoji}</span>
                    <span className="wb-calm-ex-title">{ex.title}</span>
                    <span className="wb-calm-ex-tagline">{ex.tagline}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="wb-calm-active">
                <div className="wb-calm-active-header">
                  <span>
                    {
                      mockData.relaxExercises.find((e) => e.id === activeRelax)
                        ?.emoji
                    }
                  </span>
                  <strong>
                    {
                      mockData.relaxExercises.find((e) => e.id === activeRelax)
                        ?.title
                    }
                  </strong>
                  <button
                    className="wb-calm-back-btn"
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
          </section>

          {/* NEED TO TALK / COUNSELLING */}
          <section className="wb-card wb-counselling-card">
            <div className="wb-card-header">
              <span className="wb-card-emoji">💬</span>
              <h2 className="wb-card-title">{mockData.uiStrings.talkTitle}</h2>
            </div>
            <p className="wb-counselling-tagline">
              {mockData.uiStrings.talkTagline}
            </p>

            {!showCounselling ? (
              <button
                className="wb-counselling-btn"
                onClick={() => setShowCounselling(true)}
              >
                <MessageCircle size={16} />
                {mockData.uiStrings.requestCounselling}
                <ChevronRight size={14} />
              </button>
            ) : (
              <div className="wb-counselling-form">
                <p className="wb-counselling-info">
                  Your warden and counsellor care about you. Tell them what's on
                  your mind (optional).
                </p>
                <textarea
                  className="wb-counselling-input"
                  placeholder="What's bothering you? (you don't have to share everything)"
                  value={counsellingMsg}
                  onChange={(e) => setCounsellingMsg(e.target.value)}
                  rows={3}
                />
                {!counsellingSent ? (
                  <div className="wb-counselling-actions">
                    <button
                      className="wb-btn-secondary"
                      onClick={() => setShowCounselling(false)}
                    >
                      Not right now
                    </button>
                    <button
                      className="wb-btn-primary"
                      onClick={handleCounsellingSubmit}
                    >
                      <Send size={14} />
                      Yes, send request
                    </button>
                  </div>
                ) : (
                  <div className="wb-counselling-success">
                    <Check size={18} fill="currentColor" />
                    <span>{mockData.uiStrings.counsellingSent}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="wb-col">
          {/* PERSONALISED CBT CHECK-IN */}
          <section className="wb-card wb-cbt-card">
            <div className="wb-card-header">
              <span className="wb-card-emoji">🧠</span>
              <h2 className="wb-card-title">{mockData.uiStrings.cbtTitle}</h2>
            </div>

            {/* Progress bar */}
            {!cbtSaved && (
              <div className="wb-cbt-progress-bar">
                {phases.map((p, i) => (
                  <div
                    key={p}
                    className={`wb-cbt-progress-step ${phases.indexOf(cbtPhase) >= i ? "wb-cbt-progress-step--done" : ""}`}
                  />
                ))}
              </div>
            )}

            {cbtSaved ? (
              <div className="wb-cbt-success">
                <Sparkles size={20} fill="currentColor" />
                <p>
                  Check-in saved! You just invested in yourself. That's huge. 💛
                </p>
              </div>
            ) : (
              <div className="wb-cbt-flow">
                {/* Phase 1: Mood */}
                {cbtPhase === "mood" && (
                  <div className="wb-cbt-phase">
                    <p className="wb-cbt-q">
                      {greeting} How are you feeling right now?
                    </p>
                    <div className="wb-cbt-moods">
                      {(Object.keys(mockData.moodConfig) as Mood[]).map((m) => {
                        const cfg = mockData.moodConfig[m];
                        return (
                          <button
                            key={m}
                            className={`wb-cbt-mood-btn ${cbtMood === m ? "wb-cbt-mood-btn--active" : ""}`}
                            style={
                              {
                                "--mc": cfg.color,
                                "--mb": cfg.bg,
                              } as React.CSSProperties
                            }
                            onClick={() => setCBTMood(m)}
                          >
                            <span className="wb-cbt-emoji">{cfg.emoji}</span>
                            <span className="wb-cbt-label">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {cbtMood && (
                      <div
                        className="wb-cbt-affirmation"
                        style={{
                          background: mockData.moodConfig[cbtMood].bg,
                          borderColor:
                            mockData.moodConfig[cbtMood].color + "55",
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
                  <div className="wb-cbt-phase">
                    <p className="wb-cbt-q">{cbtConfig.contextPrompt}</p>
                    <p className="wb-cbt-sub">
                      Share as much or as little as you'd like — this is just
                      for you.
                    </p>
                    <textarea
                      className="wb-cbt-input"
                      placeholder="For example: 'I have a big exam tomorrow' or 'I had a great chat with a friend'..."
                      value={cbtContext}
                      onChange={(e) => setCBTContext(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Phase 3: Thought */}
                {cbtPhase === "thought" && cbtConfig && (
                  <div className="wb-cbt-phase">
                    <p className="wb-cbt-q">{cbtConfig.thoughtPrompt}</p>
                    <p className="wb-cbt-sub">
                      Our thoughts shape how we feel. Name the thought honestly.
                    </p>
                    <textarea
                      className="wb-cbt-input"
                      placeholder="For example: 'I'm going to mess it up' or 'I'm proud of myself'..."
                      value={cbtThought}
                      onChange={(e) => setCBTThought(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Phase 4: Reframe (this is the new CBT step!) */}
                {cbtPhase === "reframe" && cbtConfig && (
                  <div className="wb-cbt-phase">
                    <p className="wb-cbt-q">{cbtConfig.reframePrompt}</p>
                    <p className="wb-cbt-sub">
                      {cbtMood === "Need Help"
                        ? "Try to be as kind to yourself as you'd be to your best friend."
                        : "Reframing helps you see clearly — not to dismiss your feelings, but to find strength."}
                    </p>
                    {cbtThought && (
                      <div className="wb-cbt-thought-echo">
                        <span className="wb-cbt-thought-echo-label">
                          Your thought:
                        </span>
                        <span>"{cbtThought}"</span>
                      </div>
                    )}
                    <textarea
                      className="wb-cbt-input"
                      placeholder="Write a kinder or more balanced thought here..."
                      value={cbtReframe}
                      onChange={(e) => setCBTReframe(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Phase 5: Action */}
                {cbtPhase === "action" && (
                  <div className="wb-cbt-phase">
                    <p className="wb-cbt-q">
                      {mockData.uiStrings.cbtActionPrompt}
                    </p>
                    <p className="wb-cbt-sub">
                      Pick one action. Even tiny steps count.
                    </p>
                    <div className="wb-cbt-actions">
                      {CBT_ACTIONS.map((a) => (
                        <button
                          key={a.value}
                          className={`wb-cbt-action ${cbtAction === a.value ? "wb-cbt-action--selected" : ""}`}
                          onClick={() => setCBTAction(a.value)}
                        >
                          <span className="wb-cbt-action-emoji">{a.emoji}</span>
                          <span>{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="wb-cbt-nav">
                  {cbtPhase !== "mood" && (
                    <button
                      className="wb-btn-secondary"
                      onClick={() => {
                        const idx = phases.indexOf(cbtPhase);
                        if (idx > 0) setCBTPhase(phases[idx - 1]);
                      }}
                    >
                      <RotateCcw size={14} />
                      Back
                    </button>
                  )}
                  {cbtPhase !== "action" ? (
                    <button
                      className="wb-btn-primary"
                      onClick={handleCBTNext}
                      disabled={
                        (cbtPhase === "mood" && !cbtMood) ||
                        (cbtPhase === "context" && !cbtContext.trim()) ||
                        (cbtPhase === "thought" && !cbtThought.trim()) ||
                        (cbtPhase === "reframe" && !cbtReframe.trim())
                      }
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button className="wb-btn-primary" onClick={handleCBTSave}>
                      <Star size={14} />
                      Save Check-In
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* MOOD HISTORY */}
          <section className="wb-card">
            <div className="wb-card-header">
              <span className="wb-card-emoji">📅</span>
              <h2 className="wb-card-title">
                {mockData.uiStrings.moodJourneyTitle}
              </h2>
            </div>
            <div className="wb-history-list">
              {moodHistory.slice(0, 5).map((entry) => {
                const cfg = mockData.moodConfig[entry.mood];
                return (
                  <div
                    key={entry.id}
                    className="wb-history-item"
                    style={
                      {
                        "--mc": cfg.color,
                        "--mb": cfg.bg,
                      } as React.CSSProperties
                    }
                  >
                    <span className="wb-hist-emoji">{cfg.emoji}</span>
                    <div className="wb-hist-text">
                      <span
                        className="wb-hist-mood"
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {entry.context && (
                        <p className="wb-hist-note">{entry.context}</p>
                      )}
                      {entry.reframe && (
                        <p className="wb-hist-reframe">💭 {entry.reframe}</p>
                      )}
                    </div>
                    <span className="wb-hist-date">
                      {new Date(entry.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
              {moodHistory.length === 0 && (
                <p className="wb-hist-empty">
                  No check-ins yet. Start your journey above! 🌱
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
