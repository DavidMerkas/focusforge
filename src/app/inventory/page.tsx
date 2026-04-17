"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  scenario: string;
  rarity: string;
  icon: string;
  bonusType: string | null;
  bonusValue: number;
  obtainedAt: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9aa6a6", rare: "#4a9eff", epic: "#b060ff", legendary: "#f4b03a",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};
const FILTERS = [
  { id: "all", label: "Sve", icon: "🎒" },
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
        { icon: "📊", label: "Stats", href: "/stats" },
        { icon: "🛒", label: "Shop",  href: "/shop" },
        { icon: "🎒", label: "Inv",   href: "/inventory", active: true },
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

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase
        .from("user_items")
        .select("id, obtained_at, items(id, name, description, scenario, rarity, icon, bonus_type, bonus_value)")
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });
      if (data) {
        setItems(data.map((row) => {
          const item = row.items as Record<string, unknown>;
          return {
            id: row.id, name: item.name as string, description: item.description as string,
            scenario: item.scenario as string, rarity: item.rarity as string, icon: item.icon as string,
            bonusType: item.bonus_type as string | null, bonusValue: item.bonus_value as number,
            obtainedAt: row.obtained_at,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = filter === "all" ? items : items.filter((i) => i.scenario === filter);

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Inventar 🎒</span>
      </header>

      {/* Filters */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        {FILTERS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 999, border: 0, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "var(--font-body)", background: filter === id ? "var(--accent)" : "#fff", color: filter === id ? "#fff" : "var(--ink-soft)", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", transition: "all 0.15s" }}
          >{icon} {label}</button>
        ))}
      </div>

      <div className="px-5">
        {loading ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", marginTop: 40 }}>Učitavanje...</p>
        ) : filtered.length === 0 ? (
          <div className="ff-card flex flex-col items-center gap-3" style={{ marginTop: 20, padding: 32 }}>
            <div style={{ fontSize: 48 }}>🎒</div>
            <p style={{ color: "var(--ink-soft)", textAlign: "center", fontSize: 14, margin: 0 }}>Nemaš još nijedan predmet.<br />Završi sesiju i možda nešto ispadne!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setSelected(item)}
                style={{ background: "#fff", border: `2px solid ${RARITY_COLORS[item.rarity]}`, borderRadius: 20, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: "0 4px 0 rgba(59,74,74,0.08)", transition: "transform 0.08s" }}
              >
                <span style={{ fontSize: 38 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: "var(--ink)", lineHeight: 1.3 }}>{item.name}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: RARITY_COLORS[item.rarity] }}>{RARITY_LABELS[item.rarity]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item detail modal */}
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
            <p style={{ color: "var(--ink-faint)", fontSize: 11, margin: 0 }}>Dobiveno: {new Date(selected.obtainedAt).toLocaleDateString("hr")}</p>
            <button className="ff-btn ghost sm" style={{ width: "100%", marginTop: 4 }} onClick={() => setSelected(null)}>Zatvori</button>
          </div>
        </div>
      )}

      <NavBar />
    </main>
  );
}
