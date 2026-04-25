import { supabase } from "./supabase";
import type { UserData } from "./storage";

export type UserDataWithMeta = UserData & { onboarded: boolean; friendCode?: string };

// Load user data from Supabase, returns null if not found
export async function loadUserFromDB(userId: string): Promise<UserDataWithMeta | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    heroName: data.hero_name,
    level: data.level,
    xp: data.xp,
    coins: data.coins,
    streak: data.streak,
    lastSessionDate: data.last_session_date,
    recentSubjects: data.recent_subjects ?? [],
    onboarded: data.onboarded ?? false,
    friendCode: data.friend_code ?? null,
  };
}

// Create user row in DB for new users
export async function createUserInDB(userId: string, userData: UserData): Promise<void> {
  await supabase.from("users").insert({
    id: userId,
    hero_name: userData.heroName,
    level: userData.level,
    xp: userData.xp,
    coins: userData.coins,
    streak: userData.streak,
    last_session_date: userData.lastSessionDate,
    recent_subjects: userData.recentSubjects,
  });
}

// Save updated user data to Supabase
export async function saveUserToDB(userId: string, userData: UserData): Promise<void> {
  await supabase.from("users").update({
    hero_name: userData.heroName,
    level: userData.level,
    xp: userData.xp,
    coins: userData.coins,
    streak: userData.streak,
    last_session_date: userData.lastSessionDate,
    recent_subjects: userData.recentSubjects,
  }).eq("id", userId);
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  scenario: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  icon: string;
  bonusType: string | null;
  bonusValue: number;
}

// Roll for loot drop after a session (12% base drop rate)
// Returns the dropped item, or null if no drop
export async function rollLoot(userId: string, scenario: string, durationMin: number = 25): Promise<ItemData | null> {
  // Drop rate scales with session length: 8% base + up to 22% bonus for 90min session
  const dropRate = Math.min(0.08 + (durationMin / 90) * 0.22, 0.30);
  if (Math.random() > dropRate) return null;

  // Rarity weights: common 70%, rare 20%, epic 8%, legendary 2%
  const roll = Math.random() * 100;
  let rarity: string;
  if (roll < 70)       rarity = "common";
  else if (roll < 90)  rarity = "rare";
  else if (roll < 98)  rarity = "epic";
  else                 rarity = "legendary";

  // Pick a random item of that rarity from the correct scenario
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("scenario", scenario)
    .eq("rarity", rarity);

  if (!items || items.length === 0) return null;

  const item = items[Math.floor(Math.random() * items.length)];

  // Add to user's inventory
  await supabase.from("user_items").insert({
    user_id: userId,
    item_id: item.id,
  });

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

// Get total XP and coin bonuses from equipped items for a user
export async function getEquippedBonuses(userId: string): Promise<{ xpBonus: number; coinBonus: number }> {
  const { data } = await supabase
    .from("user_items")
    .select("items(bonus_type, bonus_value)")
    .eq("user_id", userId)
    .eq("equipped", true);

  let xpBonus = 0;
  let coinBonus = 0;

  if (data) {
    for (const row of data) {
      const item = row.items as unknown as { bonus_type: string | null; bonus_value: number } | null;
      if (!item) continue;
      if (item.bonus_type === "xp_boost")   xpBonus   += item.bonus_value;
      if (item.bonus_type === "coin_boost")  coinBonus += item.bonus_value;
    }
  }

  return { xpBonus, coinBonus };
}

// Save completed session to sessions table
export async function saveSessionToDB(
  userId: string,
  subject: string,
  durationMin: number,
  xpEarned: number,
  completed: boolean
): Promise<void> {
  await supabase.from("sessions").insert({
    user_id: userId,
    subject,
    duration_min: durationMin,
    xp_earned: xpEarned,
    completed,
  });
}
