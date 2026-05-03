"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { PERKS, perkSlotsAt, type PerkId } from "@/lib/perks";

interface Session {
  subject: string;
  duration_min: number;
  xp_earned: number;
  completed: boolean;
  created_at: string;
}

function calcLongestStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDates = [...new Set(sessions.map((s) => s.created_at.slice(0, 10)))].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = (new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { current++; if (current > longest) longest = current; }
    else current = 1;
  }
  return longest;
}

const HEATMAP_LEVELS = ["#eef2ea", "#c5e8d4", "#8fd7b0", "#6fc6b0", "#3d9e85"];
function heatLevel(min: number) {
  if (min === 0)  return HEATMAP_LEVELS[0];
  if (min <= 30)  return HEATMAP_LEVELS[1];
  if (min <= 60)  return HEATMAP_LEVELS[2];
  if (min <= 120) return HEATMAP_LEVELS[3];
  return HEATMAP_LEVELS[4];
}

interface FriendRow {
  id: string; status: string; isIncoming: boolean;
  otherUserId: string; otherName: string;
  otherCode: string; otherLevel: number; otherStreak: number;
}

function NavBar() {
  return (
    <nav className="ff-nav">
      {[
        { icon: "🏠", label: "Home",  href: "/" },
        { icon: "🏆", label: "Achievements", href: "/stats" },
        { icon: "🛒", label: "Shop",  href: "/shop" },
        { icon: "🎒", label: "Inventory",   href: "/inventory" },
        { icon: "👤", label: "Me",    href: "/me", active: true },
      ].map(({ icon, label, href, active }) => (
        <Link key={label} href={href} className={`ff-nav-item${active ? " active" : ""}`}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function MePage() {
  const router = useRouter();
  const [myCode, setMyCode] = useState("");
  const [myName, setMyName] = useState("");
  const [myLevel, setMyLevel] = useState(1);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [addCode, setAddCode] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myAvatar, setMyAvatar] = useState("🧙‍♂️");
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [myPerks, setMyPerks] = useState<PerkId[]>([]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const userData = await loadUserFromDB(user.id);
    if (!userData) return;

    let code = (userData as { friendCode?: string } & typeof userData).friendCode;
    if (!code) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("users").update({ friend_code: newCode }).eq("id", user.id);
      code = newCode;
    }
    setMyCode(code ?? "");
    setMyName(userData.heroName);
    setMyLevel(userData.level);
    setMyAvatar(userData.avatar ?? "🧙‍♂️");
    setMyPerks((userData.perks ?? []) as PerkId[]);

    const { data: sessionData } = await supabase
      .from("sessions")
      .select("subject, duration_min, xp_earned, completed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (sessionData) setSessions(sessionData);

    const { data: achData } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);
    setUnlockedAchievements(new Set((achData ?? []).map((r) => r.achievement_id)));

    const { data: friendRows } = await supabase
      .from("friends").select("id, status, user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendRows && friendRows.length > 0) {
      const otherIds = friendRows.map((r) => r.user_id === user.id ? r.friend_id : r.user_id);
      const { data: otherUsers } = await supabase.from("users").select("id, hero_name, friend_code, level, streak").in("id", otherIds);
      setFriends(friendRows.map((r) => {
        const isIncoming = r.friend_id === user.id;
        const otherId = isIncoming ? r.user_id : r.friend_id;
        const other = otherUsers?.find((u) => u.id === otherId);
        return { id: r.id, status: r.status, isIncoming, otherUserId: otherId, otherName: other?.hero_name ?? "???", otherCode: other?.friend_code ?? "", otherLevel: other?.level ?? 1, otherStreak: other?.streak ?? 0 };
      }));
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [router]);

  async function handleAddFriend() {
    setAddError(""); setAddSuccess("");
    const code = addCode.trim().toUpperCase();
    if (!code) { setAddError("Upiši friend code!"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (code === myCode) { setAddError("Ne možeš dodati sebe!"); return; }
    const { data: target } = await supabase.from("users").select("id, hero_name").eq("friend_code", code).single();
    if (!target) { setAddError("Ne postoji korisnik s tim kodom."); return; }
    const { data: existing } = await supabase.from("friends").select("id").or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`).single();
    if (existing) { setAddError("Već si prijatelj ili zahtjev čeka."); return; }
    await supabase.from("friends").insert({ user_id: user.id, friend_id: target.id });
    setAddSuccess(`Zahtjev poslan ${target.hero_name}! 🎉`);
    setAddCode("");
    loadData();
  }

  async function handleAccept(id: string) { await supabase.from("friends").update({ status: "accepted" }).eq("id", id); loadData(); }
  async function handleRemove(id: string) { await supabase.from("friends").delete().eq("id", id); loadData(); }

  const accepted = friends.filter((f) => f.status === "accepted");
  const pending  = friends.filter((f) => f.status === "pending" && f.isIncoming);
  const sent     = friends.filter((f) => f.status === "pending" && !f.isIncoming);

  // Stats calculations
  const totalSessions  = sessions.length;
  const totalMinutes   = sessions.reduce((s, r) => s + r.duration_min, 0);
  const totalXP        = sessions.reduce((s, r) => s + r.xp_earned, 0);
  const totalHours     = Math.floor(totalMinutes / 60);
  const remMin         = totalMinutes % 60;
  const completionRate = totalSessions > 0 ? Math.round((sessions.filter((s) => s.completed).length / totalSessions) * 100) : 0;
  const longestStreak  = calcLongestStreak(sessions);

  const subjectMap: Record<string, number> = {};
  sessions.forEach((s) => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration_min; });
  const topSubjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dayMap: Record<string, number> = {};
  sessions.forEach((s) => { const d = s.created_at.slice(0, 10); dayMap[d] = (dayMap[d] ?? 0) + s.duration_min; });

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, minutes: dayMap[key] ?? 0, day: d.getDate() };
  });
  const maxMin  = Math.max(...last30.map((d) => d.minutes), 1);
  const bestDay = last30.reduce((b, d) => d.minutes > b.minutes ? d : b, { date: "", minutes: 0, day: 0 });

  const today = new Date();
  const daysFromMonday = (today.getDay() + 6) % 7;
  const heatStart = new Date(today.getTime() - (daysFromMonday + 15 * 7) * 86400000);
  const heatDays  = Array.from({ length: 16 * 7 }, (_, i) => {
    const d = new Date(heatStart.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, minutes: dayMap[key] ?? 0, month: d.getMonth(), day: d.getDate() };
  });
  const heatWeeks = Array.from({ length: 16 }, (_, w) => heatDays.slice(w * 7, w * 7 + 7));
  const monthNames = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Kol","Ruj","Lis","Stu","Pro"];
  const weekMonthLabels = heatWeeks.map((week, w) => {
    const isNew = w === 0 || week[0].month !== heatWeeks[w - 1][0].month;
    return isNew ? monthNames[week[0].month] : "";
  });

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Moj profil 👤</span>
      </header>

      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", marginTop: 40 }}>Učitavanje...</p>
        ) : (
          <>
            {/* Profile card */}
            <div className="ff-card ff-tilt" style={{ borderRadius: 28, padding: 0, overflow: "hidden" }}>
              <div style={{ height: 100, background: "linear-gradient(135deg, #cdebe1, #ffd479)", borderRadius: "28px 28px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="animate-breathe" style={{ fontSize: 56 }}>{myAvatar}</span>
              </div>
              <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{myName}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "#fff", padding: "3px 10px", borderRadius: 999 }}>⭐ Level {myLevel}</span>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>Tvoj friend code</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: 4, background: "#f6ead1", padding: "10px 20px", borderRadius: 16, border: 0, cursor: "pointer", color: "var(--ink)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)", transition: "transform 0.08s" }}
                  >{myCode}</button>
                  <span style={{ fontSize: 11, color: copied ? "#4caf50" : "var(--ink-faint)", fontWeight: 700 }}>{copied ? "✅ Kopirano!" : "Klikni za kopiranje"}</span>
                </div>
              </div>
            </div>

            {/* Perks */}
            <div className="ff-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>⚡ Perkovi</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)", letterSpacing: 1 }}>{myPerks.length}/{perkSlotsAt(myLevel)} SLOT</span>
              </div>
              {myPerks.length === 0 ? (
                <p style={{ color: "var(--ink-soft)", fontSize: 12, margin: 0, fontWeight: 600 }}>
                  {perkSlotsAt(myLevel) > 0
                    ? "Imaš slobodan slot — završi sesiju da odabereš perk."
                    : `Sljedeći slot na levelu ${(Math.floor(myLevel / 10) + 1) * 10}.`}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {myPerks.map((id) => {
                    const p = PERKS[id];
                    if (!p) return null;
                    return (
                      <div key={id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 12, background: "rgba(201,255,74,0.06)", border: "1px solid rgba(201,255,74,0.20)" }}>
                        <span style={{ fontSize: 22 }}>{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600 }}>{p.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add friend */}
            <div className="ff-card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 12 }}>Dodaj prijatelja</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="ff-input" type="text" value={addCode} onChange={(e) => setAddCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" style={{ flex: 1, letterSpacing: 3, fontFamily: "var(--font-display)", fontSize: 16 }} />
                <button className="ff-btn" style={{ width: "auto", padding: "0 20px", fontSize: 14, borderRadius: 16 }} onClick={handleAddFriend}>Dodaj</button>
              </div>
              {addError   && <p style={{ color: "#e74c3c", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{addError}</p>}
              {addSuccess && <p style={{ color: "#4caf50", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{addSuccess}</p>}
            </div>

            {/* Incoming requests */}
            {pending.length > 0 && (
              <div className="ff-card">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 10 }}>Zahtjevi ({pending.length})</div>
                {pending.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>{f.otherName}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, fontWeight: 600 }}>Level {f.otherLevel}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleAccept(f.id)} style={{ padding: "8px 14px", background: "var(--accent-2)", border: 0, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff", boxShadow: "0 3px 0 color-mix(in oklab, var(--accent-2), #000 30%)" }}>Prihvati</button>
                      <button onClick={() => handleRemove(f.id)} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: 0, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--ink-soft)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}>Odbij</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sent */}
            {sent.length > 0 && (
              <div className="ff-card">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 10 }}>Poslani zahtjevi</div>
                {sent.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{f.otherName} <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>(čeka)</span></span>
                    <button onClick={() => handleRemove(f.id)} style={{ fontSize: 12, color: "var(--ink-faint)", border: 0, background: "transparent", cursor: "pointer", fontWeight: 700 }}>Otkaži</button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div className="ff-card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 10 }}>Prijatelji ({accepted.length})</div>
              {accepted.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-faint)", margin: 0, fontWeight: 600 }}>Još nemaš prijatelja. Dodaj ih gore!</p>
              ) : (
                accepted.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 32 }}>🧙‍♂️</span>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>{f.otherName}</p>
                        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, fontWeight: 600 }}>Level {f.otherLevel} · 🔥 {f.otherStreak}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(f.id)} style={{ fontSize: 12, color: "var(--ink-faint)", border: 0, background: "transparent", cursor: "pointer", fontWeight: 700 }}>Ukloni</button>
                  </div>
                ))
              )}
            </div>
            {/* ── Stats sekcija ── */}
            {totalSessions > 0 && (
              <>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--ink)", marginTop: 8 }}>Statistike 📊</div>

                {/* Summary row 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { val: totalSessions, label: "Sesija", icon: "🎯" },
                    { val: totalHours > 0 ? `${totalHours}h ${remMin}m` : `${totalMinutes}m`, label: "Ukupno", icon: "⏱️" },
                    { val: totalXP, label: "XP ukupno", icon: "⭐" },
                  ].map(({ val, label, icon }) => (
                    <div key={label} className="ff-card flex flex-col items-center gap-1" style={{ padding: "16px 10px" }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>{val}</span>
                      <span style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 700, textAlign: "center" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Summary row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="ff-card flex flex-col items-center gap-1" style={{ padding: "16px 10px" }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--accent-2)" }}>{completionRate}%</span>
                    <span style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 700, textAlign: "center" }}>Završenih sesija</span>
                  </div>
                  <div className="ff-card flex flex-col items-center gap-1" style={{ padding: "16px 10px" }}>
                    <span style={{ fontSize: 24 }}>🔥</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--streak)" }}>{longestStreak} dana</span>
                    <span style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 700, textAlign: "center" }}>Rekordni streak</span>
                  </div>
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

                {/* Bar chart 30 dana */}
                <div className="ff-card flex flex-col gap-3">
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Zadnjih 30 dana</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 88, textAlign: "right" }}>
                      <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>{maxMin}m</span>
                      <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>{Math.round(maxMin / 2)}m</span>
                      <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 700 }}>0</span>
                    </div>
                    <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "flex-end", height: 88 }}>
                      {last30.map(({ date, minutes, day }) => {
                        const pct = (minutes / maxMin) * 100;
                        const isToday = date === new Date().toISOString().slice(0, 10);
                        return (
                          <div key={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                            <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 80 }}>
                              <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: isToday ? "var(--accent)" : minutes > 0 ? "var(--accent-2)" : "rgba(59,74,74,0.08)", height: `${Math.max(pct, minutes > 0 ? 4 : 0)}%`, transition: "height 0.5s ease" }} />
                            </div>
                            <span style={{ fontSize: 8, color: isToday ? "var(--accent)" : "var(--ink-faint)", fontWeight: isToday ? 800 : 700 }}>{day % 5 === 0 || isToday ? day : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="ff-card flex flex-col gap-3">
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Aktivnost 📅</div>
                  <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", gap: 0 }}>
                      <div style={{ display: "flex", gap: 3, marginBottom: 4, paddingLeft: 18 }}>
                        {heatWeeks.map((_, w) => (
                          <div key={w} style={{ width: 14, fontSize: 8, fontWeight: 800, color: "var(--ink-faint)", flexShrink: 0 }}>{weekMonthLabels[w]}</div>
                        ))}
                      </div>
                      {["Po","Ut","Sr","Če","Pe","Su","Ne"].map((label, row) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                          <span style={{ width: 14, fontSize: 8, color: "var(--ink-faint)", fontWeight: 800, textAlign: "right", flexShrink: 0 }}>{row % 2 === 0 ? label : ""}</span>
                          {heatWeeks.map((week, w) => {
                            const cell = week[row];
                            return (
                              <div key={w} title={cell ? `${cell.date}: ${cell.minutes} min` : ""} style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, background: cell ? heatLevel(cell.minutes) : HEATMAP_LEVELS[0] }} />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 10, color: "var(--ink-faint)", fontWeight: 700 }}>Manje</span>
                    {HEATMAP_LEVELS.map((color) => (
                      <div key={color} style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                    ))}
                    <span style={{ fontSize: 10, color: "var(--ink-faint)", fontWeight: 700 }}>Više</span>
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
                            <span>{i + 1}. {subject}</span>
                            <span style={{ color: "var(--ink-soft)" }}>{minutes} min</span>
                          </div>
                          <div style={{ height: 10, borderRadius: 999, background: "#eef2ea", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "var(--accent-2)", transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Achievements sažetak */}
            <div className="ff-card flex flex-col gap-3">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Achievements 🏆</span>
                <Link href="/stats" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>Sve →</Link>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--accent)" }}>
                  {unlockedAchievements.size}/{ACHIEVEMENTS.length}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="ff-xpbar">
                    <div className="ff-xpbar-fill" style={{ width: `${(unlockedAchievements.size / ACHIEVEMENTS.length) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ACHIEVEMENTS.map((ach) => {
                  const done = unlockedAchievements.has(ach.id);
                  return (
                    <span key={ach.id} title={ach.title} style={{ fontSize: 24, filter: done ? "none" : "grayscale(1)", opacity: done ? 1 : 0.35 }}>
                      {ach.icon}
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <NavBar />
    </main>
  );
}
