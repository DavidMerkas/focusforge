"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function TimerContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration = Number(params.get("duration") ?? 25);
  const subject = params.get("subject") ?? "Opći fokus";
  const scenario = params.get("scenario") ?? "dungeon";

  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Write a token so celebration page knows a real session was completed
  useEffect(() => {
    sessionStorage.setItem("ff_session", JSON.stringify({ duration, subject, scenario, startedAt: Date.now() }));
  }, [duration, subject, scenario]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            // Mark session as completed so celebration can verify it
            sessionStorage.setItem("ff_session_complete", "1");
            const celebrationParams = new URLSearchParams({
              duration: String(duration),
              subject,
              scenario,
            });
            router.push(`/celebration?${celebrationParams.toString()}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, duration, subject, scenario, router]);

  function handleStop() {
    setIsRunning(false);
    setShowStopConfirm(true);
  }

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button onClick={handleStop} className="text-slate-400 hover:text-white text-xl transition" aria-label="Stop">
          ✕
        </button>
        <span className="text-sm text-slate-400 font-medium">{subject}</span>
        <div className="w-8" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-5">
        <div className="text-8xl">🧙‍♂️</div>
        <p className="text-slate-400 text-sm tracking-wide">Fokus sesija</p>

        <div className="text-8xl font-mono font-bold tracking-widest">
          {formatTime(secondsLeft)}
        </div>

        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={() => setIsRunning((r) => !r)}
          className="px-10 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold text-lg transition"
        >
          {isRunning ? "⏸ Pauza" : "▶ Nastavi"}
        </button>
      </div>

      {showStopConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-4 w-full max-w-xs">
            <h2 className="text-lg font-bold text-center">Odustati od sesije?</h2>
            <p className="text-sm text-slate-400 text-center">
              Dobit ćeš 25% XP-a za odrađeno vrijeme.
            </p>
            <button
              onClick={() => router.push("/")}
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

// useSearchParams requires Suspense boundary in Next.js App Router
export default function TimerPage() {
  return (
    <Suspense>
      <TimerContent />
    </Suspense>
  );
}
