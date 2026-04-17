"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Session {
  subject: string;
  duration_min: number;
  xp_earned: number;
  created_at: string;
}

interface DayData {
  date: string;   // "2026-04-18"
  minutes: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("sessions")
        .select("subject, duration_min, xp_earned, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setSessions(data);
      setLoading(false);
    }
    load();
  }, [router]);

  // ── Computed stats ──────────────────────────────────────────────
  const totalSessions = sessions.length;
  const totalMinutes  = sessions.reduce((s, r) => s + r.duration_min, 0);
  const totalXP       = sessions.reduce((s, r) => s + r.xp_earned, 0);
  const totalHours    = Math.floor(totalMinutes / 60);
  const remMinutes    = totalMinutes % 60;

  // Top kategorije po ukupnim minutama
  const subjectMap: Record<string, number> = {};
  sessions.forEach((s) => {
    subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration_min;
  });
  const topSubjects = Object.entries(subjectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Last 14 days heatmap data
  const dayMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = s.created_at.slice(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + s.duration_min;
  });

  const last14: DayData[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    last14.push({ date: key, minutes: dayMap[key] ?? 0 });
  }

  // Best day
  const bestDay = last14.reduce((best, d) => d.minutes > best.minutes ? d : best, { date: "", minutes: 0 });

  function heatColor(minutes: number): string {
    if (minutes === 0)   return "bg-slate-800";
    if (minutes < 30)    return "bg-purple-900";
    if (minutes < 60)    return "bg-purple-700";
    if (minutes < 120)   return "bg-purple-500";
    return "bg-purple-400";
  }

  const DAY_LABELS = ["Po", "Ut", "Sr", "Če", "Pe", "Su", "Ne"];

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white text-xl transition">←</Link>
        <h1 className="text-xl font-bold">Statistike 📊</h1>
      </header>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-5">

        {loading ? (
          <p className="text-slate-400 text-sm text-center mt-10">Učitavanje...</p>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 mt-16 text-center">
            <div className="text-5xl">📊</div>
            <p className="text-slate-400 text-sm">Još nemaš sesija.<br />Završi prvu i vidi statistike!</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-purple-400">{totalSessions}</span>
                <span className="text-xs text-slate-400 text-center">Sesija</span>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-purple-400">
                  {totalHours > 0 ? `${totalHours}h ${remMinutes}m` : `${totalMinutes}m`}
                </span>
                <span className="text-xs text-slate-400 text-center">Ukupno</span>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-purple-400">{totalXP}</span>
                <span className="text-xs text-slate-400 text-center">XP zarađen</span>
              </div>
            </div>

            {/* Best day */}
            {bestDay.minutes > 0 && (
              <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-semibold">Najbolji dan</p>
                  <p className="text-xs text-slate-400">
                    {new Date(bestDay.date).toLocaleDateString("hr", { weekday: "long", day: "numeric", month: "long" })} — {bestDay.minutes} min
                  </p>
                </div>
              </div>
            )}

            {/* 14-day bar chart */}
            <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-300">Zadnjih 14 dana</p>
              <div className="flex gap-2">
                {/* Y os */}
                {(() => {
                  const maxMin = Math.max(...last14.map((d) => d.minutes), 1);
                  return (
                    <div className="flex flex-col justify-between text-right" style={{ height: "88px" }}>
                      <span className="text-[9px] text-slate-500">{maxMin}m</span>
                      <span className="text-[9px] text-slate-500">{Math.round(maxMin / 2)}m</span>
                      <span className="text-[9px] text-slate-500">0</span>
                    </div>
                  );
                })()}
                {/* Bars */}
                <div className="flex items-end gap-1 flex-1" style={{ height: "88px" }}>
                  {last14.map(({ date, minutes }) => {
                    const maxMin = Math.max(...last14.map((d) => d.minutes), 1);
                    const pct = (minutes / maxMin) * 100;
                    const d = new Date(date);
                    const dayNum = d.getDate();
                    const isToday = date === new Date().toISOString().slice(0, 10);
                    return (
                      <div key={date} className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full flex items-end" style={{ height: "80px" }}>
                          <div
                            title={`${minutes} min`}
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              isToday ? "bg-purple-400" : minutes > 0 ? "bg-purple-600" : "bg-slate-700"
                            }`}
                            style={{ height: `${Math.max(pct, minutes > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] leading-none ${isToday ? "text-purple-400 font-bold" : "text-slate-500"}`}>
                          {dayNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Top kategorije */}
            {topSubjects.length > 0 && (
              <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-300">Top kategorije</p>
                {topSubjects.map(([subject, minutes], i) => {
                  const maxMin = topSubjects[0][1];
                  const pct = (minutes / maxMin) * 100;
                  return (
                    <div key={subject} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{i + 1}. {subject}</span>
                        <span className="text-slate-400">{minutes} min</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[
          { icon: "🏠", label: "Home",  href: "/" },
          { icon: "📊", label: "Stats", href: "/stats",     active: true },
          { icon: "🛒", label: "Shop",  href: "/shop" },
          { icon: "🎒", label: "Inv",   href: "/inventory" },
          { icon: "👤", label: "Me",    href: "/" },
        ].map(({ icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-xl transition ${
              active ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
