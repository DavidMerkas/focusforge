import { supabase } from "./supabase";
import type { ItemData } from "./db";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  rewardType: "coins" | "xp" | "item";
  rewardCoins?: number;
  rewardXP?: number;
  rewardRarity?: "common" | "rare" | "epic" | "legendary";
}

export interface AchievementGrant {
  achievement: Achievement;
  coinsGranted: number;
  xpGranted: number;
  itemGranted: ItemData | null;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    icon: "🎯",
    title: "Početak pustolovine",
    description: "Završi svoju prvu fokus sesiju.",
    rewardType: "coins",
    rewardCoins: 50,
  },
  {
    id: "streak_7",
    icon: "🔥",
    title: "Tjedan vatre",
    description: "Fokusiraj se 7 dana zaredom.",
    rewardType: "coins",
    rewardCoins: 100,
  },
  {
    id: "streak_30",
    icon: "💎",
    title: "Mjesec fokusa",
    description: "Fokusiraj se 30 dana zaredom.",
    rewardType: "item",
    rewardRarity: "legendary",
  },
  {
    id: "level_10",
    icon: "⭐",
    title: "Heroj razine 10",
    description: "Dostigni razinu 10.",
    rewardType: "xp",
    rewardXP: 200,
  },
  {
    id: "level_25",
    icon: "🏆",
    title: "Pravi heroj",
    description: "Dostigni razinu 25.",
    rewardType: "xp",
    rewardXP: 500,
  },
  {
    id: "minutes_100",
    icon: "⏱️",
    title: "100 minuta fokusa",
    description: "Ukupno 100 minuta fokusa.",
    rewardType: "coins",
    rewardCoins: 75,
  },
  {
    id: "minutes_1000",
    icon: "⌛",
    title: "1000 minuta fokusa",
    description: "Ukupno 1000 minuta fokusa.",
    rewardType: "item",
    rewardRarity: "epic",
  },
  {
    id: "sessions_50",
    icon: "🎮",
    title: "Veteran",
    description: "Završi 50 fokus sesija.",
    rewardType: "item",
    rewardRarity: "rare",
  },
  {
    id: "all_scenarios",
    icon: "🌍",
    title: "Istraživač",
    description: "Koristi sva 4 scenarija barem jednom.",
    rewardType: "xp",
    rewardXP: 150,
  },
  {
    id: "first_friend",
    icon: "👥",
    title: "Nije sam",
    description: "Dodaj prvog prijatelja.",
    rewardType: "coins",
    rewardCoins: 50,
  },
];

// Returns IDs of achievements the user already has
async function getUnlockedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.achievement_id));
}

// Grants a random item of the given rarity into user's inventory, returns ItemData or null
async function grantRandomItem(userId: string, rarity: string): Promise<ItemData | null> {
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("rarity", rarity);

  if (!items || items.length === 0) return null;

  const item = items[Math.floor(Math.random() * items.length)];
  await supabase.from("user_items").insert({ user_id: userId, item_id: item.id });

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    scenario: item.scenario,
    rarity: item.rarity,
    icon: item.icon,
    bonusType: item.bonus_type,
    bonusValue: item.bonus_value,
  };
}

export interface AchievementContext {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  level: number;
  scenariosUsed: string[];   // IDs of scenarios used across all sessions
  hasFriend: boolean;
}

// Main function: check which achievements are newly unlocked, grant rewards, return grants
export async function checkAndGrantAchievements(
  userId: string,
  ctx: AchievementContext
): Promise<AchievementGrant[]> {
  const unlocked = await getUnlockedIds(userId);
  const grants: AchievementGrant[] = [];

  const conditions: Record<string, boolean> = {
    first_session:  ctx.totalSessions >= 1,
    streak_7:       ctx.streak >= 7,
    streak_30:      ctx.streak >= 30,
    level_10:       ctx.level >= 10,
    level_25:       ctx.level >= 25,
    minutes_100:    ctx.totalMinutes >= 100,
    minutes_1000:   ctx.totalMinutes >= 1000,
    sessions_50:    ctx.totalSessions >= 50,
    all_scenarios:  ["dungeon", "garden", "space", "chaos"].every((s) => ctx.scenariosUsed.includes(s)),
    first_friend:   ctx.hasFriend,
  };

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.has(ach.id)) continue;
    if (!conditions[ach.id]) continue;

    // Insert into DB
    await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: ach.id,
    });

    // Grant reward
    let coinsGranted = 0;
    let xpGranted = 0;
    let itemGranted: ItemData | null = null;

    if (ach.rewardType === "coins" && ach.rewardCoins) {
      coinsGranted = ach.rewardCoins;
    } else if (ach.rewardType === "xp" && ach.rewardXP) {
      xpGranted = ach.rewardXP;
    } else if (ach.rewardType === "item" && ach.rewardRarity) {
      itemGranted = await grantRandomItem(userId, ach.rewardRarity);
    }

    grants.push({ achievement: ach, coinsGranted, xpGranted, itemGranted });
  }

  return grants;
}
