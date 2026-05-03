"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Diorama, type Scenario, type Variant } from "@/components/Dioramas";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const SCENARIO_ICONS: Record<string, string> = {
  dungeon: "⚔️", garden: "🌱", space: "🚀", chaos: "🤡",
};

const SCENARIO_BG: Record<string, string> = {
  dungeon: "radial-gradient(ellipse at top, #2a1844 0%, #0d0c20 60%, #06051a 100%)",
  garden:  "radial-gradient(ellipse at top, #0a2630 0%, #0d0c20 60%, #06051a 100%)",
  space:   "radial-gradient(ellipse at top, #1a2880 0%, #0a1248 60%, #050828 100%)",
  chaos:   "radial-gradient(ellipse at top, #28084a 0%, #1a0540 60%, #06051a 100%)",
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 115; // r=115

function TimerContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration   = Number(params.get("duration") ?? 25);
  const subject    = params.get("subject") ?? "Opći fokus";
  const scenario   = params.get("scenario") ?? "dungeon";
  const questTitle = params.get("questTitle") ?? "Fokus sesija";
  const questDesc  = params.get("questDesc") ?? "";
  const avatar     = params.get("avatar") ?? "🧙‍♂️";
  const variantRaw = Number(params.get("variant") ?? 1);
  const variant: Variant = (variantRaw === 2 || variantRaw === 3 ? variantRaw : 1) as Variant;

  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showDesc, setShowDesc] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-dismiss splash
  useEffect(() => {
    if (!showSplash) return;
    const id = setTimeout(() => { setShowSplash(false); setIsRunning(true); }, 4000);
    return () => clearTimeout(id);
  }, [showSplash]);

  // Navigate on completion
  useEffect(() => {
    if (!completed) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200);
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch {}
    sessionStorage.setItem("ff_session_complete", "1");
    router.push(`/celebration?${new URLSearchParams({ duration: String(duration), subject, scenario, avatar }).toString()}`);
  }, [completed, duration, subject, scenario, router]);

  useEffect(() => {
    sessionStorage.setItem("ff_session", JSON.stringify({ duration, subject, scenario, startedAt: Date.now() }));
  }, [duration, subject, scenario]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); setCompleted(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const ringOffset = RING_CIRCUMFERENCE * progress;
  const scenarioIcon = SCENARIO_ICONS[scenario] ?? "⚔️";
  const scenarioBg = SCENARIO_BG[scenario] ?? SCENARIO_BG.dungeon;
  const isDark = true; // Neon = always dark

  // ── Quest splash ─────────────────────────────────────────────
  if (showSplash) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-8 gap-6" style={{ maxWidth: 480, margin: "0 auto", background: scenarioBg }}>
        <div style={{ fontSize: 64 }}>{avatar}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, textAlign: "center", color: isDark ? "#fff" : "var(--ink)", margin: 0 }}>{questTitle}</h2>
        {questDesc && (
          <p style={{ color: isDark ? "rgba(255,255,255,0.7)" : "var(--ink-soft)", fontSize: 14, textAlign: "center", lineHeight: 1.6, margin: 0 }}>{questDesc}</p>
        )}
        <button className="ff-btn" onClick={() => { setShowSplash(false); setIsRunning(true); }} style={{ fontSize: 18 }}>
          Kreni! ⚔️
        </button>
        <button onClick={() => { setShowSplash(false); setIsRunning(true); }} style={{ background: "none", border: 0, cursor: "pointer", fontSize: 13, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)", textDecoration: "underline" }}>
          Preskoči priču
        </button>
      </main>
    );
  }

  // ── Timer ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col" style={{ maxWidth: 480, margin: "0 auto", background: scenarioBg }}>

      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <button onClick={() => { setIsRunning(false); setShowStopConfirm(true); }} style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.2)", border: 0, cursor: "pointer", fontSize: 18, color: isDark ? "#fff" : "var(--ink)" }}>
          ✕
        </button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.7)" : "var(--ink-soft)" }}>{subject}</span>
        <div style={{ width: 40 }} />
      </header>

      {/* Quest tag */}
      <div className="px-5">
        <button
          onClick={() => setShowDesc(!showDesc)}
          style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "10px 14px", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", backdropFilter: "blur(8px)" }}
        >
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{scenarioIcon}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: isDark ? "#fff" : "var(--ink)" }}>{questTitle}</div>
            {showDesc && questDesc && <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.6)" : "var(--ink-soft)", marginTop: 4, fontWeight: 600 }}>{questDesc}</div>}
            {!showDesc && <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : "var(--ink-faint)", fontWeight: 700 }}>{subject} · {duration} min · tap za detalje</div>}
          </div>
        </button>
      </div>

      {/* Ring + avatar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* SVG ring */}
        <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 260 260" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="130" cy="130" r="115" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="16" />
            <circle
              cx="130" cy="130" r="115" fill="none"
              stroke="var(--accent)"
              strokeWidth="14" strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 10px rgba(201,255,74,0.7))" }}
            />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 52, color: isDark ? "#fff" : "var(--ink)", lineHeight: 1 }}>
              {formatTime(secondsLeft)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "rgba(255,255,255,0.5)" : "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "1.2px", marginTop: 6 }}>
              preostalo
            </div>
          </div>
        </div>

        {/* Diorama — animirana scena ovisi o scenariju i varijanti */}
        <div className="flex flex-col items-center gap-2" style={{ width: "100%", padding: "0 20px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 300, aspectRatio: "300 / 200", borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            <Diorama scenario={scenario as Scenario} variant={variant} progress={progress} avatar={avatar} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "rgba(255,255,255,0.5)" : "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.8px" }}>U FOKUSU {scenarioIcon}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-5 pb-8">
        <button className="ff-btn ghost" onClick={() => setIsRunning((r) => !r)} style={{ flex: 1, padding: "14px", fontSize: 15, borderRadius: 18 }}>
          {isRunning ? "⏸ Pauza" : "▶ Nastavi"}
        </button>
      </div>

      {/* Stop confirm modal */}
      {showStopConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px", zIndex: 50 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, textAlign: "center", margin: 0 }}>Odustati od sesije?</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", margin: 0 }}>Dobit ćeš 25% XP-a za odrađeno vrijeme.</p>
            <button className="ff-btn danger sm" onClick={() => router.push("/")}>Da, zaustavi</button>
            <button className="ff-btn ghost sm" onClick={() => { setShowStopConfirm(false); setIsRunning(true); }}>Nastavi fokus</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TimerPage() {
  return <Suspense><TimerContent /></Suspense>;
}
