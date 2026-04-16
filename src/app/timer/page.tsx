"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Hardcoded for now — will receive from setup screen later
const TOTAL_SECONDS = 25 * 60;
const SUBJECT = "Matematika";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TimerPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(true); // starts immediately
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // useRef keeps the interval ID between renders without causing re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // This effect runs whenever isRunning changes
  useEffect(() => {
    if (isRunning) {
      // Start ticking: subtract 1 second every 1000ms
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            router.push("/celebration");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Pause: stop the interval
      clearInterval(intervalRef.current!);
    }

    // Cleanup: always clear interval when effect re-runs or component unmounts
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, router]);

  function handleStop() {
    setIsRunning(false);
    setShowStopConfirm(true);
  }

  function confirmStop() {
    router.push("/");
  }

  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      {/* HEADER */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button
          onClick={handleStop}
          className="text-slate-400 hover:text-white text-xl transition"
          aria-label="Stop"
        >
          ✕
        </button>
        <span className="text-sm text-slate-400 font-medium">{SUBJECT}</span>
        <div className="w-8" /> {/* spacer to center the subject label */}
      </header>

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-5">

        {/* Avatar */}
        <div className="text-8xl">🧙‍♂️</div>

        {/* Quest title */}
        <p className="text-slate-400 text-sm tracking-wide">Fokus sesija</p>

        {/* Countdown */}
        <div className="text-8xl font-mono font-bold tracking-widest">
          {formatTime(secondsLeft)}
        </div>

        {/* Progress ring / bar */}
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pause / Resume button */}
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="px-10 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold text-lg transition"
        >
          {isRunning ? "⏸ Pauza" : "▶ Nastavi"}
        </button>

      </div>

      {/* STOP CONFIRMATION MODAL */}
      {showStopConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-4 w-full max-w-xs">
            <h2 className="text-lg font-bold text-center">Odustati od sesije?</h2>
            <p className="text-sm text-slate-400 text-center">
              Dobit ćeš 25% XP-a za odradjeno vrijeme.
            </p>
            <button
              onClick={confirmStop}
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition"
            >
              Da, zaustavi
            </button>
            <button
              onClick={() => { setShowStopConfirm(false); setIsRunning(true); }}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition"
            >
              Nastavi fokus
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
