"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, saveUserToDB } from "@/lib/db";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  scenario: string;
  rarity: string;
  icon: string;
  bonusType: string | null;
  bonusValue: number;
  price: number;
}

const RARITY_COLORS: Record<string, string> = {
  common:    "text-gray-400 border-gray-600",
  rare:      "text-blue-400 border-blue-600",
  epic:      "text-purple-400 border-purple-600",
  legendary: "text-yellow-400 border-yellow-600",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};

const FILTERS = [
  { id: "all",     label: "Sve",     icon: "🛒" },
  { id: "dungeon", label: "Dungeon", icon: "⚔️" },
  { id: "garden",  label: "Vrt",     icon: "🌱" },
  { id: "space",   label: "Svemir",  icon: "🚀" },
  { id: "chaos",   label: "Chaos",   icon: "🤡" },
];

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

      if (itemsData) {
        setItems(itemsData.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          scenario: i.scenario,
          rarity: i.rarity,
          icon: i.icon,
          bonusType: i.bonus_type,
          bonusValue: i.bonus_value,
          price: i.price,
        })));
      }
      if (userData) setCoins(userData.coins);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleBuy() {
    if (!selected) return;
    if (coins < selected.price) {
      setFeedback({ msg: "Nemaš dovoljno coinsa! 💰", ok: false });
      return;
    }

    setBuying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userData = await loadUserFromDB(user.id);
    if (!userData) return;

    // Deduct coins and save
    const updated = { ...userData, coins: userData.coins - selected.price };
    await saveUserToDB(user.id, updated);

    // Add item to inventory
    await supabase.from("user_items").insert({
      user_id: user.id,
      item_id: selected.id,
    });

    setCoins(updated.coins);
    setFeedback({ msg: `${selected.icon} ${selected.name} dodan u inventar!`, ok: true });
    setSelected(null);
    setBuying(false);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.scenario === filter);

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-xl transition">←</Link>
          <h1 className="text-xl font-bold">Shop 🛒</h1>
        </div>
        <span className="text-amber-400 font-semibold">💰 {coins}</span>
      </header>

      {/* Filter tabs */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        {FILTERS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === id ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`mx-5 mb-3 px-4 py-3 rounded-xl text-sm font-semibold text-center ${
          feedback.ok ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"
        }`}>
          {feedback.msg}
          <button onClick={() => setFeedback(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex-1 px-5 pb-6">
        {loading ? (
          <p className="text-slate-400 text-sm text-center mt-10">Učitavanje...</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelected(item); setFeedback(null); }}
                className={`bg-slate-800 rounded-2xl p-3 flex flex-col items-center gap-1 border-2 transition hover:bg-slate-700 ${RARITY_COLORS[item.rarity]}`}
              >
                <span className="text-4xl">{item.icon}</span>
                <span className="text-xs font-semibold text-center leading-tight">{item.name}</span>
                <span className="text-xs text-amber-400 font-semibold">💰 {item.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item purchase modal */}
      {selected && (
        <div className="absolute inset-0 bg-black/70 flex items-end justify-center px-4 pb-6">
          <div className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="text-6xl">{selected.icon}</div>
            <h2 className={`text-xl font-bold ${RARITY_COLORS[selected.rarity].split(" ")[0]}`}>
              {selected.name}
            </h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-slate-700 ${RARITY_COLORS[selected.rarity].split(" ")[0]}`}>
              {RARITY_LABELS[selected.rarity]}
            </span>
            <p className="text-slate-400 text-sm text-center">{selected.description}</p>
            {selected.bonusType && (
              <p className="text-green-400 text-sm font-semibold">
                +{selected.bonusValue} {selected.bonusType === "xp_boost" ? "XP bonus" : "Coin bonus"}
              </p>
            )}
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              💰 {selected.price}
              {coins < selected.price && (
                <span className="text-red-400 text-xs font-normal">(nemaš dovoljno)</span>
              )}
            </div>
            <button
              onClick={handleBuy}
              disabled={buying || coins < selected.price}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl font-semibold transition"
            >
              {buying ? "Kupujem..." : "Kupi"}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="w-full py-2 text-slate-400 hover:text-white text-sm transition"
            >
              Odustani
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[
          { icon: "🏠", label: "Home",  href: "/" },
          { icon: "📊", label: "Stats", href: "/" },
          { icon: "🛒", label: "Shop",  href: "/shop",      active: true },
          { icon: "🎒", label: "Inv",   href: "/inventory" },
          { icon: "👤", label: "Me",    href: "/" },
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
