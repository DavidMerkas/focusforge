"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface InventoryItem {
  id: string;         // user_items.id
  itemId: string;
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
  common:    "text-gray-400 border-gray-600",
  rare:      "text-blue-400 border-blue-600",
  epic:      "text-purple-400 border-purple-600",
  legendary: "text-yellow-400 border-yellow-600",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};

const FILTERS = [
  { id: "all",     label: "Sve",    icon: "🎒" },
  { id: "dungeon", label: "Dungeon", icon: "⚔️" },
  { id: "garden",  label: "Vrt",    icon: "🌱" },
  { id: "space",   label: "Svemir", icon: "🚀" },
  { id: "chaos",   label: "Chaos",  icon: "🤡" },
];

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

      // Join user_items with items to get full item data
      const { data } = await supabase
        .from("user_items")
        .select("id, obtained_at, items(id, name, description, scenario, rarity, icon, bonus_type, bonus_value)")
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      if (data) {
        const mapped: InventoryItem[] = data.map((row) => {
          const item = row.items as Record<string, unknown>;
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
          };
        });
        setItems(mapped);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = filter === "all" ? items : items.filter((i) => i.scenario === filter);

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col max-w-[480px] mx-auto">

      <header className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white text-xl transition">←</Link>
        <h1 className="text-xl font-bold">Inventar 🎒</h1>
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

      <div className="flex-1 px-5 pb-6">
        {loading ? (
          <p className="text-slate-400 text-sm text-center mt-10">Učitavanje...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 mt-16 text-center">
            <div className="text-5xl">🎒</div>
            <p className="text-slate-400 text-sm">Nemaš još nijedan predmet.<br />Završi sesiju i možda nešto ispadne!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`bg-slate-800 rounded-2xl p-3 flex flex-col items-center gap-1 border-2 transition hover:bg-slate-700 ${RARITY_COLORS[item.rarity]}`}
              >
                <span className="text-4xl">{item.icon}</span>
                <span className="text-xs font-semibold text-center leading-tight">{item.name}</span>
                <span className={`text-[10px] ${RARITY_COLORS[item.rarity].split(" ")[0]}`}>
                  {RARITY_LABELS[item.rarity]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item detail modal */}
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
            <p className="text-slate-600 text-xs">
              Dobiveno: {new Date(selected.obtainedAt).toLocaleDateString("hr")}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition mt-1"
            >
              Zatvori
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[
          { icon: "🏠", label: "Home",  href: "/" },
          { icon: "📊", label: "Stats", href: "/" },
          { icon: "🛒", label: "Shop",  href: "/" },
          { icon: "🎒", label: "Inv",   href: "/inventory", active: true },
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
