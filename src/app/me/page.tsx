"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB } from "@/lib/db";

interface FriendRow {
  id: string;
  status: string;
  // ako smo mi poslali zahtjev → friend je druga osoba
  // ako smo mi primili zahtjev → user je druga osoba
  isIncoming: boolean;
  otherUserId: string;
  otherName: string;
  otherCode: string;
  otherLevel: number;
  otherStreak: number;
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

    // Ensure friend_code exists
    let code = (userData as { friendCode?: string } & typeof userData).friendCode;
    if (!code) {
      // generate one
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("users").update({ friend_code: newCode }).eq("id", user.id);
      code = newCode;
    }
    setMyCode(code ?? "");
    setMyName(userData.heroName);
    setMyLevel(userData.level);

    // Load friends (both directions)
    const { data: friendRows } = await supabase
      .from("friends")
      .select("id, status, user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendRows && friendRows.length > 0) {
      const otherIds = friendRows.map((r) =>
        r.user_id === user.id ? r.friend_id : r.user_id
      );

      const { data: otherUsers } = await supabase
        .from("users")
        .select("id, hero_name, friend_code, level, streak")
        .in("id", otherIds);

      const mapped: FriendRow[] = friendRows.map((r) => {
        const isIncoming = r.friend_id === user.id;
        const otherId = isIncoming ? r.user_id : r.friend_id;
        const other = otherUsers?.find((u) => u.id === otherId);
        return {
          id: r.id,
          status: r.status,
          isIncoming,
          otherUserId: otherId,
          otherName: other?.hero_name ?? "???",
          otherCode: other?.friend_code ?? "",
          otherLevel: other?.level ?? 1,
          otherStreak: other?.streak ?? 0,
        };
      });
      setFriends(mapped);
    }

    setLoading(false);
  }

  useEffect(() => { loadData(); }, [router]);

  async function handleAddFriend() {
    setAddError("");
    setAddSuccess("");
    const code = addCode.trim().toUpperCase();
    if (!code) { setAddError("Upiši friend code!"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (code === myCode) { setAddError("Ne možeš dodati sebe!"); return; }

    // Find user with that code
    const { data: target } = await supabase
      .from("users")
      .select("id, hero_name")
      .eq("friend_code", code)
      .single();

    if (!target) { setAddError("Ne postoji korisnik s tim kodom."); return; }

    // Check if already friends/pending
    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`)
      .single();

    if (existing) { setAddError("Već si prijatelj ili zahtjev čeka."); return; }

    await supabase.from("friends").insert({ user_id: user.id, friend_id: target.id });
    setAddSuccess(`Zahtjev poslan ${target.hero_name}! 🎉`);
    setAddCode("");
    loadData();
  }

  async function handleAccept(friendRowId: string) {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", friendRowId);
    loadData();
  }

  async function handleRemove(friendRowId: string) {
    await supabase.from("friends").delete().eq("id", friendRowId);
    loadData();
  }

  const accepted  = friends.filter((f) => f.status === "accepted");
  const pending   = friends.filter((f) => f.status === "pending" && f.isIncoming);
  const sent      = friends.filter((f) => f.status === "pending" && !f.isIncoming);

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white text-xl transition">←</Link>
        <h1 className="text-xl font-bold">Moj profil 👤</h1>
      </header>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-5">

        {loading ? <p className="text-slate-400 text-sm text-center mt-10">Učitavanje...</p> : (
          <>
            {/* Profile card */}
            <section className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-2">
              <div className="text-6xl animate-breathe">🧙‍♂️</div>
              <p className="text-lg font-bold">{myName}</p>
              <p className="text-sm text-purple-400">⭐ Level {myLevel}</p>
              <div className="mt-2 flex flex-col items-center gap-1">
                <p className="text-xs text-slate-400">Tvoj friend code</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="text-2xl font-mono font-bold tracking-widest bg-slate-700 px-6 py-2 rounded-xl hover:bg-slate-600 transition"
                >
                  {myCode}
                </button>
                <p className="text-xs text-slate-500">{copied ? "✅ Kopirano!" : "Klikni za kopiranje"}</p>
              </div>
            </section>

            {/* Add friend */}
            <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-300">Dodaj prijatelja</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  onClick={handleAddFriend}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition"
                >
                  Dodaj
                </button>
              </div>
              {addError   && <p className="text-red-400 text-xs">{addError}</p>}
              {addSuccess && <p className="text-green-400 text-xs">{addSuccess}</p>}
            </section>

            {/* Pending incoming requests */}
            {pending.length > 0 && (
              <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-300">Zahtjevi ({pending.length})</p>
                {pending.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{f.otherName}</p>
                      <p className="text-xs text-slate-400">Level {f.otherLevel}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(f.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold transition">Prihvati</button>
                      <button onClick={() => handleRemove(f.id)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold transition">Odbij</button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Sent requests */}
            {sent.length > 0 && (
              <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-300">Poslani zahtjevi</p>
                {sent.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">{f.otherName} <span className="text-slate-500 text-xs">(čeka)</span></p>
                    <button onClick={() => handleRemove(f.id)} className="text-xs text-slate-500 hover:text-red-400 transition">Otkaži</button>
                  </div>
                ))}
              </section>
            )}

            {/* Friends list */}
            <section className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-300">Prijatelji ({accepted.length})</p>
              {accepted.length === 0 ? (
                <p className="text-xs text-slate-500">Još nemaš prijatelja. Dodaj ih gore!</p>
              ) : (
                accepted.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🧙‍♂️</div>
                      <div>
                        <p className="text-sm font-semibold">{f.otherName}</p>
                        <p className="text-xs text-slate-400">Level {f.otherLevel} · 🔥 {f.otherStreak}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(f.id)} className="text-xs text-slate-500 hover:text-red-400 transition">Ukloni</button>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[
          { icon: "🏠", label: "Home",  href: "/" },
          { icon: "📊", label: "Stats", href: "/stats" },
          { icon: "🛒", label: "Shop",  href: "/shop" },
          { icon: "🎒", label: "Inv",   href: "/inventory" },
          { icon: "👤", label: "Me",    href: "/me", active: true },
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
