import { supabase } from "./supabase";
import { saveUserToDB, loadUserFromDB } from "./db";

export interface Challenge {
  id: string;
  type: "total_minutes" | "session_count";
  target: number;
  current: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
  rewarded: boolean;
}

// Returns Monday of the current week as "YYYY-MM-DD"
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// Load or generate challenges for this week
export async function getOrCreateChallenges(userId: string): Promise<Challenge[]> {
  const weekStart = currentWeekStart();

  // Check if challenges already exist for this week
  const { data: existing } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  if (existing && existing.length > 0) {
    return existing.map(mapChallenge);
  }

  // Generate 2 new challenges for this week
  const challenges = [
    { user_id: userId, week_start: weekStart, type: "total_minutes", target: 60,  reward_xp: 200, reward_coins: 20 },
    { user_id: userId, week_start: weekStart, type: "session_count", target: 3,   reward_xp: 150, reward_coins: 15 },
  ];

  const { data: created } = await supabase
    .from("weekly_challenges")
    .upsert(challenges, { onConflict: "user_id,week_start,type" })
    .select();

  return (created ?? []).map(mapChallenge);
}

// Update challenge progress after a session, grant rewards if completed
export async function updateChallengeProgress(
  userId: string,
  durationMin: number
): Promise<void> {
  const weekStart = currentWeekStart();

  const { data: challenges } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("completed", false);

  if (!challenges || challenges.length === 0) return;

  for (const c of challenges) {
    let newCurrent = c.current;

    if (c.type === "total_minutes") newCurrent += durationMin;
    if (c.type === "session_count") newCurrent += 1;

    const nowCompleted = newCurrent >= c.target;

    await supabase
      .from("weekly_challenges")
      .update({ current: newCurrent, completed: nowCompleted })
      .eq("id", c.id);

    // Grant reward if just completed
    if (nowCompleted && !c.rewarded) {
      const userData = await loadUserFromDB(userId);
      if (userData) {
        await saveUserToDB(userId, {
          ...userData,
          xp: userData.xp + c.reward_xp,
          coins: userData.coins + c.reward_coins,
        });
        await supabase
          .from("weekly_challenges")
          .update({ rewarded: true })
          .eq("id", c.id);
      }
    }
  }
}

function mapChallenge(row: Record<string, unknown>): Challenge {
  return {
    id:          row.id as string,
    type:        row.type as "total_minutes" | "session_count",
    target:      row.target as number,
    current:     row.current as number,
    rewardXp:    row.reward_xp as number,
    rewardCoins: row.reward_coins as number,
    completed:   row.completed as boolean,
    rewarded:    row.rewarded as boolean,
  };
}
