"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB } from "@/lib/db";

const DURATIONS = [15, 25, 45, 90];
const SCENARIOS = [
  { id: "dungeon", icon: "⚔️", label: "Dungeon" },
  { id: "garden",  icon: "🌱", label: "Vrt" },
  { id: "space",   icon: "🚀", label: "Svemir" },
  { id: "chaos",   icon: "🤡", label: "Chaos" },
];

export default function SetupPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState("");
  const [scenario, setScenario] = useState("dungeon");
  const [recentSubjects, setRecentSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRecent() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userData = await loadUserFromDB(user.id);
      if (userData) setRecentSubjects(userData.recentSubjects);
    }
    loadRecent();
  }, []);

  async function handleStart() {
    setLoading(true);
    const finalSubject = subject.trim() || "Opći fokus";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let questTitle = "Fokus sesija";
    let questDesc = "";
    try {
      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: finalSubject, scenario, durationMin: duration, userId: user.id }),
      });
      if (res.ok) {
        const quest = await res.json();
        questTitle = quest.title ?? questTitle;
        questDesc = quest.description ?? "";
      }
    } catch {}

    const params = new URLSearchParams({ duration: String(duration), subject: finalSubject, scenario, questTitle, questDesc });
    router.push(`/timer?${params.toString()}`);
  }

  return (
    <main className="min-h-screen pb-10" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 18, cursor: "pointer", textDecoration: "none" }}>←</Link>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Nova sesija</span>
      </header>

      <div className="px-5 flex flex-col gap-1">

        {/* Subject */}
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.8px", margin: "8px 2px 6px" }}>Što učiš?</div>
        <input
          className="ff-input"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="npr. Matematika, Fizika, Engleski..."
        />
        {recentSubjects.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {recentSubjects.map((s) => (
              <button key={s} onClick={() => setSubject(s)} className="ff-chip" style={{ fontSize: 11, padding: "6px 10px", border: 0, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Duration */}
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.8px", margin: "14px 2px 6px" }}>Trajanje</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {DURATIONS.map((min) => (
            <button
              key={min}
              onClick={() => { setDuration(min); setCustomDuration(""); }}
              className={`ff-pick${duration === min && customDuration === "" ? " selected" : ""}`}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>{min}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.6px" }}>min</span>
            </button>
          ))}
        </div>
        <input
          className="ff-input"
          type="number"
          min={1} max={480}
          value={customDuration}
          onChange={(e) => {
            setCustomDuration(e.target.value);
            const val = Number(e.target.value);
            if (val >= 1 && val <= 480) setDuration(val);
          }}
          placeholder="Vlastito trajanje (min)"
          style={{ marginTop: 10 }}
        />

        {/* Scenario */}
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.8px", margin: "14px 2px 6px" }}>Scenarij</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {SCENARIOS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setScenario(id)} className={`ff-pick${scenario === id ? " selected" : ""}`}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ height: 20 }} />
        <button className="ff-btn" onClick={handleStart} disabled={loading} style={{ fontSize: 20, padding: "20px 24px", borderRadius: 26, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Generiranje questa..." : "Krenimo! 🗡️"}
        </button>

      </div>
    </main>
  );
}
