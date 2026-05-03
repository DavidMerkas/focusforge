"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, saveUserToDB, buyPotion } from "@/lib/db";
import { FilterPicker } from "@/components/FilterPicker";
import { POTION_LIST } from "@/lib/potions";

interface ShopItem {
  id: string; name: string; description: string;
  scenario: string; rarity: string; icon: string;
  bonusType: string | null; bonusValue: number; price: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9aa6a6", rare: "#4a9eff", epic: "#b060ff", legendary: "#f4b03a",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};
const FILTERS = [
  { id: "all", label: "Sve", icon: "🛒" },
  { id: "dungeon", label: "Dungeon", icon: "⚔️" },
  { id: "garden",  label: "Vrt",    icon: "🌱" },
  { id: "space",   label: "Svemir", icon: "🚀" },
  { id: "chaos",   label: "Chaos",  icon: "🤡" },
];

function NavBar() {
  return (
    <nav className="ff-nav">
      {[
        { icon: "🏠", label: "Home",  href: "/" },
        { icon: "🏆", label: "Achievements", href: "/stats" },
        { icon: "🛒", label: "Shop",  href: "/shop", active: true },
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

export default function ShopPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const [{ data: itemsData }, userData] = await Promise.all([
        supabase.from("items").select("*").order("price"),
        loadUserFromDB(user.id),
      ]);
      if (itemsData) setItems(itemsData.map((i) => ({ id: i.id, name: i.name, description: i.description, scenario: i.scenario, rarity: i.rarity, icon: i.icon, bonusType: i.bonus_type, bonusValue: i.bonus_value, price: i.price })));
      if (userData) setCoins(userData.coins);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleBuy() {
    if (!selected) return;
    if (coins < selected.price) { setFeedback({ msg: "Nemaš dovoljno coinsa! 🪙", ok: false }); return; }
    setBuying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userData = await loadUserFromDB(user.id);
    if (!userData) return;
    const updated = { ...userData, coins: userData.coins - selected.price };
    await saveUserToDB(user.id, updated);
    await supabase.from("user_items").insert({ user_id: user.id, item_id: selected.id });
    setCoins(updated.coins);
    setFeedback({ msg: `${selected.icon} ${selected.name} dodan u inventar!`, ok: true });
    setSelected(null);
    setBuying(false);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.scenario === filter);

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Shop 🛒</span>
        </div>
        <span className="ff-chip" style={{ color: "var(--coin)", fontFamily: "var(--font-display)" }}>🪙 {coins}</span>
      </header>

      {/* Filter dropdown */}
      <FilterPicker value={filter} onChange={setFilter} options={FILTERS} />

      {/* Feedback */}
      {feedback && (
        <div className="px-5 mb-3">
          <div style={{ padding: "12px 16px", borderRadius: 16, fontSize: 13, fontWeight: 700, textAlign: "center", background: feedback.ok ? "#d4f5e2" : "#fde8e8", color: feedback.ok ? "#2a7a4a" : "#c0392b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {feedback.msg}
            <button onClick={() => setFeedback(null)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 16, opacity: 0.5 }}>✕</button>
          </div>
        </div>
      )}

      <div className="px-5">
        {/* Potions section */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-soft)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>🧪 Napitci</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 18 }}>
          {POTION_LIST.map((p) => (
            <button
              key={p.id}
              onClick={async () => {
                if (coins < p.price) { setFeedback({ msg: "Nemaš dovoljno coinsa! 🪙", ok: false }); return; }
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const userData = await loadUserFromDB(user.id);
                if (!userData) return;
                await saveUserToDB(user.id, { ...userData, coins: userData.coins - p.price });
                await buyPotion(user.id, p.id, 1);
                setCoins(userData.coins - p.price);
                setFeedback({ msg: `${p.icon} ${p.name} kupljen!`, ok: true });
              }}
              style={{
                background: "rgba(201,255,74,0.04)",
                border: "1px solid rgba(201,255,74,0.30)",
                borderRadius: 16, padding: 12,
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                cursor: "pointer", color: "var(--ink)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--coin)" }}>🪙 {p.price}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>{p.effectLabel}</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-soft)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>🎒 Predmeti</div>
        {loading ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", marginTop: 40 }}>Učitavanje...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map((item) => (
              <button key={item.id} onClick={() => { setSelected(item); setFeedback(null); }}
                style={{ background: "rgba(255,255,255,0.06)", border: `2px solid ${RARITY_COLORS[item.rarity]}`, borderRadius: 20, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)", transition: "transform 0.08s" }}
              >
                <span style={{ fontSize: 38 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: "var(--ink)", lineHeight: 1.3 }}>{item.name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--coin)" }}>🪙 {item.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Purchase modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(59,74,74,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 24px", zIndex: 60 }}>
          <div className="ff-card animate-pop" style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 56 }}>{selected.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: RARITY_COLORS[selected.rarity] }}>{selected.name}</div>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: RARITY_COLORS[selected.rarity], background: "rgba(0,0,0,0.06)", padding: "4px 10px", borderRadius: 999 }}>{RARITY_LABELS[selected.rarity]}</span>
            <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>{selected.description}</p>
            {selected.bonusType && (
              <p style={{ color: "#4caf50", fontSize: 13, fontWeight: 700, margin: 0 }}>+{selected.bonusValue} {selected.bonusType === "xp_boost" ? "XP bonus" : "Coin bonus"}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--coin)" }}>
              🪙 {selected.price}
              {coins < selected.price && <span style={{ fontSize: 11, color: "#e74c3c", fontFamily: "var(--font-body)", fontWeight: 700 }}>(nemaš dovoljno)</span>}
            </div>
            <button className="ff-btn" style={{ width: "100%", opacity: buying || coins < selected.price ? 0.4 : 1 }} disabled={buying || coins < selected.price} onClick={handleBuy}>
              {buying ? "Kupujem..." : "Kupi"}
            </button>
            <button className="ff-btn ghost sm" style={{ width: "100%" }} onClick={() => setSelected(null)}>Odustani</button>
          </div>
        </div>
      )}

      <NavBar />
    </main>
  );
}
