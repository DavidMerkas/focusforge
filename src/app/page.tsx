"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { xpForNextLevel } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, createUserInDB } from "@/lib/db";
import { getOrCreateChallenges, type Challenge } from "@/lib/challenges";

function NavBar() {
  return (
    <nav className="ff-nav">
      {[
        { icon: "🏠", label: "Home",  href: "/",          active: true  },
        { icon: "📊", label: "Stats", href: "/stats" },
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

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState({ heroName: "Heroj", level: 1, xp: 0, coins: 0, streak: 0 });
  const [xpToNext, setXpToNext] = useState(50);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarAnim, setAvatarAnim] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.replace("/login"); return; }

      let data = await loadUserFromDB(authUser.id);
      if (!data) {
        const defaultData = { heroName: "Heroj", level: 1, xp: 0, coins: 0, streak: 0, lastSessionDate: null, recentSubjects: [] };
        await createUserInDB(authUser.id, defaultData);
        router.replace("/onboarding");
        return;
      }
      if (!data.onboarded) { router.replace("/onboarding"); return; }

      setUser({ heroName: data.heroName, level: data.level, xp: data.xp, coins: data.coins, streak: data.streak });
      setXpToNext(xpForNextLevel(data.level));
      const ch = await getOrCreateChallenges(authUser.id);
      setChallenges(ch);
      setLoading(false);
    }

    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [router]);

  function handleAvatarTap() {
    setAvatarAnim("jump");
    setTimeout(() => setAvatarAnim(""), 700);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const xpPercent = xpToNext > 0 ? (user.xp / xpToNext) * 100 : 100;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span style={{ color: "var(--ink-soft)", fontFamily: "var(--font-display)" }}>Učitavanje...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Ambient clouds */}
      <div className="ff-cloud" style={{ top: 60, animationDuration: "34s" }} />
      <div className="ff-cloud" style={{ top: 110, animationDuration: "48s", animationDelay: "-14s", transform: "scale(0.7)" }} />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
          🌿 FocusForge
        </div>
        <button onClick={handleLogout} style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, cursor: "pointer", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 16 }}>
          🚪
        </button>
      </header>

      <div className="px-5 flex flex-col gap-4" style={{ position: "relative", zIndex: 1 }}>

        {/* Streak + coins chips */}
        <div className="flex gap-3">
          <span className="ff-chip" style={{ color: "var(--streak)" }}>🔥 <strong>{user.streak}</strong> dana</span>
          <span className="ff-chip" style={{ color: "var(--coin)" }}>🪙 <strong>{user.coins}</strong></span>
        </div>

        {/* Hero card */}
        <div className="ff-card ff-tilt" style={{ borderRadius: 28, padding: 0, overflow: "hidden" }}>
          {/* Island scene */}
          <div style={{
            height: 170, position: "relative", overflow: "hidden",
            background: "radial-gradient(circle at 20% 80%, #8fd7b0 0 44px, transparent 45px), radial-gradient(circle at 85% 85%, #8fd7b0 0 34px, transparent 35px), linear-gradient(180deg, #e8f8d0, #c8eee0)",
            borderRadius: "28px 28px 40% 40% / 28px 28px 22% 22%",
          }}>
            {/* Sun */}
            <div className="animate-sunpulse" style={{ position: "absolute", top: 16, right: 24, width: 46, height: 46, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #fffbe0, #ffd479)", boxShadow: "0 0 32px rgba(255,212,121,0.6)" }} />
            {/* Palms */}
            <span className="animate-sway" style={{ position: "absolute", bottom: 14, left: 12, fontSize: 32, transformOrigin: "bottom center" }}>🌴</span>
            <span style={{ position: "absolute", bottom: 14, right: 12, fontSize: 32, transformOrigin: "bottom center", transform: "scaleX(-1)", animation: "sway 5s ease-in-out infinite", display: "inline-block" }}>🌴</span>
            {/* Ground shadow */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -10, height: 40, background: "radial-gradient(ellipse at center, rgba(143,215,176,0.9), transparent 70%)" }} />
            {/* Avatar */}
            <div style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ width: 100, height: 16, margin: "0 auto -4px", background: "radial-gradient(ellipse at center, rgba(59,74,74,0.2), transparent 70%)", borderRadius: "50%", filter: "blur(1px)" }} />
              <span
                onClick={handleAvatarTap}
                style={{
                  fontSize: 64, display: "inline-block", cursor: "pointer", userSelect: "none",
                  filter: "drop-shadow(0 6px 6px rgba(59,74,74,0.2))",
                  animation: avatarAnim === "jump"
                    ? "jump 0.6s cubic-bezier(.2,.9,.3,1.4)"
                    : "breathe 3.2s ease-in-out infinite",
                }}
              >🧙‍♂️</span>
            </div>
            <span className="animate-twinkle" style={{ position: "absolute", top: 10, right: 14, fontSize: 14, color: "var(--accent-3)" }}>✨</span>
          </div>

          {/* Hero info */}
          <div className="flex flex-col gap-2" style={{ padding: "14px 18px 16px" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>{user.heroName}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, background: "var(--accent)", color: "#fff", padding: "4px 10px", borderRadius: 999, boxShadow: "0 3px 0 rgba(212,99,69,0.5)" }}>⭐ Lv {user.level}</span>
            </div>
            <div className="ff-xpbar">
              <div className="ff-xpbar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "right", fontWeight: 700 }}>{user.xp} / {xpToNext} XP</div>
          </div>
        </div>

        {/* Weekly challenges */}
        {challenges.length > 0 && (
          <div className="ff-card ff-tilt">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "var(--ink)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              Tjedni izazovi
            </div>
            {challenges.map((c) => {
              const pct = Math.min((c.current / c.target) * 100, 100);
              const label = c.type === "total_minutes" ? `🎯 Fokusiraj ${c.target} minuta` : `📚 Završi ${c.target} sesije`;
              const progress = c.type === "total_minutes" ? `${c.current}/${c.target} min` : `${c.current}/${c.target}`;
              return (
                <div key={c.id} style={{ padding: "10px 0", borderTop: "1px dashed rgba(59,74,74,0.12)" }}>
                  <div className="flex justify-between" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    <span>{c.completed ? "✅" : ""}{label}</span>
                    <span style={{ color: "var(--ink-soft)" }}>{progress}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "#eef2ea", overflow: "hidden", boxShadow: "inset 0 2px 3px rgba(59,74,74,0.12)" }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: c.completed ? "#6fc6b0" : "var(--accent-2)", transition: "width 0.8s ease", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.08)" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 4 }}>Nagrada: +{c.rewardXp} XP · +{c.rewardCoins} 🪙</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Start focus button */}
        <Link href="/setup" style={{ textDecoration: "none" }}>
          <button className="ff-btn" style={{ fontSize: 20, padding: "20px 24px", borderRadius: 26 }}>
            <span style={{ position: "absolute", inset: -3, borderRadius: 28, animation: "ringpulse 2.4s ease-out infinite", pointerEvents: "none" }} />
            ▶ Pokreni fokus
          </button>
        </Link>

      </div>

      <NavBar />
    </main>
  );
}
