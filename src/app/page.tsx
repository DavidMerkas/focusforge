"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { xpForNextLevel } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, createUserInDB } from "@/lib/db";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState({
    heroName: "Hero",
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
  });
  const [xpToNext, setXpToNext] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace("/login");
        return;
      }

      // Load from DB, create row if first time
      let data = await loadUserFromDB(authUser.id);
      if (!data) {
        const defaultData = {
          heroName: "Heroj",
          level: 1,
          xp: 0,
          coins: 0,
          streak: 0,
          lastSessionDate: null,
          recentSubjects: [],
        };
        await createUserInDB(authUser.id, defaultData);
        router.replace("/onboarding");
        return;
      }
      if (!data.onboarded) {
        router.replace("/onboarding");
        return;
      }

      setUser({
        heroName: data.heroName,
        level: data.level,
        xp: data.xp,
        coins: data.coins,
        streak: data.streak,
      });
      setXpToNext(xpForNextLevel(data.level));
      setLoading(false);
    }

    loadData();

    // Refresh when window gets focus (e.g. after returning from celebration)
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const xpPercent = xpToNext > 0 ? (user.xp / xpToNext) * 100 : 100;
  const weeklyGoalMin = 100;
  const weeklyDoneMin = 0;
  const weeklyPercent = (weeklyDoneMin / weeklyGoalMin) * 100;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <span className="text-slate-400 text-sm">Učitavanje...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">FocusForge 🧙</h1>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm transition"
        >
          Odjava
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">

        <section className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-2">
          <div className="text-7xl">🧙‍♂️</div>
          <div className="text-lg font-semibold">{user.heroName}</div>
          <div className="text-sm text-purple-400 font-medium">⭐ Level {user.level}</div>

          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="text-xs text-slate-400">{user.xp} / {xpToNext} XP</div>

          <div className="flex gap-6 mt-1">
            <span className="text-sm text-slate-300">🔥 <span className="font-semibold text-white">{user.streak}</span> streak</span>
            <span className="text-sm text-slate-300">💰 <span className="font-semibold text-amber-400">{user.coins}</span> coins</span>
          </div>
        </section>

        <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">📅 Tjedni izazov</span>
            <span className="text-xs text-slate-400">{weeklyDoneMin}/{weeklyGoalMin} min</span>
          </div>
          <div className="text-xs text-slate-400">Fokusiraj se {weeklyGoalMin} minuta ovaj tjedan</div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        </section>

        <Link
          href="/setup"
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-2xl font-bold text-lg tracking-wide transition-colors text-center block"
        >
          ▶ Start Focus
        </Link>

      </div>

      <nav className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[
          { icon: "🏠", label: "Home",  href: "/",          active: true  },
          { icon: "📊", label: "Stats", href: "/",          active: false },
          { icon: "🛒", label: "Shop",  href: "/shop",       active: false },
          { icon: "🎒", label: "Inv",   href: "/inventory", active: false },
          { icon: "👤", label: "Me",    href: "/",          active: false },
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
