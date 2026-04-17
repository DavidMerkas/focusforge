"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { applySession, xpForNextLevel } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, saveUserToDB, saveSessionToDB, rollLoot, type ItemData } from "@/lib/db";
import { updateChallengeProgress } from "@/lib/challenges";

const RARITY_COLORS: Record<string, string> = {
  common:    "#9aa6a6",
  rare:      "#4a9eff",
  epic:      "#b060ff",
  legendary: "#f4b03a",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};

const CONFETTI_COLORS = ["#ff9b7a", "#6fc6b0", "#ffd479", "#ff7a59", "#8dc7ea", "#b060ff"];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    duration: `${1.5 + Math.random() * 2}s`,
    delay: `${Math.random() * 0.8}s`,
    size: `${8 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
  }));
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left, backgroundColor: p.color,
          width: p.size, height: p.size, borderRadius: p.borderRadius,
          animationDuration: p.duration, animationDelay: p.delay,
        }} />
      ))}
    </>
  );
}

function CelebrationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration = Number(params.get("duration") ?? 25);
  const subject  = params.get("subject") ?? "Opći fokus";
  const scenario = params.get("scenario") ?? "dungeon";

  const validatedRef = useRef(false);
  useEffect(() => {
    if (validatedRef.current) return;
    validatedRef.current = true;
    const valid = sessionStorage.getItem("ff_session_complete");
    if (!valid) { router.replace("/"); return; }
    sessionStorage.removeItem("ff_session_complete");
  }, [router]);

  const appliedRef = useRef(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpAfter, setXpAfter] = useState(0);
  const [xpToNext, setXpToNext] = useState(50);
  const [leveledUp, setLeveledUp] = useState(false);
  const [lootItem, setLootItem] = useState<ItemData | null>(null);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    async function apply() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.replace("/login"); return; }
      const userData = await loadUserFromDB(authUser.id);
      if (!userData) { router.replace("/"); return; }
      const result = applySession(userData, duration, subject);
      await saveUserToDB(authUser.id, result.updated);
      await saveSessionToDB(authUser.id, subject, duration, result.xpEarned, true);
      await updateChallengeProgress(authUser.id, duration);
      const item = await rollLoot(authUser.id, scenario, duration);
      setLootItem(item);
      setXpEarned(result.xpEarned);
      setCoinsEarned(result.coinsEarned);
      setLevel(result.updated.level);
      setXpAfter(result.updated.xp);
      setXpToNext(xpForNextLevel(result.updated.level));
      setLeveledUp(result.leveledUp);
    }
    apply();
  }, [duration, subject, scenario, router]);

  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLoot, setShowLoot] = useState(false);
  const [breakTimer, setBreakTimer] = useState<number | null>(null);

  useEffect(() => {
    if (xpEarned === 0) return;
    let frame = 0;
    const total = 40;
    const interval = setInterval(() => {
      frame++;
      const p = frame / total;
      setDisplayXP(Math.floor(xpEarned * p));
      setDisplayCoins(Math.floor(coinsEarned * p));
      if (frame >= total) {
        clearInterval(interval);
        setDisplayXP(xpEarned);
        setDisplayCoins(coinsEarned);
        if (leveledUp) setShowLevelUp(true);
        else if (lootItem) setShowLoot(true);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [xpEarned, coinsEarned, leveledUp, lootItem]);

  useEffect(() => {
    if (breakTimer === null || breakTimer <= 0) return;
    const id = setTimeout(() => setBreakTimer((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [breakTimer]);

  useEffect(() => { if (breakTimer === 0) router.push("/"); }, [breakTimer, router]);

  const xpBarPercent = xpToNext > 0 ? Math.min((xpAfter / xpToNext) * 100, 100) : 100;

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(59,74,74,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", zIndex: 60 }}>
      <div className="ff-card animate-pop" style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {children}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pb-10" style={{ maxWidth: 480, margin: "0 auto" }}>
      <Confetti />

      <header className="flex justify-end px-5 pt-6 pb-2">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.6)", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", textDecoration: "none", color: "var(--ink)", backdropFilter: "blur(8px)" }}>✕</Link>
      </header>

      {/* Hero mini scene */}
      <div className="px-5 flex flex-col items-center gap-2">
        <div style={{ position: "relative", width: "100%", height: 140, background: "radial-gradient(circle at 20% 80%, #8fd7b0 0 30px, transparent 31px), radial-gradient(circle at 85% 85%, #8fd7b0 0 24px, transparent 25px), linear-gradient(180deg, #e8f8d0, #c8eee0)", borderRadius: 24, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: -8, left: 0, right: 0, height: 36, background: "radial-gradient(ellipse at center, rgba(143,215,176,0.9), transparent 70%)" }} />
          <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", textAlign: "center" }}>
            <span className="animate-breathe" style={{ fontSize: 56, display: "inline-block", filter: "drop-shadow(0 4px 6px rgba(59,74,74,0.15))" }}>🧙‍♂️</span>
          </div>
          <span className="animate-twinkle" style={{ position: "absolute", top: 10, right: 14, fontSize: 14, color: "var(--accent-3)" }}>✨</span>
        </div>

        <div className="animate-pop" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
          🎉 Sesija završena!
        </div>
        <div style={{ color: "var(--ink-soft)", fontSize: 13, fontWeight: 700 }}>Odlično si se fokusirao {duration} minuta</div>
      </div>

      <div className="px-5 flex flex-col gap-4 mt-4">
        {/* Rewards card */}
        <div className="ff-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { icon: "⭐", label: "Iskustvo", val: displayXP, unit: "XP", color: "#b060ff" },
              { icon: "🪙", label: "Coinsi",   val: displayCoins, unit: "coins", color: "var(--coin)" },
            ].map(({ icon, label, val, unit, color }, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i === 0 ? "1px dashed rgba(59,74,74,0.12)" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 14 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 12, background: "color-mix(in oklab, var(--accent-2) 25%, white)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</span>
                  {label}
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color }}>+{val}</span>
              </div>
            ))}
          </div>

          {/* XP bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 700 }}>
              <span>⭐ Level {level}</span>
              <span>{xpAfter} / {xpToNext} XP</span>
            </div>
            <div className="ff-xpbar">
              <div className="ff-xpbar-fill" style={{ width: `${xpBarPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Break / skip */}
        {breakTimer === null ? (
          <div className="flex flex-col gap-3">
            <button className="ff-btn ghost" onClick={() => setBreakTimer(5 * 60)}>☕ Uzmi pauzu (5 min)</button>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="ff-btn mint" style={{ fontSize: 17 }}>Preskoči pauzu →</button>
            </Link>
          </div>
        ) : (
          <div className="ff-card flex flex-col items-center gap-2">
            <p style={{ color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, margin: 0 }}>Pauza završava za</p>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, color: "var(--ink)" }}>
              {Math.floor(breakTimer / 60).toString().padStart(2, "0")}:{(breakTimer % 60).toString().padStart(2, "0")}
            </span>
            <Link href="/" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none" }}>Preskoči pauzu</Link>
          </div>
        )}
      </div>

      {/* Level Up modal */}
      {showLevelUp && (
        <Modal>
          <div style={{ fontSize: 56 }}>⭐</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>Level Up!</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--accent)", fontWeight: 600 }}>Level {level}</div>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>Nastavljaš biti heroj!</p>
          <button className="ff-btn" style={{ width: "100%" }} onClick={() => { setShowLevelUp(false); if (lootItem) setShowLoot(true); }}>Nastavi 🎉</button>
        </Modal>
      )}

      {/* Loot modal */}
      {showLoot && lootItem && (
        <Modal>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, margin: 0 }}>Predmet pronađen!</p>
          <div style={{ fontSize: 64 }}>{lootItem.icon}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: RARITY_COLORS[lootItem.rarity] }}>{lootItem.name}</div>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: RARITY_COLORS[lootItem.rarity], background: "rgba(0,0,0,0.06)", padding: "4px 10px", borderRadius: 999 }}>{RARITY_LABELS[lootItem.rarity]}</span>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>{lootItem.description}</p>
          <button className="ff-btn mint" style={{ width: "100%" }} onClick={() => setShowLoot(false)}>Uzmi! 🎒</button>
        </Modal>
      )}
    </main>
  );
}

export default function CelebrationPage() {
  return <Suspense><CelebrationContent /></Suspense>;
}
