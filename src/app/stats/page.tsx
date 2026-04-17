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

function NavBar() {
  return (
    <nav className="ff-nav">
      {[
        { icon: "🏠", label: "Home",  href: "/" },
        { icon: "📊", label: "Stats", href: "/stats", active: true },
        { icon: "🛒", label: "Shop",  href: "/shop" },
        { icon: "🎒", label: "Inv",   href: "/inventory" },
        { icon: "👤", label: "Me",    href: "/me" },
      ].map(({ icon, label, href, active }) => (
        <Link key={label} href={href} className={`ff-nav-item${active ? " active" : ""}`}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
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

  const totalSessions = sessions.length;
  const totalMinutes  = sessions.reduce((s, r) => s + r.duration_min, 0);
  const totalXP       = sessions.reduce((s, r) => s + r.xp_earned, 0);
  const totalHours    = Math.floor(totalMinutes / 60);
  const remMinutes    = totalMinutes % 60;

  const subjectMap: Record<string, number> = {};
  sessions.forEach((s) => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration_min; });
  const topSubjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dayMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = s.created_at.slice(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + s.duration_min;
  });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, minutes: dayMap[key] ?? 0, day: d.getDate() };
  });

  const maxMin  = Math.max(...last14.map((d) => d.minutes), 1);
  const bestDay = last14.reduce((b, d) => d.minutes > b.minutes ? d : b, { date: "", minutes: 0, day: 0 });

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Statistike 📊</span>
      </header>

      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", marginTop: 40 }}>Učitavanje...</p>
        ) : sessions.length === 0 ? (
          <div className="ff-card flex flex-col items-center gap-3" style={{ marginTop: 40, padding: 32 }}>
            <div style={{ fontSize: 48 }}>📊</div>
            <p style={{ color: "var(--ink-soft)", textAlign: "center", fontSize: 14, margin: 0 }}>Još nemaš sesija.<br />Završi prvu i vidi statistike!</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { val: totalSessions, label: "Sesija", icon: "🎯" },
                { val: totalHours > 0 ? `${totalHours}h ${remMinutes}m` : `${totalMinutes}m`, label: "Ukupno", icon: "⏱️" },
                { val: totalXP,       label: "XP zarađen", icon: "⭐" },
              ].map(({ val, label, icon }) => (
                <div key={label} className="ff-card flex flex-col items-center gap-1" style={{ padding: "16px 10px" }}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{val}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, textAlign: "center" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Best day */}
            {bestDay.minutes > 0 && (
              <div className="ff-card flex items-center gap-3">
                <span style={{ fontSize: 28 }}>🏆</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 13, margin: 0 }}>Najbolji dan</p>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, fontWeight: 600 }}>
                    {new Date(bestDay.date).toLocaleDateString("hr", { weekday: "long", day: "numeric", month: "long" })} — {bestDay.minutes} min
                  </p>
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div className="ff-card flex flex-col gap-3">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Zadnjih 14 dana</div>
              <div style={{ display: "flex", gap: 6 }}>
                {/* Y axis */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 88, textAlign: "right" }}>
                  <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>{maxMin}m</span>
                  <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>{Math.round(maxMin / 2)}m</span>
                  <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>0</span>
                </div>
                {/* Bars */}
                <div style={{ display: "flex", gap: 3, flex: 1, alignItems: "flex-end", height: 88 }}>
                  {last14.map(({ date, minutes, day }) => {
                    const pct = (minutes / maxMin) * 100;
                    const isToday = date === new Date().toISOString().slice(0, 10);
                    return (
                      <div key={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                        <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 80 }}>
                          <div style={{
                            width: "100%", borderRadius: "4px 4px 0 0",
                            background: isToday ? "var(--accent)" : minutes > 0 ? "var(--accent-2)" : "rgba(59,74,74,0.08)",
                            height: `${Math.max(pct, minutes > 0 ? 4 : 0)}%`,
                            transition: "height 0.5s ease",
                            boxShadow: minutes > 0 ? "inset 0 -3px 0 rgba(0,0,0,0.1)" : "none",
                          }} />
                        </div>
                        <span style={{ fontSize: 9, color: isToday ? "var(--accent)" : "var(--ink-faint)", fontWeight: isToday ? 800 : 700 }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top kategorije */}
            {topSubjects.length > 0 && (
              <div className="ff-card flex flex-col gap-3">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Top kategorije</div>
                {topSubjects.map(([subject, minutes], i) => {
                  const pct = (minutes / topSubjects[0][1]) * 100;
                  return (
                    <div key={subject} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                        <span style={{ color: "var(--ink)" }}>{i + 1}. {subject}</span>
                        <span style={{ color: "var(--ink-soft)" }}>{minutes} min</span>
                      </div>
                      <div style={{ height: 10, borderRadius: 999, background: "#eef2ea", overflow: "hidden", boxShadow: "inset 0 2px 3px rgba(59,74,74,0.12)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "var(--accent-2)", transition: "width 0.5s ease", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.08)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <NavBar />
    </main>
  );
}
