"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface InventoryItem {
  id: string;         // user_items.id
  itemId: string;     // items.id
  name: string;
  description: string;
  scenario: string;
  rarity: string;
  icon: string;
  bonusType: string | null;
  bonusValue: number;
  obtainedAt: string;
  equipped: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9aa6a6", rare: "#4a9eff", epic: "#b060ff", legendary: "#f4b03a",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};
const FILTERS = [
  { id: "all",     label: "Sve",     icon: "🎒" },
  { id: "dungeon", label: "Dungeon", icon: "⚔️" },
  { id: "garden",  label: "Vrt",     icon: "🌱" },
  { id: "space",   label: "Svemir",  icon: "🚀" },
  { id: "chaos",   label: "Chaos",   icon: "🤡" },
];

const MAX_EQUIPPED = 3;

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
  const [equipping, setEquipping] = useState(false);

  async function loadItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const { data } = await supabase
      .from("user_items")
      .select("id, obtained_at, equipped, items(id, name, description, scenario, rarity, icon, bonus_type, bonus_value)")
      .eq("user_id", user.id)
      .order("obtained_at", { ascending: false });
    if (data) {
      setItems(data.map((row) => {
        const item = row.items as unknown as Record<string, unknown>;
        return {
          id: row.id,
          itemId: item.id as string,
          name: item.name as string,
          description: item.description as string,
          scenario: item.scenario as string,
          rarity: item.rarity as string,
          icon: item.icon as string,
          bonusType: item.bonus_type as string | null,
          bonusValue: item.bonus_value as number,
          obtainedAt: row.obtained_at,
          equipped: row.equipped ?? false,
        };
      }));
    }
    setLoading(false);
  }

  useEffect(() => { loadItems(); }, [router]);

  const equippedCount = items.filter((i) => i.equipped).length;

  async function handleToggleEquip(item: InventoryItem) {
    setEquipping(true);
    if (item.equipped) {
      // Unequip
      await supabase.from("user_items").update({ equipped: false }).eq("id", item.id);
    } else {
      // Equip — check max slots
      if (equippedCount >= MAX_EQUIPPED) {
        setEquipping(false);
        return;
      }
      await supabase.from("user_items").update({ equipped: true }).eq("id", item.id);
    }
    await loadItems();
    // Update selected to reflect new state
    setSelected((prev) => prev ? { ...prev, equipped: !prev.equipped } : null);
    setEquipping(false);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.scenario === filter);
  const equippedItems = items.filter((i) => i.equipped);

  return (
    <main className="min-h-screen pb-28" style={{ maxWidth: 480, margin: "0 auto" }}>

      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "#fff", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(59,74,74,0.08)", fontSize: 18, cursor: "pointer", textDecoration: "none", color: "var(--ink)" }}>←</Link>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Inventar 🎒</span>
      </header>

      {/* Equipped slots */}
      <div className="px-5 mb-3">
        <div className="ff-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
            OPREMLJENO ({equippedCount}/{MAX_EQUIPPED})
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: MAX_EQUIPPED }).map((_, i) => {
              const eq = equippedItems[i];
              return (
                <button
                  key={i}
                  onClick={() => eq && setSelected(eq)}
                  style={{
                    flex: 1, aspectRatio: "1", borderRadius: 16, border: `2px dashed ${eq ? RARITY_COLORS[eq.rarity] : "rgba(59,74,74,0.15)"}`,
                    background: eq ? "rgba(255,255,255,0.8)" : "rgba(59,74,74,0.04)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    cursor: eq ? "pointer" : "default", transition: "all 0.15s",
                    boxShadow: eq ? "0 3px 0 rgba(59,74,74,0.08)" : "none",
                  }}
                >
                  {eq ? (
                    <>
                      <span style={{ fontSize: 28 }}>{eq.icon}</span>
                      {eq.bonusType && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#4caf50" }}>
                          +{eq.bonusValue} {eq.bonusType === "xp_boost" ? "XP" : "🪙"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 20, opacity: 0.2 }}>＋</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Total bonuses */}
          {equippedItems.some((i) => i.bonusType) && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => {
                const xp = equippedItems.filter(i => i.bonusType === "xp_boost").reduce((s, i) => s + i.bonusValue, 0);
                const coin = equippedItems.filter(i => i.bonusType === "coin_boost").reduce((s, i) => s + i.bonusValue, 0);
                return (
                  <>
                    {xp > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: "#b060ff", background: "rgba(176,96,255,0.1)", padding: "3px 8px", borderRadius: 999 }}>⭐ +{xp} XP bonus</span>}
                    {coin > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--coin)", background: "rgba(255,212,121,0.2)", padding: "3px 8px", borderRadius: 999 }}>🪙 +{coin} coin bonus</span>}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

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
                style={{ background: "#fff", border: `2px solid ${item.equipped ? RARITY_COLORS[item.rarity] : "rgba(59,74,74,0.08)"}`, borderRadius: 20, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: item.equipped ? `0 4px 0 ${RARITY_COLORS[item.rarity]}44` : "0 4px 0 rgba(59,74,74,0.08)", transition: "transform 0.08s", position: "relative" }}
              >
                {item.equipped && (
                  <span style={{ position: "absolute", top: 6, right: 6, fontSize: 10, background: "var(--accent-2)", color: "#fff", fontWeight: 800, padding: "2px 5px", borderRadius: 999 }}>ON</span>
                )}
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

            {/* Equip / Unequip */}
            {selected.bonusType ? (
              selected.equipped ? (
                <button className="ff-btn ghost sm" style={{ width: "100%", marginTop: 4 }} disabled={equipping} onClick={() => handleToggleEquip(selected)}>
                  {equipping ? "..." : "🔓 Skini"}
                </button>
              ) : (
                <button className="ff-btn" style={{ width: "100%", marginTop: 4, opacity: equippedCount >= MAX_EQUIPPED ? 0.4 : 1 }} disabled={equipping || equippedCount >= MAX_EQUIPPED} onClick={() => handleToggleEquip(selected)}>
                  {equipping ? "..." : equippedCount >= MAX_EQUIPPED ? "Slotovi puni (3/3)" : "⚔️ Opremi"}
                </button>
              )
            ) : (
              <p style={{ fontSize: 11, color: "var(--ink-faint)", margin: 0, fontWeight: 600 }}>Ovaj predmet nema bonus — samo je za kolekciju!</p>
            )}

            <button className="ff-btn ghost sm" style={{ width: "100%" }} onClick={() => setSelected(null)}>Zatvori</button>
          </div>
        </div>
      )}

      <NavBar />
    </main>
  );
}
