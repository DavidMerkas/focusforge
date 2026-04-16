"use client"; // needed because we use useState (interactivity)

import { useState } from "react";
import Link from "next/link";

const DURATIONS = [15, 25, 45, 90];

const SCENARIOS = [
  { id: "dungeon", icon: "⚔️", label: "Dungeon" },
  { id: "garden", icon: "🌱", label: "Vrt" },
  { id: "space", icon: "🚀", label: "Svemir" },
  { id: "chaos", icon: "🤡", label: "Chaos" },
];

export default function SetupPage() {
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(25); // default 25 min
  const [scenario, setScenario] = useState("dungeon"); // default dungeon

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      {/* HEADER */}
      <header className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-slate-400 hover:text-white text-xl transition"
          aria-label="Natrag"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold">Novi fokus</h1>
      </header>

      {/* FORM */}
      <div className="flex-1 px-5 pb-6 flex flex-col gap-6 pt-4">

        {/* SUBJECT INPUT */}
        <section className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">
            Što učiš?
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="npr. Matematika, Fizika, Engleski..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          {/* Placeholder for recent subjects — localStorage comes later */}
          <div className="flex gap-2 flex-wrap">
            {["Matematika", "Fizika", "Engleski"].map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* DURATION SELECTOR */}
        <section className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">
            Trajanje
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((min) => (
              <button
                key={min}
                onClick={() => setDuration(min)}
                className={`py-3 rounded-xl font-semibold text-sm transition ${
                  duration === min
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </section>

        {/* SCENARIO SELECTOR */}
        <section className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">
            Scenarij
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SCENARIOS.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setScenario(id)}
                className={`flex flex-col items-center py-3 rounded-xl transition ${
                  scenario === id
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* START BUTTON */}
        <Link
          href="/timer"
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-2xl font-bold text-lg tracking-wide transition-colors text-center block mt-auto"
        >
          ▶ Start Focus
        </Link>

      </div>
    </main>
  );
}
