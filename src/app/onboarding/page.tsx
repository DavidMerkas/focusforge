"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AVATARS = ["🧙", "⚔️", "🏹", "🛡️", "🔮", "🐉"];

export default function OnboardingPage() {
  const router = useRouter();
  const [heroName, setHeroName] = useState("");
  const [avatar, setAvatar] = useState("🧙");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish() {
    const name = heroName.trim();
    if (!name) { setError("Upiši ime svog heroja!"); return; }
    if (name.length > 20) { setError("Ime je predugačko (max 20 znakova)."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    await supabase.from("users").update({
      hero_name: name,
      onboarded: true,
    }).eq("id", user.id);

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center max-w-[480px] mx-auto px-6 gap-8">

      <div className="flex flex-col items-center gap-2">
        <div className="text-6xl">{avatar}</div>
        <h1 className="text-2xl font-bold text-center">Dobrodošao u FocusForge!</h1>
        <p className="text-slate-400 text-sm text-center">Kako se zove tvoj heroj?</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <input
          type="text"
          value={heroName}
          onChange={(e) => { setHeroName(e.target.value); setError(""); }}
          placeholder="npr. Veliki David, Čarobnjak..."
          maxLength={20}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="w-full flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-300 text-center">Odaberi avatar</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-3xl py-2 rounded-xl transition ${
                avatar === a ? "bg-purple-600" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-2xl font-bold text-lg transition"
      >
        {loading ? "..." : "Kreni u avanturu! ⚔️"}
      </button>

    </main>
  );
}
