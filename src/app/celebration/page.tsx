"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadUser, saveUser, applySession, xpForNextLevel } from "@/lib/storage";

function CelebrationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration = Number(params.get("duration") ?? 25);
  const subject = params.get("subject") ?? "Opći fokus";

  // Redirect if user navigated here directly without completing a real session
  useEffect(() => {
    const valid = sessionStorage.getItem("ff_session_complete");
    if (!valid) {
      router.replace("/");
      return;
    }
    sessionStorage.removeItem("ff_session_complete");
  }, [router]);

  // Apply session once on mount, save to localStorage
  const appliedRef = useRef(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpAfter, setXpAfter] = useState(0);
  const [xpToNext, setXpToNext] = useState(50);
  const [leveledUp, setLeveledUp] = useState(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    const user = loadUser();
    const result = applySession(user, duration, subject);
    saveUser(result.updated);

    setXpEarned(result.xpEarned);
    setCoinsEarned(result.coinsEarned);
    setLevel(result.updated.level);
    setXpAfter(result.updated.xp);
    setXpToNext(xpForNextLevel(result.updated.level));
    setLeveledUp(result.leveledUp);
  }, [duration, subject]);

  // Animated counters
  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
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
      }
    }, 30);
    return () => clearInterval(interval);
  }, [xpEarned, coinsEarned, leveledUp]);

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

      <div className="text-7xl">🎉</div>
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

      {showLevelUp && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="text-6xl">⭐</div>
            <h2 className="text-2xl font-bold">Level Up!</h2>
            <p className="text-purple-400 font-semibold text-lg">Level {level}</p>
            <p className="text-slate-400 text-sm text-center">Nastavljaš biti heroj!</p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition"
            >
              Nastavi 🎉
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
