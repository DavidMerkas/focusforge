"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB } from "@/lib/db";

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
        { icon: "📊", label: "Stats", href: "/stats" },
        { icon: "🛒", label: "Shop",  href: "/shop" },
        { icon: "🎒", label: "Inv",   href: "/inventory" },
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

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
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
                <span className="animate-breathe" style={{ fontSize: 56 }}>🧙‍♂️</span>
              </div>
              <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{myName}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "#fff", padding: "3px 10px", borderRadius: 999 }}>⭐ Level {myLevel}</span>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>Tvoj friend code</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: 4, background: "#f6ead1", padding: "10px 20px", borderRadius: 16, border: 0, cursor: "pointer", color: "var(--ink)", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", transition: "transform 0.08s" }}
                  >{myCode}</button>
                  <span style={{ fontSize: 11, color: copied ? "#4caf50" : "var(--ink-faint)", fontWeight: 700 }}>{copied ? "✅ Kopirano!" : "Klikni za kopiranje"}</span>
                </div>
              </div>
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
                      <button onClick={() => handleRemove(f.id)} style={{ padding: "8px 14px", background: "#fff", border: 0, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--ink-soft)", boxShadow: "0 3px 0 rgba(59,74,74,0.08)" }}>Odbij</button>
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
          </>
        )}
      </div>

      <NavBar />
    </main>
  );
}
