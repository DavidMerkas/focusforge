"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AVATARS = ["🧙‍♂️", "⚔️", "🏹", "🛡️", "🔮", "🐉"];

export default function OnboardingPage() {
  const router = useRouter();
  const [heroName, setHeroName] = useState("");
  const [avatar, setAvatar] = useState("🧙‍♂️");
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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-5" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Hero */}
      <div className="flex flex-col items-center gap-2">
        <span className="animate-breathe" style={{ fontSize: 72, display: "inline-block" }}>{avatar}</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--ink)" }}>Dobrodošao! 🎉</span>
        <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>Kako se zove tvoj heroj?</span>
      </div>

      <div className="ff-card" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Name input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>IME HEROJA</label>
          <input
            className="ff-input"
            type="text"
            value={heroName}
            onChange={(e) => { setHeroName(e.target.value); setError(""); }}
            placeholder="npr. Veliki David, Čarobnjak..."
            maxLength={20}
            style={{ fontFamily: "var(--font-display)", fontSize: 16 }}
          />
          {error && <p style={{ color: "#e74c3c", fontSize: 12, fontWeight: 700, margin: 0 }}>{error}</p>}
        </div>

        {/* Avatar picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>ODABERI AVATAR</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                style={{
                  fontSize: 28, padding: "10px 0", borderRadius: 16, border: 0, cursor: "pointer",
                  background: avatar === a ? "var(--accent)" : "#f0f5f2",
                  boxShadow: avatar === a ? "0 4px 0 color-mix(in oklab, var(--accent), #000 20%)" : "0 3px 0 rgba(59,74,74,0.08)",
                  transition: "all 0.12s",
                  transform: avatar === a ? "translateY(1px)" : "translateY(0)",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          className="ff-btn"
          onClick={handleFinish}
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "..." : "Kreni u avanturu! ⚔️"}
        </button>

      </div>

    </main>
  );
}
