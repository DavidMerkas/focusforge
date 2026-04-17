"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { applySession, xpForNextLevel } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, saveUserToDB, saveSessionToDB, rollLoot, type ItemData } from "@/lib/db";
import { updateChallengeProgress } from "@/lib/challenges";

const CONFETTI_COLORS = ["#a855f7", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#f97316"];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    duration: `${1.5 + Math.random() * 2}s`,
    delay: `${Math.random() * 0.8}s`,
    size: `${8 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? "50%" : "0",
  }));
  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: "-10px",
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            borderRadius: p.borderRadius,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common:    "text-gray-400",
  rare:      "text-blue-400",
  epic:      "text-purple-400",
  legendary: "text-yellow-400",
};

const RARITY_LABELS: Record<string, string> = {
  common:    "Obično",
  rare:      "Rijetko",
  epic:      "Epsko",
  legendary: "Legendarno",
};

function CelebrationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration = Number(params.get("duration") ?? 25);
  const subject  = params.get("subject") ?? "Opći fokus";
  const scenario = params.get("scenario") ?? "dungeon";

  // Redirect if user navigated here directly without completing a real session
  const validatedRef = useRef(false);
  useEffect(() => {
    if (validatedRef.current) return;
    validatedRef.current = true;
    const valid = sessionStorage.getItem("ff_session_complete");
    if (!valid) { router.replace("/"); return; }
    sessionStorage.removeItem("ff_session_complete");
  }, [router]);

  // Apply session + roll loot once on mount
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

      // Update weekly challenge progress
      await updateChallengeProgress(authUser.id, duration);

      // Roll for loot drop (longer sessions = higher drop rate)
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

  // Animated counters
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
      const progress = frame / total;
      setDisplayXP(Math.floor(xpEarned * progress));
      setDisplayCoins(Math.floor(coinsEarned * progress));
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

  // After level up modal closes, show loot if any
  function handleLevelUpClose() {
    setShowLevelUp(false);
    if (lootItem) setShowLoot(true);
  }

  // Break countdown
  useEffect(() => {
    if (breakTimer === null || breakTimer <= 0) return;
    const id = setTimeout(() => setBreakTimer((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [breakTimer]);

  useEffect(() => {
    if (breakTimer === 0) router.push("/");
  }, [breakTimer, router]);

  const xpBarPercent = xpToNext > 0 ? Math.min((xpAfter / xpToNext) * 100, 100) : 100;

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center max-w-[480px] mx-auto px-6 gap-6">

      <Confetti />
      <div className="text-7xl animate-pop">🎉</div>
      <h1 className="text-2xl font-bold text-center">Sesija završena!</h1>

      <div className="bg-slate-800 rounded-2xl px-10 py-5 flex gap-10 items-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-purple-400">+{displayXP}</span>
          <span className="text-xs text-slate-400">XP</span>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-amber-400">+{displayCoins}</span>
          <span className="text-xs text-slate-400">💰 coins</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>⭐ Level {level}</span>
          <span>{xpAfter} / {xpToNext} XP</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${xpBarPercent}%` }}
          />
        </div>
      </div>

      {breakTimer === null ? (
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={() => setBreakTimer(5 * 60)}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold transition"
          >
            ☕ Uzmi pauzu (5 min)
          </button>
          <Link
            href="/"
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold text-center transition"
          >
            Preskoči pauzu →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-400 text-sm">Pauza završava za</p>
          <span className="text-5xl font-mono font-bold">
            {Math.floor(breakTimer / 60).toString().padStart(2, "0")}:{(breakTimer % 60).toString().padStart(2, "0")}
          </span>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 mt-2 transition">
            Preskoči pauzu
          </Link>
        </div>
      )}

      {/* Level Up modal */}
      {showLevelUp && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="text-6xl">⭐</div>
            <h2 className="text-2xl font-bold">Level Up!</h2>
            <p className="text-purple-400 font-semibold text-lg">Level {level}</p>
            <p className="text-slate-400 text-sm text-center">Nastavljaš biti heroj!</p>
            <button
              onClick={handleLevelUpClose}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition"
            >
              Nastavi 🎉
            </button>
          </div>
        </div>
      )}

      {/* Loot drop modal */}
      {showLoot && lootItem && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-xs">
            <p className="text-sm text-slate-400">Predmet pronađen!</p>
            <div className="text-7xl">{lootItem.icon}</div>
            <h2 className={`text-xl font-bold ${RARITY_COLORS[lootItem.rarity]}`}>
              {lootItem.name}
            </h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-slate-700 ${RARITY_COLORS[lootItem.rarity]}`}>
              {RARITY_LABELS[lootItem.rarity]}
            </span>
            <p className="text-slate-400 text-sm text-center">{lootItem.description}</p>
            <button
              onClick={() => setShowLoot(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition"
            >
              Uzmi! 🎒
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CelebrationPage() {
  return (
    <Suspense>
      <CelebrationContent />
    </Suspense>
  );
}
