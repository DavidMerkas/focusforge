"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ACHIEVEMENTS } from "@/lib/achievements";

const RARITY_COLORS: Record<string, string> = {
  common: "#9aa6a6", rare: "#4a9eff", epic: "#b060ff", legendary: "#f4b03a",
};
const REWARD_LABEL = (ach: typeof ACHIEVEMENTS[0]) => {
  if (ach.rewardType === "coins") return `🪙 ${ach.rewardCoins} coins`;
  if (ach.rewardType === "xp")    return `⭐ ${ach.rewardXP} XP`;
  if (ach.rewardType === "item")  return `🎁 Random ${ach.rewardRarity} item`;
  return "";
};

function NavBar() {
  return (
    <nav className="ff-nav">
      {[
        { icon: "🏠", label: "Home",  href: "/" },
        { icon: "🏆", label: "Achievements", href: "/stats", active: true },
        { icon: "🛒", label: "Shop",  href: "/shop" },
        { icon: "🎒", label: "Inventory",   href: "/inventory" },
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

export default function AchievementsPage() {
  const router = useRouter();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      setUnlockedIds(new Set((data ?? []).map((r) => r.achievement_id)));
      setLoading(false);
    }
    load();
  }, [router]);

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));
  const locked   = ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Achievements 🏆</span>
        {!loading && (
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        )}
      </header>

      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", marginTop: 40 }}>Učitavanje...</p>
        ) : (
          <>
            {/* Progress bar */}
            <div className="ff-card" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
                <span>Ukupni napredak</span>
                <span>{unlocked.length} / {ACHIEVEMENTS.length}</span>
              </div>
              <div className="ff-xpbar">
                <div className="ff-xpbar-fill" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
            </div>

            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div className="ff-card flex flex-col gap-3">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Otključano ✅</div>
                {unlocked.map((ach) => (
                  <div key={ach.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px dashed rgba(59,74,74,0.08)" }}>
                    <span style={{ fontSize: 36, width: 44, textAlign: "center", flexShrink: 0 }}>{ach.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{ach.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{ach.description}</div>
                      <div style={{ fontSize: 11, color: ach.rewardRarity ? RARITY_COLORS[ach.rewardRarity] : "var(--accent)", fontWeight: 800, marginTop: 2 }}>{REWARD_LABEL(ach)}</div>
                    </div>
                    <span style={{ fontSize: 20 }}>✅</span>
                  </div>
                ))}
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div className="ff-card flex flex-col gap-3">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Zaključano 🔒</div>
                {locked.map((ach) => (
                  <div key={ach.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px dashed rgba(59,74,74,0.08)", opacity: 0.5 }}>
                    <span style={{ fontSize: 36, width: 44, textAlign: "center", flexShrink: 0, filter: "grayscale(1)" }}>{ach.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{ach.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{ach.description}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 800, marginTop: 2 }}>{REWARD_LABEL(ach)}</div>
                    </div>
                    <span style={{ fontSize: 18, color: "var(--ink-faint)" }}>🔒</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <NavBar />
    </main>
  );
}
