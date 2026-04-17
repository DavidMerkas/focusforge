"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, createUserInDB } from "@/lib/db";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setConfirmSent(true);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        // Check if user has a row in DB (might be first login after email confirm)
        const userId = data.user.id;
        let userData = await loadUserFromDB(userId);
        if (!userData) {
          // First login — create row and send to onboarding
          await createUserInDB(userId, {
            heroName: "Heroj",
            level: 1, xp: 0, coins: 0, streak: 0,
            lastSessionDate: null, recentSubjects: [],
          });
          router.push("/onboarding");
        } else if (!userData.onboarded) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
    }

    setLoading(false);
  }

  if (confirmSent) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center max-w-[480px] mx-auto px-6 gap-4">
        <div className="text-6xl">📧</div>
        <h1 className="text-2xl font-bold text-center">Provjeri email</h1>
        <p className="text-slate-400 text-center text-sm">
          Poslali smo ti link za potvrdu na <span className="text-white">{email}</span>.
          Klikni ga i onda se prijavi.
        </p>
        <button
          onClick={() => { setConfirmSent(false); setMode("login"); }}
          className="mt-2 text-purple-400 hover:text-purple-300 text-sm transition"
        >
          Nazad na prijavu
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center max-w-[480px] mx-auto px-6 gap-6">

      <div className="text-6xl">🧙</div>
      <h1 className="text-2xl font-bold">FocusForge</h1>

      <div className="w-full flex bg-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            mode === "login" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Prijava
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            mode === "register" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Registracija
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lozinka"
          required
          minLength={6}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-2xl font-bold text-lg transition mt-1"
        >
          {loading ? "..." : mode === "login" ? "Prijavi se" : "Registriraj se"}
        </button>
      </form>

    </main>
  );
}
