// Potion sustav — privremeni boostovi koji se troše po sesiji.
// Pohranjeni su kao count map u users.potions (jsonb).

export type PotionId = "xp_boost" | "coin_boost" | "loot_boost" | "streak_freeze";

export interface PotionDef {
  id: PotionId;
  name: string;
  icon: string;
  description: string;
  price: number;
  effectLabel: string;
}

export const POTIONS: Record<PotionId, PotionDef> = {
  xp_boost: {
    id: "xp_boost",
    name: "XP Napitak",
    icon: "🧪",
    description: "+50% XP-a za jednu sesiju.",
    price: 50,
    effectLabel: "+50% XP",
  },
  coin_boost: {
    id: "coin_boost",
    name: "Coin Napitak",
    icon: "🪙",
    description: "+50% coinsa za jednu sesiju.",
    price: 50,
    effectLabel: "+50% 🪙",
  },
  loot_boost: {
    id: "loot_boost",
    name: "Loot Napitak",
    icon: "💎",
    description: "+15% šanse za loot drop.",
    price: 80,
    effectLabel: "+15% drop",
  },
  streak_freeze: {
    id: "streak_freeze",
    name: "Streak Freeze",
    icon: "❄️",
    description: "Spašava streak ako preskočiš dan (auto).",
    price: 120,
    effectLabel: "🛡 Streak",
  },
};

export const POTION_LIST: PotionDef[] = Object.values(POTIONS);

export type PotionCounts = Partial<Record<PotionId, number>>;

export const MAX_POTIONS_PER_SESSION = 2;

// Calculate XP/coin/loot multipliers from active potions in a session
export function getPotionMultipliers(active: PotionId[]) {
  return {
    xpMult:   active.includes("xp_boost")   ? 1.5 : 1,
    coinMult: active.includes("coin_boost") ? 1.5 : 1,
    lootMult: active.includes("loot_boost") ? 1.15 : 1,
  };
}

export function ownedCount(counts: PotionCounts | null | undefined, id: PotionId): number {
  return counts?.[id] ?? 0;
}

export function decrementPotions(counts: PotionCounts, used: PotionId[]): PotionCounts {
  const out: PotionCounts = { ...counts };
  for (const id of used) {
    const n = out[id] ?? 0;
    out[id] = Math.max(0, n - 1);
  }
  return out;
}
