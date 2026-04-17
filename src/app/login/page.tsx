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
        const userId = data.user.id;
        let userData = await loadUserFromDB(userId);
        if (!userData) {
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="ff-card flex flex-col items-center gap-4" style={{ width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>📧</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Provjeri email!</div>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Poslali smo ti link na<br />
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>{email}</span>.<br />
            Klikni ga i onda se prijavi.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode("login"); }}
            style={{ fontSize: 13, color: "var(--accent)", background: "none", border: 0, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}
          >
            ← Nazad na prijavu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-5" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <span className="animate-breathe" style={{ fontSize: 64, display: "inline-block" }}>🧙‍♂️</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>FocusForge</span>
        <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>Učenje kao avantura ⚔️</span>
      </div>

      <div className="ff-card" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#f0f5f2", borderRadius: 16, padding: 4, gap: 4 }}>
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: 0, cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, transition: "all 0.15s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "var(--ink)" : "var(--ink-soft)",
                boxShadow: mode === m ? "0 3px 0 rgba(59,74,74,0.08)" : "none",
              }}
            >
              {m === "login" ? "Prijava" : "Registracija"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="ff-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="ff-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lozinka (min. 6 znakova)"
            required
            minLength={6}
          />

          {error && (
            <p style={{ color: "#e74c3c", fontSize: 12, fontWeight: 700, margin: 0, textAlign: "center" }}>{error}</p>
          )}

          <button
            type="submit"
            className="ff-btn"
            disabled={loading}
            style={{ marginTop: 4, opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "..." : mode === "login" ? "Prijavi se 🚀" : "Registriraj se ✨"}
          </button>
        </form>

      </div>

      <p style={{ fontSize: 12, color: "var(--ink-faint)", textAlign: "center", fontWeight: 600 }}>
        Privacy-first · Nema push notifikacija · Bez pritiska 🌿
      </p>

    </main>
  );
}
